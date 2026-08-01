import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { handState } from '../hands/HandState';

const DUST_COUNT = 500;
const BOUNDS = 10;

export default function VoidDust() {
  const meshRef = useRef();
  
  // Initialize particles
  const { positions, velocities, initialPositions } = useMemo(() => {
    const pos = new Float32Array(DUST_COUNT * 3);
    const init = new Float32Array(DUST_COUNT * 3);
    const vel = new Float32Array(DUST_COUNT * 3);
    
    for (let i = 0; i < DUST_COUNT; i++) {
      const x = (Math.random() - 0.5) * BOUNDS * 2;
      const y = (Math.random() - 0.5) * BOUNDS * 2;
      const z = (Math.random() - 0.5) * BOUNDS * 2 - 2; // Offset slightly back
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      init[i * 3] = x;
      init[i * 3 + 1] = y;
      init[i * 3 + 2] = z;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return { positions: pos, velocities: vel, initialPositions: init };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const pos = meshRef.current.geometry.attributes.position.array;
    
    // Extract palm positions for repulsion
    const palms = [];
    if (handState.isReady) {
      handState.landmarks.forEach(hand => {
        const palm = hand[9]; // MIDDLE_MCP roughly center
        const px = (palm.x - 0.5) * 10;
        const py = -(palm.y - 0.5) * 6;
        const pz = -palm.z * 5;
        palms.push(new THREE.Vector3(px, py, pz));
      });
    }

    for (let i = 0; i < DUST_COUNT; i++) {
      const idx = i * 3;
      
      // Basic drift
      pos[idx] += velocities[idx];
      pos[idx + 1] += velocities[idx + 1];
      pos[idx + 2] += velocities[idx + 2];

      // Hand repulsion
      const p = new THREE.Vector3(pos[idx], pos[idx + 1], pos[idx + 2]);
      
      palms.forEach(palm => {
        const dist = p.distanceTo(palm);
        if (dist < 2.0) {
          const force = (2.0 - dist) * 0.05;
          const dir = p.clone().sub(palm).normalize();
          pos[idx] += dir.x * force;
          pos[idx + 1] += dir.y * force;
          pos[idx + 2] += dir.z * force;
        }
      });

      // Slowly return to initial bounds if they drift too far
      const initP = new THREE.Vector3(initialPositions[idx], initialPositions[idx+1], initialPositions[idx+2]);
      if (p.distanceTo(initP) > 3.0) {
        const dir = initP.clone().sub(p).normalize();
        pos[idx] += dir.x * 0.005;
        pos[idx + 1] += dir.y * 0.005;
        pos[idx + 2] += dir.z * 0.005;
      }
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.03} 
        color="#00f3ff" 
        transparent 
        opacity={0.4} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
