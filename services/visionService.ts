import { HandGestureState } from '../types';

// Declare globals for the loaded script
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export class VisionService {
  private hands: any;
  private camera: any;
  private videoElement: HTMLVideoElement | null = null;
  private onGestureUpdate: ((state: HandGestureState) => void) | null = null;
  private isLoaded = false;

  async loadLibrary() {
    if (this.isLoaded) return;

    // Load MediaPipe Hands script
    await this.loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
    await this.loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
    
    this.isLoaded = true;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  async start(videoElement: HTMLVideoElement, callback: (state: HandGestureState) => void) {
    if (!this.isLoaded) await this.loadLibrary();
    
    this.videoElement = videoElement;
    this.onGestureUpdate = callback;

    const { Hands } = window;
    this.hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.processResults.bind(this));

    const { Camera } = window;
    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.videoElement && this.hands) {
          await this.hands.send({ image: this.videoElement });
        }
      },
      width: 640,
      height: 480
    });

    this.camera.start();
  }

  private processResults(results: any) {
    let leftHandOpenness = 0;
    let rightHandPinchDistance = 1;
    let isRightPinching = false;

    if (results.multiHandLandmarks) {
      for (const [index, landmarks] of results.multiHandLandmarks.entries()) {
        const classification = results.multiHandedness[index].label; // "Left" or "Right"
        
        // MediaPipe mirrors logic: "Left" usually means the user's left hand in non-mirrored mode
        // But often camera is mirrored. We'll check standard logic.
        // Let's assume standard "Left" and "Right" labels.
        
        if (classification === 'Left') {
          // Calculate Openness: Avg distance of tips from wrist (landmark 0)
          // Tips: 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
          const wrist = landmarks[0];
          const tips = [4, 8, 12, 16, 20];
          let totalDist = 0;
          
          tips.forEach(idx => {
            const dx = landmarks[idx].x - wrist.x;
            const dy = landmarks[idx].y - wrist.y;
            totalDist += Math.sqrt(dx*dx + dy*dy);
          });
          
          const avgDist = totalDist / 5;
          // Normalize (heuristic: 0.1 is closed, 0.4 is open)
          leftHandOpenness = Math.min(Math.max((avgDist - 0.1) / 0.3, 0), 1);

        } else if (classification === 'Right') {
          // Pinch: Distance between Index Tip (8) and Thumb Tip (4)
          const thumb = landmarks[4];
          const indexFinger = landmarks[8];
          const dx = thumb.x - indexFinger.x;
          const dy = thumb.y - indexFinger.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          rightHandPinchDistance = dist;
          // Heuristic threshold for pinch
          isRightPinching = dist < 0.05; 
        }
      }
    }

    if (this.onGestureUpdate) {
      this.onGestureUpdate({
        leftHandOpenness,
        rightHandPinchDistance,
        isRightPinching
      });
    }
  }

  stop() {
    if (this.camera) this.camera.stop();
  }
}

export const visionService = new VisionService();
