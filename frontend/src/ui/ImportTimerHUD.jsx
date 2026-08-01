import React, { useState, useEffect } from 'react';
import { sceneState } from '../scene/SceneState';

export default function ImportTimerHUD() {
  const [hudState, setHudState] = useState({
    isForging: false,
    itemName: '',
    elapsedTime: 0,
    lastImportDuration: null,
    showCompleteBanner: false
  });

  useEffect(() => {
    let timerInterval = null;

    const unsubscribe = sceneState.subscribe(() => {
      const isForging = !!sceneState.isForging;
      const itemName = sceneState.forgeItemName || '3D Model';
      const lastImportDuration = sceneState.lastImportDuration;

      setHudState(prev => {
        const nextState = {
          ...prev,
          isForging,
          itemName,
          lastImportDuration
        };

        if (isForging && !prev.isForging) {
          nextState.elapsedTime = 0;
          nextState.showCompleteBanner = false;
        } else if (!isForging && prev.isForging && lastImportDuration !== null) {
          nextState.showCompleteBanner = true;
        }

        return nextState;
      });
    });

    return () => {
      unsubscribe();
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  // Tick elapsed timer during forging
  useEffect(() => {
    let interval = null;
    if (hudState.isForging) {
      const startTime = performance.now();
      interval = setInterval(() => {
        const currentElapsed = (performance.now() - startTime) / 1000;
        setHudState(prev => ({ ...prev, elapsedTime: currentElapsed }));
      }, 50);
    } else if (hudState.showCompleteBanner) {
      const timeout = setTimeout(() => {
        setHudState(prev => ({ ...prev, showCompleteBanner: false }));
      }, 6000);
      return () => clearTimeout(timeout);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hudState.isForging, hudState.showCompleteBanner]);

  if (!hudState.isForging && !hudState.showCompleteBanner) return null;

  // Estimated progress calculation (typical Sketchfab API download takes ~3 to 4 seconds)
  const estTotal = 3.5;
  const progressPct = hudState.isForging
    ? Math.min(95, Math.round((hudState.elapsedTime / estTotal) * 100))
    : 100;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      {hudState.isForging ? (
        /* Active Forging & Download Progress Timer Panel */
        <div className="bg-black/80 backdrop-blur-2xl border border-neon-cyan/60 rounded-2xl p-4 min-w-[340px] shadow-[0_0_40px_rgba(0,243,255,0.4)] ring-1 ring-white/20 animate-pulse-subtle">
          <div className="flex items-center justify-between border-b border-neon-cyan/30 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-cyan animate-ping" />
              <span className="text-neon-cyan text-xs font-black uppercase tracking-[0.2em]">
                ⚡ HOLO-FORGE PIPELINE
              </span>
            </div>
            <span className="text-[10px] font-mono text-neon-blue bg-neon-cyan/10 border border-neon-cyan/30 px-2 py-0.5 rounded">
              DOWNLOADING
            </span>
          </div>

          <div className="flex flex-col gap-2 font-mono text-xs text-white/90">
            <div className="flex justify-between items-center text-neon-cyan">
              <span>TARGET OBJECT:</span>
              <span className="font-bold text-white uppercase tracking-wider">{hudState.itemName}</span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-neon-blue">
              <span>SOURCE:</span>
              <span className="text-neon-cyan">SKETCHFAB API / LOCAL CACHE</span>
            </div>

            {/* Live Timer Display */}
            <div className="flex justify-between items-center my-1 bg-black/60 p-2 rounded-lg border border-white/10">
              <span className="text-neon-blue text-[10px] tracking-widest">ELAPSED TIME:</span>
              <span className="text-xl font-bold text-neon-cyan drop-shadow-[0_0_10px_#00f3ff]">
                {hudState.elapsedTime.toFixed(1)}s
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden border border-neon-cyan/40 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-neon-blue via-neon-cyan to-green-400 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_#00f3ff]"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-neon-blue/80 mt-1">
              <span>ESTIMATED: ~3.5s</span>
              <span className="text-neon-cyan font-bold">{progressPct}%</span>
            </div>
          </div>
        </div>
      ) : (
        /* Completion Notification Banner */
        <div className="bg-black/90 backdrop-blur-2xl border border-green-400/80 rounded-2xl p-4 min-w-[320px] shadow-[0_0_35px_rgba(74,222,128,0.4)] ring-1 ring-white/20 animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-400/20 border border-green-400 flex items-center justify-center text-green-400 text-lg shadow-[0_0_15px_#4ade80]">
              ✓
            </div>
            <div className="flex flex-col font-mono">
              <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
                MODEL IMPORT COMPLETE
              </span>
              <span className="text-white text-xs mt-0.5">
                Imported <strong className="text-neon-cyan">{hudState.itemName}</strong> in{' '}
                <strong className="text-green-300 font-bold">{hudState.lastImportDuration}s</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
