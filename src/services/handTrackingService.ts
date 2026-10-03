/**
 * Hand Tracking Service using MediaPipe Hands
 * - Tracks 21 hand landmarks
 * - Computes Index Finger Tip (Landmark 8) for virtual cursor
 * - Computes Thumb Tip (Landmark 4) to Index Tip distance for Pinch detection
 * - Implements Palm-Width Normalization to make Pinch detection scale-invariant
 * - Configurable sensitivity presets (easy, normal, strict)
 * - Implements smoothing formula: cursor += (target - cursor) * 0.35
 * - Strictly manages camera lifecycle (starts only during AR activities, stops immediately after)
 * - Enhanced camera illumination and exposure controls
 */

export interface HandData {
  indexTip: { x: number; y: number } | null;
  thumbTip: { x: number; y: number } | null;
  middleTip: { x: number; y: number } | null;
  ringTip: { x: number; y: number } | null;
  pinkyTip: { x: number; y: number } | null;
  wrist: { x: number; y: number } | null;

  // 2-finger pinch (Thumb + Index) - For grabbing & moving items
  isPinching: boolean;
  pinchDistance: number;
  pinchRatio: number;

  // 3-finger pinch (Thumb + Index + Middle) - For holding a pen & drawing ✍️
  isThreeFingerPinching: boolean;
  threeFingerSpread: number;
  threeFingerRatio: number;
  threeFingerCentroid: { x: number; y: number } | null;

  // Active detected gesture
  gesture: 'pointing' | 'two_finger_pinch' | 'three_finger_pen' | 'open_hand' | 'no_hand';

  landmarks: Array<{ x: number; y: number; z: number }> | null;
  lastUpdated: number;
  fps: number;
  estimatedLightLevel: 'dark' | 'good' | 'bright';
}

export type HandCallback = (data: HandData) => void;
export type PinchSensitivity = 'easy' | 'normal' | 'strict';

class HandTrackingService {
  private hands: any = null;
  private camera: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private isRunning: boolean = false;
  private callback: HandCallback | null = null;

  // 2-Finger Pinch Sensitivity Thresholds
  private pinchOnThreshold: number = 0.11;
  private pinchOffThreshold: number = 0.145;
  private currentPinchState: boolean = false;

  // 3-Finger Pen Grip Thresholds (Thumb + Index + Middle)
  // Must be strictly calibrated so an open hand never accidentally triggers pen-down
  private threeFingerOnThreshold: number = 0.075;
  private threeFingerOffThreshold: number = 0.092;
  private threeFingerOnRatio: number = 0.52;
  private threeFingerOffRatio: number = 0.60;
  private currentThreeFingerState: boolean = false;

  private sensitivity: PinchSensitivity = 'easy';

  // Smoothed cursor coordinates
  private smoothedX: number = 0.5;
  private smoothedY: number = 0.5;
  private smoothedCentroidX: number = 0.5;
  private smoothedCentroidY: number = 0.5;
  private readonly SMOOTHING_FACTOR = 0.35;

  // FPS & Diagnostics
  private frameCount: number = 0;
  private lastFpsCalcTime: number = Date.now();
  private currentFps: number = 0;
  private lightLevel: 'dark' | 'good' | 'bright' = 'good';

  // Brightness filter level (1.0 = normal, 1.5 = boosted, 2.0 = extra bright, 2.5 = max)
  private brightnessMultiplier: number = 1.5;

  private latestData: HandData = {
    indexTip: null,
    thumbTip: null,
    middleTip: null,
    ringTip: null,
    pinkyTip: null,
    wrist: null,
    isPinching: false,
    pinchDistance: 1.0,
    pinchRatio: 1.0,
    isThreeFingerPinching: false,
    threeFingerSpread: 1.0,
    threeFingerRatio: 1.0,
    threeFingerCentroid: null,
    gesture: 'no_hand',
    landmarks: null,
    lastUpdated: 0,
    fps: 0,
    estimatedLightLevel: 'good'
  };

  /**
   * Set pinch & pen grip sensitivity
   */
  public setSensitivity(level: PinchSensitivity) {
    this.sensitivity = level;
    if (level === 'easy') {
      this.pinchOnThreshold = 0.115;
      this.pinchOffThreshold = 0.15;
      this.threeFingerOnThreshold = 0.075;
      this.threeFingerOffThreshold = 0.092;
      this.threeFingerOnRatio = 0.52;
      this.threeFingerOffRatio = 0.60;
    } else if (level === 'normal') {
      this.pinchOnThreshold = 0.09;
      this.pinchOffThreshold = 0.125;
      this.threeFingerOnThreshold = 0.060;
      this.threeFingerOffThreshold = 0.076;
      this.threeFingerOnRatio = 0.42;
      this.threeFingerOffRatio = 0.50;
    } else {
      this.pinchOnThreshold = 0.07;
      this.pinchOffThreshold = 0.10;
      this.threeFingerOnThreshold = 0.048;
      this.threeFingerOffThreshold = 0.062;
      this.threeFingerOnRatio = 0.35;
      this.threeFingerOffRatio = 0.42;
    }
  }

  public getSensitivity(): PinchSensitivity {
    return this.sensitivity;
  }

  /**
   * Dynamically ensure MediaPipe scripts are loaded from CDN if not yet on window
   */
  public async ensureMediaPipeLoaded(): Promise<boolean> {
    if ((window as any).Hands && (window as any).Camera) {
      return true;
    }

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      return !!((window as any).Hands);
    } catch (err) {
      console.error('MediaPipe CDN load failed:', err);
      return false;
    }
  }

  /**
   * Set brightness enhancement multiplier
   */
  public setBrightnessMultiplier(val: number) {
    this.brightnessMultiplier = val;
    if (this.videoElement) {
      this.videoElement.style.filter = `brightness(${val}) contrast(1.15) saturate(1.15)`;
    }
  }

  public getBrightnessMultiplier(): number {
    return this.brightnessMultiplier;
  }

  /**
   * Check if camera is available in navigator
   */
  public async checkCameraSupport(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(d => d.kind === 'videoinput');
    } catch {
      return true;
    }
  }

  /**
   * Start tracking on specified video element
   */
  public async startTracking(
    videoEl: HTMLVideoElement,
    onHandData: HandCallback
  ): Promise<{ success: boolean; error?: string }> {
    this.callback = onHandData;
    this.videoElement = videoEl;

    // Apply brightness enhancement filter to video immediately
    this.videoElement.style.filter = `brightness(${this.brightnessMultiplier}) contrast(1.15) saturate(1.15)`;

    try {
      // 1. Ensure library is loaded
      await this.ensureMediaPipeLoaded();

      const HandsClass = (window as any).Hands;
      if (!HandsClass) {
        throw new Error('لم يتم تحميل مكتبة MediaPipe Hands من المتصفح بنجاح.');
      }

      // 2. Initialize MediaPipe Hands if not already created
      if (!this.hands) {
        this.hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4
        });

        this.hands.onResults((results: any) => this.processResults(results));
      }

      // 3. Initialize Camera helper
      const CameraClass = (window as any).Camera;
      if (CameraClass) {
        this.camera = new CameraClass(this.videoElement, {
          onFrame: async () => {
            if (this.isRunning && this.hands && this.videoElement) {
              this.updateFps();
              await this.hands.send({ image: this.videoElement });
            }
          },
          width: 640,
          height: 480
        });

        await this.camera.start();
        this.isRunning = true;
        return { success: true };
      } else {
        // Direct getUserMedia fallback
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
        this.isRunning = true;

        const loop = async () => {
          if (this.isRunning && this.videoElement && this.hands) {
            this.updateFps();
            await this.hands.send({ image: this.videoElement });
            requestAnimationFrame(loop);
          }
        };
        requestAnimationFrame(loop);
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Failed to start camera / hand tracking:', err);
      this.isRunning = false;
      return {
        success: false,
        error: err.name === 'NotAllowedError'
          ? 'تم رفض إذن الوصول للكاميرا من المتصفح. يمكنك إكمال النشاط بالماوس أو اللمس.'
          : 'تعذر تشغيل الكاميرا أو نموذج تتبع اليد. يمكنك استخدام الماوس أو اللمس كبديل مباشر.'
      };
    }
  }

  private updateFps() {
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastFpsCalcTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }
  }

  /**
   * Process results from MediaPipe hands
   */
  private processResults(results: any) {
    if (!this.isRunning) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Landmark 8: Index Finger Tip
      // Landmark 4: Thumb Tip
      // Landmark 12: Middle Finger Tip
      // Landmark 16: Ring Finger Tip
      // Landmark 20: Pinky Finger Tip
      // Landmark 0: Wrist
      // Landmark 5: Index Knuckle (MCP)
      // Landmark 17: Pinky Knuckle (MCP)
      const rawIndex = landmarks[8];
      const rawThumb = landmarks[4];
      const rawMiddle = landmarks[12];
      const rawRing = landmarks[16];
      const rawPinky = landmarks[20];
      const rawWrist = landmarks[0];
      const rawIndexKnuckle = landmarks[5];
      const rawPinkyKnuckle = landmarks[17];

      // Video is mirrored for natural interaction: x is flipped: 1 - x
      const targetX = 1 - rawIndex.x;
      const targetY = rawIndex.y;

      const thumbX = 1 - rawThumb.x;
      const thumbY = rawThumb.y;

      const middleX = 1 - rawMiddle.x;
      const middleY = rawMiddle.y;

      const ringX = 1 - rawRing.x;
      const ringY = rawRing.y;

      const pinkyX = 1 - rawPinky.x;
      const pinkyY = rawPinky.y;

      const wristX = 1 - rawWrist.x;
      const wristY = rawWrist.y;

      // Cursor smoothing formula: cursor += (target - cursor) * 0.35
      this.smoothedX += (targetX - this.smoothedX) * this.SMOOTHING_FACTOR;
      this.smoothedY += (targetY - this.smoothedY) * this.SMOOTHING_FACTOR;

      // Palm width (scale invariant reference)
      const palmDx = (1 - rawPinkyKnuckle.x) - (1 - rawIndexKnuckle.x);
      const palmDy = rawPinkyKnuckle.y - rawIndexKnuckle.y;
      const palmWidth = Math.max(0.04, Math.sqrt(palmDx * palmDx + palmDy * palmDy));

      // 1. Two-Finger Pinch (Thumb Tip to Index Tip) - Used for grabbing/moving
      const dxThumbIndex = thumbX - targetX;
      const dyThumbIndex = thumbY - targetY;
      const rawDistance = Math.sqrt(dxThumbIndex * dxThumbIndex + dyThumbIndex * dyThumbIndex);
      const pinchRatio = rawDistance / palmWidth;

      const isCurrentlyClose2 = rawDistance < this.pinchOnThreshold || pinchRatio < 0.68;
      const isCurrentlyFar2 = rawDistance > this.pinchOffThreshold && pinchRatio > 0.95;

      if (this.currentPinchState) {
        if (isCurrentlyFar2) {
          this.currentPinchState = false;
        }
      } else {
        if (isCurrentlyClose2) {
          this.currentPinchState = true;
        }
      }

      // 2. Three-Finger Pen Grip (Thumb + Index + Middle) - Used for drawing ✍️
      const dxIndexMiddle = targetX - middleX;
      const dyIndexMiddle = targetY - middleY;
      const distIndexMiddle = Math.sqrt(dxIndexMiddle * dxIndexMiddle + dyIndexMiddle * dyIndexMiddle);

      const dxThumbMiddle = thumbX - middleX;
      const dyThumbMiddle = thumbY - middleY;
      const distThumbMiddle = Math.sqrt(dxThumbMiddle * dxThumbMiddle + dyThumbMiddle * dyThumbMiddle);

      // Max spread among the 3 tips
      const threeFingerSpread = Math.max(rawDistance, distIndexMiddle, distThumbMiddle);
      const threeFingerRatio = threeFingerSpread / palmWidth;

      // Centroid of the 3 fingertips (natural virtual pen position)
      const rawCentroidX = (thumbX + targetX + middleX) / 3;
      const rawCentroidY = (thumbY + targetY + middleY) / 3;
      this.smoothedCentroidX += (rawCentroidX - this.smoothedCentroidX) * 0.40;
      this.smoothedCentroidY += (rawCentroidY - this.smoothedCentroidY) * 0.40;

      // 3-Finger Pen Grip Hysteresis:
      // To start drawing: ALL 3 fingers must be joined together into a true pen grip
      const isCurrentlyClose3 = threeFingerSpread < this.threeFingerOnThreshold && threeFingerRatio < this.threeFingerOnRatio;

      // To stop drawing: Opening fingers or lifting the pen releases IMMEDIATELY
      const isCurrentlyFar3 = threeFingerSpread > this.threeFingerOffThreshold || threeFingerRatio > this.threeFingerOffRatio;

      if (this.currentThreeFingerState) {
        if (isCurrentlyFar3) {
          this.currentThreeFingerState = false;
        }
      } else {
        if (isCurrentlyClose3) {
          this.currentThreeFingerState = true;
        }
      }

      // 3. Gesture Classification
      let gesture: 'pointing' | 'two_finger_pinch' | 'three_finger_pen' | 'open_hand' | 'no_hand' = 'open_hand';
      if (this.currentThreeFingerState) {
        gesture = 'three_finger_pen';
      } else if (this.currentPinchState && distIndexMiddle > 0.08) {
        gesture = 'two_finger_pinch';
      } else {
        // Pointing with index extended
        const isIndexExtended = rawIndex.y < (landmarks[6]?.y ?? 1.0);
        const isMiddleFolded = rawMiddle.y > (landmarks[10]?.y ?? 0);
        if (isIndexExtended && (isMiddleFolded || rawDistance > 0.15)) {
          gesture = 'pointing';
        } else {
          gesture = 'open_hand';
        }
      }

      this.latestData = {
        indexTip: { x: this.smoothedX, y: this.smoothedY },
        thumbTip: { x: thumbX, y: thumbY },
        middleTip: { x: middleX, y: middleY },
        ringTip: { x: ringX, y: ringY },
        pinkyTip: { x: pinkyX, y: pinkyY },
        wrist: { x: wristX, y: wristY },
        isPinching: this.currentPinchState,
        pinchDistance: rawDistance,
        pinchRatio,
        isThreeFingerPinching: this.currentThreeFingerState,
        threeFingerSpread,
        threeFingerRatio,
        threeFingerCentroid: { x: this.smoothedCentroidX, y: this.smoothedCentroidY },
        gesture,
        landmarks: landmarks.map((pt: any) => ({ x: 1 - pt.x, y: pt.y, z: pt.z })),
        lastUpdated: Date.now(),
        fps: this.currentFps,
        estimatedLightLevel: this.lightLevel
      };
    } else {
      // No hand detected
      this.currentPinchState = false;
      this.currentThreeFingerState = false;
      this.latestData = {
        indexTip: null,
        thumbTip: null,
        middleTip: null,
        ringTip: null,
        pinkyTip: null,
        wrist: null,
        isPinching: false,
        pinchDistance: 1.0,
        pinchRatio: 1.0,
        isThreeFingerPinching: false,
        threeFingerSpread: 1.0,
        threeFingerRatio: 1.0,
        threeFingerCentroid: null,
        gesture: 'no_hand',
        landmarks: null,
        lastUpdated: Date.now(),
        fps: this.currentFps,
        estimatedLightLevel: this.lightLevel
      };
    }

    if (this.callback) {
      this.callback(this.latestData);
    }
  }

  /**
   * Stop tracking and release hardware camera tracks immediately
   */
  public stopTracking() {
    this.isRunning = false;
    this.callback = null;

    if (this.camera && typeof this.camera.stop === 'function') {
      try {
        this.camera.stop();
      } catch {
        // Ignore
      }
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      this.videoElement.srcObject = null;
    }

    this.latestData = {
      indexTip: null,
      thumbTip: null,
      middleTip: null,
      ringTip: null,
      pinkyTip: null,
      wrist: null,
      isPinching: false,
      pinchDistance: 1.0,
      pinchRatio: 1.0,
      isThreeFingerPinching: false,
      threeFingerSpread: 1.0,
      threeFingerRatio: 1.0,
      threeFingerCentroid: null,
      gesture: 'no_hand',
      landmarks: null,
      lastUpdated: 0,
      fps: 0,
      estimatedLightLevel: 'good'
    };
    this.currentPinchState = false;
    this.currentThreeFingerState = false;
  }

  public getLatestData(): HandData {
    return this.latestData;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const handTrackingService = new HandTrackingService();
