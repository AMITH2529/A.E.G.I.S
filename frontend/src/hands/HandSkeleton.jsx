import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { handState } from './HandState';
import * as THREE from 'three';

const MAX_HANDS = 2;
const JOINTS_PER_HAND = 21;
const TOTAL_JOINTS = MAX_HANDS * JOINTS_PER_HAND;

// The connections between joints to draw lines (bones)
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
];

export default function HandSkeleton() {
  const jointsRef = useRef();
  const innerJointsRef = useRef();
  
  const linesRef = useRef();
  
  // We'll use an InstancedMesh for performance
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();

  // Create Float32Array for line segment positions (2 points per connection * 3 coords)
  const TOTAL_CONNECTIONS = MAX_HANDS * HAND_CONNECTIONS.length;
  const linePositions = new Float32Array(TOTAL_CONNECTIONS * 2 * 3);
  const lineColors = new Float32Array(TOTAL_CONNECTIONS * 2 * 3);

  useFrame((state, delta) => {
    if (!jointsRef.current || !innerJointsRef.current || !linesRef.current || !handState.isReady) return;
    
    let instanceIdx = 0;
    let lineIdx = 0;
    
    // Hide all joints initially by moving them far away
    for (let i = 0; i < TOTAL_JOINTS; i++) {
      matrix.makeTranslation(0, -9999, 0);
      matrix.scale(new THREE.Vector3(0, 0, 0));
      jointsRef.current.setMatrixAt(i, matrix);
      innerJointsRef.current.setMatrixAt(i, matrix);
    }
    
    // Hide lines by setting to 0,0,0
    for (let i = 0; i < linePositions.length; i++) {
      linePositions[i] = 0;
    }
    
    handState.landmarks.forEach((hand, handIdx) => {
      if (handIdx >= MAX_HANDS) return;
      
      const handColor = new THREE.Color(
        handState.handednesses[handIdx][0].categoryName === 'Left' ? "#00f3ff" : "#ff0055"
      );
      
      // Store world coordinates for this hand to draw lines later
      const worldCoords = [];
      
      hand.forEach((joint, jointIdx) => {
        const x = (joint.x - 0.5) * 10;
        const y = -(joint.y - 0.5) * 6;
        const z = -joint.z * 5; 
        
        position.set(x, y, z);
        worldCoords.push(position.clone());
        
        matrix.makeTranslation(position.x, position.y, position.z);
        
        // Dynamic scale based on joint type (Original 3D Exo-Nodes)
        let scale = 0.04; 
        if (jointIdx === 9) scale = 0.06; // Palm center
        else if ([4, 8, 12, 16, 20].includes(jointIdx)) scale = 0.08; // Fingertips
        
        matrix.scale(new THREE.Vector3(scale, scale, scale));
        jointsRef.current.setMatrixAt(instanceIdx, matrix);
        jointsRef.current.setColorAt(instanceIdx, handColor);

        // Inner glowing core
        const innerMatrix = matrix.clone().scale(new THREE.Vector3(0.6, 0.6, 0.6));
        innerJointsRef.current.setMatrixAt(instanceIdx, innerMatrix);
        innerJointsRef.current.setColorAt(instanceIdx, handColor);
        
        instanceIdx++;
      });
      
      // Draw Bones as energetic tethers
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = worldCoords[startIdx];
        const end = worldCoords[endIdx];
        
        if (start && end) {
          // Start point
          linePositions[lineIdx * 6] = start.x;
          linePositions[lineIdx * 6 + 1] = start.y;
          linePositions[lineIdx * 6 + 2] = start.z;
          lineColors[lineIdx * 6] = handColor.r;
          lineColors[lineIdx * 6 + 1] = handColor.g;
          lineColors[lineIdx * 6 + 2] = handColor.b;
          
          // End point
          linePositions[lineIdx * 6 + 3] = end.x;
          linePositions[lineIdx * 6 + 4] = end.y;
          linePositions[lineIdx * 6 + 5] = end.z;
          lineColors[lineIdx * 6 + 3] = handColor.r;
          lineColors[lineIdx * 6 + 4] = handColor.g;
          lineColors[lineIdx * 6 + 5] = handColor.b;
          
          lineIdx++;
        }
      });
    });
    
    jointsRef.current.instanceMatrix.needsUpdate = true;
    if (jointsRef.current.instanceColor) jointsRef.current.instanceColor.needsUpdate = true;

    innerJointsRef.current.instanceMatrix.needsUpdate = true;
    if (innerJointsRef.current.instanceColor) innerJointsRef.current.instanceColor.needsUpdate = true;
    
    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group renderOrder={9999}>
      {/* Outer Wireframe Exo-Joints */}
      <instancedMesh ref={jointsRef} args={[null, null, TOTAL_JOINTS]} renderOrder={9999}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} depthTest={false} />
      </instancedMesh>

      {/* Inner Glowing Core */}
      <instancedMesh ref={innerJointsRef} args={[null, null, TOTAL_JOINTS]} renderOrder={9999}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} depthTest={false} />
      </instancedMesh>
      
      {/* Energetic Tethers */}
      <lineSegments ref={linesRef} renderOrder={9999}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={TOTAL_CONNECTIONS * 2}
            array={linePositions}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
          <bufferAttribute
            attach="attributes-color"
            count={TOTAL_CONNECTIONS * 2}
            array={lineColors}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors toneMapped={false} transparent opacity={0.95} linewidth={4} depthTest={false} />
      </lineSegments>
    </group>
  );
}
