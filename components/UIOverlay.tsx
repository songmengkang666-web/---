import React, { useRef } from 'react';
import { TreeSettings } from '../types';

interface UIOverlayProps {
  settings: TreeSettings;
  setSettings: React.Dispatch<React.SetStateAction<TreeSettings>>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMusicSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleFullscreen: () => void;
  changeBackground: (style: string) => void;
  gestureState: { left: number; right: number; isPinch: boolean };
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  settings,
  setSettings,
  onFileSelect,
  onMusicSelect,
  toggleFullscreen,
  changeBackground,
  gestureState
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-4 left-4 z-20 text-white bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition"
      >
        <i className="fas fa-sliders-h"></i>
      </button>
    );
  }

  return (
    <div className="absolute top-0 left-0 h-full w-full sm:w-80 p-4 z-20 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-md text-white rounded-2xl p-6 pointer-events-auto h-full overflow-y-auto border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-yellow-300">
            <i className="fas fa-tree mr-2"></i>Dreamy Tree
          </h1>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Status Monitor */}
        <div className="mb-6 bg-white/5 rounded-lg p-3 text-xs space-y-2">
            <div className="flex justify-between">
                <span className="text-gray-400">Left Hand (Explode):</span>
                <span className="text-green-400 font-mono">{(gestureState.left * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-100" style={{ width: `${gestureState.left * 100}%` }}></div>
            </div>
            
            <div className="flex justify-between mt-2">
                <span className="text-gray-400">Right Hand (Pinch):</span>
                <span className={gestureState.isPinch ? "text-yellow-400 font-bold" : "text-gray-500"}>
                    {gestureState.isPinch ? "ACTIVE" : "IDLE"}
                </span>
            </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tree Height</label>
            <input 
              type="range" min="3" max="10" step="0.5"
              value={settings.height}
              onChange={(e) => setSettings(prev => ({...prev, height: parseFloat(e.target.value)}))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Particle Size</label>
            <input 
              type="range" min="0.1" max="1.0" step="0.1"
              value={settings.particleSize}
              onChange={(e) => setSettings(prev => ({...prev, particleSize: parseFloat(e.target.value)}))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rotation Speed</label>
            <input 
              type="range" min="0" max="5" step="0.5"
              value={settings.rotationSpeed}
              onChange={(e) => setSettings(prev => ({...prev, rotationSpeed: parseFloat(e.target.value)}))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Audio Reactivity</label>
            <input 
              type="range" min="0" max="2" step="0.1"
              value={settings.sensitivity}
              onChange={(e) => setSettings(prev => ({...prev, sensitivity: parseFloat(e.target.value)}))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          {/* Uploads */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div>
                <label className="flex items-center justify-center w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition group">
                    <i className="fas fa-camera mr-2 text-blue-400 group-hover:scale-110 transition"></i>
                    <span className="text-sm">Upload Photos</span>
                    <input type="file" multiple accept="image/*" onChange={onFileSelect} className="hidden" />
                </label>
            </div>
            <div>
                <label className="flex items-center justify-center w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition group">
                    <i className="fas fa-music mr-2 text-purple-400 group-hover:scale-110 transition"></i>
                    <span className="text-sm">Change Music</span>
                    <input type="file" accept="audio/*" onChange={onMusicSelect} className="hidden" />
                </label>
            </div>
          </div>

          {/* Theme Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => changeBackground('#000000')} className="p-2 text-xs bg-gray-900 rounded hover:bg-gray-800 border border-white/10">
                Pure Black
            </button>
            <button onClick={() => changeBackground('linear-gradient(to bottom, #0f2027, #203a43, #2c5364)')} className="p-2 text-xs bg-blue-900 rounded hover:bg-blue-800 border border-white/10">
                Aurora
            </button>
            <button onClick={() => changeBackground('linear-gradient(to bottom, #23074d, #cc5333)')} className="p-2 text-xs bg-red-900 rounded hover:bg-red-800 border border-white/10">
                Warm Winter
            </button>
             <button onClick={toggleFullscreen} className="p-2 text-xs bg-white/20 rounded hover:bg-white/30 border border-white/10">
                Fullscreen
            </button>
          </div>

        </div>
        
        <div className="mt-8 text-xs text-center text-gray-500">
            <p>Show Left Palm to Explode Tree</p>
            <p>Pinch Right Fingers to View Photo</p>
        </div>
      </div>
    </div>
  );
};
