import { useEffect, useRef, useState, useCallback } from 'react';
import { useVoiceListener } from './VoiceListener';
import { sceneState } from '../scene/SceneState';
import { aegisVoice } from './VoiceSpeaker';
import { audioManager } from '../audio/AudioManager';

export function useCommandParser() {
  const wsRef = useRef(null);
  const [systemState, setSystemState] = useState('Offline');
  const [lastCommand, setLastCommand] = useState('');

  useEffect(() => {
    // Connect to local FastAPI server
    const ws = new WebSocket('ws://localhost:8000/ws/forge');
    
    ws.onopen = () => {
      setSystemState('Online');
      sceneState.systemState = 'Online';
      sceneState.notify();
      console.log('Connected to AEGIS Backend');
      aegisVoice.speak('AEGIS systems online.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('AEGIS Response:', data);
        
        if (data.action === 'summon') {
          const prompt = data.prompt || 'object';
          setSystemState(`Forging: ${prompt}`);
          sceneState.systemState = `Forging: ${prompt}`;
          sceneState.isForging = true;
          sceneState.forgeItemName = prompt;
          sceneState.forgeStartTime = performance.now();
          
          // Determine WebGL primitive shape
          let shapeType = data.shapeType || 'sphere';
          if (!data.shapeType) {
            const p = prompt.toLowerCase();
            if (p.includes('box') || p.includes('cube') || p.includes('square')) shapeType = 'box';
            else if (p.includes('ring') || p.includes('torus') || p.includes('donut')) shapeType = 'torus';
            else if (p.includes('cylinder') || p.includes('tube') || p.includes('pipe')) shapeType = 'cylinder';
            else if (p.includes('cone') || p.includes('pyramid')) shapeType = 'cone';
          }
          
          // Store the current shape type so model_ready knows what it was
          sceneState.currentShapeType = shapeType;
          
          sceneState.notify();
          audioManager.playSummon();
          aegisVoice.speak(`Okay sir, importing ${prompt} in seconds.`);
        } else if (data.action === 'model_ready') {
          setSystemState('Model ready. Awaiting grab.');
          sceneState.isForging = false;

          // Compute exact import time duration in seconds
          const duration = sceneState.forgeStartTime
            ? ((performance.now() - sceneState.forgeStartTime) / 1000).toFixed(1)
            : '2.5';
          sceneState.lastImportDuration = duration;

          // Add a new placeholder object to the scene using WebGL primitive or GLB
          sceneState.objects.push({
            id: `summoned-${Date.now()}`,
            position: [0, 0, 0],
            scale: 1,
            color: '#00f3ff', // Default neon cyan
            shapeType: data.shapeType || (data.url ? 'glb' : 'sphere'),
            url: data.url || null,
            explosionFactor: 0
          });
          sceneState.notify();
          aegisVoice.speak(`Import complete in ${duration} seconds. Ready for manipulation, sir.`);
        } else if (data.action === 'recolor') {
          setSystemState(`Recoloring...`);
          if (sceneState.objects.length > 0) {
            let targetObj = null;
            if (sceneState.grabbedObjectId) {
              targetObj = sceneState.objects.find(o => o.id === sceneState.grabbedObjectId);
            }
            if (!targetObj) {
              targetObj = sceneState.objects[sceneState.objects.length - 1];
            }
            
            if (targetObj) {
              if (data.colors && data.colors.length > 0) {
                targetObj.colors = data.colors;
                targetObj.color = data.colors[0];
                targetObj.secondaryColor = data.colors.length > 1 ? data.colors[1] : data.colors[0];
              }
              if (data.finish) {
                targetObj.finish = data.finish;
              }
              sceneState.notify();
              aegisVoice.speak('Right away, sir. Updating holographic material properties.');
            }
          }
        } else if (data.action === 'dismantle' || data.action === 'assemble' || (data.raw_transcript && (String(data.raw_transcript).toLowerCase().includes('dismantle') || String(data.raw_transcript).toLowerCase().includes('assemble') || String(data.raw_transcript).toLowerCase().includes('explode') || String(data.raw_transcript).toLowerCase().includes('condense')))) {
          const text = data.raw_transcript ? String(data.raw_transcript).toLowerCase() : '';
          const isExplode = text.includes('dismantle') || text.includes('explode') || text.includes('pull apart') || data.mode === 'explode' || (data.action === 'dismantle' && data.mode !== 'condense' && data.mode !== 'assemble');
          
          setSystemState(isExplode ? 'Dismantling: Explode' : 'Assembling: Condense');
          sceneState.objects = sceneState.objects.map(obj => ({
            ...obj,
            explosionFactor: isExplode ? 1.0 : 0
          }));
          sceneState.notify();
          aegisVoice.speak(isExplode ? 'Exploding assembly part by part, sir.' : 'Condensing assembly layers, sir.');
        } else if (data.action === 'stress_test') {
          setSystemState('Stress Test Active');
          sceneState.stressScanning = true;
          sceneState.objects.forEach(obj => {
            obj.stressHeatmap = true;
          });
          sceneState.notify();
          aegisVoice.speak('Initiating material stress analysis simulation, sir.');
          setTimeout(() => {
            sceneState.stressScanning = false;
            sceneState.notify();
          }, 5000);
        } else if (data.action === 'destroy') {
          setSystemState(`Destroying object...`);
          if (sceneState.objects.length > 0) {
            if (sceneState.grabbedObjectId) {
              sceneState.objects = sceneState.objects.filter(o => o.id !== sceneState.grabbedObjectId);
              sceneState.grabbedObjectId = null;
            } else {
              sceneState.objects.pop(); // Remove last object
            }
            sceneState.notify();
            aegisVoice.speak('Object purged from the local cache, sir.');
          }
        } else if (data.action === 'clear_scene') {
          setSystemState(`Clearing scene...`);
          sceneState.objects = [];
          sceneState.grabbedObjectId = null;
          sceneState.notify();
          aegisVoice.speak('Scene cleared, sir.');
        } else if (data.action === 'export') {
          setSystemState('Exporting Scene to GLB...');
          sceneState.shouldExport = true;
          sceneState.notify();
          aegisVoice.speak('Executing export protocol. Saving scene as GLB, sir.');
        }
      } catch(e) {
        console.error("Failed to parse backend message", e);
      }
    };

    ws.onclose = () => {
      setSystemState('Offline');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const sendManualCommand = useCallback((transcript) => {
    setLastCommand(transcript);
    sceneState.lastCommand = transcript;
    sceneState.addLog('user', transcript);
    sceneState.notify();
    
    // Play subtle processing sound
    audioManager.playClick();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(transcript);
      setSystemState('Processing...');
      sceneState.systemState = 'Processing...';
      sceneState.notify();
    }
  }, []);

  useVoiceListener(useCallback((transcript) => {
    sendManualCommand(transcript);
  }, [sendManualCommand]));

  return { systemState, lastCommand, sendManualCommand };
}
