import React, { useEffect, useState, useRef, useCallback } from 'react';
import { DrawingItem, StudentProfile, DrawingResult } from '../../types';
import { drawingEngineService, GUIDE_LINE_COLORS, ImageAnalysisResult } from '../../services/drawingEngineService';
import { handTrackingService, HandData, PinchSensitivity } from '../../services/handTrackingService';
import { audioService } from '../../services/audioService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { whiteboardSyncService, WhiteboardSyncMessage } from '../../services/whiteboardSyncService';
import confetti from 'canvas-confetti';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Camera,
  Activity,
  CheckCircle2,
  Play,
  Sliders,
  ChevronRight,
  Eye,
  EyeOff,
  Radio
} from 'lucide-react';

interface StudentWhiteboardViewProps {
  initialDrawingId?: string | null;
  onExit?: () => void;
}

export const StudentWhiteboardView: React.FC<StudentWhiteboardViewProps> = ({
  initialDrawingId,
  onExit
}) => {
  const allDrawings = drawingEngineService.getAllDrawings();
  const defaultDrawing =
    allDrawings.find((d) => d.id === initialDrawingId) ||
    allDrawings.find((d) => d.id === whiteboardSyncService.getLatestDrawingId()) ||
    allDrawings[0];

  const [currentDrawing, setCurrentDrawing] = useState<DrawingItem>(defaultDrawing);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTeacherConnected, setIsTeacherConnected] = useState(true);

  // Drawing & Session States
  const [isSessionActive, setIsSessionActive] = useState(false);
  const isSessionActiveRef = useRef(false);
  isSessionActiveRef.current = isSessionActive;

  const [accuracy, setAccuracy] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const isFinishedRef = useRef(false);

  // Visual settings
  const [guideColor, setGuideColor] = useState<'yellow' | 'green' | 'white' | 'cyan' | 'black'>('yellow');
  const [brushColor, setBrushColor] = useState('#10b981');
  const [brushSize, setBrushSize] = useState(20);
  const [sensitivity, setSensitivity] = useState<PinchSensitivity>('easy');
  const [showVideo, setShowVideo] = useState(true);
  const [isPenDown, setIsPenDown] = useState(false);
  const isPenDownRef = useRef(false);

  // In-canvas button tracking
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [buttonFeedback, setButtonFeedback] = useState(false);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastButtonTriggerRef = useRef(0);

  // Canvases and refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const userDrawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);

  const analysisRef = useRef<ImageAnalysisResult | null>(null);
  const coveredSetRef = useRef<Set<number>>(new Set());
  const onTargetSamplesRef = useRef(0);
  const totalSamplesRef = useRef(0);
  const lastDrawPosRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef(Date.now());

  // Listen to remote commands from teacher dashboard
  useEffect(() => {
    const unsubscribe = whiteboardSyncService.subscribe((msg: WhiteboardSyncMessage) => {
      setIsTeacherConnected(true);
      if (msg.type === 'SELECT_DRAWING' && msg.payload?.drawingId) {
        const found = allDrawings.find((d) => d.id === msg.payload.drawingId);
        if (found) {
          setCurrentDrawing(found);
          clearCanvas();
        }
      } else if (msg.type === 'START_SESSION') {
        startDrawingSession();
      } else if (msg.type === 'FINISH_SESSION') {
        finishDrawingSession();
      } else if (msg.type === 'CLEAR_BOARD') {
        clearCanvas();
      } else if (msg.type === 'SET_GUIDE_COLOR' && msg.payload?.color) {
        setGuideColor(msg.payload.color);
      } else if (msg.type === 'SET_BRUSH_SIZE' && msg.payload?.size) {
        setBrushSize(msg.payload.size);
      } else if (msg.type === 'SET_SENSITIVITY' && msg.payload?.sensitivity) {
        setSensitivity(msg.payload.sensitivity);
        handTrackingService.setSensitivity(msg.payload.sensitivity);
      }
    });

    return () => unsubscribe();
  }, [allDrawings]);

  // Load and analyze the image template
  useEffect(() => {
    let mounted = true;
    const analyze = async () => {
      try {
        const result = await drawingEngineService.loadAndAnalyzeImage(currentDrawing.imageUrl, 700, 520);
        if (mounted) {
          analysisRef.current = result;
          clearCanvas();
          if (guideCanvasRef.current) {
            const colorOpt = GUIDE_LINE_COLORS.find((c) => c.id === guideColor) || GUIDE_LINE_COLORS[0];
            drawingEngineService.renderGuideToCanvas(
              guideCanvasRef.current,
              result.targetMask,
              result.width,
              result.height,
              colorOpt.hex,
              currentDrawing.opacity || 0.35
            );
          }
        }
      } catch (err) {
        console.warn('Whiteboard image analysis error:', err);
      }
    };

    analyze();
    return () => {
      mounted = false;
    };
  }, [currentDrawing.id, currentDrawing.imageUrl]);

  // Update guide line canvas on color changes
  useEffect(() => {
    if (guideCanvasRef.current && analysisRef.current) {
      const colorOpt = GUIDE_LINE_COLORS.find((c) => c.id === guideColor) || GUIDE_LINE_COLORS[0];
      drawingEngineService.renderGuideToCanvas(
        guideCanvasRef.current,
        analysisRef.current.targetMask,
        analysisRef.current.width,
        analysisRef.current.height,
        colorOpt.hex,
        currentDrawing.opacity || 0.35
      );
    }
  }, [guideColor, currentDrawing.opacity]);

  // Setup camera & MediaPipe tracking
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      if (!videoRef.current) return;
      handTrackingService.setSensitivity(sensitivity);
      await handTrackingService.startTracking(videoRef.current, (data: HandData) => {
        if (!mounted) return;
        handleHandUpdate(data);
      });
    };

    startCamera();
    return () => {
      mounted = false;
      handTrackingService.stopTracking();
    };
  }, [sensitivity]);

  const clearCanvas = () => {
    if (userDrawCanvasRef.current) {
      const ctx = userDrawCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, userDrawCanvasRef.current.width, userDrawCanvasRef.current.height);
    }
    coveredSetRef.current.clear();
    onTargetSamplesRef.current = 0;
    totalSamplesRef.current = 0;
    lastDrawPosRef.current = null;
    setCoverage(0);
    setAccuracy(0);
    setIsFinished(false);
    isFinishedRef.current = false;
  };

  const startDrawingSession = () => {
    setIsSessionActive(true);
    isSessionActiveRef.current = true;
    startTimeRef.current = Date.now();
    setButtonFeedback(true);
    setTimeout(() => setButtonFeedback(false), 500);
    audioService.playChime();
    audioService.speakArabic('بدأت جلسة الرسم على السبورة! ضم أصابعك الثلاثة وابدأ التلوين ✍️');
  };

  const finishDrawingSession = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinished(true);
    setIsSessionActive(false);
    isSessionActiveRef.current = false;
    audioService.playSuccessSound();

    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch {
      // Ignore
    }

    const duration = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    const finalAcc = accuracy || 80;
    const earnedScore = Math.round((currentDrawing.points * finalAcc) / 100);

    const resultRecord: DrawingResult = {
      id: 'board_' + Date.now(),
      studentId: 'smartboard_student',
      studentName: 'طالب السبورة التفاعلية',
      drawingId: currentDrawing.id,
      drawingTitle: currentDrawing.title,
      mode: currentDrawing.mode,
      accuracy: finalAcc,
      score: earnedScore,
      attempts: 1,
      timestamp: new Date().toISOString(),
      durationSeconds: duration
    };

    googleSheetsService.enqueueDrawingResult(resultRecord);
  };

  const handleToggleButton = () => {
    if (!isSessionActiveRef.current) {
      startDrawingSession();
    } else {
      finishDrawingSession();
    }
  };

  // Process stroke point
  const processDrawPoint = useCallback((pixelX: number, pixelY: number) => {
    if (!isSessionActiveRef.current || isFinishedRef.current || !analysisRef.current || !userDrawCanvasRef.current) return;

    const { width, height, targetMask, totalTargetPixels } = analysisRef.current;
    const ctx = userDrawCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;

    if (lastDrawPosRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastDrawPosRef.current.x, lastDrawPosRef.current.y);
      ctx.lineTo(pixelX, pixelY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = brushColor;
      ctx.fill();
    }

    lastDrawPosRef.current = { x: pixelX, y: pixelY };

    // Hit test radius
    const radius = drawingEngineService.getToleranceRadius(currentDrawing.tolerance);
    let hitFound = false;

    const startX = Math.max(0, Math.floor(pixelX - radius));
    const endX = Math.min(width - 1, Math.ceil(pixelX + radius));
    const startY = Math.max(0, Math.floor(pixelY - radius));
    const endY = Math.min(height - 1, Math.ceil(pixelY + radius));

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const dist = Math.hypot(x - pixelX, y - pixelY);
        if (dist <= radius) {
          const index = y * width + x;
          if (targetMask[index] === 1) {
            coveredSetRef.current.add(index);
            hitFound = true;
          }
        }
      }
    }

    totalSamplesRef.current++;
    if (hitFound) onTargetSamplesRef.current++;

    const currentCovered = coveredSetRef.current.size;
    const covRatio = Math.min(100, Math.round((currentCovered / totalTargetPixels) * 100));
    setCoverage(covRatio);

    const steadiness = totalSamplesRef.current > 0 ? Math.round((onTargetSamplesRef.current / totalSamplesRef.current) * 100) : 100;
    const currentAcc = Math.min(100, Math.round(covRatio * 0.7 + steadiness * 0.3));
    setAccuracy(currentAcc);

    // Broadcast student progress back to teacher console
    whiteboardSyncService.send({
      type: 'STUDENT_PROGRESS',
      payload: {
        accuracy: currentAcc,
        coverage: covRatio,
        drawingId: currentDrawing.id
      }
    });
  }, [brushColor, brushSize, currentDrawing.id, currentDrawing.tolerance]);

  // Hand tracking frame handler
  const handleHandUpdate = useCallback((data: HandData) => {
    if (!stageWrapperRef.current || !analysisRef.current) return;

    const hasHand = !!data.indexTip;

    if (!hasHand) {
      if (isPenDownRef.current) {
        isPenDownRef.current = false;
        setIsPenDown(false);
      }
      setIsHoveringButton(false);
      lastDrawPosRef.current = null;
      if (skeletonCanvasRef.current) {
        const cvs = skeletonCanvasRef.current;
        cvs.getContext('2d')?.clearRect(0, 0, cvs.width, cvs.height);
      }
      return;
    }

    // 1. Button Hit Testing (in-canvas Start/Finish button)
    let isOverButton = false;
    if (actionButtonRef.current && data.indexTip && stageWrapperRef.current) {
      const btnRect = actionButtonRef.current.getBoundingClientRect();
      const stageRect = stageWrapperRef.current.getBoundingClientRect();
      const tipX = stageRect.left + data.indexTip.x * stageRect.width;
      const tipY = stageRect.top + data.indexTip.y * stageRect.height;

      isOverButton =
        tipX >= btnRect.left - 16 &&
        tipX <= btnRect.right + 16 &&
        tipY >= btnRect.top - 16 &&
        tipY <= btnRect.bottom + 16;

      setIsHoveringButton(isOverButton);

      // 2-Finger Pinch Click on Button
      if (isOverButton && data.isPinching) {
        const now = Date.now();
        if (now - lastButtonTriggerRef.current > 800) {
          lastButtonTriggerRef.current = now;
          audioService.playPopSound();
          handleToggleButton();
        }
      }
    } else {
      setIsHoveringButton(false);
    }

    // 2. Drawing state: 3-Finger Pen Grip
    let isDrawing = false;
    if (isSessionActiveRef.current && !isOverButton) {
      isDrawing = !!data.isThreeFingerPinching;
    }

    if (isDrawing !== isPenDownRef.current) {
      isPenDownRef.current = isDrawing;
      setIsPenDown(isDrawing);
      if (isDrawing) {
        audioService.playChime();
        lastDrawPosRef.current = null;
      }
    }

    // 3. Render Hand Skeleton aligned 1:1 on the canvas
    if (skeletonCanvasRef.current && data.landmarks) {
      const cvs = skeletonCanvasRef.current;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17]
        ];

        // Draw bone lines (matched perfectly to camera hand)
        ctx.lineWidth = 3;
        ctx.strokeStyle = isOverButton
          ? '#38bdf8'
          : isDrawing
          ? '#10b981'
          : 'rgba(245, 158, 11, 0.55)';
        connections.forEach(([i, j]) => {
          const p1 = data.landmarks![i];
          const p2 = data.landmarks![j];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * cvs.width, p1.y * cvs.height);
            ctx.lineTo(p2.x * cvs.width, p2.y * cvs.height);
            ctx.stroke();
          }
        });

        // 3-Finger Pen Grip Triangle (Thumb 4 + Index 8 + Middle 12)
        if (data.landmarks[4] && data.landmarks[8] && data.landmarks[12]) {
          const pThumb = data.landmarks[4];
          const pIndex = data.landmarks[8];
          const pMiddle = data.landmarks[12];

          ctx.beginPath();
          ctx.moveTo(pThumb.x * cvs.width, pThumb.y * cvs.height);
          ctx.lineTo(pIndex.x * cvs.width, pIndex.y * cvs.height);
          ctx.lineTo(pMiddle.x * cvs.width, pMiddle.y * cvs.height);
          ctx.closePath();

          if (data.isThreeFingerPinching && isSessionActiveRef.current && !isOverButton) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#10b981';
            ctx.stroke();
          } else {
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Highlight fingertips
        if (data.thumbTip) {
          ctx.beginPath();
          ctx.arc(data.thumbTip.x * cvs.width, data.thumbTip.y * cvs.height, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
        }
        if (data.middleTip) {
          ctx.beginPath();
          ctx.arc(data.middleTip.x * cvs.width, data.middleTip.y * cvs.height, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#06b6d4';
          ctx.fill();
        }
        if (data.indexTip) {
          ctx.beginPath();
          ctx.arc(data.indexTip.x * cvs.width, data.indexTip.y * cvs.height, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        }

        // Cursor indicator
        if (isOverButton && data.indexTip) {
          const px = data.indexTip.x * cvs.width;
          const py = data.indexTip.y * cvs.height;
          ctx.beginPath();
          ctx.arc(px, py, 24, 0, Math.PI * 2);
          ctx.strokeStyle = data.isPinching ? '#10b981' : '#38bdf8';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.font = 'bold 13px Cairo, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(data.isPinching ? 'تم النقر! ✨' : 'اقبض بإصبعين 🤏', px, py - 30);
        } else {
          const activePoint = data.threeFingerCentroid || data.indexTip;
          if (activePoint) {
            const px = activePoint.x * cvs.width;
            const py = activePoint.y * cvs.height;
            if (isDrawing) {
              ctx.beginPath();
              ctx.arc(px, py, 16, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(px, py, 8, 0, Math.PI * 2);
              ctx.fillStyle = brushColor;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(px, py, 12, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.setLineDash([4, 4]);
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }
    }

    if (!isDrawing) {
      lastDrawPosRef.current = null;
      return;
    }

    // Map point to user draw canvas
    if (userDrawCanvasRef.current) {
      const activePoint = data.threeFingerCentroid || data.indexTip;
      if (activePoint) {
        const px = activePoint.x * userDrawCanvasRef.current.width;
        const py = activePoint.y * userDrawCanvasRef.current.height;
        processDrawPoint(px, py);
      }
    }
  }, [brushColor, processDrawPoint]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      
      {/* Top Smart Board Header */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="العودة للنظام الكامل"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black font-serif text-amber-400">
                {currentDrawing.title}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>سبورة العرض التفاعلية</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isTeacherConnected ? 'متصل بكونسول المعلم في الوقت الحقيقي' : 'جاهز للرسم التفاعلي'}
            </p>
          </div>
        </div>

        {/* Live Gauges & Controls */}
        <div className="flex items-center gap-3">
          {/* Accuracy Score */}
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold leading-none">نسبة الإتقان</div>
              <div className="text-base font-extrabold font-mono text-emerald-400 leading-tight">
                {accuracy}% <span className="text-[10px] text-slate-500">/ {currentDrawing.targetAccuracy}%</span>
              </div>
            </div>
          </div>

          {/* Toggle Video Visibility */}
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
            title={showVideo ? 'إخفاء كاميرا الخلفية' : 'إظهار كاميرا الخلفية'}
          >
            {showVideo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Clear board */}
          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">مسح</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow"
            title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Drawing Stage (Centered with 1:1 Camera-Skeleton Alignment) */}
      <div className="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        
        {/* Unified 700x520 Stage Frame with IDENTICAL aspect ratio for Camera and Skeleton */}
        <div
          ref={stageWrapperRef}
          className="relative w-full max-w-[700px] h-full max-h-[520px] aspect-[700/520] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center"
        >
          {/* Layer 1: Mirror Video Camera Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-300 pointer-events-none ${
              showVideo ? 'opacity-90' : 'opacity-0'
            }`}
            style={{
              filter: 'brightness(1.4) contrast(1.15) saturate(1.15)'
            }}
          />

          {/* Layer 2: Glowing Guide Canvas */}
          <canvas
            ref={guideCanvasRef}
            width={700}
            height={520}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 transition-all duration-200"
            style={{
              filter:
                guideColor === 'yellow'
                  ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.9)) drop-shadow(0 0 16px rgba(234, 179, 8, 0.5))'
                  : guideColor === 'green'
                  ? 'drop-shadow(0 0 8px rgba(74, 222, 128, 0.9)) drop-shadow(0 0 16px rgba(34, 197, 94, 0.5))'
                  : guideColor === 'white'
                  ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.95))'
                  : guideColor === 'cyan'
                  ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.9)) drop-shadow(0 0 16px rgba(14, 165, 233, 0.5))'
                  : 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.7))'
            }}
          />

          {/* Layer 3: Student Live Drawing Canvas */}
          <canvas
            ref={userDrawCanvasRef}
            width={700}
            height={520}
            className="absolute inset-0 w-full h-full object-cover cursor-crosshair z-20"
          />

          {/* Layer 4: Aligned Hand Skeleton Canvas */}
          <canvas
            ref={skeletonCanvasRef}
            width={700}
            height={520}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30"
          />

          {/* Interactive In-Canvas Button (Start / Finish Session with 2 Fingers) */}
          <button
            ref={actionButtonRef}
            type="button"
            onClick={handleToggleButton}
            className={`absolute top-4 right-4 z-40 px-4 py-2.5 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 cursor-pointer shadow-2xl backdrop-blur-md select-none ${
              buttonFeedback
                ? 'scale-95 ring-8 ring-amber-400 bg-amber-400 text-slate-950'
                : !isSessionActive
                ? isHoveringButton
                  ? 'bg-emerald-900/95 border-emerald-400 text-emerald-100 scale-110 ring-4 ring-emerald-400/60 shadow-emerald-500/40 animate-pulse'
                  : 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200 hover:bg-emerald-900/90'
                : isHoveringButton
                ? 'bg-rose-900/95 border-rose-400 text-rose-100 scale-110 ring-4 ring-rose-400/60 shadow-rose-500/40 animate-pulse'
                : 'bg-rose-950/90 border-rose-500/80 text-rose-200 hover:bg-rose-900/90'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                !isSessionActive ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
              }`}
            >
              {!isSessionActive ? <Play className="w-5 h-5 fill-current ml-0.5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>

            <div className="text-right">
              <div className="text-xs font-extrabold text-white">
                {!isSessionActive ? 'ابدأ الرسم الآن' : 'إنهاء الرسم وحفظ النتيجة'}
              </div>
              <div className="text-[10px] text-amber-300 font-medium">
                انقر بإصبعين 🤏 (سبابة + إبهام)
              </div>
            </div>
          </button>

          {/* Dynamic Gesture Guidance Pill */}
          <div className="absolute top-4 left-4 z-30 pointer-events-none">
            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md border ${
                isPenDown
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}
            >
              {isPenDown ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>✍️ القلم يرسم (3 أصابع مضمومة)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>✋ القلم مرفوع (ضم 3 أصابع للرسم)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
