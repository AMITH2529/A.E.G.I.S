import React, { useRef, useEffect, useState } from 'react';
import { handState } from '../hands/HandState';
import { HAND_CONNECTIONS } from '../hands/HandSkeleton';

const FINGER_TIPS = [4, 8, 12, 16, 20];

const THEMES = {
  Rainbow: (t, index, total) => `hsl(${(t * 120 + index * (360 / total)) % 360}, 100%, 60%)`,
  Cyberpunk: (t, index, total) => (index % 2 === 0 ? '#ff003c' : '#00f0ff'),
  Lava: (t, index, total) => `hsl(${(10 + index * 12) % 45}, 100%, ${50 + Math.sin(t) * 10}%)`,
  Ocean: (t, index, total) => `hsl(${185 + index * 18}, 100%, 60%)`,
  Galaxy: (t, index, total) => `hsl(${260 + Math.sin(t * 2 + index) * 40}, 100%, 65%)`
};

export default function NeonHandOverlay() {
  const canvasRef = useRef(null);
  const [currentTheme, setCurrentTheme] = useState('Cyberpunk');
  const [handCount, setHandCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    let ripples = [];
    let time = 0;
    let lastTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const createParticles = (pos, color, count = 2) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: pos.x,
          y: pos.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1.0,
          color,
          size: Math.random() * 3 + 1
        });
      }
    };

    const render = (timestamp) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      time += dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hands = handState.landmarks || [];
      setHandCount(hands.length);

      if (hands.length > 0) {
        ctx.globalCompositeOperation = 'screen';

        // 1. Draw Skeleton & Fingertip Sparks for each hand
        hands.forEach((hand, handIdx) => {
          const isLeft = handState.handednesses[handIdx]?.[0]?.categoryName === 'Left';
          const themeFn = THEMES[currentTheme];
          const glowColor = isLeft ? '#00f3ff' : '#ff0055';

          // Draw connectors
          HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
            const p1 = hand[startIdx];
            const p2 = hand[endIdx];
            if (!p1 || !p2) return;

            const x1 = p1.x * canvas.width;
            const y1 = p1.y * canvas.height;
            const x2 = p2.x * canvas.width;
            const y2 = p2.y * canvas.height;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 1.8;
            ctx.shadowBlur = 8;
            ctx.shadowColor = glowColor;
            ctx.stroke();
            ctx.shadowBlur = 0;
          });

          // Draw all 21 Glowing Skeleton Joint Dots
          hand.forEach((joint, jIdx) => {
            if (!joint) return;
            const jx = joint.x * canvas.width;
            const jy = joint.y * canvas.height;

            const isTip = FINGER_TIPS.includes(jIdx);
            const isWrist = jIdx === 0;
            const radius = isTip ? 5.0 : (isWrist ? 4.5 : 3.5);
            const nodeColor = isTip ? themeFn(time, FINGER_TIPS.indexOf(jIdx), 5) : glowColor;

            // Outer Neon Halo Glow Dot
            ctx.beginPath();
            ctx.arc(jx, jy, radius, 0, Math.PI * 2);
            ctx.fillStyle = nodeColor;
            ctx.shadowBlur = isTip ? 16 : 10;
            ctx.shadowColor = nodeColor;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Inner Bright White Core Dot
            ctx.beginPath();
            ctx.arc(jx, jy, radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          });
        });

        // 2. Dual-Hand Lightning Arcs & Flowing Gradients when 2 hands are detected
        if (hands.length >= 2) {
          const h1 = hands[0];
          const h2 = hands[1];

          FINGER_TIPS.forEach((tipIdx, fIdx) => {
            const p1 = h1[tipIdx];
            const p2 = h2[tipIdx];
            if (!p1 || !p2) return;

            const pt1 = { x: p1.x * canvas.width, y: p1.y * canvas.height };
            const pt2 = { x: p2.x * canvas.width, y: p2.y * canvas.height };
            const dist = Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y);

            const col = THEMES[currentTheme](time, fIdx, FINGER_TIPS.length);

            // Lightning arc when close
            if (dist < 220 && Math.random() > 0.3) {
              ctx.beginPath();
              ctx.moveTo(pt1.x, pt1.y);
              const midX = (pt1.x + pt2.x) / 2 + (Math.random() - 0.5) * 40;
              const midY = (pt1.y + pt2.y) / 2 + (Math.random() - 0.5) * 40;
              ctx.lineTo(midX, midY);
              ctx.lineTo(pt2.x, pt2.y);
              ctx.strokeStyle = '#ffffff';
              ctx.shadowBlur = 25;
              ctx.shadowColor = col;
              ctx.lineWidth = 2.5;
              ctx.stroke();
              ctx.shadowBlur = 0;
            }

            // Flowing gradient tether line
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            const grad = ctx.createLinearGradient(pt1.x, pt1.y, pt2.x, pt2.y);
            grad.addColorStop(0, '#00f3ff');
            grad.addColorStop(0.5, col);
            grad.addColorStop(1, '#ff0055');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = col;
            ctx.stroke();
            ctx.shadowBlur = 0;
          });
        }

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentTheme]);

  return (
    <>
      {/* 2D High-Tech Canvas Neon Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Dual Hand Telemetry HUD & Theme Selector Overlay */}
      <div className="absolute top-20 left-6 z-40 pointer-events-auto flex flex-col gap-2 font-mono">
        <div className="bg-black/80 backdrop-blur-xl border border-neon-cyan/50 rounded-xl p-2.5 shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-ping" />
            <span className="text-neon-cyan font-bold">HANDS TRACKED:</span>
            <span className="text-white font-bold text-sm bg-neon-cyan/20 px-2 py-0.5 rounded border border-neon-cyan/40">
              {handCount} / 2 DETECTED
            </span>
          </div>
        </div>

        {/* Theme Switcher Bar */}
        <div className="bg-black/80 backdrop-blur-xl border border-neon-cyan/40 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
          {Object.keys(THEMES).map((themeName) => (
            <button
              key={themeName}
              onClick={() => setCurrentTheme(themeName)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all cursor-pointer ${
                currentTheme === themeName
                  ? 'bg-neon-cyan text-black shadow-[0_0_10px_#00f3ff]'
                  : 'text-neon-blue/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {themeName}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
