import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { handState } from './HandState';

export default function HandTracker() {
  const videoRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    let active = true;

    async function init() {
      // Load MediaPipe WASM and model
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );
      
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.3,
        minHandPresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });

      if (!active) return;
      handLandmarkerRef.current = handLandmarker;
      
      // Start Webcam
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" }
        });
        if (videoRef.current && active) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.error("Play failed", e));
            predictWebcam();
          };
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam error:", err);
      }
    }

    init();

    const predictWebcam = () => {
      const video = videoRef.current;
      const landmarker = handLandmarkerRef.current;
      
      if (video && landmarker && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        
        // Detect hands
        const results = landmarker.detectForVideo(video, performance.now());
        
        // Mirror the X-axis so movements match the screen exactly
        const rawLandmarks = results.landmarks ? results.landmarks.map(hand => 
          hand.map(lm => ({ ...lm, x: 1.0 - lm.x }))
        ) : [];
        
        const handednesses = (results.handednesses && results.handednesses.length > 0)
          ? results.handednesses
          : rawLandmarks.map((_, i) => [{ categoryName: i === 0 ? 'Left' : 'Right', score: 0.9 }]);

        // Keyed smoothing by hand identity ('Left' or 'Right') with instant 0.15 alpha for zero lag
        if (!window._prevHandMap) window._prevHandMap = {};
        const alpha = 0.15; // Low lag, instant response
        
        const smoothedLandmarks = rawLandmarks.map((hand, hIdx) => {
          const side = handednesses[hIdx]?.[0]?.categoryName || (hIdx === 0 ? 'Left' : 'Right');
          const prevHand = window._prevHandMap[side] || [];
          
          const smoothedHand = hand.map((joint, jIdx) => {
            const prevJoint = prevHand[jIdx];
            if (!prevJoint) return joint;
            
            return {
              x: prevJoint.x * alpha + joint.x * (1 - alpha),
              y: prevJoint.y * alpha + joint.y * (1 - alpha),
              z: prevJoint.z * alpha + joint.z * (1 - alpha)
            };
          });

          window._prevHandMap[side] = smoothedHand;
          return smoothedHand;
        });

        // Update global mutable state
        handState.landmarks = smoothedLandmarks;
        handState.worldLandmarks = results.worldLandmarks || [];
        handState.handednesses = handednesses;
        handState.isReady = true;
      }
      
      if (active) {
        animationRef.current = requestAnimationFrame(predictWebcam);
      }
    };

    return () => {
      active = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <video 
      ref={videoRef}
      autoPlay 
      playsInline 
      muted 
      style={{ display: 'none' }} 
    />
  );
}
