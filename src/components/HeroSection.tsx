import { ArrowDownLeft, ArrowRight, Play, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { HeroVehicleStage } from './HeroVehicleStage';
import type { CarModel } from '../data/cars';
import type { Lang } from '../data/cars';

interface HeroSectionProps {
  lang: Lang;
  sceneActive: boolean;
  t: Record<string, string>;
  onReplayIntro: () => void;
  onOpenConcierge: () => void;
  onSelectCar: (car: CarModel) => void;
}

export function HeroSection({ lang, sceneActive, t, onReplayIntro, onOpenConcierge, onSelectCar }: HeroSectionProps) {
  const isRtl = lang === 'ar';
  const reduceMotion = useReducedMotion();
  return (
    <section
      id="home"
      className="hero-cinematic relative flex min-h-[620px] items-center overflow-hidden bg-[#090909] py-16 lg:min-h-[760px] lg:py-24"
      style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
    >
      {/* Layered showroom lighting and a rotatable, automatically advancing vehicle stage. */}
      <motion.div
        className="hero-stage-backdrop absolute inset-0 z-0"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.1 }}
      />
      <HeroVehicleStage lang={lang} active={sceneActive} onSelectCar={onSelectCar} />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-[6%]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-3 text-xs font-semibold tracking-widest text-[#f5d8d8]">
            <span className="h-[1px] w-9 bg-[#ed1c24]" aria-hidden="true" />
            <span>{t.eyebrow}</span>
          </div>

          <h1
            className="mt-6 font-bold leading-[1.08] tracking-tight text-[#f5f3ef]"
            style={{ fontSize: 'clamp(2.65rem, 6vw, 5.25rem)', textWrap: 'balance' }}
          >
            {t.heroTitleLine1}
            <span className="block text-[#ed1c24]">{t.heroTitleLine2}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#d5d1cc] sm:text-lg">
            {t.heroDesc}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <a
              href="#inventory"
              className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-[#ed1c24] px-7 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#ff2c34] hover:shadow-[0_10px_28px_rgba(237,28,36,0.35)] whitespace-nowrap"
            >
              <span>{t.heroSecondaryCta}</span>
              {isRtl ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </a>

            <button
              type="button"
              onClick={onOpenConcierge}
              className="inline-flex h-12 items-center gap-2 rounded-sm border border-white/40 bg-black/40 px-6 text-sm font-semibold text-[#f5f3ef] backdrop-blur-sm transition-colors hover:border-[#ed1c24] hover:text-white whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 text-[#ed1c24]" />
              <span>{t.heroPrimaryCta}</span>
            </button>

            <button
              type="button"
              onClick={onReplayIntro}
              className="inline-flex h-12 items-center gap-2 rounded-sm border border-[#333] bg-[#121212]/80 px-4 text-xs font-semibold text-[#d5d1cc] transition-colors hover:border-[#ed1c24] hover:text-white whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5 text-[#ed1c24]" />
              <span>{t.replayIntro}</span>
            </button>
          </div>

          {/* Proof Strip */}
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-6">
            <div>
              <strong className="block font-latin text-2xl font-bold tabular-nums text-[#f5f3ef] sm:text-3xl">
                100%
              </strong>
              <span className="mt-1 block text-xs text-[#c1bdb8]">{t.statNew}</span>
            </div>
            <div>
              <strong className="block font-latin text-2xl font-bold tabular-nums text-[#f5f3ef] sm:text-3xl">
                5
              </strong>
              <span className="mt-1 block text-xs text-[#c1bdb8]">{t.statLang}</span>
            </div>
            <div>
              <strong className="block font-latin text-2xl font-bold tabular-nums text-[#f5f3ef] sm:text-3xl">
                01
              </strong>
              <span className="mt-1 block text-xs text-[#c1bdb8]">{t.statExp}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
