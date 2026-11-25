import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { LangCode } from '../data/cars';

interface DriftIntroProps {
  visible: boolean;
  lang: LangCode;
  onFinish: () => void;
}

export function DriftIntro({ visible, lang, onFinish }: DriftIntroProps) {
  const [phase, setPhase] = useState<'drift' | 'brand'>('drift');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!visible) return;
    setPhase('drift');

    if (reduceMotion) {
      const quickTimer = setTimeout(onFinish, 450);
      return () => clearTimeout(quickTimer);
    }

    const brandTimer = setTimeout(() => setPhase('brand'), 1900);
    const doneTimer = setTimeout(onFinish, 3300);

    return () => {
      clearTimeout(brandTimer);
      clearTimeout(doneTimer);
    };
  }, [visible, onFinish, reduceMotion]);

  const skipLabel =
    lang === 'ar'
      ? 'تخطي'
      : lang === 'fr'
        ? 'Passer'
        : lang === 'zh'
          ? '跳过'
          : lang === 'de'
            ? 'Überspringen'
            : 'Skip';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#060607]"
          aria-label="LANE Automotive Entrance"
        >
          {/* Deep obsidian studio lighting */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 56%, rgba(237,28,36,0.16) 0%, rgba(18,10,11,0.5) 36%, #060607 74%)',
            }}
          />

          {/* Precision architectural light lines */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[20%] inset-x-0 h-[1px] origin-left bg-gradient-to-r from-transparent via-[#ed1c24]/75 to-transparent"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[20%] inset-x-0 h-[1px] origin-right bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />

          {/* Skip Button */}
          <button
            type="button"
            onClick={onFinish}
            className="absolute top-6 z-20 rounded-sm border border-white/20 bg-black/50 px-4 py-1.5 text-xs font-medium text-[#d5d1cc] backdrop-blur-sm transition-colors hover:border-[#ed1c24] hover:text-white ltr:right-6 rtl:left-6"
          >
            {skipLabel}
          </button>

          {/* Luxury Brand Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="relative z-10 mb-6 text-center"
          >
            <div className="font-latin text-5xl font-extrabold tracking-tight text-[#f5f3ef] sm:text-7xl">
              LANE<span className="text-[#ed1c24]">.</span>
            </div>
            <div className="mt-2 font-latin text-[11px] font-semibold tracking-[0.48em] text-[#b9b4ae]">
              AUTOMOTIVE
            </div>
          </motion.div>

          {/* Sleek Motion & Drift Light-Trail Stage */}
          <div className="intro-road-stage relative h-36 w-full max-w-4xl overflow-hidden sm:h-48">
            <motion.div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#ed1c24]/70 to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: phase === 'brand' ? 0.7 : 1, opacity: phase === 'brand' ? 0.25 : 1 }}
              transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
              aria-hidden="true"
            />
            {/* Subtle asphalt reflection line */}
            <div className="absolute inset-x-0 bottom-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Curved precision drift trail */}
            <svg
              viewBox="0 0 1000 220"
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="tailTrail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ed1c24" stopOpacity="0" />
                  <stop offset="65%" stopColor="#ed1c24" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <motion.path
                d="M -60 164 Q 260 160 470 142 T 680 148 T 1060 128"
                fill="none"
                stroke="#18181a"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 1.35, delay: 0.25, ease: 'easeOut' }}
              />
              <motion.path
                d="M -60 174 Q 270 168 480 150 T 690 156 T 1060 136"
                fill="none"
                stroke="url(#tailTrail)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.3, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>

            {/* Atmospheric mist / tire haze */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5, x: '24vw', y: 105 }}
                animate={{
                  opacity: [0, 0.28, 0.14, 0],
                  scale: [0.6, 1.5, 2.2, 2.8],
                  x: [`${28 + i * 8}vw`, `${22 + i * 7}vw`],
                  y: [110, 88 - i * 5],
                }}
                transition={{
                  duration: 1.25,
                  delay: 0.45 + i * 0.14,
                  ease: 'easeOut',
                }}
                className="pointer-events-none absolute h-14 w-28 rounded-full bg-gradient-to-tr from-[#3a3a3d]/35 via-[#d8d4cf]/20 to-transparent blur-2xl"
              />
            ))}

            {/* Sleek Metallic GT Silhouette (Sculpted Automotive Concept Lines, No Cartoon Outlines) */}
            <motion.div
              initial={{ x: '-35vw', y: 34, rotate: 0, scale: 0.92 }}
              animate={{
                x: ['-35vw', '30vw', '37vw', '128vw'],
                y: [34, 28, 32, 20],
                rotate: [0, -6, -9, 1],
                scale: [0.92, 1.02, 1.04, 0.96],
              }}
              transition={{
                duration: 2.1,
                times: [0, 0.44, 0.66, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              className="hidden"
            >
              <svg viewBox="0 0 640 180" className="w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.95)]">
                <defs>
                  <linearGradient id="gtSilver" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f5f3ef" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#7c838a" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#141619" stopOpacity="0.98" />
                  </linearGradient>
                  <linearGradient id="gtGlass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#465863" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#090b0d" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fff7df" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#fff7df" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Volumetric Headlight Cone */}
                <polygon points="560,104 640,84 640,134 560,114" fill="url(#beam)" />

                {/* Studio Floor Reflection */}
                <ellipse cx="315" cy="148" rx="250" ry="12" fill="#000000" fillOpacity="0.8" />

                {/* Sculpted Fastback Body */}
                <path
                  d="M46 122 L66 94 Q80 80 112 75 L212 46 Q256 36 308 36 H376 Q418 36 452 60 L506 94 L562 104 Q584 109 586 124 L582 134 H44 V125 Z"
                  fill="url(#gtSilver)"
                />

                {/* Top Light Rim */}
                <path
                  d="M114 75 L214 47 Q256 37 308 37 H375 Q416 37 450 61 L504 94"
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.55"
                  strokeWidth="1.4"
                />

                {/* Sleek Greenhouse Glass */}
                <path
                  d="M202 52 L268 41 H364 Q396 41 422 60 L460 90 H164 Z"
                  fill="url(#gtGlass)"
                />

                {/* Character Beltline */}
                <path
                  d="M84 106 Q260 96 520 108"
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.22"
                  strokeWidth="1.2"
                />

                {/* Crimson LED Tail Blade & Brake Glow */}
                <path d="M50 98 L82 95" stroke="#ed1c24" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M540 106 L574 111" stroke="#fff9e2" strokeWidth="3" strokeLinecap="round" />

                {/* Precision Alloy Wheels */}
                <motion.g
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 0.42, repeat: 4, ease: 'linear' }}
                  style={{ transformBox: 'view-box', transformOrigin: '158px 133px' }}
                >
                  <circle cx="158" cy="133" r="28" fill="#08090b" stroke="#52565c" strokeWidth="2" />
                  <circle cx="158" cy="133" r="17" fill="#17191d" stroke="#a6abb2" strokeWidth="1.4" />
                  <path d="M158 117v32 M142 133h32 M147 122l22 22 M169 122l-22 22" stroke="#c4c8cd" strokeOpacity=".72" strokeWidth="2" />
                  <circle cx="158" cy="133" r="5" fill="#ed1c24" />
                </motion.g>
                <motion.g
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 0.42, repeat: 4, ease: 'linear' }}
                  style={{ transformBox: 'view-box', transformOrigin: '468px 133px' }}
                >
                  <circle cx="468" cy="133" r="28" fill="#08090b" stroke="#52565c" strokeWidth="2" />
                  <circle cx="468" cy="133" r="17" fill="#17191d" stroke="#a6abb2" strokeWidth="1.4" />
                  <path d="M468 117v32 M452 133h32 M457 122l22 22 M479 122l-22 22" stroke="#c4c8cd" strokeOpacity=".72" strokeWidth="2" />
                  <circle cx="468" cy="133" r="5" fill="#ed1c24" />
                </motion.g>
              </svg>
            </motion.div>
          </div>

          {/* Bottom Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: phase === 'brand' ? 1 : 0.65, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 mt-4 text-center"
          >
            <p className="font-latin text-xs font-bold tracking-[0.38em] text-[#ed1c24]">
              FIND YOUR ROAD
            </p>
            <p className="mt-2 text-xs text-[#9c9790]">
              {lang === 'ar'
                ? 'معرض السيارات الجديدة — الشيخ زايد'
                : 'NEW CAR SHOWROOM — SHEIKH ZAYED'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
