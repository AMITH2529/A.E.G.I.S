import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import { handState } from './HandState';
import { LM } from './GestureEngine';

function TrailPoint({ handIndex, jointIndex, color }) {
  const ref = useRef();
  
  useFrame(() => {
    if (!handState.isReady || !handState.landmarks[handIndex]) {
      // Move out of sight if hand not present
      if (ref.current) ref.current.position.set(0, -100, 0);
      return;
    }
    
    const joint = handState.landmarks[handIndex][jointIndex];
    if (joint && ref.current) {
      const x = (joint.x - 0.5) * 10;
      const y = -(joint.y - 0.5) * 6;
      const z = -joint.z * 5;
      ref.current.position.set(x, y, z);
    }
  });

  return (
    <Trail
      width={0.5}
      length={20}
      color={color}
      attenuation={(t) => t * t} // Taper off
    >
      <mesh ref={ref} visible={false}>
        <sphereGeometry args={[0.1]} />
      </mesh>
    </Trail>
  );
}

export default function HandTrails() {
  return (
    <group>
      {/* Left Hand Index and Thumb */}
      <TrailPoint handIndex={0} jointIndex={LM.INDEX_TIP} color="#00f3ff" />
      <TrailPoint handIndex={0} jointIndex={LM.THUMB_TIP} color="#00f3ff" />
      
      {/* Right Hand Index and Thumb */}
      <TrailPoint handIndex={1} jointIndex={LM.INDEX_TIP} color="#0077ff" />
      <TrailPoint handIndex={1} jointIndex={LM.THUMB_TIP} color="#0077ff" />
    </group>
  );
}
