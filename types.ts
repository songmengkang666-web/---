export interface HandGestureState {
  leftHandOpenness: number; // 0 (closed) to 1 (open) - Controls Explosion
  rightHandPinchDistance: number; // Normalized distance
  isRightPinching: boolean; // Trigger for photo popup
}

export interface AudioState {
  isPlaying: boolean;
  beatIntensity: number; // 0 to 1 scale for visual pulse
  volume: number;
}

export interface TreeSettings {
  height: number;
  particleSize: number;
  rotationSpeed: number;
  sensitivity: number; // Audio sensitivity
}

export interface UserPhoto {
  id: string;
  url: string;
  texture?: any; // THREE.Texture
}
