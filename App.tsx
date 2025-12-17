import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Scene3D } from './components/Scene3D';
import { UIOverlay } from './components/UIOverlay';
import { audioService } from './services/audioService';
import { visionService } from './services/visionService';
import { TreeSettings, UserPhoto, HandGestureState } from './types';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [background, setBackground] = useState<string>('linear-gradient(to bottom, #0f2027, #203a43, #2c5364)'); // Aurora default
  const [settings, setSettings] = useState<TreeSettings>({
    height: 6,
    particleSize: 0.25,
    rotationSpeed: 1,
    sensitivity: 1.0,
  });

  // State for Visualization
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  
  // Hand State
  const [gestureState, setGestureState] = useState({ left: 0, right: 1, isPinch: false });
  // We smooth the left hand explosion factor
  const [smoothExplosion, setSmoothExplosion] = useState(0);

  // Photo Popup State
  const [activePhoto, setActivePhoto] = useState<UserPhoto | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Audio Loop
  useEffect(() => {
    if (!hasStarted) return;

    let rAF: number;
    const updateAudio = () => {
      const beat = audioService.getBeatIntensity();
      setBeatIntensity(beat);
      rAF = requestAnimationFrame(updateAudio);
    };
    updateAudio();
    return () => cancelAnimationFrame(rAF);
  }, [hasStarted]);

  // Start Sequence
  const handleStart = async () => {
    await audioService.initialize();
    audioService.play();
    setHasStarted(true);

    if (videoRef.current) {
      visionService.start(videoRef.current, (state: HandGestureState) => {
        setGestureState({
            left: state.leftHandOpenness,
            right: state.rightHandPinchDistance,
            isPinch: state.isRightPinching
        });
      });
    }
  };

  // Smoothing Explosion Factor & Photo Popup Logic
  useEffect(() => {
    // Lerp explosion factor for smoothness
    const target = gestureState.left;
    const interval = setInterval(() => {
        setSmoothExplosion(prev => prev + (target - prev) * 0.1);
    }, 16); // ~60fps

    // Handle Pinch - Show random photo
    if (gestureState.isPinch && !activePhoto && userPhotos.length > 0) {
        const randomPhoto = userPhotos[Math.floor(Math.random() * userPhotos.length)];
        setActivePhoto(randomPhoto);
    } else if (!gestureState.isPinch && activePhoto) {
        setActivePhoto(null);
    }

    return () => clearInterval(interval);
  }, [gestureState, activePhoto, userPhotos]);


  // File Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos: UserPhoto[] = Array.from(e.target.files).map((file: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file)
      }));
      setUserPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      audioService.setSource(e.target.files[0]);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-white" style={{ background }}>
      {/* Hidden Video for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline muted></video>

      {/* 3D Scene */}
      {hasStarted && (
        <Scene3D 
          settings={settings}
          beatIntensity={beatIntensity}
          explosionFactor={smoothExplosion}
          userPhotos={userPhotos}
          onSceneReady={(scene) => {
            // Can access raw scene here if needed for debugging
          }}
        />
      )}

      {/* Start Screen */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-yellow-200 to-red-400 mb-8 animate-pulse text-center">
            3D Magic Xmas Tree
          </h1>
          <p className="max-w-md text-center text-gray-300 mb-8 leading-relaxed">
            Experience a musical Christmas tree controlled by your hands. 
            <br/><br/>
            <span className="text-yellow-400"><i className="fas fa-hand-paper mr-2"></i>Left Hand:</span> Explode the tree.
            <br/>
            <span className="text-blue-400"><i className="fas fa-hand-lizard mr-2"></i>Right Hand:</span> Pinch to peek at memories.
          </p>
          <button 
            onClick={handleStart}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full text-xl font-bold shadow-lg hover:scale-105 transition transform flex items-center"
          >
            <i className="fas fa-play mr-3"></i> Start Experience
          </button>
          <div className="mt-4 text-xs text-gray-500">
            Microphone & Camera access required for interactivity.
          </div>
        </div>
      )}

      {/* UI Overlay */}
      {hasStarted && (
        <UIOverlay 
          settings={settings}
          setSettings={setSettings}
          onFileSelect={handlePhotoUpload}
          onMusicSelect={handleMusicUpload}
          toggleFullscreen={toggleFullscreen}
          changeBackground={setBackground}
          gestureState={gestureState}
        />
      )}

      {/* Popup Photo Overlay (Right Hand Pinch) */}
      {activePhoto && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="relative animate-[bounce_0.5s_ease-out]">
                <div className="p-2 bg-white rounded-lg shadow-[0_0_50px_rgba(255,255,255,0.5)] transform rotate-3">
                    <img src={activePhoto.url} alt="Memory" className="max-w-xs sm:max-w-md max-h-[60vh] object-cover rounded" />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}