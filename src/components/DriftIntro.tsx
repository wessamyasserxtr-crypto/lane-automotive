import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { LangCode } from '../data/cars';
import porsche991 from '../assets/images/porsche-991-intro.jpg';

interface DriftIntroProps {
  visible: boolean;
  lang: LangCode;
  onFinish: () => void;
}

const copy = {
  ar: { skip: 'تخطي', line: 'اختار سيارتك… والباقي علينا', location: 'معرض السيارات الجديدة · الشيخ زايد' },
  en: { skip: 'Skip', line: 'Find the drive that feels like you', location: 'NEW CAR SHOWROOM · SHEIKH ZAYED' },
  fr: { skip: 'Passer', line: 'Trouvez la voiture qui vous ressemble', location: 'VÉHICULES NEUFS · SHEIKH ZAYED' },
  zh: { skip: '跳过', line: '找到属于你的驾乘体验', location: '新车展厅 · 谢赫扎耶德' },
  de: { skip: 'Überspringen', line: 'Finden Sie Ihr Fahrgefühl', location: 'NEUWAGEN · SHEIKH ZAYED' },
} as const;

export function DriftIntro({ visible, lang, onFinish }: DriftIntroProps) {
  const [settled, setSettled] = useState(false);
  const reduceMotion = useReducedMotion();
  const text = copy[lang] ?? copy.en;

  useEffect(() => {
    if (!visible) return;
    setSettled(false);
    if (reduceMotion) {
      const timer = setTimeout(onFinish, 900);
      return () => clearTimeout(timer);
    }
    const brandTimer = setTimeout(() => setSettled(true), 1900);
    const doneTimer = setTimeout(onFinish, 3500);
    return () => {
      clearTimeout(brandTimer);
      clearTimeout(doneTimer);
    };
  }, [visible, onFinish, reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.main
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.025, filter: 'blur(8px)' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#070809] text-white"
          aria-label="LANE Automotive entrance"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_57%,rgba(118,24,30,.28),transparent_45%),linear-gradient(180deg,#070809_0%,#101113_50%,#050506_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[34vh] bg-[linear-gradient(180deg,rgba(255,255,255,.06),transparent)]" />

          <button
            type="button"
            onClick={onFinish}
            className="absolute right-6 top-6 z-30 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/70 backdrop-blur-md transition hover:border-white/45 hover:text-white rtl:left-6 rtl:right-auto"
          >
            {text.skip}
          </button>

          <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 mb-[-2vh] text-center"
          >
            <div className="font-latin text-6xl font-semibold tracking-[-0.075em] sm:text-8xl">
              LANE<span className="text-[#e31d2b]">.</span>
            </div>
            <div className="mt-1 font-latin text-[10px] font-medium tracking-[0.55em] text-white/55 sm:text-xs">
              AUTOMOTIVE
            </div>
          </motion.header>

          <div className="relative z-10 mt-[-1vh] h-[49vh] min-h-[260px] w-full max-w-[1500px] overflow-hidden sm:h-[57vh]">
            {/* The source is a real Porsche 911 (991); the fading edges blend the photograph into the dark stage. */}
            <motion.div
              initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: '-112vw', y: 22, scale: 0.94, rotate: -1.4 }}
              animate={reduceMotion ? { opacity: 1, x: 0 } : {
                opacity: [0, 1, 1, 0],
                x: ['-112vw', '-4vw', '3vw', '115vw'],
                y: [22, 0, 0, -12],
                scale: [0.94, 1.02, 1.02, 0.98],
                rotate: [-1.4, 0, 0, 1.1],
              }}
              transition={reduceMotion ? { duration: 0.2 } : {
                duration: 2.9,
                times: [0, 0.42, 0.66, 1],
                ease: [0.22, 0.68, 0.2, 1],
              }}
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="relative h-full w-full max-w-[1320px]" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, black 13%, black 86%, transparent 100%)' }}>
                <img
                  src={porsche991}
                  alt="Porsche 911"
                  className="h-full w-full object-cover object-[center_59%]"
                  style={{ filter: 'brightness(.76) contrast(1.1) saturate(.8)' }}
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#08090a_0%,transparent_27%,transparent_70%,#08090a_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_48%_62%,transparent_28%,rgba(6,7,8,.78)_100%)]" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.95, 0] }}
                  transition={{ duration: 0.9, delay: 1.25, ease: 'easeOut' }}
                  className="pointer-events-none absolute bottom-[16%] left-[18%] h-1 w-[64%] rounded-full bg-[#ef2430] blur-[9px]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: settled ? 0.56 : 1, opacity: settled ? 0.45 : 0.9 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-[9%] bottom-[15%] h-px origin-center bg-gradient-to-r from-transparent via-[#d21d29] to-transparent"
            />
          </div>

          <motion.footer
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: settled ? 1 : 0.55, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative z-20 -mt-[2vh] px-6 text-center"
          >
            <p className="text-base font-medium tracking-wide text-white/90 sm:text-xl">{text.line}</p>
            <p className="mt-3 font-latin text-[9px] font-semibold tracking-[0.28em] text-white/45 sm:text-[10px]">{text.location}</p>
          </motion.footer>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
