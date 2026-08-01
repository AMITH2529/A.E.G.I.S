import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { handState } from '../hands/HandState';
import { sceneState } from './SceneState';

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_COLORS = ['#00f3ff', '#ff0055', '#ffd700', '#00ffaa', '#aa00ff'];

export default function HoloHandTethers() {
  const [tetherData, setTetherData] = useState({
    active: false,
    lines: [],
    bothPinching: false,
    distance: 0,
    expansionPct: 0,
    pinchPos1: null,
    pinchPos2: null
  });

  const initialDistRef = useRef(null);

  useFrame(() => {
    if (!handState.isReady || !handState.landmarks || handState.landmarks.length < 2) {
      initialDistRef.current = null;
      if (tetherData.active) {
        setTetherData(prev => ({ ...prev, active: false, bothPinching: false }));
      }
      return;
    }

    const h1 = handState.landmarks[0];
    const h2 = handState.landmarks[1];

    if (!h1 || !h2) return;

    // Check pinch gesture for Hand 1 (Thumb 4 + Index 8)
    const p1Thumb = h1[4];
    const p1Index = h1[8];
    const pinchDist1 = Math.hypot(p1Thumb.x - p1Index.x, p1Thumb.y - p1Index.y);
    const isPinch1 = pinchDist1 < 0.08;

    // Check pinch gesture for Hand 2 (Thumb 4 + Index 8)
    const p2Thumb = h2[4];
    const p2Index = h2[8];
    const pinchDist2 = Math.hypot(p2Thumb.x - p2Index.x, p2Thumb.y - p2Index.y);
    const isPinch2 = pinchDist2 < 0.08;

    const bothPinching = isPinch1 && isPinch2;

    // Convert Pinch midpoints to 3D world space
    const p1Mid = { x: (p1Thumb.x + p1Index.x) / 2, y: (p1Thumb.y + p1Index.y) / 2, z: (p1Thumb.z + p1Index.z) / 2 };
    const p2Mid = { x: (p2Thumb.x + p2Index.x) / 2, y: (p2Thumb.y + p2Index.y) / 2, z: (p2Thumb.z + p2Index.z) / 2 };

    const p1World = new THREE.Vector3((p1Mid.x - 0.5) * 10, -(p1Mid.y - 0.5) * 6, -p1Mid.z * 5);
    const p2World = new THREE.Vector3((p2Mid.x - 0.5) * 10, -(p2Mid.y - 0.5) * 6, -p2Mid.z * 5);

    const currentPinchDist = p1World.distanceTo(p2World);

    let expansionRatio = 0;

    if (bothPinching) {
      if (initialDistRef.current === null) {
        initialDistRef.current = currentPinchDist;
      }
      
      // Calculate how far hands have expanded sideways relative to initial pinch hold
      const deltaDist = currentPinchDist - initialDistRef.current;
      expansionRatio = Math.max(0, Math.min(1.0, deltaDist / 2.0));

      // Drive explosionFactor on 3D objects in real-time
      if (sceneState.objects && sceneState.objects.length > 0) {
        sceneState.objects.forEach(obj => {
          obj.explosionFactor = expansionRatio;
        });
      }
    } else {
      initialDistRef.current = null;
    }

    // Build 5 fingertip connecting thread lines
    const lines = FINGER_TIPS.map((tipIdx, i) => {
      const pt1 = h1[tipIdx];
      const pt2 = h2[tipIdx];

      const start = [(pt1.x - 0.5) * 10, -(pt1.y - 0.5) * 6, -pt1.z * 5];
      const end = [(pt2.x - 0.5) * 10, -(pt2.y - 0.5) * 6, -pt2.z * 5];

      // Add electric arc jitter when both hands pinch & expand
      const jitterAmount = bothPinching ? 0.2 : 0.08;
      const mid = [
        (start[0] + end[0]) / 2 + (Math.random() - 0.5) * jitterAmount,
        (start[1] + end[1]) / 2 + (Math.random() - 0.5) * jitterAmount,
        (start[2] + end[2]) / 2 + (Math.random() - 0.5) * jitterAmount
      ];

      return {
        points: [start, mid, end],
        color: bothPinching ? '#ff0055' : FINGER_COLORS[i],
        startPos: start,
        endPos: end
      };
    });

    setTetherData({
      active: true,
      lines,
      bothPinching,
      distance: currentPinchDist,
      expansionPct: Math.round(expansionRatio * 100),
      pinchPos1: [p1World.x, p1World.y, p1World.z],
      pinchPos2: [p2World.x, p2World.y, p2World.z]
    });
  });

  if (!tetherData.active) return null;

  return (
    <group>
      {/* 5 Holographic Fingertip Tethers */}
      {tetherData.lines.map((line, idx) => (
        <group key={idx}>
          <Line
            points={line.points}
            color={line.color}
            lineWidth={tetherData.bothPinching ? 4 : 2}
            transparent
            opacity={tetherData.bothPinching ? 1.0 : 0.6}
          />
          <mesh position={line.startPos}>
            <sphereGeometry args={[tetherData.bothPinching ? 0.06 : 0.03, 16, 16]} />
            <meshBasicMaterial color={line.color} />
          </mesh>
          <mesh position={line.endPos}>
            <sphereGeometry args={[tetherData.bothPinching ? 0.06 : 0.03, 16, 16]} />
            <meshBasicMaterial color={line.color} />
          </mesh>
        </group>
      ))}

      {/* Main Dual-Pinch Beam when BOTH hands hold pinch */}
      {tetherData.bothPinching && tetherData.pinchPos1 && tetherData.pinchPos2 && (
        <group>
          <Line
            points={[tetherData.pinchPos1, tetherData.pinchPos2]}
            color="#00f3ff"
            lineWidth={6}
          />
          <mesh position={tetherData.pinchPos1}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#00f3ff" toneMapped={false} />
          </mesh>
          <mesh position={tetherData.pinchPos2}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#00f3ff" toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* Real-time Dual-Pinch Expansion HUD Readout */}
      {tetherData.bothPinching && (
        <Html position={[0, 2.2, 0]} center>
          <div style={{
            background: 'rgba(255, 0, 85, 0.9)',
            border: '1px solid #ff0055',
            padding: '8px 18px',
            borderRadius: '20px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '1px',
            boxShadow: '0 0 25px rgba(255,0,85,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '14px' }}>🤏🤏</span>
            <span>DUAL-PINCH DISMANTLING: </span>
            <span style={{ fontWeight: 'bold', color: '#00f3ff' }}>{tetherData.expansionPct}%</span>
            <span>| {tetherData.expansionPct > 10 ? 'EXPANDING PARTS' : 'LOCKED'}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
