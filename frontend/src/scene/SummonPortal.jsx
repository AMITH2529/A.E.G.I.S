import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { sceneState } from './SceneState';
import * as THREE from 'three';

export default function SummonPortal() {
  const pointsRef = useRef();
  const [active, setActive] = useState(sceneState.isForging);

  useEffect(() => {
    return sceneState.subscribe(() => {
      setActive(sceneState.isForging);
    });
  }, []);

  const particleCount = 1000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Cylinder distribution
      const r = 1.5 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(theta);
      
      // Cyberpunk cyan/blue mix
      const isCyan = Math.random() > 0.5;
      col[i * 3] = 0;
      col[i * 3 + 1] = isCyan ? 0.95 : 0.46;
      col[i * 3 + 2] = 1.0;
    }
    
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !active) return;
    
    // Rotate vortex
    pointsRef.current.rotation.y += 0.05;
    
    // Pulse scale
    const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
    pointsRef.current.scale.set(scale, scale, scale);
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
