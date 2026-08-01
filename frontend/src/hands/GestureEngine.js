import { handState } from './HandState';

// MediaPipe Landmark Indices
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

function getDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class GestureEngine {
  constructor() {
    this.gestures = [];
    this.lastHandPositions = { left: null, right: null };
    this.lastTwoFingerPos = { left: null, right: null };
    this.lastTime = performance.now();
  }

  detectGestures() {
    const activeGestures = [];
    
    if (!handState.isReady || handState.landmarks.length === 0) return activeGestures;

    const currentTime = performance.now();
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    handState.landmarks.forEach((hand, handIdx) => {
      const isLeft = handState.handednesses[handIdx]?.[0]?.categoryName === 'Left';
      const handKey = isLeft ? 'left' : 'right';
      
      const thumbTip = hand[LM.THUMB_TIP];
      const indexTip = hand[LM.INDEX_TIP];
      const middleTip = hand[LM.MIDDLE_TIP];
      const ringTip = hand[LM.RING_TIP];
      const pinkyTip = hand[LM.PINKY_TIP];
      const wrist = hand[LM.WRIST];
      const palm = hand[LM.MIDDLE_MCP];

      // Track velocity for Repulsor & Punching
      let velocity = 0;
      if (this.lastHandPositions[handKey] && dt > 0) {
        const distMoved = getDistance(palm, this.lastHandPositions[handKey]);
        velocity = distMoved / dt;
      }
      this.lastHandPositions[handKey] = palm;

      // Distances to wrist
      const indexToWrist = getDistance(indexTip, wrist);
      const middleToWrist = getDistance(middleTip, wrist);
      const ringToWrist = getDistance(ringTip, wrist);
      const pinkyToWrist = getDistance(pinkyTip, wrist);

      // 1. PINCH DETECTION (Thumb + Index touching)
      const pinchDist = getDistance(thumbTip, indexTip);
      const isRawPinching = pinchDist < 0.08;

      if (!this.pinchStates) this.pinchStates = { left: 0, right: 0 };
      if (isRawPinching) {
        this.pinchStates[handKey] = currentTime;
      }
      const isPinching = (currentTime - this.pinchStates[handKey]) < 150;

      // 2. OG 2-FINGER CRADLE / ROTATE GESTURE ✌️
      // Index & Middle fingers extended, Ring & Pinky folded into palm
      const isTwoFingerRotate = indexToWrist > 0.35 && middleToWrist > 0.35 && ringToWrist < 0.25 && pinkyToWrist < 0.25 && !isPinching;

      if (isTwoFingerRotate) {
        const twoFingerMid = {
          x: (indexTip.x + middleTip.x) / 2,
          y: (indexTip.y + middleTip.y) / 2
        };

        if (this.lastTwoFingerPos[handKey]) {
          const deltaX = twoFingerMid.x - this.lastTwoFingerPos[handKey].x;
          const deltaY = twoFingerMid.y - this.lastTwoFingerPos[handKey].y;

          // Calculate wrist rotation angle for Z-roll
          const angle = Math.atan2(indexTip.y - wrist.y, indexTip.x - wrist.x);
          let deltaAngle = 0;
          if (this.lastWristAngle && this.lastWristAngle[handKey] !== undefined) {
            deltaAngle = angle - this.lastWristAngle[handKey];
          }
          if (!this.lastWristAngle) this.lastWristAngle = {};
          this.lastWristAngle[handKey] = angle;

          activeGestures.push({
            type: 'two_finger_rotate',
            hand: handKey,
            deltaX,
            deltaY,
            deltaAngle,
            position: twoFingerMid
          });
        }
        this.lastTwoFingerPos[handKey] = twoFingerMid;
      } else {
        this.lastTwoFingerPos[handKey] = null;
      }

      // 3. CLEAN SINGLE PINCH DRAG (XYZ Movement) 🤏
      if (isPinching && !isTwoFingerRotate) {
        activeGestures.push({ type: 'grab_drag', hand: handKey, position: indexTip });
        activeGestures.push({ type: 'pinch', hand: handKey, position: indexTip });

        // Double Pinch Pulse (Array Clone)
        if (!this.lastPinchTime) this.lastPinchTime = {};
        if (this.prevPinchState && !this.prevPinchState[handKey] && isRawPinching) {
          const timeSinceLastPinch = currentTime - (this.lastPinchTime[handKey] || 0);
          if (timeSinceLastPinch > 100 && timeSinceLastPinch < 450) {
            activeGestures.push({ type: 'array_clone', hand: handKey, position: indexTip });
          }
          this.lastPinchTime[handKey] = currentTime;
        }
        if (!this.prevPinchState) this.prevPinchState = {};
        this.prevPinchState[handKey] = isRawPinching;
      }

      // 4. CLOSED FIST ✊
      const isFist = indexToWrist < 0.25 && middleToWrist < 0.25 && ringToWrist < 0.25 && pinkyToWrist < 0.25 && !isPinching;
      if (isFist) {
        activeGestures.push({ type: 'fist', hand: handKey, position: wrist });
        activeGestures.push({ type: 'squeezing_air', hand: handKey, position: wrist });
        if (velocity > 1.4) {
          activeGestures.push({ type: 'punching_air', hand: handKey, position: wrist });
        }
      }

      // 5. INDEX POKE & POINT 👉
      const isPoke = indexToWrist > 0.35 && middleToWrist < 0.25 && ringToWrist < 0.25 && pinkyToWrist < 0.25 && !isPinching;
      if (isPoke) {
        activeGestures.push({ type: 'poke_select', hand: handKey, position: indexTip });
        activeGestures.push({ type: 'single_tap_face', hand: handKey, position: indexTip });

        // Finger Flick Duplication
        if (!this.lastFlickY) this.lastFlickY = {};
        if (this.lastFlickY[handKey] && (this.lastFlickY[handKey] - indexTip.y) > 0.12) {
          if (!this.lastFlickTime) this.lastFlickTime = 0;
          if (currentTime - this.lastFlickTime > 800) {
            activeGestures.push({ type: 'finger_flick_duplicate', hand: handKey, position: indexTip });
            this.lastFlickTime = currentTime;
          }
        }
        this.lastFlickY[handKey] = indexTip.y;
      }

      // 6. OPEN PALM 🖐️
      const isOpenPalm = indexToWrist > 0.38 && middleToWrist > 0.38 && ringToWrist > 0.38 && pinkyToWrist > 0.38 && !isPinching && !isFist && !isTwoFingerRotate;
      if (isOpenPalm) {
        activeGestures.push({ type: 'open_palm', hand: handKey, position: palm });
        if (velocity > 1.2) {
          activeGestures.push({ type: 'repulsor', hand: handKey, position: palm, direction: { x: 0, y: 0, z: -1 } });
        }
      }

      // 7. ANATOMICAL HAND MECHANICS: PALM-UP 🫴 vs PALM-DOWN 🫱 vs UPSIDE-DOWN 🤲
      const isPalmUp = isOpenPalm && (wrist.y > palm.y + 0.03);
      if (isPalmUp) {
        activeGestures.push({ type: 'palm_up_menu', hand: handKey, position: palm });
      }

      const isPalmDown = isOpenPalm && (wrist.y < palm.y - 0.03);
      if (isPalmDown && velocity > 1.2) {
        activeGestures.push({ type: 'gravity_wave', hand: handKey, position: palm });
      }

      // 8. DEVIL HORNS (Laser Cutter) 🤟
      const isRockHorns = indexToWrist > 0.35 && pinkyToWrist > 0.35 && middleToWrist < 0.25 && ringToWrist < 0.25 && !isPinching;
      if (isRockHorns) {
        activeGestures.push({ type: 'laser_horns', hand: handKey, indexTip, pinkyTip });
      }

      // 9. VULCAN SPOCK SIGN (X-Ray Vision) 🖖
      const indexMiddleGap = getDistance(indexTip, middleTip);
      const ringPinkyGap = getDistance(ringTip, pinkyTip);
      const middleRingGap = getDistance(middleTip, ringTip);
      const isVulcan = indexToWrist > 0.35 && middleToWrist > 0.35 && ringToWrist > 0.35 && pinkyToWrist > 0.35 &&
                       indexMiddleGap < 0.06 && ringPinkyGap < 0.06 && middleRingGap > 0.08;
      if (isVulcan) {
        if (!this.lastVulcanTime || (currentTime - this.lastVulcanTime > 1000)) {
          activeGestures.push({ type: 'vulcan_xray', hand: handKey });
          this.lastVulcanTime = currentTime;
        }
      }
    });

    // BIMANUAL DUAL-HAND GESTURES
    if (handState.landmarks.length >= 2) {
      const h1 = handState.landmarks[0];
      const h2 = handState.landmarks[1];

      const palm1 = h1[LM.MIDDLE_MCP];
      const palm2 = h2[LM.MIDDLE_MCP];
      const distTwoHands = getDistance(palm1, palm2);

      const isPinch1 = getDistance(h1[LM.THUMB_TIP], h1[LM.INDEX_TIP]) < 0.08;
      const isPinch2 = getDistance(h2[LM.THUMB_TIP], h2[LM.INDEX_TIP]) < 0.08;

      const isPalm1 = getDistance(h1[LM.INDEX_TIP], h1[LM.WRIST]) > 0.35;
      const isPalm2 = getDistance(h2[LM.INDEX_TIP], h2[LM.WRIST]) > 0.35;

      // SUB-COMPONENT ISOLATION
      if (isPinch1 && isPinch2) {
        activeGestures.push({ type: 'sub_component_isolation', distance: distTwoHands });
      }

      if (!this.lastTwoHandDist) {
        this.lastTwoHandDist = distTwoHands;
        this.lastPalmYDiff = palm1.y - palm2.y;
        this.lastPalmXAvg = (palm1.x + palm2.x) / 2;
      } else {
        const deltaDist = distTwoHands - this.lastTwoHandDist;
        const currentYDiff = palm1.y - palm2.y;
        const deltaY = currentYDiff - this.lastPalmYDiff;
        const currentXAvg = (palm1.x + palm2.x) / 2;
        const deltaX = currentXAvg - this.lastPalmXAvg;

        // UNIFORM SCALE / STRETCH
        if (Math.abs(deltaDist) > 0.03) {
          activeGestures.push({ type: 'bimanual_scale', distance: distTwoHands, delta: deltaDist });
        }

        // BIMANUAL ROTATE
        if (isPalm1 && isPalm2 && Math.abs(deltaY) > 0.02) {
          activeGestures.push({ type: 'bimanual_rotate', deltaY, distance: distTwoHands });
        }

        this.lastTwoHandDist = distTwoHands;
        this.lastPalmYDiff = currentYDiff;
        this.lastPalmXAvg = currentXAvg;
      }
    } else {
      this.lastTwoHandDist = null;
      this.lastPalmYDiff = null;
      this.lastPalmXAvg = null;
    }

    return activeGestures;
  }
}

export const gestureEngine = new GestureEngine();
