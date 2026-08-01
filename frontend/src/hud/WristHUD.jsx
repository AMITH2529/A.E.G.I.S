import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { handState } from '../hands/HandState';
import { sceneState } from '../scene/SceneState';
import { aegisVoice } from '../voice/VoiceSpeaker';
import { audioManager } from '../audio/AudioManager';

const LM = {
  WRIST: 0,
  INDEX_MCP: 5,
  INDEX_TIP: 8
};

export default function WristHUD() {
  const groupRef = useRef(null);
  const btnExportRef = useRef(null);
  const btnClearRef = useRef(null);
  
  const [sysState, setSysState] = useState(sceneState.systemState);
  const [cmd, setCmd] = useState(sceneState.lastCommand);
  const [exportHover, setExportHover] = useState(false);
  const [clearHover, setClearHover] = useState(false);

  const lastTapTime = useRef(0);

  useEffect(() => {
    return sceneState.subscribe(() => {
      setSysState(sceneState.systemState);
      setCmd(sceneState.lastCommand);
    });
  }, []);

  const ringRef = useRef();
  
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.5;
    }
    
    if (!handState.isReady || !groupRef.current) return;
    
    let leftHandIdx = -1;
    let rightHandIdx = -1;
    for (let i = 0; i < handState.handednesses.length; i++) {
      if (handState.handednesses[i][0].categoryName === 'Left') leftHandIdx = i;
      if (handState.handednesses[i][0].categoryName === 'Right') rightHandIdx = i;
    }

    if (leftHandIdx !== -1) {
      const hand = handState.landmarks[leftHandIdx];
      const wrist = hand[LM.WRIST];
      const indexBase = hand[LM.INDEX_MCP];

      // Convert to world space to match our Void dimensions
      const px = (wrist.x - 0.5) * 10;
      const py = -(wrist.y - 0.5) * 6;
      const pz = -wrist.z * 5;

      const p2x = (indexBase.x - 0.5) * 10;
      const p2y = -(indexBase.y - 0.5) * 6;
      const p2z = -indexBase.z * 5;

      const wristPos = new THREE.Vector3(px, py, pz);
      const forwardPos = new THREE.Vector3(p2x, p2y, p2z);

      // Position HUD slightly above the wrist
      groupRef.current.position.copy(wristPos).add(new THREE.Vector3(0, 0.4, 0));
      
      // Calculate rotation to make the HUD face inward/upward slightly
      const direction = forwardPos.clone().sub(wristPos).normalize();
      const target = groupRef.current.position.clone().add(direction);
      groupRef.current.lookAt(target);
      // Removed tilt up so it stands straight above the hand
      groupRef.current.visible = true;

      // --- Button Collision Logic ---
      if (rightHandIdx !== -1 && btnExportRef.current && btnClearRef.current) {
        const rightHand = handState.landmarks[rightHandIdx];
        const rightIndexTip = rightHand[LM.INDEX_TIP];
        const rx = (rightIndexTip.x - 0.5) * 10;
        const ry = -(rightIndexTip.y - 0.5) * 6;
        const rz = -rightIndexTip.z * 5;
        const pointerPos = new THREE.Vector3(rx, ry, rz);

        // Get world positions of buttons
        const exportPos = new THREE.Vector3();
        btnExportRef.current.getWorldPosition(exportPos);
        const clearPos = new THREE.Vector3();
        btnClearRef.current.getWorldPosition(clearPos);

        const distExport = pointerPos.distanceTo(exportPos);
        const distClear = pointerPos.distanceTo(clearPos);
        const clickThreshold = 0.4;
        const now = Date.now();

        // Export Button
        if (distExport < clickThreshold) {
          setExportHover(true);
          if (now - lastTapTime.current > 2000) {
            lastTapTime.current = now;
            sceneState.shouldExport = true;
            sceneState.notify();
            audioManager.playClick();
            aegisVoice.speak('Exporting G L B from manual override.');
          }
        } else {
          setExportHover(false);
        }

        // Clear Button
        if (distClear < clickThreshold) {
          setClearHover(true);
          if (now - lastTapTime.current > 2000) {
            lastTapTime.current = now;
            sceneState.objects = []; // Nuke all objects
            sceneState.systemState = 'Scene Cleared';
            sceneState.notify();
            audioManager.playClick();
            aegisVoice.speak('Void cleared.');
          }
        } else {
          setClearHover(false);
        }
      }
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Sci-Fi Spinning Ring */}
      <mesh ref={ringRef} position={[0.5, 0, -0.1]} rotation={[0, 0, 0]}>
        <ringGeometry args={[1.0, 1.1, 32, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Outer Ring */}
      <mesh position={[0.5, 0, -0.12]} rotation={[0, 0, 0]}>
        <ringGeometry args={[1.15, 1.17, 64]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Holographic glowing base plate */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2.2, 1.2]} />
        <meshBasicMaterial color="#001525" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      
      {/* Wireframe border */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2.2, 1.2]} />
        <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Export Button (Physical 3D) */}
      <mesh ref={btnExportRef} position={[1.4, 0.3, 0.1]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshStandardMaterial color={exportHover ? "#ffffff" : "#00f3ff"} emissive={exportHover ? "#ffffff" : "#00f3ff"} emissiveIntensity={exportHover ? 1.0 : 0.4} wireframe />
        <Html position={[0, 0, 0.1]} center transform scale={0.2} style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 5px #00f3ff', pointerEvents: 'none' }}>
          EXPORT
        </Html>
      </mesh>

      {/* Clear Button (Physical 3D) */}
      <mesh ref={btnClearRef} position={[1.4, -0.3, 0.1]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshStandardMaterial color={clearHover ? "#ff0055" : "#ff0055"} emissive={clearHover ? "#ffffff" : "#ff0055"} emissiveIntensity={clearHover ? 1.0 : 0.4} wireframe />
        <Html position={[0, 0, 0.1]} center transform scale={0.2} style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold', textShadow: '0 0 5px #ff0055', pointerEvents: 'none' }}>
          CLEAR
        </Html>
      </mesh>

      {/* HTML DOM Overlay */}
      <Html 
        transform 
        position={[0.3, 0, 0.05]} 
        scale={0.1}
        occlude={false}
      >
        <div style={{
          width: '320px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(0, 30, 60, 0.8) 0%, rgba(0, 10, 20, 0.9) 100%)',
          border: '1px solid rgba(0, 243, 255, 0.3)',
          borderLeft: '4px solid #00f3ff',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0, 243, 255, 0.2), inset 0 0 10px rgba(0, 243, 255, 0.1)',
          color: '#00f3ff',
          fontFamily: '"Courier New", Courier, monospace',
          backdropFilter: 'blur(8px)',
          textTransform: 'uppercase',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Scanline effect */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '100%',
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 243, 255, 0.05) 51%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none'
          }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', opacity: 0.6, letterSpacing: '2px' }}>SYS.OP.AEGIS // V2.0</div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sysState.includes('Forging') ? '#ff00ff' : '#00f3ff', boxShadow: '0 0 8px currentColor' }} />
          </div>
          
          <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '15px', color: sysState.includes('Forging') ? '#ff5500' : '#00f3ff', textShadow: '0 0 10px currentColor' }}>
            {sysState}
          </div>
          
          <div style={{ fontSize: '12px', borderTop: '1px solid rgba(0,243,255,0.2)', paddingTop: '12px', opacity: 0.9, minHeight: '40px' }}>
            <span style={{ opacity: 0.5, marginRight: '8px' }}>INPUT:</span>
            {cmd || 'AWAITING VOICE COMMAND...'}
          </div>
        </div>
      </Html>
    </group>
  );
}
