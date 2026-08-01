// Mutable state for high-performance updates without triggering React re-renders.
// We'll update this directly from the MediaPipe loop and read it from R3F useFrame.

export const handState = {
  landmarks: [],
  worldLandmarks: [],
  handednesses: [],
  isReady: false,
};
