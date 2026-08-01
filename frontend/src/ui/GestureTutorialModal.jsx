import React from 'react';

export const GESTURE_DETAILS = {
  poke: {
    id: "poke",
    title: "1. Poke (UI Select)",
    emoji: "👆",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Single Index Point & Tap",
    steps: [
      "Extend your index finger forward while keeping other fingers curled.",
      "Move fingertip over a holographic button or target surface.",
      "Tap forward in mid-air to trigger UI selection."
    ]
  },
  grab: {
    id: "grab",
    title: "2. Grab & Drag (Translate X, Y, Z)",
    emoji: "🤏",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Pinch or Closed Fist Move",
    steps: [
      "Bring thumb and index finger together in a pinch (or form a closed fist).",
      "Lock onto any 3D asset near your hand.",
      "Translate your hand smoothly across X, Y, Z space to move the asset."
    ]
  },
  rotate: {
    id: "rotate",
    title: "3. Bimanual Rotate (Turn Object)",
    emoji: "🔄",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Dual Hand Cradle Turn",
    steps: [
      "Position both open palms on opposing sides of the 3D model.",
      "Shift one hand up or forward relative to the other.",
      "The object smoothly rotates along 3D orientation axes."
    ]
  },
  stretch: {
    id: "stretch",
    title: "4. Stretch (Uniform Scale Up)",
    emoji: "↔️",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Dual Hand Uniform Scale",
    steps: [
      "Hold both hands open or pinched around the object.",
      "Move hands apart to stretch & scale up the model uniformly.",
      "Bring hands closer to shrink model size down."
    ]
  },
  box_select: {
    id: "box_select",
    title: "5. Box Selection (Select Area)",
    emoji: "⬛",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Bounding Area Frame",
    steps: [
      "Raise both hands high in the workspace facing inward.",
      "Form a bounding rectangular frame around objects.",
      "Selects all enclosed 3D assets in the region."
    ]
  },
  axis_lock: {
    id: "axis_lock",
    title: "6. Axis Lock (Lock to Axis)",
    emoji: "🔒",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Constraint Single Axis",
    steps: [
      "Grab the model with your primary hand.",
      "Point your secondary index finger at the desired X, Y, or Z axis line.",
      "Constrains object movement strictly along that locked line."
    ]
  },
  tool_menu: {
    id: "tool_menu",
    title: "7. Tool Menu Summon (Quick Tools)",
    emoji: "🔮",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Palm-Up Radial Arc",
    steps: [
      "Hold hand flat with palm facing UP towards the ceiling.",
      "A holographic semi-circular quick tools ring projects above palm.",
      "Select Paint, Sculpt, Extrude, or Merge directly."
    ]
  },
  orbit: {
    id: "orbit",
    title: "8. Camera Orbit (View Around)",
    emoji: "🎡",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Dual Palm Viewport Sweep",
    steps: [
      "Hold both palms open facing inward.",
      "Sweep hands horizontally left or right.",
      "Orbits the 3D scene camera smoothly around the center model."
    ]
  },
  tap_select: {
    id: "tap_select",
    title: "9. Tap Selection (Target Face)",
    emoji: "🎯",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Mesh Face Targeting",
    steps: [
      "Touch index tip directly onto a specific polygon face on the 3D model.",
      "Highlights the targeted mesh face in neon cyan color."
    ]
  },
  sculpt: {
    id: "sculpt",
    title: "10. Mesh Sculpting (Deform Surface)",
    emoji: "🗿",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Palm Surface Pressure",
    steps: [
      "Press open palm downward toward the 3D model surface.",
      "Dynamically deforms and sculpts mesh geometry vertices in real-time."
    ]
  },
  explode: {
    id: "explode",
    title: "11. Exploded View (Dismantle)",
    emoji: "💥",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Sub-Component Isolation",
    steps: [
      "Pinch both hands simultaneously.",
      "Pull hands sideways apart.",
      "Explodes all internal sub-assembly parts outwards for inspection."
    ]
  },
  duplicate: {
    id: "duplicate",
    title: "12. Duplication (Create Copy)",
    emoji: "✨",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Index Finger Flick Clone",
    steps: [
      "Flick index finger rapidly upwards near an active 3D model.",
      "Instantly clones and spawns an exact duplicate asset."
    ]
  },
  repulsor: {
    id: "repulsor",
    title: "Repulsor Blast",
    emoji: "🖐️",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Kinetic Push Wave",
    steps: [
      "Push open palm forward rapidly toward the screen.",
      "Triggers a high-velocity kinetic force push."
    ]
  },
  web_shooter: {
    id: "web_shooter",
    title: "Web Shooter",
    emoji: "✊",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Wrist Flexion Tether",
    steps: [
      "Flex wrist downward with middle/ring fingers curled.",
      "Launches holographic connecting tethers onto 3D objects."
    ]
  },
  shockwave: {
    id: "shockwave",
    title: "Air Impact Shockwave",
    emoji: "👊",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Fist Punch & Heatmap",
    steps: [
      "Punch closed fist forward at high velocity.",
      "Triggers structural impact shockwave and stress heatmap scan."
    ]
  },
  flexibility: {
    id: "flexibility",
    title: "Flexibility Mode",
    emoji: "🖐️",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "5-Finger Mesh Wireframe",
    steps: [
      "Spread all 5 fingers wide apart.",
      "Toggles soft-body flexibility wireframe mode."
    ]
  },
  stress_scan: {
    id: "stress_scan",
    title: "Stress HUD Scan",
    emoji: "👇",
    image: "/tutorials/media__1784711336702.png",
    subtitle: "Downward Swipe Diagnostic",
    steps: [
      "Swipe open hand rapidly downwards.",
      "Runs full diagnostic stress scan across all active 3D models."
    ]
  },
  pinch_twist: {
    id: "pinch_twist",
    title: "Pinch & Twist",
    emoji: "🤏🌀",
    subtitle: "Precision Wrist Angle Rotation",
    steps: [
      "Pinch thumb and index finger together on active model.",
      "Twist wrist left or right in Z-axis.",
      "Rotates object down to decimal precision angles."
    ]
  },
  laser_horns: {
    id: "laser_horns",
    title: "Holo-Laser Cutter",
    emoji: "🤟",
    subtitle: "Dual Fingertip Laser Guns",
    steps: [
      "Extend Index and Pinky fingers while curling Middle and Ring (Rock sign).",
      "Points dual high-intensity laser beams from fingertips into 3D scene.",
      "Slices and cuts through 3D meshes in mid-air."
    ]
  },
  vulcan_xray: {
    id: "vulcan_xray",
    title: "Vulcan X-Ray Inspection",
    emoji: "🖖",
    subtitle: "Spock Sign Wireframe Mode",
    steps: [
      "Form the Vulcan Spock sign (Index+Middle paired, Ring+Pinky paired, split open).",
      "Instantly toggles X-Ray holographic wireframe inspection view across all models."
    ]
  },
  array_clone: {
    id: "array_clone",
    title: "Double Pinch Array",
    emoji: "🤏⚡",
    subtitle: "360-Degree Mirror Matrix",
    steps: [
      "Perform a rapid double pinch motion on a model.",
      "Spawns a 360-degree circular array of 4 mirrored holographic clones."
    ]
  },
  gravity_wave: {
    id: "gravity_wave",
    title: "Zero-G Gravity Wave",
    emoji: "🫱",
    subtitle: "Horizontal Palm Sweep",
    steps: [
      "Sweep open palm horizontally across the camera viewport.",
      "Triggers zero-gravity levitation float on all active 3D assets."
    ]
  }
};

export default function GestureTutorialModal({ gestureId, onClose }) {
  if (!gestureId || !GESTURE_DETAILS[gestureId]) return null;

  const info = GESTURE_DETAILS[gestureId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-black/90 border-2 border-neon-cyan rounded-2xl p-6 shadow-[0_0_50px_rgba(0,243,255,0.4)] ring-1 ring-white/20 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neon-cyan/40 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{info.emoji}</span>
            <div>
              <h2 className="text-neon-cyan text-lg font-black tracking-wider uppercase font-mono">{info.title}</h2>
              <p className="text-xs text-neon-blue/80 font-mono">{info.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/60 text-red-400 flex items-center justify-center font-bold text-sm hover:bg-red-500 hover:text-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Instructions Steps (Text Only - High Visibility) */}
        <div className="flex flex-col gap-3 bg-gradient-to-b from-cyan-950/40 to-black/60 p-5 rounded-xl border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,243,255,0.15)]">
          <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-widest font-mono flex items-center gap-2 border-b border-neon-cyan/20 pb-2">
            <span>📋</span> PHYSICAL EXECUTION INSTRUCTIONS:
          </h3>
          <ol className="flex flex-col gap-3 pl-1 text-sm font-mono text-cyan-100/90">
            {info.steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-white/5 p-2.5 rounded-lg border border-white/5 hover:border-neon-cyan/40 transition-all">
                <span className="bg-neon-cyan/20 text-neon-cyan font-black px-2 py-0.5 rounded text-xs border border-neon-cyan/40 shadow-[0_0_8px_rgba(0,243,255,0.3)]">{idx + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button 
            onClick={onClose}
            className="bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black font-mono font-bold text-xs uppercase px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] cursor-pointer"
          >
            TRY GESTURE LIVE ✓
          </button>
        </div>
      </div>
    </div>
  );
}
