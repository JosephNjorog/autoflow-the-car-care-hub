import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'enter' | 'wash' | 'exit' | 'out';

// ── Side-view car SVG ─────────────────────────────────────────────────────────
function CarSvg({ clean }: { clean: boolean }) {
  return (
    <svg viewBox="0 0 124 58" width="124" height="58" style={{ overflow: 'visible' }}>
      {/* Drop shadow */}
      <ellipse cx="62" cy="55" rx="54" ry="4" fill="rgba(0,0,0,0.6)" />

      {/* Mud/dirt (shown before wash) */}
      {!clean && (
        <g opacity="0.45">
          <ellipse cx="30" cy="45" rx="15" ry="6" fill="#7B5B2A" />
          <ellipse cx="92" cy="45" rx="15" ry="6" fill="#7B5B2A" />
          <rect x="8" y="26" width="108" height="14" rx="3" fill="rgba(100,70,20,0.4)" />
        </g>
      )}

      {/* Body */}
      <rect x="8" y="25" width="108" height="20" rx="6" fill={clean ? '#fff' : '#d6c9ae'} />

      {/* Roof / cabin */}
      <path d="M28 25 L37 11 L82 11 L95 25 Z" fill={clean ? '#f5f5f5' : '#c8b998'} />

      {/* Front windshield */}
      <path d="M70 24 L78 12 L92 12 L93 24 Z"
        fill={clean ? 'rgba(140,210,255,0.82)' : 'rgba(110,150,180,0.5)'} />

      {/* Side window */}
      <path d="M38 24 L45 12 L68 12 L68 24 Z"
        fill={clean ? 'rgba(140,210,255,0.82)' : 'rgba(110,150,180,0.5)'} />

      {/* Door seam */}
      <line x1="68" y1="25" x2="68" y2="44" stroke={clean ? '#ccc' : '#aaa'} strokeWidth="1" opacity="0.6" />

      {/* Headlight */}
      <rect x="112" y="27" width="5" height="8" rx="2" fill={clean ? '#fff9a0' : '#bbb'} />
      {clean && <rect x="112" y="27" width="5" height="8" rx="2" fill="rgba(255,250,100,0.3)" />}

      {/* Rear light */}
      <rect x="7" y="27" width="5" height="8" rx="2" fill={clean ? '#ff5252' : '#994444'} />

      {/* Bumpers */}
      <rect x="114" y="36" width="5" height="7" rx="2" fill={clean ? '#e0e0e0' : '#b0a090'} />
      <rect x="5" y="36" width="5" height="7" rx="2" fill={clean ? '#e0e0e0' : '#b0a090'} />

      {/* Wheel wells */}
      <ellipse cx="30" cy="45" rx="15" ry="7" fill="#0a0a0a" />
      <ellipse cx="92" cy="45" rx="15" ry="7" fill="#0a0a0a" />

      {/* Wheels */}
      {[30, 92].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="45" r="13" fill="#1a1a1a" />
          <circle cx={cx} cy="45" r="9" fill="#292929" />
          <circle cx={cx} cy="45" r="5" fill="#404040" />
          <circle cx={cx} cy="45" r="2.5" fill="#606060" />
          {/* Spokes */}
          {[0, 60, 120, 180, 240, 300].map(angle => (
            <line key={angle}
              x1={cx} y1="45"
              x2={cx + Math.cos(angle * Math.PI / 180) * 8}
              y2={45 + Math.sin(angle * Math.PI / 180) * 8}
              stroke="#333" strokeWidth="1.5" />
          ))}
        </g>
      ))}

      {/* Shine streaks (clean only) */}
      {clean && (
        <g opacity="0.85">
          <path d="M41 13 L46 10 L51 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="58" cy="12" r="1.5" fill="white" />
          <circle cx="64" cy="10" r="1" fill="white" />
        </g>
      )}
    </svg>
  );
}

// ── Carwash portal ────────────────────────────────────────────────────────────
function Portal({ washing }: { washing: boolean }) {
  const drops = Array.from({ length: 11 }, (_, i) => i);
  const bubbles = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div style={{ position: 'absolute', left: 106, top: 0, width: 160, height: '100%', pointerEvents: 'none' }}>
      {/* Water drops */}
      {washing && drops.map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: 22,
          left: 15 + i * 13,
          width: i % 3 === 0 ? 3 : 2,
          height: 14 + (i % 3) * 4,
          borderRadius: 3,
          background: `rgba(${80 + i * 6}, ${170 + i * 3}, 255, 0.7)`,
          animation: `afw-drop ${0.38 + (i % 4) * 0.05}s ease-in ${i * 0.055}s infinite`,
        }} />
      ))}

      {/* Rising foam bubbles */}
      {washing && bubbles.map(i => (
        <div key={i} style={{
          position: 'absolute',
          bottom: 12 + (i % 4) * 12,
          left: 18 + i * 19,
          width: 6 + (i % 3) * 5,
          height: 6 + (i % 3) * 5,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.3)',
          animation: `afw-bubble ${0.75 + i * 0.08}s ease-out ${i * 0.12}s infinite`,
        }} />
      ))}

      {/* Portal frame SVG — rendered on top of water/bubbles */}
      <svg viewBox="0 0 160 110" width="160" height="110"
        style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Top bar */}
        <rect x="0" y="0" width="160" height="22" rx="4"
          fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <text x="80" y="15" textAnchor="middle" fill="rgba(255,255,255,0.9)"
          fontSize="7.5" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="2.8">
          CAR WASH
        </text>

        {/* Left pillar */}
        <rect x="0" y="22" width="13" height="88" rx="3"
          fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        {/* Right pillar */}
        <rect x="147" y="22" width="13" height="88" rx="3"
          fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />

        {/* Spinning brushes */}
        {washing && (
          <>
            <g style={{ transformOrigin: '13px 65px', animation: 'afw-spin 0.3s linear infinite' }}>
              <circle cx="13" cy="65" r="17"
                fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.5)"
                strokeWidth="3.5" strokeDasharray="7 5" />
            </g>
            <g style={{ transformOrigin: '147px 65px', animation: 'afw-spin 0.3s linear infinite reverse' }}>
              <circle cx="147" cy="65" r="17"
                fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.5)"
                strokeWidth="3.5" strokeDasharray="7 5" />
            </g>
          </>
        )}

        {/* Glow when washing */}
        {washing && (
          <rect x="13" y="22" width="134" height="88"
            fill="url(#washGlow)" opacity="0.2" />
        )}
        <defs>
          <linearGradient id="washGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Sparkle stars after wash ──────────────────────────────────────────────────
function Sparkles() {
  const pts = [
    { x: -18, y: -12, d: 0,    s: 14 },
    { x:  10, y: -20, d: 0.08, s: 10 },
    { x:  30, y: -8,  d: 0.16, s: 12 },
    { x: -5,  y: -28, d: 0.12, s: 8  },
    { x:  48, y: -15, d: 0.05, s: 11 },
  ];
  return (
    <>
      {pts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: p.y,
          left: p.x + 62,
          fontSize: p.s,
          lineHeight: 1,
          color: 'white',
          animation: `afw-spark 0.55s ease-out ${p.d}s infinite`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>✦</div>
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('enter');

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase('wash'), 1350),
      setTimeout(() => setPhase('exit'), 2850),
      setTimeout(() => setPhase('out'),  3850),
      setTimeout(onDone,                 4550),
    ];
    return () => t.forEach(clearTimeout);
  }, [onDone]);

  const isWashing = phase === 'wash';
  const isClean   = phase === 'exit' || phase === 'out';

  const carX = phase === 'enter' ? 78 : phase === 'wash' ? 98 : 500;
  const carTransition =
    phase === 'enter' ? { duration: 1.35, ease: [0.22, 1, 0.36, 1] as const } :
    phase === 'wash'  ? { duration: 1.5,  ease: 'linear' as const } :
                        { duration: 1.1,  ease: [0.55, 0, 1, 0.45] as const };

  return (
    <>
      <style>{`
        @keyframes afw-drop  { 0%   { transform: translateY(-6px); opacity: .85; }
                               100% { transform: translateY(64px); opacity: 0; } }
        @keyframes afw-spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes afw-bubble{ 0%   { transform: translateY(0) scale(1); opacity: .75; }
                               100% { transform: translateY(-44px) scale(.15); opacity: 0; } }
        @keyframes afw-spark { 0%,100% { transform: scale(0) rotate(0deg);   opacity: 0; }
                               50%     { transform: scale(1) rotate(180deg);  opacity: 1; } }
        @keyframes afw-road  { 0%   { transform: translateX(0); }
                               100% { transform: translateX(-60px); } }
        @keyframes afw-steam { 0%   { transform: translateY(0)   scale(1);   opacity: .25; }
                               100% { transform: translateY(-30px) scale(2); opacity: 0; } }
      `}</style>

      <AnimatePresence>
        {phase !== 'out' && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: '#000',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Background grid shimmer */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
            }} />

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ marginBottom: 40, textAlign: 'center' }}
            >
              <div style={{ fontSize: 38, lineHeight: 1, marginBottom: 10 }}>🚗</div>
              <p style={{
                margin: 0, color: '#fff', fontSize: 24,
                fontWeight: 700, letterSpacing: '-0.5px',
                fontFamily: 'Inter, sans-serif',
              }}>AutoPayKe</p>
              <p style={{
                margin: '5px 0 0', color: 'rgba(255,255,255,0.38)',
                fontSize: 12, fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.04em',
              }}>Car Care Hub Kenya</p>
            </motion.div>

            {/* Scene */}
            <div style={{ position: 'relative', width: 380, height: 118 }}>

              {/* Scrolling road dashes */}
              <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, overflow: 'hidden', height: 4 }}>
                <div style={{
                  display: 'flex', gap: 20, width: 540,
                  animation: 'afw-road 0.28s linear infinite',
                }}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <div key={i} style={{
                      width: 40, height: 3, flexShrink: 0,
                      background: 'rgba(255,255,255,0.1)', borderRadius: 2,
                    }} />
                  ))}
                </div>
              </div>

              {/* Road surface */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
                background: 'rgba(255,255,255,0.04)', borderRadius: 2,
              }} />

              {/* Carwash portal */}
              <Portal washing={isWashing} />

              {/* Steam rising from portal exit */}
              {isWashing && [0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  bottom: 18,
                  left: 260 + i * 16,
                  width: 12 + i * 6,
                  height: 12 + i * 6,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  filter: 'blur(4px)',
                  animation: `afw-steam ${0.7 + i * 0.1}s ease-out ${i * 0.2}s infinite`,
                }} />
              ))}

              {/* Car */}
              <motion.div
                initial={{ x: -160 }}
                animate={{ x: carX }}
                transition={carTransition}
                style={{ position: 'absolute', bottom: 8, left: 0 }}
              >
                <CarSvg clean={isClean} />
                {/* Sparkles burst when clean */}
                {isClean && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <Sparkles />
                  </div>
                )}
                {/* Water mist over car during wash */}
                {isWashing && (
                  <div style={{
                    position: 'absolute', inset: '-4px -8px',
                    background: 'rgba(14,165,233,0.07)',
                    borderRadius: 8,
                    filter: 'blur(2px)',
                    animation: 'afw-steam 0.8s ease-in-out infinite alternate',
                  }} />
                )}
              </motion.div>
            </div>

            {/* Bottom tagline — fades in after wash */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: isClean ? 0.55 : 0 }}
              transition={{ duration: 0.6 }}
              style={{
                margin: '28px 0 0',
                color: 'rgba(255,255,255,0.55)',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              Your car deserves the best ✨
            </motion.p>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
