import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { handState } from '../hands/HandState';
import { sceneState } from './SceneState';

export default function HoloEffectsSystem({ activeEffects }) {
  const webLinesRef = useRef();
  const nozzleLaserRef = useRef();
  const impactRingRef = useRef();
  
  const [effectState, setEffectState] = useState({
    webActive: false,
    webTarget: new THREE.Vector3(),
    webOrigin: new THREE.Vector3(),
    nozzleActive: false,
    nozzlePos: new THREE.Vector3(),
    impactActive: false,
    impactPos: new THREE.Vector3(),
    impactScale: 0.1,
    fluidPressure: 50,
    stressScanning: false,
    flexibilityActive: false
  });

  useEffect(() => {
    return sceneState.subscribe(() => {
      setEffectState(prev => ({
        ...prev,
        fluidPressure: sceneState.fluidPressure || 50,
        stressScanning: !!sceneState.stressScanning,
        flexibilityActive: !!sceneState.flexibilityActive,
        impactActive: !!sceneState.impactTriggered,
        impactPos: sceneState.impactPos ? sceneState.impactPos.clone() : prev.impactPos
      }));
    });
  }, []);

  useFrame((state, delta) => {
    if (!handState.isReady || handState.landmarks.length === 0) return;

    // Check gesture effects from sceneState / handState
    if (sceneState.activeGestures) {
      const webG = sceneState.activeGestures.find(g => g.type === 'wrist_flexion');
      const flickG = sceneState.activeGestures.find(g => g.type === 'flick_up');
      
      if (webG) {
        const wx = (webG.position.x - 0.5) * 10;
        const wy = -(webG.position.y - 0.5) * 6;
        const wz = -webG.position.z * 5;
        
        setEffectState(prev => ({
          ...prev,
          webActive: true,
          webOrigin: new THREE.Vector3(wx, wy, wz),
          webTarget: new THREE.Vector3(wx, wy + 1, wz - 4)
        }));
      } else {
        setEffectState(prev => ({ ...prev, webActive: false }));
      }

      if (flickG) {
        const fx = (flickG.position.x - 0.5) * 10;
        const fy = -(flickG.position.y - 0.5) * 6;
        const fz = -flickG.position.z * 5;

        setEffectState(prev => ({
          ...prev,
          nozzleActive: true,
          nozzlePos: new THREE.Vector3(fx, fy, fz)
        }));
      } else {
        setEffectState(prev => ({ ...prev, nozzleActive: false }));
      }
    }

    // Animate impact ring
    if (impactRingRef.current && effectState.impactActive) {
      impactRingRef.current.scale.addScalar(delta * 4);
      if (impactRingRef.current.material) {
        impactRingRef.current.material.opacity -= delta * 1.5;
        if (impactRingRef.current.material.opacity <= 0) {
          sceneState.impactTriggered = false;
          setEffectState(prev => ({ ...prev, impactActive: false }));
        }
      }
    }
  });

  return (
    <group>
      {/* Web Shooter Holographic Tethers */}
      {effectState.webActive && (
        <Line
          points={[
            [effectState.webOrigin.x, effectState.webOrigin.y, effectState.webOrigin.z],
            [effectState.webTarget.x, effectState.webTarget.y, effectState.webTarget.z]
          ]}
          color="#00f3ff"
          lineWidth={4}
          transparent
          opacity={0.9}
        />
      )}

      {/* Nozzle Alignment Laser Beam */}
      {effectState.nozzleActive && (
        <group position={[effectState.nozzlePos.x, effectState.nozzlePos.y, effectState.nozzlePos.z]}>
          <Line
            points={[[0, 0, 0], [0, 5, 0]]}
            color="#ff0055"
            lineWidth={3}
            transparent
            opacity={0.9}
          />
          <Html position={[0, 2.5, 0]} center>
            <div style={{
              background: 'rgba(255, 0, 85, 0.85)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              boxShadow: '0 0 10px rgba(255,0,85,0.8)'
            }}>
              NOZZLE ALIGNED: 100%
            </div>
          </Html>
        </group>
      )}

      {/* Impact Shockwave Ring */}
      {effectState.impactActive && (
        <mesh ref={impactRingRef} position={effectState.impactPos} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.4, 32]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Fluid Pressure Compression Meter */}
      {sceneState.fluidCompressing && (
        <Html position={[0, 2, 1]} center>
          <div style={{
            background: 'rgba(0, 15, 30, 0.9)',
            border: '1px solid #00f3ff',
            padding: '12px 18px',
            borderRadius: '8px',
            color: '#00f3ff',
            fontFamily: 'monospace',
            minWidth: '220px',
            boxShadow: '0 0 20px rgba(0,243,255,0.4)'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>
              ✊ FLUID CARTRIDGE COMPRESSION
            </div>
            <div style={{ background: 'rgba(0,243,255,0.2)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                background: 'linear-gradient(90deg, #00f3ff, #ff0055)',
                width: `${effectState.fluidPressure}%`,
                height: '100%',
                transition: 'width 0.1s ease'
              }} />
            </div>
            <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'right' }}>
              PRESSURE: {effectState.fluidPressure.toFixed(0)} PSI
            </div>
          </div>
        </Html>
      )}

      {/* Stress Simulation Analysis Scan Overlay */}
      {effectState.stressScanning && (
        <Html position={[0, 0, 2]} center>
          <div style={{
            background: 'rgba(20, 0, 40, 0.9)',
            border: '1px solid #ff00ff',
            padding: '14px 20px',
            borderRadius: '10px',
            color: '#ff00ff',
            fontFamily: 'monospace',
            minWidth: '260px',
            boxShadow: '0 0 25px rgba(255,0,255,0.5)',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #ff00ff', pb: '6px', marginBottom: '8px' }}>
              👇 MATERIAL STRESS ANALYSIS
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
              <div>• STRUCTURAL INTEGRITY: 98.4%</div>
              <div>• TENSION STRESS: NORMAL</div>
              <div>• THERMAL DEFORMATION: 0.02mm</div>
              <div>• MESH FLEXIBILITY: OPTIMAL</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
