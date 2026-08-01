import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { sceneState } from './SceneState';

export default function BoundingBoxHUD({ objects, meshRefs }) {
  return (
    <group>
      {objects.map((obj, i) => {
        const mesh = meshRefs.current[i];
        if (!mesh) return null;

        const scaleVal = obj.scale || 1.0;
        const width = (25.4 * scaleVal).toFixed(1);
        const height = (25.4 * scaleVal).toFixed(1);
        const depth = (25.4 * scaleVal).toFixed(1);
        const volume = (Math.pow(2.54 * scaleVal, 3)).toFixed(1);

        const pos = mesh.position || new THREE.Vector3(...obj.position);

        return (
          <group key={'bbox_' + obj.id} position={[pos.x, pos.y + 1.2 * scaleVal, pos.z]}>
            <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
              <div className="bg-black/85 backdrop-blur-md border border-neon-cyan/70 rounded-lg p-2 font-mono text-[9px] text-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.4)] whitespace-nowrap flex flex-col gap-0.5 animate-pulse">
                <div className="flex items-center justify-between border-b border-neon-cyan/30 pb-0.5 mb-0.5">
                  <span className="font-bold text-white tracking-widest text-[8px]">📐 CAD DIMENSIONS</span>
                  <span className="text-[7px] bg-neon-cyan/20 text-neon-cyan px-1 rounded">LIVE</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[8px]">
                  <div><span className="text-neon-blue">W:</span> {width}mm</div>
                  <div><span className="text-neon-blue">H:</span> {height}mm</div>
                  <div><span className="text-neon-blue">D:</span> {depth}mm</div>
                </div>
                <div className="flex items-center justify-between border-t border-neon-cyan/20 pt-0.5 mt-0.5 text-[7.5px] text-cyan-200">
                  <span>VOL: {volume} cm³</span>
                  <span className="text-neon-cyan">POS: ({pos.x.toFixed(1)}, {pos.y.toFixed(1)}, {pos.z.toFixed(1)})</span>
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
