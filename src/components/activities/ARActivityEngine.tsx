import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityDefinition, CursorState } from '../../types';
import { handTrackingService, HandData } from '../../services/handTrackingService';
import { audioService } from '../../services/audioService';
import confetti from 'canvas-confetti';
import {
  Camera,
  MousePointer,
  Volume2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Sun,
  Activity,
  Hand
} from 'lucide-react';
import { HandCalibrationModal } from '../HandCalibrationModal';

interface ARActivityEngineProps {
  activity: ActivityDefinition;
  studentId: string;
  studentName: string;
  onComplete: (score: number, attempts: number, mode: 'ar_hand' | 'mouse_touch') => void;
  onExit: () => void;
}

export const ARActivityEngine: React.FC<ARActivityEngineProps> = ({
  activity,
  onComplete,
  onExit
}) => {
  // Mode: AR Camera with Hand Tracking vs Mouse / Touch Fallback
  const [inputMode, setInputMode] = useState<'ar_hand' | 'mouse_touch'>(
    activity.supportsAR ? 'ar_hand' : 'mouse_touch'
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [showVideoFeed, setShowVideoFeed] = useState(true);

  // Brightness Control (1.0 = normal, 1.5 = boosted, 2.0 = extra bright)
  const [brightness, setBrightness] = useState<number>(1.5);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);

  // Stats
  const [attempts, setAttempts] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const isResolvedRef = useRef(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'retry' | 'info' } | null>(null);

  // Video and Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Virtual Cursor State
  const [cursor, setCursor] = useState<CursorState>({
    x: 0.5,
    y: 0.5,
    isPinching: false,
    status: 'no_hand',
    handDetected: false
  });

  // Touch & Dwell Interaction Engine
  const [dwellProgress, setDwellProgress] = useState(0); // 0 to 100%
  const dwellTimerRef = useRef(0);
  const currentHoverElRef = useRef<HTMLElement | null>(null);
  const lastActionTimeRef = useRef(0);

  // 1. match_word_image states
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.72 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragPosRef = useRef({ x: 0.5, y: 0.72 });
  const hoverGrabTimerRef = useRef(0);

  // 2. trace_letter states
  const [tracedPoints, setTracedPoints] = useState<number[]>([]);
  const tracedPointsRef = useRef<number[]>([]);

  // 3. build_word states
  const [assembledLetters, setAssembledLetters] = useState<string[]>([]);
  const assembledLettersRef = useRef<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>(
    activity.lettersToAssemble ? [...activity.lettersToAssemble] : []
  );
  const availableLettersRef = useRef<string[]>(
    activity.lettersToAssemble ? [...activity.lettersToAssemble] : []
  );

  // 4. arrange_sentence states
  const [sentenceWords, setSentenceWords] = useState<string[]>(
    activity.wordsToArrange ? [...activity.wordsToArrange] : []
  );
  const sentenceWordsRef = useRef<string[]>(
    activity.wordsToArrange ? [...activity.wordsToArrange] : []
  );

  // 5. classify_words states
  const [classifiedMap, setClassifiedMap] = useState<Record<string, string>>({});
  const classifiedMapRef = useRef<Record<string, string>>({});

  // Mouse drag fallback state
  const isMouseDownRef = useRef(false);

  // Keep references fresh
  const handleHandUpdateRef = useRef<(data: HandData) => void>(() => {});

  // Reset internal states on mount or activity switch
  useEffect(() => {
    isResolvedRef.current = false;
    setIsResolved(false);
    setFeedbackMsg(null);
    setDwellProgress(0);
    dwellTimerRef.current = 0;
    currentHoverElRef.current = null;
    lastActionTimeRef.current = 0;

    isDraggingRef.current = false;
    setIsDragging(false);
    dragPosRef.current = { x: 0.5, y: 0.72 };
    setDragPos({ x: 0.5, y: 0.72 });

    tracedPointsRef.current = [];
    setTracedPoints([]);

    const initialLetters = activity.lettersToAssemble ? [...activity.lettersToAssemble] : [];
    availableLettersRef.current = initialLetters;
    setAvailableLetters(initialLetters);
    assembledLettersRef.current = [];
    setAssembledLetters([]);

    const initialWords = activity.wordsToArrange ? [...activity.wordsToArrange] : [];
    sentenceWordsRef.current = initialWords;
    setSentenceWords(initialWords);

    classifiedMapRef.current = {};
    setClassifiedMap({});

    if (activity.audioPrompt) {
      const timer = setTimeout(() => audioService.speakArabic(activity.audioPrompt!), 600);
      return () => clearTimeout(timer);
    }
  }, [activity.id]);

  // Clean-up camera on unmount or mode switch
  useEffect(() => {
    let mounted = true;

    const setupAR = async () => {
      if (inputMode !== 'ar_hand') return;

      setIsCameraStarting(true);
      setCameraError(null);

      if (!videoRef.current) return;

      // Ensure brightness is applied
      handTrackingService.setBrightnessMultiplier(brightness);

      const res = await handTrackingService.startTracking(
        videoRef.current,
        (data: HandData) => {
          if (!mounted) return;
          handleHandUpdateRef.current(data);
        }
      );

      if (!res.success) {
        setCameraError(res.error || 'تعذر تشغيل الكاميرا');
        setInputMode('mouse_touch');
      }
      setIsCameraStarting(false);
    };

    if (inputMode === 'ar_hand') {
      setupAR();
    } else {
      handTrackingService.stopTracking();
    }

    return () => {
      mounted = false;
      handTrackingService.stopTracking();
    };
  }, [inputMode, brightness]);

  // Celebrate Success
  const celebrateSuccess = useCallback((earnedPoints: number) => {
    if (isResolvedRef.current) return;
    isResolvedRef.current = true;
    setIsResolved(true);

    setFeedbackMsg({
      text: '🎉 أحسنت! إجابة صحيحة وتفاعل رائع!',
      type: 'success'
    });

    audioService.playSuccessSound();
    if (activity.correctAnswer) {
      audioService.speakArabic(activity.correctAnswer);
    }

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore confetti error
    }

    setTimeout(() => {
      onComplete(earnedPoints, attempts + 1, inputMode);
    }, 1800);
  }, [activity.correctAnswer, activity.points, attempts, inputMode, onComplete]);

  // Retry feedback
  const triggerRetry = useCallback(() => {
    setAttempts(a => a + 1);
    audioService.playErrorSound();
    setFeedbackMsg({
      text: '💡 حاول مرة أخرى، أنت قريب جداً من الإجابة!',
      type: 'retry'
    });
    setTimeout(() => {
      if (!isResolvedRef.current) {
        setFeedbackMsg(null);
      }
    }, 2200);
  }, []);

  // --- ACTIVITY SPECIFIC LOGIC WITH REFS ---

  // 1. Trace Letter checkpoint hit handler
  const hitTraceDot = useCallback((idx: number) => {
    if (isResolvedRef.current) return;
    const currentHit = tracedPointsRef.current;
    if (currentHit.includes(idx)) return;

    // Must be sequential: first dot or adjacent to last hit dot
    if (idx === 0 || currentHit.includes(idx - 1)) {
      const next = [...currentHit, idx];
      tracedPointsRef.current = next;
      setTracedPoints(next);
      audioService.playChime();

      const totalDots = activity.tracePath?.length || 6;
      if (next.length === totalDots) {
        celebrateSuccess(activity.points);
      }
    }
  }, [activity.points, activity.tracePath?.length, celebrateSuccess]);

  // 2. Build Word assemble letter handler
  const handleAssembleLetter = useCallback((letter: string) => {
    if (isResolvedRef.current) return;
    audioService.playGrabSound();

    const nextAssembled = [...assembledLettersRef.current, letter];
    assembledLettersRef.current = nextAssembled;
    setAssembledLetters(nextAssembled);

    const nextAvailable = [...availableLettersRef.current];
    const idx = nextAvailable.indexOf(letter);
    if (idx > -1) {
      nextAvailable.splice(idx, 1);
      availableLettersRef.current = nextAvailable;
      setAvailableLetters(nextAvailable);
    }

    const currentWord = nextAssembled.join('');
    if (currentWord === activity.correctAnswer) {
      celebrateSuccess(activity.points);
    } else if (nextAssembled.length >= (activity.lettersToAssemble?.length || 4)) {
      triggerRetry();
      setTimeout(() => {
        if (!isResolvedRef.current) {
          assembledLettersRef.current = [];
          setAssembledLetters([]);
          const fresh = activity.lettersToAssemble ? [...activity.lettersToAssemble] : [];
          availableLettersRef.current = fresh;
          setAvailableLetters(fresh);
        }
      }, 900);
    }
  }, [activity.correctAnswer, activity.lettersToAssemble, activity.points, celebrateSuccess, triggerRetry]);

  // 3. Missing Letter selection handler
  const handleChooseMissingLetter = useCallback((choice: string) => {
    if (isResolvedRef.current) return;
    setAttempts(a => a + 1);
    if (choice === activity.correctAnswer) {
      celebrateSuccess(activity.points);
    } else {
      triggerRetry();
    }
  }, [activity.correctAnswer, activity.points, celebrateSuccess, triggerRetry]);

  // 4. Listen Option selection handler
  const handleChooseListenOption = useCallback((text: string) => {
    if (isResolvedRef.current) return;
    setAttempts(a => a + 1);
    if (text === activity.correctAnswer) {
      celebrateSuccess(activity.points);
    } else {
      triggerRetry();
    }
  }, [activity.correctAnswer, activity.points, celebrateSuccess, triggerRetry]);

  // 5. Sentence Reordering handler
  const handleMoveSentenceWord = useCallback((fromIdx: number, toIdx: number) => {
    if (isResolvedRef.current) return;
    const current = sentenceWordsRef.current;
    if (toIdx < 0 || toIdx >= current.length) return;

    const copy = [...current];
    const item = copy.splice(fromIdx, 1)[0];
    copy.splice(toIdx, 0, item);

    sentenceWordsRef.current = copy;
    setSentenceWords(copy);
    audioService.playChime();

    const joined = copy.join(' ').replace(/\s+/g, ' ').trim();
    const targetClean = activity.correctAnswer.replace(/\s+/g, ' ').trim();
    if (joined === targetClean) {
      celebrateSuccess(activity.points);
    }
  }, [activity.correctAnswer, activity.points, celebrateSuccess]);

  // 6. Sentence check handler
  const handleCheckSentence = useCallback(() => {
    if (isResolvedRef.current) return;
    const joined = sentenceWordsRef.current.join(' ').replace(/\s+/g, ' ').trim();
    const targetClean = activity.correctAnswer.replace(/\s+/g, ' ').trim();
    if (joined === targetClean) {
      celebrateSuccess(activity.points);
    } else {
      triggerRetry();
    }
  }, [activity.correctAnswer, activity.points, celebrateSuccess, triggerRetry]);

  // 7. Classify Item drop handler
  const handleClassifyItem = useCallback((itemId: string, categoryId: string) => {
    if (isResolvedRef.current) return;
    const item = activity.itemsToClassify?.find(i => i.id === itemId);
    if (!item) return;

    if (item.categoryId === categoryId) {
      audioService.playChime();
      const updated = { ...classifiedMapRef.current, [itemId]: categoryId };
      classifiedMapRef.current = updated;
      setClassifiedMap(updated);

      if (Object.keys(updated).length === (activity.itemsToClassify?.length || 0)) {
        celebrateSuccess(activity.points);
      }
    } else {
      triggerRetry();
    }
  }, [activity.itemsToClassify, activity.points, celebrateSuccess, triggerRetry]);

  // Drop validation for match_word_image using viewport coordinates
  const checkWordDropTarget = useCallback((screenX: number, screenY: number) => {
    let matchedOption: string | null = null;
    const optionElements = document.querySelectorAll('.ar-option-target');

    optionElements.forEach(opt => {
      const optRect = opt.getBoundingClientRect();
      if (
        screenX >= optRect.left - 30 &&
        screenX <= optRect.right + 30 &&
        screenY >= optRect.top - 30 &&
        screenY <= optRect.bottom + 30
      ) {
        matchedOption = opt.getAttribute('data-option-id');
      }
    });

    if (matchedOption) {
      if (matchedOption === activity.correctAnswer) {
        celebrateSuccess(activity.points);
      } else {
        triggerRetry();
        dragPosRef.current = { x: 0.5, y: 0.72 };
        setDragPos({ x: 0.5, y: 0.72 });
      }
    } else {
      dragPosRef.current = { x: 0.5, y: 0.72 };
      setDragPos({ x: 0.5, y: 0.72 });
    }
  }, [activity.correctAnswer, activity.points, celebrateSuccess, triggerRetry]);

  // --- UNIVERSAL TOUCH & DWELL COLLISION ENGINE ---
  const processCollision = useCallback((
    normX: number,
    normY: number,
    isPinch: boolean,
    landmarks: any
  ) => {
    if (isResolvedRef.current || !containerRef.current) return;

    const bounds = containerRef.current.getBoundingClientRect();
    const pixelX = normX * bounds.width;
    const pixelY = normY * bounds.height;
    const cursorScreenX = bounds.left + pixelX;
    const cursorScreenY = bounds.top + pixelY;

    // Draw hand skeleton on canvas
    if (canvasRef.current && landmarks) {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        // Connections between landmarks (bones)
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [0, 9], [9, 10], [10, 11], [11, 12], // Middle
          [0, 13], [13, 14], [14, 15], [15, 16], // Ring
          [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [5, 9], [9, 13], [13, 17] // Palm base
        ];

        ctx.lineWidth = 3;
        ctx.strokeStyle = isPinch ? '#10b981' : 'rgba(245, 158, 11, 0.45)';
        connections.forEach(([i, j]) => {
          const p1 = landmarks[i];
          const p2 = landmarks[j];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * cvs.width, p1.y * cvs.height);
            ctx.lineTo(p2.x * cvs.width, p2.y * cvs.height);
            ctx.stroke();
          }
        });

        // Draw points
        landmarks.forEach((pt: any, idx: number) => {
          const px = pt.x * cvs.width;
          const py = pt.y * cvs.height;
          ctx.beginPath();
          ctx.arc(px, py, idx === 8 || idx === 4 ? 7 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = idx === 8 ? '#0284c7' : idx === 4 ? '#eab308' : 'rgba(255,255,255,0.7)';
          ctx.fill();
        });
      }
    }

    // 1. SPECIAL CASE: TRACE LETTER (Check all checkpoint dots)
    if (activity.type === 'trace_letter' && activity.tracePath) {
      activity.tracePath.forEach((_, idx) => {
        const dotEl = document.getElementById(`trace-dot-${idx}`);
        if (dotEl) {
          const dRect = dotEl.getBoundingClientRect();
          const dotCenterX = dRect.left + dRect.width / 2;
          const dotCenterY = dRect.top + dRect.height / 2;
          const dist = Math.hypot(cursorScreenX - dotCenterX, cursorScreenY - dotCenterY);

          // Generous 60px hit radius so finger gliding over dots hits easily
          if (dist < 60) {
            hitTraceDot(idx);
          }
        }
      });
    }

    // 2. SPECIAL CASE: MATCH WORD IMAGE (Dragging card)
    if (activity.type === 'match_word_image') {
      const dragTarget = document.getElementById('ar-draggable-word');
      if (dragTarget) {
        const dRect = dragTarget.getBoundingClientRect();
        const isOverCard =
          cursorScreenX >= dRect.left - 45 &&
          cursorScreenX <= dRect.right + 45 &&
          cursorScreenY >= dRect.top - 45 &&
          cursorScreenY <= dRect.bottom + 45;

        if (isOverCard && !isDraggingRef.current) {
          hoverGrabTimerRef.current++;
          // Grab card if pinched OR hovered for 15 frames (~240ms)
          if (isPinch || hoverGrabTimerRef.current > 15) {
            isDraggingRef.current = true;
            setIsDragging(true);
            hoverGrabTimerRef.current = 0;
            audioService.playGrabSound();
          }
        } else if (!isDraggingRef.current) {
          hoverGrabTimerRef.current = 0;
        }
      }

      if (isDraggingRef.current) {
        dragPosRef.current = { x: normX, y: normY };
        setDragPos({ x: normX, y: normY });

        // Check if cursor entered a drop target
        const optionElements = document.querySelectorAll('.ar-option-target');
        let isOverAnyOption = false;
        optionElements.forEach(opt => {
          const optRect = opt.getBoundingClientRect();
          if (
            cursorScreenX >= optRect.left &&
            cursorScreenX <= optRect.right &&
            cursorScreenY >= optRect.top &&
            cursorScreenY <= optRect.bottom
          ) {
            isOverAnyOption = true;
          }
        });

        // Release condition: finger opened (pinch false) OR dropped on an option target
        if (!isPinch || isOverAnyOption) {
          isDraggingRef.current = false;
          setIsDragging(false);
          audioService.playReleaseSound();
          checkWordDropTarget(cursorScreenX, cursorScreenY);
          return;
        }
      }
    }

    // 3. UNIVERSAL TOUCH & DWELL CLICK FOR ALL INTERACTIVE ELEMENTS
    // Find what element is directly under the virtual cursor
    const rawEl = document.elementFromPoint(cursorScreenX, cursorScreenY) as HTMLElement | null;
    const touchable = rawEl?.closest('[data-ar-touchable="true"]') as HTMLElement | null;

    if (touchable && !isDraggingRef.current) {
      if (currentHoverElRef.current === touchable) {
        dwellTimerRef.current++;
        const pct = Math.min(100, Math.round((dwellTimerRef.current / 16) * 100)); // ~260ms to trigger
        setDwellProgress(pct);

        // TRIGGER ACTION: either Dwell 100% OR Pinch instant trigger!
        if (pct >= 100 || isPinch) {
          const now = Date.now();
          if (now - lastActionTimeRef.current > 450) {
            lastActionTimeRef.current = now;
            dwellTimerRef.current = 0;
            setDwellProgress(0);

            // Execute touch action
            audioService.playGrabSound();
            touchable.classList.add('scale-95', 'ring-4', 'ring-emerald-400');
            setTimeout(() => {
              touchable.classList.remove('scale-95', 'ring-4', 'ring-emerald-400');
            }, 200);

            touchable.click();
          }
        }
      } else {
        currentHoverElRef.current = touchable;
        dwellTimerRef.current = 1;
        setDwellProgress(6);
        audioService.playChime();
      }
    } else {
      currentHoverElRef.current = null;
      dwellTimerRef.current = 0;
      setDwellProgress(0);
    }
  }, [
    activity.tracePath,
    activity.type,
    checkWordDropTarget,
    hitTraceDot
  ]);

  // Handle Hand Tracking Data Update from 60FPS loop
  const handleHandUpdate = useCallback((data: HandData) => {
    if (!containerRef.current) return;

    if (!data.indexTip) {
      setCursor(prev => ({
        ...prev,
        status: 'no_hand',
        handDetected: false
      }));
      setDwellProgress(0);
      dwellTimerRef.current = 0;
      currentHoverElRef.current = null;

      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        audioService.playReleaseSound();
      }
      return;
    }

    const cursorX = data.indexTip.x;
    const cursorY = data.indexTip.y;
    const isPinch = data.isPinching;

    // Determine status
    let status: CursorState['status'] = 'normal';
    if (isDraggingRef.current) {
      status = 'grab_success';
    } else if (currentHoverElRef.current) {
      status = 'hover';
    } else if (isPinch) {
      status = 'pinch_outside';
    }

    setCursor({
      x: cursorX,
      y: cursorY,
      isPinching: isPinch,
      status,
      handDetected: true,
      rawPinchDistance: data.pinchDistance
    });

    // Run collision & touch processing
    processCollision(cursorX, cursorY, isPinch, data.landmarks);
  }, [processCollision]);

  // Keep ref synchronized
  handleHandUpdateRef.current = handleHandUpdate;

  // Mouse & Touch Fallback Handlers
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    updateMousePosition(e);
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    updateMousePosition(e);
  };

  const handleContainerMouseUp = () => {
    isMouseDownRef.current = false;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      audioService.playReleaseSound();
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        checkWordDropTarget(bounds.left + dragPosRef.current.x * bounds.width, bounds.top + dragPosRef.current.y * bounds.height);
      }
    }
  };

  const updateMousePosition = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - bounds.top) / bounds.height));

    if (inputMode === 'mouse_touch') {
      setCursor({
        x: nx,
        y: ny,
        isPinching: isMouseDownRef.current,
        status: isMouseDownRef.current ? 'grab_success' : 'normal',
        handDetected: true
      });

      if (isDraggingRef.current) {
        dragPosRef.current = { x: nx, y: ny };
        setDragPos({ x: nx, y: ny });
      }
    }
  };

  // Render Virtual Cursor Overlay with Dwell Arc
  const renderCursor = () => {
    if (!cursor.handDetected && inputMode === 'ar_hand') {
      return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/95 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xl animate-bounce z-30">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>جارٍ البحث عن يدك... ارفع كفّك أمام الكاميرا 🖐️</span>
        </div>
      );
    }

    const leftPercent = `${cursor.x * 100}%`;
    const topPercent = `${cursor.y * 100}%`;

    let cursorColorClass = 'border-sky-400 bg-sky-500/25 text-white';
    let icon = null;

    if (cursor.status === 'hover') {
      cursorColorClass = 'border-amber-400 bg-amber-500/35 ring-4 ring-amber-400/40 text-amber-300 scale-110';
      icon = <Hand className="w-3.5 h-3.5" />;
    } else if (cursor.status === 'pinch_outside') {
      cursorColorClass = 'border-rose-400 bg-rose-500/30 text-rose-200';
    } else if (cursor.status === 'grab_success' || isDragging) {
      cursorColorClass = 'border-emerald-400 bg-emerald-500/50 ring-4 ring-emerald-500/50 scale-120 text-white';
      icon = <CheckCircle2 className="w-4 h-4 text-emerald-200" />;
    }

    return (
      <div
        className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 flex items-center justify-center"
        style={{ left: leftPercent, top: topPercent }}
      >
        <div
          className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-2xl backdrop-blur-xs transition-all ${cursorColorClass}`}
        >
          {/* Radial Dwell Fill Ring when hovering */}
          {dwellProgress > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeDasharray="107"
                strokeDashoffset={107 - (107 * dwellProgress) / 100}
                className="transition-all duration-75"
              />
            </svg>
          )}

          {icon ? (
            icon
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[580px]">
      
      {/* Top Activity Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/80 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{activity.title}</h3>
            <p className="text-[11px] text-slate-400">{activity.instruction}</p>
          </div>
        </div>

        {/* Controls: Mode Switch & Camera Toggle */}
        <div className="flex items-center gap-2">
          {/* Mode Switch Button */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setInputMode('ar_hand')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                inputMode === 'ar_hand'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="التحكم عبر حركة اليد والكاميرا"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تتبع اليد AR</span>
            </button>

            <button
              onClick={() => setInputMode('mouse_touch')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                inputMode === 'mouse_touch'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="التحكم بالماوس أو شاشة اللمس"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ماوس / لمس</span>
            </button>
          </div>

          {/* Camera Lighting & Calibration Tools */}
          {inputMode === 'ar_hand' && (
            <>
              {/* Brightness Booster Button */}
              <button
                onClick={() => {
                  const nextB = brightness === 1.0 ? 1.5 : brightness === 1.5 ? 2.0 : 1.0;
                  setBrightness(nextB);
                  handTrackingService.setBrightnessMultiplier(nextB);
                }}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  brightness > 1.0
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
                title={`السطوع الحالي: ${Math.round(brightness * 100)}% (انقر لزيادة الإضاءة)`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden md:inline">{Math.round(brightness * 100)}%</span>
              </button>

              {/* Hand Calibration Button */}
              <button
                onClick={() => setIsCalibrationOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
                title="فحص ومعايرة الكاميرا واليد"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">مختبر اليد</span>
              </button>

              {/* Toggle Video Feed Visibility */}
              <button
                onClick={() => setShowVideoFeed(!showVideoFeed)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs"
                title={showVideoFeed ? 'إخفاء معاينة الكاميرا' : 'إظهار معاينة الكاميرا'}
              >
                {showVideoFeed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            خروج
          </button>
        </div>
      </div>

      {/* Camera / Interactive Stage Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onTouchStart={(e) => {
          if (e.touches[0] && containerRef.current) {
            isMouseDownRef.current = true;
            const bounds = containerRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            const nx = Math.max(0, Math.min(1, (touch.clientX - bounds.left) / bounds.width));
            const ny = Math.max(0, Math.min(1, (touch.clientY - bounds.top) / bounds.height));
            if (inputMode === 'mouse_touch') {
              setCursor({ x: nx, y: ny, isPinching: true, status: 'grab_success', handDetected: true });
            }
          }
        }}
        onTouchMove={(e) => {
          if (e.touches[0] && containerRef.current) {
            const bounds = containerRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            const nx = Math.max(0, Math.min(1, (touch.clientX - bounds.left) / bounds.width));
            const ny = Math.max(0, Math.min(1, (touch.clientY - bounds.top) / bounds.height));
            if (inputMode === 'mouse_touch') {
              setCursor({ x: nx, y: ny, isPinching: true, status: 'grab_success', handDetected: true });
              if (isDraggingRef.current) {
                dragPosRef.current = { x: nx, y: ny };
                setDragPos({ x: nx, y: ny });
              }
            }
          }
        }}
        onTouchEnd={() => {
          isMouseDownRef.current = false;
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setIsDragging(false);
            audioService.playReleaseSound();
            if (containerRef.current) {
              const bounds = containerRef.current.getBoundingClientRect();
              checkWordDropTarget(bounds.left + dragPosRef.current.x * bounds.width, bounds.top + dragPosRef.current.y * bounds.height);
            }
          }
        }}
        className="relative flex-1 w-full bg-slate-900 flex flex-col items-center justify-center p-6 select-none overflow-hidden cursor-crosshair"
        style={{ minHeight: '440px' }}
      >
        {/* Crisp, 100% Brightened Video Element for MediaPipe */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-300 pointer-events-none ${
            inputMode === 'ar_hand' && showVideoFeed ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: `brightness(${brightness}) contrast(1.15) saturate(1.15)`
          }}
        />

        {/* Hand Landmark Skeleton Canvas */}
        {inputMode === 'ar_hand' && (
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
        )}

        {/* Virtual Cursor */}
        {renderCursor()}

        {/* Camera Starting / Error Overlay */}
        {isCameraStarting && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-semibold text-white">جارٍ تهيئة كاميرا الواقع المعزز وتتبع اليد...</p>
            <p className="text-xs text-slate-400">ستعمل الكاميرا داخل هذا النشاط دون حفظ أو مشاركة أي صور</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute top-4 bg-rose-950/80 border border-rose-500/40 text-rose-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 z-30">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`absolute top-4 z-30 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
                : 'bg-amber-500 text-slate-950 border border-amber-400'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <HelpCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ACTIVITY ENGINE DISPATCHER                                    */}
        {/* ------------------------------------------------------------- */}

        {/* TYPE 1: MATCH WORD TO IMAGE (Pinch + Drag OR Touch to Select) */}
        {activity.type === 'match_word_image' && (
          <div className="w-full flex flex-col items-center justify-between h-full py-4 z-20">
            
            {/* Target Options (Drop Zones & Direct Touch Targets) */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-2xl">
              {activity.options?.map(opt => (
                <div
                  key={opt.id}
                  data-option-id={opt.id}
                  data-ar-touchable="true"
                  onClick={() => {
                    if (opt.id === activity.correctAnswer) {
                      celebrateSuccess(activity.points);
                    } else {
                      triggerRetry();
                    }
                  }}
                  className="ar-option-target group p-4 sm:p-5 rounded-2xl bg-slate-900/85 border-2 border-dashed border-slate-700 hover:border-amber-400 flex flex-col items-center justify-center gap-2 transition-all shadow-xl cursor-pointer hover:bg-slate-800/90 active:scale-95"
                >
                  <span className="text-4xl sm:text-5xl filter drop-shadow group-hover:scale-110 transition-transform">
                    {opt.emoji}
                  </span>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-amber-300 text-center">
                    {opt.text}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    (أفلت الكلمة هنا أو المس)
                  </span>
                </div>
              ))}
            </div>

            {/* Draggable Word Card */}
            <div
              id="ar-draggable-word"
              data-ar-touchable="true"
              onMouseDown={() => {
                isDraggingRef.current = true;
                setIsDragging(true);
                audioService.playGrabSound();
              }}
              style={{
                position: isDragging ? 'absolute' : 'relative',
                left: isDragging ? `${dragPos.x * 100}%` : 'auto',
                top: isDragging ? `${dragPos.y * 100}%` : 'auto',
                transform: isDragging ? 'translate(-50%, -50%) scale(1.08)' : 'none'
              }}
              className={`px-8 py-4 rounded-2xl font-serif text-3xl font-extrabold text-slate-950 transition-transform shadow-2xl flex items-center gap-3 cursor-grab active:cursor-grabbing ${
                isDragging
                  ? 'bg-amber-400 border-2 border-white ring-4 ring-amber-500/40 shadow-amber-500/40'
                  : 'bg-gradient-to-r from-amber-400 to-amber-300 border border-amber-300 hover:scale-105'
              }`}
            >
              <span>{activity.question}</span>
              <button
                type="button"
                data-ar-touchable="true"
                onClick={(e) => {
                  e.stopPropagation();
                  audioService.speakArabic(activity.question || '');
                }}
                className="p-1 rounded-full bg-slate-950/20 text-slate-950 hover:bg-slate-950/30"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Hand Tracking Hint */}
            <div className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-900/90 px-4 py-1.5 rounded-full border border-slate-700 shadow-md">
              <span className="text-amber-400 font-bold">💡 إرشاد:</span>
              <span>
                {inputMode === 'ar_hand'
                  ? 'المس الكلمة بإصبعك أو اقبض (Pinch) لسحبها وإفلاتها فوق الصورة، أو أشر مباشرة للصورة الصحيحة!'
                  : 'اسحب الكلمة بالماوس أو الإصبع وضعها فوق الصورة المناسبة.'}
              </span>
            </div>
          </div>
        )}

        {/* TYPE 2: TRACE LETTER (Trace letter strokes with index finger) */}
        {activity.type === 'trace_letter' && (
          <div className="w-full flex flex-col items-center justify-center h-full z-20 relative">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-amber-400 font-serif">{activity.traceLetterName}</div>
              <p className="text-xs text-slate-300">
                {inputMode === 'ar_hand'
                  ? 'حرّك إصبعك السبابة أو المس الشاشة لتتبع النقاط بالترتيب من 1 إلى النهاية'
                  : 'حرّك مؤشر الماوس أو انقر على النقاط بتسلسل لتتبع الحرف'}
              </p>
            </div>

            {/* Tracing Canvas Area */}
            <div className="relative w-72 h-88 rounded-3xl bg-slate-900/95 border-2 border-slate-700 flex items-center justify-center shadow-2xl overflow-hidden">
              
              {/* Giant Background Guide Letter */}
              <div className="font-serif text-9xl text-slate-800/80 font-bold select-none pointer-events-none">
                {activity.traceLetter}
              </div>

              {/* Connecting stroke line between hit points */}
              {activity.tracePath && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {tracedPoints.map((ptIdx, i) => {
                    if (i === 0) return null;
                    const prevIdx = tracedPoints[i - 1];
                    const p1 = activity.tracePath![prevIdx];
                    const p2 = activity.tracePath![ptIdx];
                    if (!p1 || !p2) return null;
                    return (
                      <line
                        key={`line-${i}`}
                        x1={`${p1.x * 100}%`}
                        y1={`${p1.y * 100}%`}
                        x2={`${p2.x * 100}%`}
                        y2={`${p2.y * 100}%`}
                        stroke="#10b981"
                        strokeWidth="6"
                        strokeLinecap="round"
                        className="animate-in fade-in duration-150"
                      />
                    );
                  })}
                </svg>
              )}

              {/* Checkpoints to hit */}
              {activity.tracePath?.map((pt, idx) => {
                const isHit = tracedPoints.includes(idx);
                const isNextTarget = idx === 0 ? !isHit : tracedPoints.includes(idx - 1) && !isHit;

                return (
                  <div
                    key={idx}
                    id={`trace-dot-${idx}`}
                    data-ar-touchable="true"
                    onClick={() => hitTraceDot(idx)}
                    onMouseEnter={() => hitTraceDot(idx)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      hitTraceDot(idx);
                    }}
                    style={{
                      left: `${pt.x * 100}%`,
                      top: `${pt.y * 100}%`
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-90 ${
                      isHit
                        ? 'bg-emerald-500 border-white text-slate-950 scale-110 shadow-emerald-500/50'
                        : isNextTarget
                        ? 'bg-amber-500 border-white text-slate-950 scale-110 ring-4 ring-amber-400/40 animate-pulse'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {isHit ? '✓' : idx + 1}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                data-ar-touchable="true"
                onClick={() => {
                  tracedPointsRef.current = [];
                  setTracedPoints([]);
                }}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المسار</span>
              </button>
              <button
                data-ar-touchable="true"
                onClick={() => audioService.speakArabic(activity.traceLetter || '')}
                className="px-3.5 py-1.5 text-xs text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>نطق الحرف</span>
              </button>
            </div>
          </div>
        )}

        {/* TYPE 3: BUILD WORD (Assemble Letters) */}
        {activity.type === 'build_word' && (
          <div className="w-full flex flex-col items-center justify-between h-full py-4 z-20">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-300">
                كوّن كلمة:{' '}
                <span className="font-serif text-amber-400 font-bold text-2xl px-2">
                  {assembledLetters.length > 0 ? assembledLetters.join('') : '...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                المس أو انقر الحروف بالترتيب الصحيح لتكوين الكلمة
              </p>
            </div>

            {/* Assembled Word Box */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 min-h-[96px] min-w-[280px] justify-center shadow-xl">
              {assembledLetters.length === 0 ? (
                <span className="text-xs text-slate-500 font-mono">ضع الحروف هنا بالتسلسل</span>
              ) : (
                assembledLetters.map((char, i) => (
                  <div
                    key={i}
                    className="w-13 h-13 rounded-xl bg-amber-500 text-slate-950 font-serif text-3xl font-bold flex items-center justify-center shadow-lg shadow-amber-500/30 animate-in zoom-in-75"
                  >
                    {char}
                  </div>
                ))
              )}
            </div>

            {/* Available Letter Tiles (Touch to Add) */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {availableLetters.map((char, idx) => (
                <button
                  key={`${char}-${idx}`}
                  data-letter={char}
                  data-ar-touchable="true"
                  onClick={() => handleAssembleLetter(char)}
                  className="ar-letter-tile w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-amber-400 text-white font-serif text-3xl font-bold flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer hover:scale-105"
                >
                  {char}
                </button>
              ))}
            </div>

            {/* Reset */}
            <button
              data-ar-touchable="true"
              onClick={() => {
                assembledLettersRef.current = [];
                setAssembledLetters([]);
                const fresh = activity.lettersToAssemble ? [...activity.lettersToAssemble] : [];
                availableLettersRef.current = fresh;
                setAvailableLetters(fresh);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 p-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة توزيع الحروف</span>
            </button>
          </div>
        )}

        {/* TYPE 4: ARRANGE SENTENCE (Sentence ordering) */}
        {activity.type === 'arrange_sentence' && (
          <div className="w-full flex flex-col items-center justify-between h-full py-4 z-20">
            <div className="text-center">
              <span className="text-xs font-semibold text-amber-400">ترتيب الجملة الصحيحة</span>
              <p className="text-xs text-slate-400 mt-0.5">رتّب الكلمات من اليمين إلى اليسار لتكوين جملة مفيدة</p>
            </div>

            {/* Sentence Slots */}
            <div className="flex items-center gap-3 flex-wrap justify-center py-6">
              {sentenceWords.map((word, idx) => (
                <div
                  key={`${word}-${idx}`}
                  className="group relative px-6 py-4 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-amber-400 shadow-xl flex items-center gap-3"
                >
                  <span className="text-xs font-mono text-amber-400/80">#{idx + 1}</span>
                  <span className="font-serif text-2xl font-bold text-white">{word}</span>
                  
                  {/* Reorder Arrows */}
                  <div className="flex flex-col gap-1 mr-2">
                    <button
                      data-ar-touchable="true"
                      onClick={() => handleMoveSentenceWord(idx, idx - 1)}
                      disabled={idx === 0}
                      className="text-[11px] px-2 py-1 bg-slate-700 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 rounded-md font-bold transition-colors"
                      title="تحريك لليمين"
                    >
                      ▶
                    </button>
                    <button
                      data-ar-touchable="true"
                      onClick={() => handleMoveSentenceWord(idx, idx + 1)}
                      disabled={idx === sentenceWords.length - 1}
                      className="text-[11px] px-2 py-1 bg-slate-700 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 rounded-md font-bold transition-colors"
                      title="تحريك لليسار"
                    >
                      ◀
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                data-ar-touchable="true"
                onClick={() => {
                  const joined = sentenceWordsRef.current.join(' ').replace(/\s+/g, ' ').trim();
                  audioService.speakArabic(joined);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>استمع للجملة الحالية</span>
              </button>

              <button
                data-ar-touchable="true"
                onClick={handleCheckSentence}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                تحقق من الإجابة
              </button>
            </div>
          </div>
        )}

        {/* TYPE 5: MISSING LETTER */}
        {activity.type === 'missing_letter' && (
          <div className="w-full flex flex-col items-center justify-between h-full py-6 z-20">
            <div className="text-center">
              <span className="text-xs font-semibold text-amber-400">أكمل الحرف الناقص</span>
              <p className="text-xs text-slate-400 mt-0.5">المس أو انقر الحرف المناسب لملء الفراغ</p>
            </div>

            {/* Word with Missing Blank */}
            <div className="px-8 py-5 rounded-3xl bg-slate-900/95 border border-slate-700 flex items-center gap-4 shadow-2xl">
              <span className="font-serif text-4xl sm:text-5xl font-extrabold text-white tracking-widest">
                {activity.wordWithBlank}
              </span>
            </div>

            {/* Options */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {activity.options?.map(opt => (
                <button
                  key={opt.id}
                  data-ar-touchable="true"
                  onClick={() => handleChooseMissingLetter(opt.text.split(' ')[0])}
                  className="px-7 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-amber-400 text-white font-serif text-2xl font-bold flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer hover:scale-105"
                >
                  {opt.text}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800">
              💡 أشر بإصبعك نحو الحرف للمسه باليد أو انقر عليه بالماوس
            </div>
          </div>
        )}

        {/* TYPE 6: LISTEN & CHOOSE */}
        {activity.type === 'listen_choose' && (
          <div className="w-full flex flex-col items-center justify-between h-full py-6 z-20">
            <div className="text-center">
              <span className="text-xs font-semibold text-amber-400">استماع وفهم</span>
              <p className="text-xs text-slate-400 mt-0.5">استمع للصوت العربي ثم حدد الخيار الصحيح</p>
            </div>

            {/* Big Audio Play Button */}
            <button
              data-ar-touchable="true"
              onClick={() => audioService.speakArabic(activity.audioPrompt || '')}
              className="group p-6 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold shadow-2xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-12 h-12" />
              <span className="text-xs font-bold">المس للاستماع للصوت 🎧</span>
            </button>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              {activity.options?.map(opt => (
                <button
                  key={opt.id}
                  data-ar-touchable="true"
                  onClick={() => handleChooseListenOption(opt.text)}
                  className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 text-white text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer hover:scale-105"
                >
                  {opt.text}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              استمع بدقة للحركات واللفظ
            </div>
          </div>
        )}

        {/* TYPE 7: CLASSIFY WORDS */}
        {activity.type === 'classify_words' && (
          <div className="w-full flex flex-col items-center justify-between h-full py-4 z-20">
            <div className="text-center">
              <span className="text-xs font-semibold text-amber-400">تصنيف المجموعات</span>
              <p className="text-xs text-slate-400 mt-0.5">صنّف العناصر التالية داخل المجموعة المطابقة</p>
            </div>

            {/* Two Category Baskets */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {activity.categories?.map(cat => {
                const count = Object.values(classifiedMap).filter(cId => cId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-slate-900/85 border-2 border-slate-700 flex flex-col items-center justify-center gap-1 shadow-lg"
                  >
                    <span className="text-4xl">{cat.emoji}</span>
                    <span className="text-sm font-bold text-white">{cat.label}</span>
                    <span className="text-[11px] text-slate-400">{cat.labelEn}</span>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1">
                      {count} مكتملة
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Items to Classify */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {activity.itemsToClassify
                ?.filter(item => !classifiedMap[item.id])
                .map(item => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 flex items-center gap-2 shadow-lg"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-xs font-bold text-white">{item.text}</span>
                    <div className="flex items-center gap-1 mr-2">
                      {activity.categories?.map(cat => (
                        <button
                          key={cat.id}
                          data-ar-touchable="true"
                          onClick={() => handleClassifyItem(item.id, cat.id)}
                          className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold transition-colors cursor-pointer"
                        >
                          ضع في {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div className="text-xs text-slate-400">
              صنّف جميع العناصر لإكمال النشاط بنجاح
            </div>
          </div>
        )}

      </div>

      {/* Footer Info & Instructions */}
      <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>طريقة الإدخال:</span>
          <span className="font-semibold text-amber-400">
            {inputMode === 'ar_hand' ? 'كاميرا الواقع المعزز (تتبع اليد واللمس)' : 'الماوس والشاشة اللمسية'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>النقاط المتاحة:</span>
          <span className="font-bold text-emerald-400">+{activity.points} نقطة</span>
        </div>
      </div>

      {/* Hand Calibration & Diagnostics Modal */}
      <HandCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        onSwitchToMouseMode={() => {
          setInputMode('mouse_touch');
          setIsCalibrationOpen(false);
        }}
      />

    </div>
  );
};
