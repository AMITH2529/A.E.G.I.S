import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { sceneState } from '../scene/SceneState';
import { exportSceneToGLB } from './GLBExporter';

export default function Exporter() {
  const { scene } = useThree();

  useEffect(() => {
    return sceneState.subscribe(() => {
      if (sceneState.shouldExport) {
        console.log("Exporting scene...");
        exportSceneToGLB(scene);
        sceneState.shouldExport = false; // Reset flag after triggering
      }
    });
  }, [scene]);

  return null;
}
