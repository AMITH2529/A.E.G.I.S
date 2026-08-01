import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { handState } from './HandState';
import { LM } from './GestureEngine';
import * as THREE from 'three';
import { VerletEngine } from '../physics/VerletEngine';

export default function StringMode() {
  const lineRef = useRef();
  
  // Initialize Verlet Engine for the string
  const physics = useMemo(() => {
    const engine = new VerletEngine({ gravity: new THREE.Vector3(0, -5, 0), bounce: 0.1 });
    // Create a chain of 10 particles
    const particles = [];
    for (let i = 0; i < 10; i++) {
      particles.push(engine.addParticle(new THREE.Vector3(0, 0, 0), i === 0 || i === 9));
    }
    // Connect them with constraints
    for (let i = 0; i < 9; i++) {
      engine.addConstraint(particles[i], particles[i+1], 0.2, 0.8);
    }
    return engine;
  }, []);

  // Array to hold the points for the Line component
  const points = useMemo(() => new Array(10).fill(new THREE.Vector3()), []);

  useFrame((state, delta) => {
    if (!handState.isReady || handState.landmarks.length < 2) {
      // Hide string if not two hands
      if (lineRef.current) lineRef.current.visible = false;
      return;
    }
    
    // Check if we have both hands (index tips)
    const indexTip1 = handState.landmarks[0][LM.INDEX_TIP];
    const indexTip2 = handState.landmarks[1][LM.INDEX_TIP];

    // Convert normalized to R3F coords
    const p1 = new THREE.Vector3((indexTip1.x - 0.5) * 10, -(indexTip1.y - 0.5) * 6, -indexTip1.z * 5);
    const p2 = new THREE.Vector3((indexTip2.x - 0.5) * 10, -(indexTip2.y - 0.5) * 6, -indexTip2.z * 5);

    // Set the anchor positions
    physics.particles[0].position.copy(p1);
    physics.particles[0].previousPosition.copy(p1);
    
    physics.particles[9].position.copy(p2);
    physics.particles[9].previousPosition.copy(p2);

    // Calculate dynamic ideal distance for constraints
    const dist = p1.distanceTo(p2);
    const segmentLength = dist / 9;
    
    // Relax constraints based on distance to make it look elastic
    physics.constraints.forEach(c => {
      c.distance = segmentLength * 0.8; // slightly shorter to cause tension
    });

    // Update physics
    physics.update(Math.min(delta, 0.1));

    // Update line geometry points
    for (let i = 0; i < 10; i++) {
      points[i] = physics.particles[i].position.clone();
    }

    if (lineRef.current) {
      lineRef.current.geometry.setPositions(points.map(p => [p.x, p.y, p.z]).flat());
      lineRef.current.visible = true;
      // Change color based on tension
      lineRef.current.material.color.setHSL(0.5 - (dist / 10), 1, 0.5); 
    }
  });

  return (
    <Line 
      ref={lineRef}
      points={points.map(p => [p.x, p.y, p.z])} // Initial dummy points
      color="#00f3ff"
      lineWidth={3}
      transparent
      opacity={0.8}
    />
  );
}
