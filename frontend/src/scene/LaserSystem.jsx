import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gestureEngine } from '../hands/GestureEngine';
import { sceneState } from '../scene/SceneState';
import { audioManager } from '../audio/AudioManager';

export default function LaserSystem() {
  const leftLaserRef = useRef();
  const rightLaserRef = useRef();
  const leftLaserHitRef = useRef();
  const rightLaserHitRef = useRef();
  
  const [isPlaying, setIsPlaying] = useState(false);

  // We use a cylinder for the beam
  // The cylinder is 1 unit long, centered at 0,0,0
  // We scale it in Z to reach the target, and position it halfway
  useFrame(() => {
    const gestures = gestureEngine.detectGestures();
    const guns = gestures.filter(g => g.type === 'gun' || g.type === 'laser_horns');

    let firing = false;

    // Reset lasers
    if (leftLaserRef.current) {
      leftLaserRef.current.visible = false;
      leftLaserHitRef.current.visible = false;
    }
    if (rightLaserRef.current) {
      rightLaserRef.current.visible = false;
      rightLaserHitRef.current.visible = false;
    }

    guns.forEach(gun => {
      firing = true;
      const isLeft = gun.hand === 'left';
      const laserMesh = isLeft ? leftLaserRef.current : rightLaserRef.current;
      const hitMesh = isLeft ? leftLaserHitRef.current : rightLaserHitRef.current;
      
      if (!laserMesh || !hitMesh) return;

      const pos = gun.position || gun.indexTip;
      if (!pos) return;

      const px = (pos.x - 0.5) * 10;
      const py = -(pos.y - 0.5) * 6;
      const pz = -(pos.z || 0) * 5;
      const startPos = new THREE.Vector3(px, py, pz);

      // Raw direction from MediaPipe coords
      const dirInput = gun.direction || { x: 0, y: 0, z: -1 };
      const dx = (dirInput.x || 0) * 10;
      const dy = -(dirInput.y || 0) * 6;
      const dz = -(dirInput.z || -1) * 5;
      let dir = new THREE.Vector3(dx, dy, dz).normalize();

      // Lasers typically shoot forward, let's just force it mostly forward for usability if pointing forward
      if (Math.abs(dir.z) < 0.5) {
        dir.z = -1;
        dir.normalize();
      }

      // Raycast against objects or just shoot far
      const MAX_DIST = 20;
      let endPos = startPos.clone().add(dir.clone().multiplyScalar(MAX_DIST));
      
      // Simple collision against scene objects
      let hit = false;
      sceneState.objects.forEach(obj => {
         if (!obj.position) return;
         const objPosVec = Array.isArray(obj.position) ? new THREE.Vector3(...obj.position) : (obj.position?.clone ? obj.position.clone() : new THREE.Vector3());
         // Very rough bounding sphere check along the ray
         const toObj = objPosVec.clone().sub(startPos);
         const projection = toObj.dot(dir);
         if (projection > 0 && projection < MAX_DIST) {
            const closestPoint = startPos.clone().add(dir.clone().multiplyScalar(projection));
            const distToCenter = closestPoint.distanceTo(objPosVec);
            if (distToCenter < 1.5) { // Hit radius
              endPos = closestPoint;
              hit = true;
              
              // Apply heat/color change or push force here if desired
              // For now, let's just make it glow super bright red
              // This would require access to the mesh material, but we can just leave it as visual
            }
         }
      });

      const dist = startPos.distanceTo(endPos);
      const midPoint = startPos.clone().lerp(endPos, 0.5);

      laserMesh.position.copy(midPoint);
      // The cylinder's default axis is Y, so we want it to align with dir
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      laserMesh.quaternion.copy(quaternion);
      laserMesh.scale.set(0.05, dist, 0.05); // Scale Y by length
      laserMesh.visible = true;

      if (hit) {
        hitMesh.position.copy(endPos);
        hitMesh.visible = true;
      }
    });

    if (firing && !isPlaying) {
      audioManager.playGrab(); // Reusing the bass hum for the laser for now
      setIsPlaying(true);
    } else if (!firing && isPlaying) {
      setIsPlaying(false);
    }
  });

  return (
    <group>
      {/* Left Laser */}
      <mesh ref={leftLaserRef} visible={false}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
      </mesh>
      <mesh ref={leftLaserHitRef} visible={false}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Right Laser */}
      <mesh ref={rightLaserRef} visible={false}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
      </mesh>
      <mesh ref={rightLaserHitRef} visible={false}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}
