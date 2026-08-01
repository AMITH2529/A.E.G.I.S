import React, { useState, useEffect } from 'react';
import Void from './void/Void';
import HandTracker from './hands/HandTracker';
import { useCommandParser } from './voice/CommandParser';
import { sceneState } from './scene/SceneState';
import Subtitles from './Subtitles';
import ChatWidget from './ui/ChatWidget';
import ImportTimerHUD from './ui/ImportTimerHUD';
import PalmMenuHUD from './ui/PalmMenuHUD';
import GestureTutorialModal from './ui/GestureTutorialModal';
import CyberReticleHUD from './ui/CyberReticleHUD';
function App() {
  const { systemState, lastCommand, sendManualCommand } = useCommandParser();
  const [selectedTutorialGesture, setSelectedTutorialGesture] = useState(null);

  const handleExport = () => {
    sceneState.shouldExport = true;
    sceneState.notify();
  };

  const handleClear = () => {
    sceneState.objects = [];
    sceneState.grabbedObjectId = null;
    sceneState.notify();
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Scene Background */}
      <Void />

      {/* Futuristic Stark Reticle & Telemetry Overlay */}
      <CyberReticleHUD />

      {/* Hidden MediaPipe Tracker */}
      <HandTracker />

      {/* Live Import Progress & Completion Timer HUD */}
      <ImportTimerHUD />

      {/* Palm-Up Menu Summon Arc */}
      <PalmMenuHUD />

      {/* Interactive Gesture Tutorial Modal Overlay */}
      <GestureTutorialModal 
        gestureId={selectedTutorialGesture} 
        onClose={() => setSelectedTutorialGesture(null)} 
      />

      {/* 2D HUD UI Layer */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between">
        <header className="flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-neon-blue/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,243,255,0.1)]">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">AEGIS</h1>
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-neon-blue mt-1">Holographic Command Center</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold px-4 py-2 rounded bg-black/60 backdrop-blur-sm border ${systemState === 'Online' ? 'border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>
              <div className={`w-2 h-2 rounded-full ${systemState === 'Online' ? 'bg-neon-cyan animate-pulse' : 'bg-red-500'}`} />
              System {systemState}
            </div>
          </div>
        </header>
        
        {/* Gesture Legend - Left Sidepanel (Full View 2-Column Micro Grid) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-80 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-2xl border border-neon-cyan/50 rounded-xl p-3 shadow-[0_0_30px_rgba(0,243,255,0.25)] ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-neon-cyan/30 pb-1 mb-2">
              <h3 className="text-neon-cyan text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <span>⚡</span> HOLO-GESTURE PROTOCOLS
              </h3>
              <span className="text-[8px] bg-neon-cyan/20 text-neon-cyan px-1.5 py-0.5 rounded font-mono border border-neon-cyan/40">ONLINE</span>
            </div>
            
            <div className="flex flex-col gap-2 font-mono">
              {/* Category 1: Spatial & Controls */}
              <div>
                <h4 className="text-neon-cyan/90 text-[8.5px] font-bold uppercase tracking-[0.12em] mb-1">
                  📐 SPATIAL & CAMERA (TAP FOR TUTORIAL)
                </h4>
                <div className="grid grid-cols-2 gap-1 text-[8.5px] text-neon-blue/90">
                  <button onClick={() => setSelectedTutorialGesture('grab')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🤏</span> <span>1. Pinch: Drag XYZ</span></button>
                  <button onClick={() => setSelectedTutorialGesture('rotate')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🔄</span> <span>2. Cradle: 3D Rotate</span></button>
                  <button onClick={() => setSelectedTutorialGesture('stretch')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">↔️</span> <span>3. Stretch: Scale Up</span></button>
                  <button onClick={() => setSelectedTutorialGesture('poke')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">👆</span> <span>4. Poke: UI Select</span></button>
                  <button onClick={() => setSelectedTutorialGesture('box_select')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">⬛</span> <span>5. Frame: Box Select</span></button>
                  <button onClick={() => setSelectedTutorialGesture('axis_lock')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🔒</span> <span>6. Point: Lock Axis</span></button>
                </div>
              </div>

              {/* Category 2: Tools & Modeling */}
              <div>
                <h4 className="text-neon-cyan/90 text-[8.5px] font-bold uppercase tracking-[0.12em] mb-1">
                  🔮 TOOLS & MODELING (TAP FOR TUTORIAL)
                </h4>
                <div className="grid grid-cols-2 gap-1 text-[8.5px] text-neon-blue/90">
                  <button onClick={() => setSelectedTutorialGesture('tool_menu')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🔮</span> <span>7. Palm Up: Tools Arc</span></button>
                  <button onClick={() => setSelectedTutorialGesture('orbit')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🎡</span> <span>8. Palms: Camera Orbit</span></button>
                  <button onClick={() => setSelectedTutorialGesture('tap_select')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🎯</span> <span>9. Index: Face Target</span></button>
                  <button onClick={() => setSelectedTutorialGesture('sculpt')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🗿</span> <span>10. Palm: Sculpt Mesh</span></button>
                  <button onClick={() => setSelectedTutorialGesture('explode')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">💥</span> <span>11. Dual Pinch: Explode</span></button>
                  <button onClick={() => setSelectedTutorialGesture('duplicate')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">✨</span> <span>12. Flick: Duplicate</span></button>
                </div>
              </div>

              {/* Category 3: Weapon & Stress Protocols */}
              <div>
                <h4 className="text-neon-cyan/90 text-[8.5px] font-bold uppercase tracking-[0.12em] mb-1">
                  💥 WEAPON & STRESS PROTOCOLS
                </h4>
                <div className="grid grid-cols-2 gap-1 text-[8.5px] text-neon-blue/90">
                  <button onClick={() => setSelectedTutorialGesture('repulsor')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🖐️</span> <span>Repulsor Blast</span></button>
                  <button onClick={() => setSelectedTutorialGesture('web_shooter')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">✊</span> <span>Web Shooter</span></button>
                  <button onClick={() => setSelectedTutorialGesture('shockwave')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">👊</span> <span>Air Shockwave</span></button>
                  <button onClick={() => setSelectedTutorialGesture('stress_scan')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">👇</span> <span>Stress Scan</span></button>
                </div>
              </div>

              {/* Category 4: New Advanced Gestures */}
              <div>
                <h4 className="text-neon-cyan/90 text-[8.5px] font-bold uppercase tracking-[0.12em] mb-1">
                  🚀 NEW ADVANCED GESTURES (TAP)
                </h4>
                <div className="grid grid-cols-2 gap-1 text-[8.5px] text-neon-blue/90">
                  <button onClick={() => setSelectedTutorialGesture('pinch_twist')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🤏🌀</span> <span>Pinch & Twist</span></button>
                  <button onClick={() => setSelectedTutorialGesture('laser_horns')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🤟</span> <span>Laser Cutter</span></button>
                  <button onClick={() => setSelectedTutorialGesture('vulcan_xray')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🖖</span> <span>Vulcan X-Ray</span></button>
                  <button onClick={() => setSelectedTutorialGesture('array_clone')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-left"><span className="text-xs">🤏⚡</span> <span>Array Mirror</span></button>
                  <button onClick={() => setSelectedTutorialGesture('gravity_wave')} className="col-span-2 flex items-center justify-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all cursor-pointer text-center"><span className="text-xs">🫱</span> <span>Zero-G Levitation Wave</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons - Top Right (High Prominence) */}
        <div className="absolute top-20 right-6 z-50 pointer-events-auto flex flex-col gap-2.5 font-mono">
          <button 
            onClick={handleExport} 
            className="bg-black/80 backdrop-blur-xl border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black px-6 py-3 rounded-xl font-black tracking-[0.2em] text-xs uppercase shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:shadow-[0_0_35px_rgba(0,243,255,0.8)] transition-all cursor-pointer flex items-center gap-2"
          >
            <span>💾</span> <span>EXPORT GLB</span>
          </button>
          <button 
            onClick={handleClear} 
            className="bg-black/80 backdrop-blur-xl border-2 border-red-500/80 text-red-400 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl font-black tracking-[0.2em] text-xs uppercase shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.7)] transition-all cursor-pointer flex items-center gap-2"
          >
            <span>🗑️</span> <span>CLEAR SCENE</span>
          </button>
        </div>

        {/* Subtitles Overlay */}
        <Subtitles />

        {/* Chat / Manual Command Input */}
        <ChatWidget onSendCommand={sendManualCommand} />

        {/* Vocal Interface Active Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md border border-neon-blue/40 rounded-full px-6 py-2 flex items-center gap-3 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
            <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_#00f3ff] animate-pulse" />
            <span className="text-[10px] text-neon-cyan uppercase tracking-[0.2em] font-bold">Wake Word: 'Hey AEGIS'</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
