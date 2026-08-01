import React from 'react';
import { sceneState } from '../scene/SceneState';
import { audioManager } from '../audio/AudioManager';

export default function QuickSpawnToolbar() {
  const spawnModel = (prompt, shapeType = 'glb') => {
    audioManager.playSummon();
    if (shapeType === 'glb') {
      let modelUrl = '';
      if (prompt.toLowerCase().includes('iron')) modelUrl = '/asset_cache/ironman.glb';
      else if (prompt.toLowerCase().includes('heli')) modelUrl = '/asset_cache/helicarrier.glb';
      else if (prompt.toLowerCase().includes('ferrari')) modelUrl = '/asset_cache/Ferrari.glb';
      else if (prompt.toLowerCase().includes('web')) modelUrl = '/asset_cache/webshooter.glb';
      
      const newObj = {
        id: prompt + '_' + Date.now(),
        shapeType: 'glb',
        url: modelUrl || '/asset_cache/ironman.glb',
        position: [0, 0, 0],
        scale: 1,
        color: '#00f3ff'
      };
      sceneState.objects.push(newObj);
    } else {
      const newObj = {
        id: shapeType + '_' + Date.now(),
        shapeType: shapeType,
        position: [(Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2],
        scale: 1,
        color: '#00f3ff'
      };
      sceneState.objects.push(newObj);
    }
    sceneState.notify();
  };

  const applyColorPreset = (colorHex) => {
    audioManager.playClick();
    sceneState.objects.forEach(obj => {
      obj.color = colorHex;
    });
    sceneState.notify();
  };

  const toggleXRayMode = () => {
    audioManager.playXRay();
    sceneState.xrayMode = !sceneState.xrayMode;
    sceneState.notify();
  };

  return (
    <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2.5 z-40">
      {/* Quick Asset Spawner */}
      <div className="bg-black/80 backdrop-blur-xl border border-neon-cyan/50 rounded-xl p-2.5 shadow-[0_0_25px_rgba(0,243,255,0.2)] flex flex-col gap-1.5 w-60">
        <div className="flex items-center justify-between border-b border-neon-cyan/30 pb-1">
          <span className="text-neon-cyan text-[9px] font-black uppercase tracking-widest font-mono flex items-center gap-1">
            <span>⚡</span> QUICK SPAWN ASSETS
          </span>
          <span className="text-[7.5px] text-neon-blue bg-neon-cyan/10 px-1 rounded">CAD LIBRARY</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono">
          <button onClick={() => spawnModel('Iron Man', 'glb')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 text-cyan-200 transition-all cursor-pointer">
            <span>🤖</span> <span>Iron Man</span>
          </button>
          <button onClick={() => spawnModel('Helicarrier', 'glb')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 text-cyan-200 transition-all cursor-pointer">
            <span>🚀</span> <span>Helicarrier</span>
          </button>
          <button onClick={() => spawnModel('Ferrari', 'glb')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 text-cyan-200 transition-all cursor-pointer">
            <span>🏎️</span> <span>Ferrari</span>
          </button>
          <button onClick={() => spawnModel('Webshooter', 'glb')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 text-cyan-200 transition-all cursor-pointer">
            <span>🕷️</span> <span>Webshooter</span>
          </button>
          <button onClick={() => spawnModel('box', 'box')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 text-cyan-200 transition-all cursor-pointer">
            <span>📦</span> <span>Cube Mesh</span>
          </button>
          <button onClick={() => spawnModel('torus', 'torus')} className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/20 text-cyan-200 transition-all cursor-pointer">
            <span>⭕</span> <span>Torus Mesh</span>
          </button>
        </div>
      </div>

      {/* Holographic Color & Shader Controls */}
      <div className="bg-black/80 backdrop-blur-xl border border-neon-cyan/50 rounded-xl p-2.5 shadow-[0_0_25px_rgba(0,243,255,0.2)] flex flex-col gap-1.5 w-60 font-mono">
        <div className="flex items-center justify-between border-b border-neon-cyan/30 pb-1">
          <span className="text-neon-cyan text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
            <span>🎨</span> HOLO MATERIAL PALETTE
          </span>
          <span className="text-[7.5px] text-neon-blue bg-neon-cyan/10 px-1 rounded">COLOR</span>
        </div>
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <button onClick={() => applyColorPreset('#00f3ff')} className="w-8 h-6 rounded border border-cyan-400 bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] hover:scale-110 transition-all cursor-pointer" title="Cyan Hologram" />
          <button onClick={() => applyColorPreset('#ffd700')} className="w-8 h-6 rounded border border-yellow-400 bg-[#ffd700] shadow-[0_0_10px_#ffd700] hover:scale-110 transition-all cursor-pointer" title="Stark Gold" />
          <button onClick={() => applyColorPreset('#ff0033')} className="w-8 h-6 rounded border border-red-500 bg-[#ff0033] shadow-[0_0_10px_#ff0033] hover:scale-110 transition-all cursor-pointer" title="Crimson Core" />
          <button onClick={() => applyColorPreset('#00ff66')} className="w-8 h-6 rounded border border-emerald-400 bg-[#00ff66] shadow-[0_0_10px_#00ff66] hover:scale-110 transition-all cursor-pointer" title="Emerald Matrix" />
          <button onClick={() => applyColorPreset('#9900ff')} className="w-8 h-6 rounded border border-purple-400 bg-[#9900ff] shadow-[0_0_10px_#9900ff] hover:scale-110 transition-all cursor-pointer" title="Quantum Violet" />
        </div>
        <div className="pt-1 flex gap-1.5">
          <button onClick={toggleXRayMode} className="flex-1 bg-white/5 border border-neon-cyan/40 hover:bg-neon-cyan/20 text-neon-cyan py-1 text-[8.5px] font-bold uppercase rounded transition-all cursor-pointer">
            <span>🖖</span> Toggle X-Ray
          </button>
        </div>
      </div>
    </div>
  );
}
