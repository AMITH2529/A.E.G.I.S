import React, { useState, useEffect } from 'react';
import { sceneState } from '../scene/SceneState';

export default function CyberReticleHUD() {
  const [telemetry, setTelemetry] = useState({ pitch: 0, yaw: 0, roll: 0, fps: 60 });

  useEffect(() => {
    let frameId;
    let time = 0;
    const update = () => {
      time += 0.03;
      setTelemetry({
        pitch: (Math.sin(time) * 12.4).toFixed(1),
        yaw: (Math.cos(time * 0.7) * 45.2).toFixed(1),
        roll: (Math.sin(time * 0.5) * 5.1).toFixed(1),
        fps: Math.floor(58 + Math.random() * 4)
      });
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Central Rotating Target Lock Rings */}
      <div className="relative w-72 h-72 rounded-full border border-neon-cyan/20 flex items-center justify-center animate-spin-slow">
        <div className="w-56 h-56 rounded-full border border-dashed border-neon-cyan/30" />
        <div className="absolute inset-0 border-t-2 border-b-2 border-neon-cyan/40 rounded-full animate-reverse-spin" />
      </div>

      {/* Crosshair Center Pointer */}
      <div className="absolute w-6 h-6 border-l-2 border-t-2 border-neon-cyan/80 top-1/2 left-1/2 -translate-x-3 -translate-y-3" />
      <div className="absolute w-6 h-6 border-r-2 border-b-2 border-neon-cyan/80 top-1/2 left-1/2 -translate-x-3 -translate-y-3" />
      <div className="absolute w-2 h-2 bg-neon-cyan/90 rounded-full animate-ping" />

      {/* Live Telemetry Display */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[9px] font-mono text-neon-cyan/70 bg-black/50 backdrop-blur-md px-4 py-1 rounded-full border border-neon-cyan/30">
        <div>PITCH: <span className="text-white font-bold">{telemetry.pitch}°</span></div>
        <div>YAW: <span className="text-white font-bold">{telemetry.yaw}°</span></div>
        <div>ROLL: <span className="text-white font-bold">{telemetry.roll}°</span></div>
        <div>RATE: <span className="text-neon-cyan font-bold">{telemetry.fps} FPS</span></div>
      </div>
    </div>
  );
}
