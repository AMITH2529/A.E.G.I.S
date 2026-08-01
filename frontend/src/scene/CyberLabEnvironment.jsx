import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

export default function CyberLabEnvironment() {
  const ringsRef = useRef();

  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y -= delta * 0.05;
    }
  });

  return (
    <group>
      {/* Dark reflective floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={0.15}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.8}
        />
      </mesh>

      {/* Grid over the floor */}
      <gridHelper args={[100, 100, '#00f3ff', '#002233']} position={[0, -1.99, 0]} />

      {/* Massive Server Rings in the background */}
      <group ref={ringsRef} position={[0, 5, -20]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 4 - 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[15 + i * 2, 0.2, 16, 100]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#00f3ff" : "#ff0055"} transparent opacity={0.3} wireframe />
          </mesh>
        ))}
      </group>

      {/* Ambient and Point Lights for dramatic lighting */}
      <ambientLight intensity={0.2} color="#001133" />
      <pointLight position={[0, 10, 0]} intensity={1.5} color="#00f3ff" distance={30} />
      <pointLight position={[0, -1, -5]} intensity={2.0} color="#ff0055" distance={15} />

      {/* Environment map for realistic reflections on objects */}
      <Environment preset="city">
        <Lightformer form="rect" intensity={2} color="#00f3ff" position={[0, 5, -10]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#ff0055" position={[0, 5, 10]} scale={[10, 2, 1]} />
      </Environment>

      {/* Fog for depth */}
      <fog attach="fog" args={['#000510', 5, 40]} />
    </group>
  );
}
