import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import HandSkeleton from '../hands/HandSkeleton';
import StringMode from '../hands/StringMode';
import HoloEffectsSystem from '../scene/HoloEffectsSystem';
import HoloHandTethers from '../scene/HoloHandTethers';
import ObjectManager from '../scene/ObjectManager';
import SummonPortal from '../scene/SummonPortal';
import Exporter from '../export/Exporter';
import VoidDust from '../scene/VoidDust';
import CyberLabEnvironment from '../scene/CyberLabEnvironment';
import LaserSystem from '../scene/LaserSystem';
import AegisAvatar from '../ui/AegisAvatar';

export default function Void() {
  return (
    <div className="absolute inset-0 w-full h-full bg-void-black">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        {/* Ambient lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Holographic Grid */}
        <Grid 
          infiniteGrid
          fadeDistance={30}
          sectionColor="#0077ff"
          sectionThickness={1}
          cellColor="#00f3ff"
          cellThickness={0.5}
          position={[0, -1.5, 0]}
        />
        
        {/* Ambient Void Dust */}
        <VoidDust />
        
        {/* Full Environment Replacement */}
        <React.Suspense fallback={null}>
          <CyberLabEnvironment />
        </React.Suspense>
        
        {/* OG 3D Hand Skeleton */}
        <HandSkeleton />

        {/* New V2 Superpowers, Connecting Tethers & FX */}
        <LaserSystem />
        <HoloEffectsSystem />
        <HoloHandTethers />
        
        {/* AEGIS 3D Avatar */}
        <React.Suspense fallback={null}>
          <AegisAvatar />
        </React.Suspense>

        {/* Manage 3D Objects and Grab Gestures */}
        <ObjectManager />

        {/* Visual FX for Summoning Objects */}
        <SummonPortal />
        
        {/* Floating holographic dust particles */}
        <VoidDust />
        
        {/* Listen for export commands */}
        <Exporter />

        {/* Basic environment map for reflection if we have objects later */}
        <React.Suspense fallback={null}>
          <Environment preset="city" />
        </React.Suspense>

        {/* Cinematic Post-Processing */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        {/* OrbitControls for manual camera movement for now */}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
