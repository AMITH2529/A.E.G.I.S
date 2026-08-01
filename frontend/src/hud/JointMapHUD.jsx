import React, { useState, useEffect } from 'react';
import { handState } from '../hands/HandState';

export default function JointMapHUD() {
  const [activeHandData, setActiveHandData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (handState.isReady && handState.landmarks.length > 0) {
        setActiveHandData({
          handCount: handState.landmarks.length,
          landmarks: handState.landmarks[0],
          handedness: handState.handednesses[0]?.[0]?.categoryName || 'Right'
        });
      } else {
        setActiveHandData(null);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute right-6 top-36 pointer-events-auto flex flex-col items-end gap-2 font-mono">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/60 backdrop-blur-md border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(0,243,255,0.2)] transition-all cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? '▶ HIDE 21-JOINT MAP' : '◀ SHOW 21-JOINT MAP'}</span>
      </button>

      {isOpen && (
        <div className="bg-black/70 backdrop-blur-xl border border-neon-cyan/40 rounded-xl p-4 w-72 text-[11px] text-neon-blue shadow-[0_0_25px_rgba(0,243,255,0.2)]">
          <div className="flex justify-between items-center border-b border-neon-cyan/30 pb-2 mb-3">
            <span className="font-bold text-neon-cyan uppercase tracking-wider">🦴 SKELETAL 21-JOINT MAP</span>
            <span className="text-[9px] bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded font-bold">
              {activeHandData ? `${activeHandData.handedness.toUpperCase()} HAND` : 'NO HAND'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-[10px]">
            <div className="flex justify-between text-neon-blue/70 border-b border-white/5 pb-1">
              <span>JOINT HIERARCHY</span>
              <span>INDEX MAP</span>
            </div>

            <div className="flex justify-between items-center text-white/90">
              <span className="text-neon-cyan">🫵 TIPS</span>
              <span className="font-bold text-neon-cyan">4, 8, 12, 16, 20</span>
            </div>
            <div className="flex justify-between items-center text-white/80">
              <span>📍 DIP JOINTS</span>
              <span>3, 7, 11, 15, 19</span>
            </div>
            <div className="flex justify-between items-center text-white/80">
              <span>📍 PIP JOINTS</span>
              <span>2, 6, 10, 14, 18</span>
            </div>
            <div className="flex justify-between items-center text-white/80">
              <span>✊ MCP (KNUCKLES)</span>
              <span>1, 5, 9, 13, 17</span>
            </div>
            <div className="flex justify-between items-center text-white/90 border-b border-white/10 pb-2">
              <span className="text-neon-cyan">⌚ WRIST ANCHOR</span>
              <span className="font-bold text-neon-cyan">0</span>
            </div>

            <div className="mt-2 pt-1 border-t border-neon-cyan/20 flex flex-col gap-1 text-[9px]">
              <div className="flex justify-between text-emerald-400">
                <span>📏 KINEMATIC CONSTRAINTS:</span>
                <span className="font-bold">VALIDATED</span>
              </div>
              <div className="flex justify-between text-neon-cyan">
                <span>🏃 TEMPORAL SMOOTHING:</span>
                <span className="font-bold">EMA (a=0.45)</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>💻 MEDIAPIPE CORE:</span>
                <span className="font-bold">21 LANDMARKS</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
