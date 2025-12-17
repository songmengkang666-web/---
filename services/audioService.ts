export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioElement: HTMLAudioElement;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.loop = true;
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.src = "https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3"; // Default Xmas track
  }

  async initialize() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    this.source = this.audioContext.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  play() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    this.audioElement.play().catch(e => console.error("Audio play failed", e));
  }

  pause() {
    this.audioElement.pause();
  }

  setVolume(val: number) {
    this.audioElement.volume = val;
  }

  setSource(file: File) {
    const url = URL.createObjectURL(file);
    this.audioElement.src = url;
    this.play();
  }

  getBeatIntensity(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average of lower frequencies (Bass)
    let sum = 0;
    // Use first 10 bins for bass
    const bassBins = 10;
    for (let i = 0; i < bassBins; i++) {
      sum += this.dataArray[i];
    }
    
    const average = sum / bassBins;
    // Normalize 0-255 to 0-1
    return average / 255;
  }
}

export const audioService = new AudioService();
