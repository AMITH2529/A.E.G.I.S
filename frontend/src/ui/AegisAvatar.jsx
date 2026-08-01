import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { sceneState } from '../scene/SceneState';

// Define a custom shader material inspired by the Ultron Orb
const AegisCoreMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0x00f3ff),
    intensity: 1.0,
    pulseSpeed: 1.0,
  },
  // Vertex Shader (creates liquid-like displacement)
  `
  uniform float time;
  uniform float pulseSpeed;
  varying vec2 vUv;
  varying vec3 vNormal;
  
  // Simple 3D noise function approximation
  float hash(float n) { return fract(sin(n) * 1e4); }
  float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Liquid displacement based on normals
    float n = noise(position * 3.0 + time * pulseSpeed) * 0.2;
    vec3 newPos = position + normal * n;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform float time;
  uniform vec3 color;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Edge glow (Fresnel effect)
    float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    vec3 finalColor = color * intensity + (color * fresnel * 2.0);
    gl_FragColor = vec4(finalColor, 0.8);
  }
  `
);

extend({ AegisCoreMaterial });

export default function AegisAvatar() {
  const meshRef = useRef();
  const materialRef = useRef();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return sceneState.subscribe(() => {
      const state = sceneState.systemState.toLowerCase();
      if (state.includes('forging') || state.includes('processing')) {
        setIsSpeaking(true);
      } else {
        setIsSpeaking(false);
      }
    });
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current && materialRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      
      materialRef.current.time += delta;
      
      if (isSpeaking) {
        materialRef.current.intensity = THREE.MathUtils.lerp(materialRef.current.intensity, 2.5, 0.1);
        materialRef.current.pulseSpeed = THREE.MathUtils.lerp(materialRef.current.pulseSpeed, 3.0, 0.1);
        materialRef.current.color.lerp(new THREE.Color('#ff5500'), 0.1);
        meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
      } else {
        materialRef.current.intensity = THREE.MathUtils.lerp(materialRef.current.intensity, 1.0, 0.1);
        materialRef.current.pulseSpeed = THREE.MathUtils.lerp(materialRef.current.pulseSpeed, 0.5, 0.1);
        materialRef.current.color.lerp(new THREE.Color('#00f3ff'), 0.1);
        meshRef.current.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.1);
      }
    }
  });

  return (
    <group position={[0, 4, -5]}>
      {/* Liquid Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.8, 64, 64]} />
        <aegisCoreMaterial ref={materialRef} transparent />
      </mesh>
      
      {/* Outer Holographic Shell */}
      <mesh>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.2} />
      </mesh>

      <Html position={[0, -1.5, 0]} center>
        <div style={{
          color: '#00f3ff',
          fontFamily: 'monospace',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          textShadow: '0 0 10px #00f3ff'
        }}>
          AEGIS
        </div>
      </Html>
    </group>
  );
}
