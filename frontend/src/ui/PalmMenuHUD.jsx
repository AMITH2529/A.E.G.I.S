import React, { useState, useEffect } from 'react';
import { sceneState } from '../scene/SceneState';

export default function PalmMenuHUD() {
  const [activeGestures, setActiveGestures] = useState([]);

  useEffect(() => {
    const unsubscribe = sceneState.subscribe(() => {
      setActiveGestures(sceneState.activeGestures || []);
    });
    return unsubscribe;
  }, []);

  const palmGesture = activeGestures.find(g => g.type === 'palm_up_menu');

  if (!palmGesture) return null;

  const posX = palmGesture.position ? palmGesture.position.x * window.innerWidth : window.innerWidth / 2;
  const posY = palmGesture.position ? palmGesture.position.y * window.innerHeight : window.innerHeight / 2;

  const tools = [
    { name: 'Paint', icon: '🎨' },
    { name: 'Sculpt', icon: '✏️' },
    { name: 'Extrude', icon: '📦' },
    { name: 'Merge', icon: '🔄' },
    { name: 'Explode', icon: '💥' }
  ];

  return (
    <div 
      className="fixed pointer-events-auto transition-all duration-300 z-50 -translate-x-1/2 -translate-y-full"
      style={{ left: `${posX}px`, top: `${posY - 20}px` }}
    >
      <div className="relative w-64 h-32 flex items-end justify-center">
        {/* Semi-circular Holographic Ring Background */}
        <div className="absolute inset-0 border-t-2 border-neon-cyan/80 rounded-t-full bg-gradient-to-t from-black/80 to-cyan-950/40 backdrop-blur-md shadow-[0_-5px_25px_rgba(0,243,255,0.4)] animate-pulse" />
        
        {/* Radial Buttons */}
        <div className="relative flex items-center justify-around w-full px-4 pb-3 z-10">
          {tools.map((tool, idx) => (
            <button 
              key={tool.name}
              onClick={() => {
                if (tool.name === 'Explode') {
                  sceneState.objects.forEach(obj => obj.explosionFactor = (obj.explosionFactor || 0) > 0 ? 0 : 0.8);
                  sceneState.notify();
                } else if (tool.name === 'Paint') {
                  if (sceneState.objects.length > 0) {
                    sceneState.objects[sceneState.objects.length - 1].color = '#ff0055';
                    sceneState.notify();
                  }
                }
              }}
              className="group flex flex-col items-center gap-1 hover:scale-115 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-neon-cyan/60 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(0,243,255,0.3)] group-hover:border-neon-cyan group-hover:bg-neon-cyan/30">
                {tool.icon}
              </div>
              <span className="text-[9px] font-mono font-bold text-neon-cyan uppercase tracking-wider">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
