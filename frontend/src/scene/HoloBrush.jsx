import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { gestureEngine } from '../hands/GestureEngine';

export default function HoloBrush() {
  const [lines, setLines] = useState([]);
  const currentLine = useRef(null);
  const isDrawing = useRef(false);

  useFrame(() => {
    const gestures = gestureEngine.detectGestures();
    
    // Use the right hand for drawing (assuming left is for HUD)
    const rightPinch = gestures.find(g => g.type === 'pinch' && g.hand === 'right');
    const rightFist = gestures.find(g => g.type === 'fist' && g.hand === 'right');

    if (rightPinch) {
      const px = (rightPinch.position.x - 0.5) * 10;
      const py = -(rightPinch.position.y - 0.5) * 6;
      const pz = -rightPinch.position.z * 5;
      const pos = new THREE.Vector3(px, py, pz);

      if (!isDrawing.current) {
        // Start a new line
        isDrawing.current = true;
        currentLine.current = [pos];
        setLines(prev => [...prev, { points: currentLine.current, color: '#ff00ff' }]);
      } else {
        // Add point to current line if it moved enough
        const lastPos = currentLine.current[currentLine.current.length - 1];
        if (lastPos.distanceTo(pos) > 0.05) {
          currentLine.current.push(pos);
          // Force re-render of the last line by updating state array reference
          setLines(prev => {
            const newLines = [...prev];
            newLines[newLines.length - 1].points = [...currentLine.current];
            return newLines;
          });
        }
      }
    } else {
      isDrawing.current = false;
      currentLine.current = null;
    }

    // Clear drawings if you make a fist with the right hand
    if (rightFist && lines.length > 0) {
      setLines([]);
    }
  });

  return (
    <group>
      {lines.map((line, i) => (
        line.points.length > 1 && (
          <Line
            key={i}
            points={line.points}
            color={line.color}
            lineWidth={4}
            dashed={false}
            transparent
            opacity={0.8}
          />
        )
      ))}
    </group>
  );
}
