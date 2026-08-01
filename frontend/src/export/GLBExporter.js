import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export function exportSceneToGLB(scene, filename = 'aegis-export.glb') {
  const exporter = new GLTFExporter();
  
  exporter.parse(
    scene,
    (gltf) => {
      const blob = new Blob([gltf], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    (error) => {
      console.error('An error happened during GLB export:', error);
    },
    { binary: true }
  );
}
