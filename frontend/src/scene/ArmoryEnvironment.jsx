import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ArmoryEnvironment() {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Very slow rotation for ambient motion
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer structural bounds */}
      <mesh scale={[50, 50, 50]}>
        <boxGeometry args={[1, 1, 1, 10, 10, 10]} />
        <meshBasicMaterial 
          color="#002244" 
          wireframe 
          side={THREE.BackSide} 
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Inner grid bounds */}
      <mesh scale={[48, 48, 48]}>
        <boxGeometry args={[1, 1, 1, 4, 4, 4]} />
        <meshBasicMaterial 
          color="#00f3ff" 
          wireframe 
          side={THREE.BackSide} 
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}
