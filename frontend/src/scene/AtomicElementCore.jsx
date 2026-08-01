import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { sceneState } from './SceneState';
import { audioManager } from '../audio/AudioManager';

export default function AtomicElementCore() {
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const nucleusRef = useRef();
  
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    return sceneState.subscribe(() => {
      if (sceneState.synthesizeAtomic) {
        setActive(true);
        setScale(0.1);
        audioManager.playSummon();
      }
    });
  }, []);

  useFrame((state, delta) => {
    if (sceneState.activeGestures) {
      const clapG = sceneState.activeGestures.find(g => g.type === 'clap');
      if (clapG && !active) {
        setActive(true);
        setScale(0.1);
        sceneState.synthesizeAtomic = true;
        sceneState.notify();
        audioManager.playSummon();
      }
    }

    if (active && scale < 1.0) {
      setScale(prev => Math.min(1.0, prev + delta * 2.0));
    }

    if (ring1Ref.current && ring2Ref.current && ring3Ref.current && nucleusRef.current) {
      ring1Ref.current.rotation.x += delta * 2.0;
      ring1Ref.current.rotation.y += delta * 1.5;

      ring2Ref.current.rotation.y += delta * 2.5;
      ring2Ref.current.rotation.z += delta * 1.8;

      ring3Ref.current.rotation.x += delta * 1.8;
      ring3Ref.current.rotation.z += delta * 2.2;

      nucleusRef.current.rotation.y += delta * 1.0;
    }
  });

  if (!active) return null;

  return (
    <group position={[0, 0.5, 0]} scale={[scale, scale, scale]}>
      {/* Central Glowing Atomic Nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#00f3ff"
          emissive="#00f3ff"
          emissiveIntensity={2.0}
          wireframe
        />
      </mesh>

      {/* Inner Energy Core */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Electron Orbital Ring 1 */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[0.6, 0.015, 16, 64]} />
          <meshBasicMaterial color="#00f3ff" />
        </mesh>
        <mesh position={[0.6, 0, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>

      {/* Electron Orbital Ring 2 */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[0.8, 0.015, 16, 64]} />
          <meshBasicMaterial color="#ff0055" />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>

      {/* Electron Orbital Ring 3 */}
      <group ref={ring3Ref}>
        <mesh>
          <torusGeometry args={[1.0, 0.015, 16, 64]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        <mesh position={[0, 0, 1.0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>

      {/* Stark Synthesized Element HUD */}
      <Html position={[0, 1.3, 0]} center>
        <div style={{
          background: 'rgba(0, 15, 30, 0.9)',
          border: '1px solid #00f3ff',
          padding: '10px 16px',
          borderRadius: '8px',
          color: '#00f3ff',
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1px',
          boxShadow: '0 0 20px rgba(0,243,255,0.4)',
          textAlign: 'center',
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(0,243,255,0.3)', pb: '4px', mb: '4px' }}>
            👏 ELEMENT SYNTHESIZED
          </div>
          <div>ATOMIC NO: 118 (VIBRANIUM CORE)</div>
          <div style={{ color: '#ffd700', fontSize: '9px', marginTop: '2px' }}>STABILITY: 100% (STARK CORE)</div>
        </div>
      </Html>
    </group>
  );
}
