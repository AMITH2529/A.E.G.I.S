import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { handState } from '../hands/HandState';
import { GestureEngine } from '../hands/GestureEngine';
import { sceneState } from './SceneState';
import { VerletEngine } from '../physics/VerletEngine';
import { SoftBody } from '../physics/SoftBody';
import * as THREE from 'three';
import RepulsorSystem from './RepulsorSystem';
import BoundingBoxHUD from './BoundingBoxHUD';
import { audioManager } from '../audio/AudioManager';
import { useGLTF } from '@react-three/drei';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Model Loading Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <mesh><sphereGeometry args={[1, 16, 16]}/><meshStandardMaterial color="red" wireframe/></mesh>;
    }
    return this.props.children;
  }
}

function Model({ url, color, secondaryColor, colors, finish, explosionFactor = 0, flexibilityActive = false, stressHeatmap = false }) {
  const { scene } = useGLTF(`http://127.0.0.1:8000${url}`);
  const clone = useMemo(() => scene.clone(), [scene]);
  
  useEffect(() => {
    let i = 0;
    
    // Calculate accurate bounding box across all child meshes
    const box = new THREE.Box3();
    clone.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone();
        child.updateMatrixWorld(true);
        childBox.applyMatrix4(child.matrixWorld);
        box.union(childBox);
      }
    });

    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = maxDim > 0 ? (1.6 / maxDim) : 1.0;
    clone.scale.set(targetScale, targetScale, targetScale);
    clone.position.set(-center.x * targetScale, -center.y * targetScale, -center.z * targetScale);

    const activeColors = (colors && colors.length > 0) ? colors : (color && color !== '#00f3ff') ? [color, secondaryColor || color] : null;

    clone.traverse((child) => {
      if (child.isMesh) {
        // Store original position and outward direction vector for dismantling / exploding
        if (!child.userData.origPosition) {
          child.userData.origPosition = child.position.clone();
          const meshBox = new THREE.Box3().setFromObject(child);
          const meshCenter = meshBox.getCenter(new THREE.Vector3());
          let dir = meshCenter.sub(center).normalize();
          
          if (isNaN(dir.x) || dir.lengthSq() < 0.001) {
            // Golden angle 3D distribution for distinct radial explosion
            const phi = (i * 137.5 * Math.PI) / 180;
            const y = 1 - (i / 15) * 2;
            const radius = Math.sqrt(Math.max(0, 1 - y * y));
            dir = new THREE.Vector3(Math.cos(phi) * radius, y || 0.5, Math.sin(phi) * radius).normalize();
          }
          child.userData.explodeDir = dir;
        }

        // Apply multi-color combination & finishes
        if (activeColors) {
          if (!child.originalMaterial) {
            child.originalMaterial = child.material.clone();
          }
          const mat = child.material;
          const assignedColor = activeColors[i % activeColors.length];
          mat.color.set(assignedColor);
          mat.emissive.set(assignedColor);
          mat.emissiveIntensity = 0.2;
          
          if (finish === 'metallic') {
            mat.metalness = 1.0;
            mat.roughness = 0.1;
          } else if (finish === 'matte') {
            mat.metalness = 0.0;
            mat.roughness = 0.95;
          } else if (finish === 'glass') {
            mat.opacity = 0.55;
            mat.transparent = true;
            mat.roughness = 0.1;
          } else if (finish === 'glowing') {
            mat.emissiveIntensity = 1.2;
          }
        } else {
          if (finish === 'metallic') {
            child.material.metalness = 1.0;
            child.material.roughness = 0.1;
          } else if (finish === 'matte') {
            child.material.metalness = 0.0;
            child.material.roughness = 0.95;
          } else if (finish === 'glass') {
            child.material.opacity = 0.55;
            child.material.transparent = true;
          } else if (finish === 'glowing') {
            child.material.emissiveIntensity = 1.2;
          }
        }

        // Stress testing & flexibility modes
        if (flexibilityActive) {
          child.material.wireframe = true;
        } else {
          child.material.wireframe = false;
        }

        if (stressHeatmap) {
          child.material.emissive.set('#ff0033');
          child.material.emissiveIntensity = 0.8;
        }

        i++;
      }
    });

  }, [clone, color, secondaryColor, colors, finish, flexibilityActive, stressHeatmap]);

  // Dismantling / exploding animation update
  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh && child.userData.origPosition && child.userData.explodeDir) {
        const offset = child.userData.explodeDir.clone().multiplyScalar((explosionFactor || 0) * 0.45);
        child.position.copy(child.userData.origPosition).add(offset);
      }
    });
  }, [clone, explosionFactor]);

  return <primitive object={clone} />;
}

export default function ObjectManager() {
  const [objects, setObjects] = useState(sceneState.objects);
  
  useEffect(() => {
    return sceneState.subscribe(() => {
      setObjects([...sceneState.objects]);
    });
  }, []);

  // No more external OBJ loading needed; using native WebGL primitives.
  const meshRefs = useRef([]);
  const softBodies = useRef({});
  const gestureEngine = useMemo(() => new GestureEngine(), []);
  const physicsEngine = useMemo(() => new VerletEngine({ gravity: new THREE.Vector3(0, 0, 0), friction: 0.9, bounce: 0.5 }), []);

  // State for grabbing and sculpting
  const isGrabbing = useRef(false);
  const grabOffset = useRef(new THREE.Vector3());
  const grabbedObjectId = useRef(null);

  // Initialize soft bodies for non-GLB primitive meshes
  useEffect(() => {
    meshRefs.current.forEach((mesh, i) => {
      if (mesh && objects[i] && objects[i].shapeType !== 'glb' && !softBodies.current[objects[i].id]) {
        try {
          // Ensure matrixWorld is updated before creating softbody
          mesh.updateMatrixWorld();
          softBodies.current[objects[i].id] = new SoftBody(mesh, physicsEngine);
        } catch (e) {
          console.error("Failed to init SoftBody:", e);
        }
      }
    });
  }, [objects, physicsEngine]);

  useFrame((state, delta) => {
    if (!handState.isReady) return;

    // Run physics simulation for soft bodies
    physicsEngine.update(Math.min(delta, 0.1));
    
    // Update meshes from physics, momentum, and dismantling animation
    objects.forEach((obj, i) => {
      const mesh = meshRefs.current[i];
      
      if (mesh) {
        // Continuous 60 FPS smooth lerp for dismantling / exploding
        const targetExp = obj.explosionFactor || 0;
        if (mesh.userData.currentExplosionFactor === undefined) mesh.userData.currentExplosionFactor = 0;
        mesh.userData.currentExplosionFactor = THREE.MathUtils.lerp(mesh.userData.currentExplosionFactor, targetExp, 0.12);
        const curExp = mesh.userData.currentExplosionFactor;
        
        if (curExp > 0.001 || (mesh.userData.prevExp && mesh.userData.prevExp > 0.001)) {
          mesh.traverse((child) => {
            if (child.isMesh && child.userData.origPosition && child.userData.explodeDir) {
              const offset = child.userData.explodeDir.clone().multiplyScalar(curExp * 0.45);
              child.position.copy(child.userData.origPosition).add(offset);
            }
          });
        }
        mesh.userData.prevExp = curExp;

        // Apply throwing momentum if not currently grabbed
        if (!isGrabbing.current || grabbedObjectId.current !== obj.id) {
          if (mesh.userData.velocity && mesh.userData.velocity.lengthSq() > 0.01) {
            mesh.position.addScaledVector(mesh.userData.velocity, delta);
            mesh.userData.velocity.multiplyScalar(0.95); // Drag/Friction
            
            // Basic floor bounce
            if (mesh.position.y < -1.5) {
              mesh.position.y = -1.5;
              mesh.userData.velocity.y *= -0.5; // Bounce
            }
            mesh.updateMatrixWorld();
          }
          mesh.userData.lastHandPos = null;
        }

        const softBody = softBodies.current[obj.id];
        if (softBody) {
          softBody.update(mesh.matrixWorld);
        }
      }
    });

    const gestures = gestureEngine.detectGestures();
    const pinchGestures = gestures.filter(g => g.type === 'pinch');
    const pushGesture = gestures.find(g => g.type === 'open_palm');
    const pullGesture = gestures.find(g => g.type === 'telekinetic_pull');

    // 0. Telekinetic Pull Logic
    if (pullGesture && !isGrabbing.current) {
      const px = (pullGesture.position.x - 0.5) * 10;
      const py = -(pullGesture.position.y - 0.5) * 6;
      const pz = -pullGesture.position.z * 5;
      const handPos = new THREE.Vector3(px, py, pz);

      objects.forEach((obj, i) => {
        const mesh = meshRefs.current[i];
        if (mesh && !mesh.userData.velocity) mesh.userData.velocity = new THREE.Vector3();
        
        if (mesh) {
          // Add velocity towards hand
          const dir = handPos.clone().sub(mesh.position).normalize();
          mesh.userData.velocity.addScaledVector(dir, 15.0 * delta); // Strong pull force
        }
      });
    }

    // 1. Precise Grab & Manipulation Logic
    if (pinchGestures.length === 1) {
      const primaryPinch = pinchGestures[0];
      const px = (primaryPinch.position.x - 0.5) * 10;
      const py = -(primaryPinch.position.y - 0.5) * 6;
      const pz = -primaryPinch.position.z * 5;
      const handPos = new THREE.Vector3(px, py, pz);

      if (!isGrabbing.current) {
        let closestMesh = null;
        let minDist = 4.0;
        
        meshRefs.current.forEach(mesh => {
          if (!mesh) return;
          const dist = mesh.position.distanceTo(handPos);
          if (dist < minDist) {
            minDist = dist;
            closestMesh = mesh;
          }
        });

        if (closestMesh) {
          const index = meshRefs.current.indexOf(closestMesh);
          if (index !== -1) sceneState.grabbedObjectId = objects[index].id;
          
          isGrabbing.current = true;
          grabbedObjectId.current = closestMesh.uuid;
          grabOffset.current.subVectors(closestMesh.position, handPos);
          audioManager.playGrab();
        }
      }

      if (isGrabbing.current && grabbedObjectId.current) {
        const mesh = meshRefs.current.find(m => m && m.uuid === grabbedObjectId.current);
        if (mesh) {
          // Zero physics velocity while holding object so it stays rock solid
          if (mesh.userData.velocity) mesh.userData.velocity.set(0, 0, 0);

          // Smooth precision position lerp within viewport bounds
          const rawTarget = handPos.clone().add(grabOffset.current);
          const targetPos = new THREE.Vector3(
            Math.max(-2.2, Math.min(2.2, rawTarget.x)),
            Math.max(-1.2, Math.min(1.2, rawTarget.y)),
            Math.max(-1.8, Math.min(1.8, rawTarget.z))
          );
          
          // Deadzone filtering to prevent hand tremor jitter
          if (mesh.position.distanceTo(targetPos) > 0.01) {
            mesh.position.lerp(targetPos, 0.15);
          }
          mesh.updateMatrixWorld();
        }
      }
    } else {
      if (isGrabbing.current) {
        isGrabbing.current = false;
        sceneState.grabbedObjectId = null;
        meshRefs.current.forEach(mesh => {
          if (mesh && mesh.userData.velocity) {
            mesh.userData.velocity.set(0, 0, 0); // Lock object position firmly on release
          }
        });
        grabbedObjectId.current = null;
      }
    }

    // Save gestures to sceneState for HoloEffectsSystem & PalmMenuHUD
    sceneState.activeGestures = gestures;

    const bimanualRotateG = gestures.find(g => g.type === 'bimanual_rotate' || g.type === 'two_finger_rotate');
    const bimanualScaleG = gestures.find(g => g.type === 'bimanual_scale');
    const dismantleG = gestures.find(g => g.type === 'dismantle_isolate' || g.type === 'pulling_apart');
    const pokeG = gestures.find(g => g.type === 'poke_select');

    const duplicateG = gestures.find(g => g.type === 'finger_flick_duplicate');
    const axisG = gestures.find(g => g.type === 'axis_constraint');
    const sculptG = gestures.find(g => g.type === 'mesh_sculpting');

    const twoFingerRotateG = gestures.find(g => g.type === 'two_finger_rotate');

    // 1. ✌️ OG 2-Finger Cradle 3D Rotate (Pitch, Yaw, Roll)
    if (twoFingerRotateG && objects.length > 0) {
      meshRefs.current.forEach(mesh => {
        if (mesh) {
          if (twoFingerRotateG.deltaX !== undefined) {
            mesh.rotation.y += twoFingerRotateG.deltaX * 6.0; // Y-axis Yaw
          }
          if (twoFingerRotateG.deltaY !== undefined) {
            mesh.rotation.x += twoFingerRotateG.deltaY * 6.0; // X-axis Pitch
          }
          if (twoFingerRotateG.deltaAngle !== undefined) {
            mesh.rotation.z += twoFingerRotateG.deltaAngle * 1.5; // Z-axis Roll
          }
        }
      });
    }

    // 2. 👐 Bimanual Uniform Scale (Stretch / Scale object up/down)
    if (bimanualScaleG && objects.length > 0) {
      const scaleDelta = bimanualScaleG.delta * 2.0;
      objects.forEach(obj => {
        obj.scale = Math.max(0.6, Math.min(3.5, (obj.scale || 1.0) + scaleDelta));
      });
      sceneState.notify();
    }

    // 3. 💥 Sub-Component Isolation (Exploded View)
    if (dismantleG) {
      objects.forEach(obj => {
        obj.explosionFactor = Math.max(0, Math.min(1.0, (obj.explosionFactor || 0) + delta * 1.5));
      });
      sceneState.notify();
    }

    // 4. 👆 Finger-Flick Duplication (Create Copy of active 3D model)
    if (duplicateG && objects.length > 0) {
      const lastObj = objects[objects.length - 1];
      const copyObj = {
        ...lastObj,
        id: 'copy_' + Date.now(),
        position: [lastObj.position[0] + 0.8, lastObj.position[1], lastObj.position[2]]
      };
      sceneState.objects.push(copyObj);
      sceneState.notify();
      audioManager.playClick();
    }

    const arrayCloneG = gestures.find(g => g.type === 'array_clone');
    const vulcanG = gestures.find(g => g.type === 'vulcan_xray');
    const gravityG = gestures.find(g => g.type === 'gravity_wave');

    // 13. 🤏⚡ Double Pinch (Holographic Mirror & Array Clone)
    if (arrayCloneG && objects.length > 0) {
      const centerObj = objects[objects.length - 1];
      const radius = 1.2;
      [0, Math.PI/2, Math.PI, (3*Math.PI)/2].forEach((angle, idx) => {
        const arrayObj = {
          ...centerObj,
          id: 'array_' + Date.now() + '_' + idx,
          position: [
            centerObj.position[0] + Math.cos(angle) * radius,
            centerObj.position[1],
            centerObj.position[2] + Math.sin(angle) * radius
          ],
          scale: (centerObj.scale || 1.0) * 0.7
        };
        sceneState.objects.push(arrayObj);
      });
      sceneState.notify();
      audioManager.playArrayMirror();
    }

    // 14. 🖖 Vulcan Spock Sign (X-Ray / Thermal Vision Mode)
    if (vulcanG) {
      sceneState.xrayMode = !sceneState.xrayMode;
      sceneState.notify();
      audioManager.playXRay();
    }

    // 15. 🫱 Horizontal Palm Wave (Zero-Gravity Levitation Wave)
    if (gravityG) {
      sceneState.zeroGravity = !sceneState.zeroGravity;
      objects.forEach(obj => {
        obj.position[1] = (obj.position[1] || 0) + (sceneState.zeroGravity ? 0.8 : -0.8);
      });
      sceneState.notify();
      audioManager.playZeroGravity();
    }

    const squeezeG = gestures.find(g => g.type === 'squeezing_air');
    const punchG = gestures.find(g => g.type === 'punching_air');
    const spreadG = gestures.find(g => g.type === 'spreading_fingers');
    const swipeG = gestures.find(g => g.type === 'swiping_down');

    // 8. ✊ Squeezing Air (Fluid Compression)
    if (squeezeG) {
      sceneState.fluidCompressing = true;
      sceneState.fluidPressure = Math.min(100, (sceneState.fluidPressure || 50) + delta * 50);
      sceneState.notify();
    } else {
      sceneState.fluidCompressing = false;
    }

    // 9. 👊 Punching Air (Physical Impact & Stress Heatmap)
    if (punchG) {
      sceneState.impactTriggered = true;
      meshRefs.current.forEach((mesh, i) => {
        if (mesh && objects[i]) {
          sceneState.impactPos = mesh.position.clone();
          objects[i].stressHeatmap = true;
        }
      });
      sceneState.notify();
    }

    // 10. 🖐️ Spreading Fingers (Flexibility Wireframe Mode)
    if (spreadG) {
      objects.forEach(obj => {
        obj.flexibilityActive = !obj.flexibilityActive;
      });
      sceneState.notify();
    }

    // 11. 👇 Swiping Down (Stress Simulation HUD Scan)
    if (swipeG) {
      sceneState.stressScanning = true;
      sceneState.notify();
      setTimeout(() => {
        sceneState.stressScanning = false;
        sceneState.notify();
      }, 4000);
    }
  });

  return (
    <group>
      {objects.map((obj, i) => (
        <group 
          key={obj.id} 
          ref={el => meshRefs.current[i] = el} 
          position={obj.position} 
          scale={obj.scale}
        >
          {obj.shapeType === 'glb' && obj.url ? (
            <ErrorBoundary>
              <React.Suspense fallback={<mesh><sphereGeometry args={[1, 16, 16]} /><meshStandardMaterial color="#00f3ff" wireframe /></mesh>}>
                <Model 
                  url={obj.url} 
                  color={obj.color} 
                  secondaryColor={obj.secondaryColor}
                  colors={obj.colors} 
                  finish={obj.finish}
                  explosionFactor={obj.explosionFactor || 0}
                  flexibilityActive={obj.flexibilityActive || false}
                  stressHeatmap={obj.stressHeatmap || false}
                />
              </React.Suspense>
            </ErrorBoundary>
          ) : (
            <mesh>
              {obj.shapeType === 'box' ? (
                <boxGeometry args={[1.5, 1.5, 1.5]} />
              ) : obj.shapeType === 'torus' ? (
                <torusGeometry args={[1, 0.3, 16, 64]} />
              ) : obj.shapeType === 'cylinder' ? (
                <cylinderGeometry args={[1, 1, 2, 32]} />
              ) : obj.shapeType === 'cone' ? (
                <coneGeometry args={[1, 2, 32]} />
              ) : (
                <sphereGeometry args={[1, 32, 32]} />
              )}
              <meshStandardMaterial 
                color={obj.color || '#00f3ff'} 
                wireframe 
                emissive={obj.color || '#00f3ff'}
                emissiveIntensity={0.5}
              />
            </mesh>
          )}
          
          {/* Holographic Object Scanner (Visible when grabbed) */}
          {grabbedObjectId.current === obj.id && isGrabbing.current && (
            <Html position={[1.5, 0, 0]} center scale={0.1}>
              <div style={{
                background: 'rgba(0, 30, 50, 0.8)',
                borderLeft: `2px solid ${obj.color || '#00f3ff'}`,
                padding: '10px',
                color: obj.color || '#00f3ff',
                fontFamily: 'monospace',
                fontSize: '12px',
                width: '200px',
                boxShadow: '0 0 10px rgba(0,243,255,0.2)'
              }}>
                <div style={{fontWeight: 'bold', borderBottom: '1px solid rgba(0,243,255,0.3)', marginBottom: '5px'}}>
                  TARGET ACQUIRED
                </div>
                <div>ID: {obj.id.substring(0, 8)}...</div>
                <div>SCALE: {meshRefs.current[i]?.scale.x.toFixed(2)}x</div>
                <div>MASS: {meshRefs.current[i]?.geometry?.attributes?.position?.count ? (meshRefs.current[i].geometry.attributes.position.count * 0.1).toFixed(0) : 'N/A'} kg</div>
                <div>STATUS: SECURED</div>
              </div>
            </Html>
          )}
        </group>
      ))}
      <RepulsorSystem objectsRef={meshRefs} />
    </group>
  );
}
