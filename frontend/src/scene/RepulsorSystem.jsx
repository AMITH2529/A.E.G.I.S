import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gestureEngine } from '../hands/GestureEngine';
import { aegisVoice } from '../voice/VoiceSpeaker';
import { sceneState } from '../scene/SceneState';
import { audioManager } from '../audio/AudioManager';

export default function RepulsorSystem({ objectsRef }) {
  const [blasts, setBlasts] = useState([]);
  const lastFireTime = useRef(0);

  useFrame(() => {
    const gestures = gestureEngine.detectGestures();
    const repulsor = gestures.find(g => g.type === 'repulsor');
    const now = Date.now();

    // Fire a blast if gesture detected and cooldown passed
    if (repulsor && now - lastFireTime.current > 1000) {
      lastFireTime.current = now;
      
      const px = (repulsor.position.x - 0.5) * 10;
      const py = -(repulsor.position.y - 0.5) * 6;
      const pz = -repulsor.position.z * 5;
      
      const newBlast = {
        id: `blast-${now}`,
        position: new THREE.Vector3(px, py, pz),
        velocity: new THREE.Vector3(0, 0, -20), // Shoot forward into the screen
        createdAt: now
      };
      
      setBlasts(prev => [...prev, newBlast]);
      aegisVoice.speak("Repulsor fired.", 0.2); // Low volume
      audioManager.playRepulsorFire();
    }

    // Update blasts and check collisions
    setBlasts(prev => {
      let activeBlasts = [];
      prev.forEach(blast => {
        if (now - blast.createdAt > 2000) return; // Die after 2 seconds

        // Move blast
        blast.position.addScaledVector(blast.velocity, 0.016); // Approx 60fps dt

        // Check collision with objects
        let hit = false;
        if (objectsRef && objectsRef.current) {
          objectsRef.current.forEach(mesh => {
            if (!mesh) return;
            const dist = mesh.position.distanceTo(blast.position);
            if (dist < 2.0) { // Large hit radius
              hit = true;
              audioManager.playImpact();
              // Push the object away with immense force
              mesh.position.add(blast.velocity.clone().normalize().multiplyScalar(5.0));
              mesh.traverse((child) => {
                if (child.isMesh && child.material && child.material.color) {
                  const origColor = child.material.color.getHex();
                  child.material.color.set('#ffffff'); // Flash white on impact
                  setTimeout(() => {
                    if (child && child.material && child.material.color) {
                      child.material.color.setHex(origColor);
                    }
                  }, 200);
                }
              });
            }
          });
        }

        if (!hit) {
          activeBlasts.push(blast);
        }
      });
      return activeBlasts;
    });
  });

  return (
    <group>
      {blasts.map(b => (
        <mesh key={b.id} position={b.position}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          {/* Core glow */}
          <mesh scale={[1.5, 1.5, 1.5]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
          </mesh>
        </mesh>
      ))}
    </group>
  );
}
