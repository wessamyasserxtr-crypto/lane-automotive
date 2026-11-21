import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, RotateCcw, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CARS,
  CURRENCY_SYMBOLS,
  formatPrice,
  type CarModel,
  type Currency,
  type Lang,
} from '../data/cars';
import { CarImage } from './CarImage';

interface ConciergeGateProps {
  open: boolean;
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  onLangChange: (lang: Lang) => void;
  onClose: () => void;
  onApplyMatches: (matchedIds: string[], topCar: CarModel, jumpToInventory: boolean) => void;
  onInspectCar: (car: CarModel, matchedIds: string[]) => void;
  onShowToast: (msg: string) => void;
}

type UsageAnswer = 'personal' | 'business';
type BodyAnswer = 'suv' | 'sedan' | 'electric' | 'any';
type BudgetAnswer = 'under1.5' | '1.5-2.5' | '2.5-4' | 'flexible';
type PriorityAnswer = 'comfort' | 'economy' | 'tech' | 'performance';

export function ConciergeGate({
  open,
  lang,
  currency,
  t,
  onLangChange,
  onClose,
  onApplyMatches,
  onInspectCar,
  onShowToast,
}: ConciergeGateProps) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [usage, setUsage] = useState<UsageAnswer | null>(null);
  const [body, setBody] = useState<BodyAnswer | null>(null);
  const [budget, setBudget] = useState<BudgetAnswer | null>(null);
  const [priority, setPriority] = useState<PriorityAnswer | null>(null);
  const [showResults, setShowResults] = useState(false);

  const isRtl = lang === 'ar';

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const rankedMatches = useMemo(() => {
    const scored = CARS.map((car) => {
      let score = 46;
      if (usage && car.idealFor.usage.includes(usage)) score += 12;
      if (body === 'any' || body === car.type) score += 22;

      if (budget === 'flexible') {
        score += 10;
      } else if (budget === 'under1.5' && car.priceEgp < 1500000) {
        score += 16;
      } else if (budget === '1.5-2.5' && car.priceEgp >= 1500000 && car.priceEgp <= 2500000) {
        score += 16;
      } else if (budget === '2.5-4' && car.priceEgp > 2500000) {
        score += 16;
      }

      if (priority && car.idealFor.priority.includes(priority)) score += 16;

      return { car, score: Math.min(99, score) };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [usage, body, budget, priority]);

  const currentAnswer = [usage, body, budget, priority][step];
  const stepNames = [t.gateStepWho, t.gateStepType, t.gateStepBudget, t.gateStepPriority];

  const handleNext = () => {
    if (!currentAnswer) {
      onShowToast(t.quizSelectPrompt);
      return;
    }
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (step > 0) setStep((s) => s - 1);
  };

  const handleReset = () => {
    setStep(0);
    setUsage(null);
    setBody(null);
    setBudget(null);
    setPriority(null);
    setShowResults(false);
  };

  const stepsMeta = [
    {
      kicker: '01 / WHO IS IT FOR?',
      title: t.q1,
      sub: t.q1sub,
      selected: usage,
      options: [
        { val: 'personal' as UsageAnswer, label: t.personal },
        { val: 'business' as UsageAnswer, label: t.business },
      ],
      onSelect: (v: UsageAnswer) => setUsage(v),
    },
    {
      kicker: '02 / BODY STYLE',
      title: t.q2,
      sub: t.q2sub,
      selected: body,
      options: [
        { val: 'suv' as BodyAnswer, label: t.suvOption },
        { val: 'sedan' as BodyAnswer, label: t.sedanOption },
        { val: 'electric' as BodyAnswer, label: t.electricOption },
        { val: 'any' as BodyAnswer, label: t.openOption },
      ],
      onSelect: (v: BodyAnswer) => setBody(v),
    },
    {
      kicker: '03 / YOUR BUDGET',
      title: t.q3,
      sub: t.q3sub,
      selected: budget,
      options: [
        { val: 'under1.5' as BudgetAnswer, label: t.gateBudgetUnder },
        { val: '1.5-2.5' as BudgetAnswer, label: t.gateBudgetMid },
        { val: '2.5-4' as BudgetAnswer, label: t.gateBudgetHigh },
        { val: 'flexible' as BudgetAnswer, label: t.bFlexible },
      ],
      onSelect: (v: BudgetAnswer) => setBudget(v),
    },
    {
      kicker: '04 / YOUR PRIORITY',
      title: t.q4,
      sub: t.q4sub,
      selected: priority,
      options: [
        { val: 'comfort' as PriorityAnswer, label: t.comfort },
        { val: 'economy' as PriorityAnswer, label: t.economy },
        { val: 'tech' as PriorityAnswer, label: t.tech },
        { val: 'performance' as PriorityAnswer, label: t.performance },
      ],
      onSelect: (v: PriorityAnswer) => setPriority(v),
    },
  ];

  const activeStep = stepsMeta[step];
  const matchedIds = rankedMatches.map((m) => m.car.id);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t.gateHeading}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 overflow-y-auto bg-[#090909]"
        >
          <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12">
            {/* Editorial Visual Side Panel */}
            <div className="relative min-h-[220px] overflow-hidden border-b border-white/10 lg:col-span-5 lg:min-h-screen lg:border-b-0 lg:border-e">
              <CarImage
                src="https://egypt.yallamotor.com/_next/image?q=75&url=https%3A%2F%2Fymimg1.b8cdn.com%2Fresized%2Fcar_model%2F11834%2Fpictures%2F13647399%2Fwebp_listing_main_Jetour-T1-2025-Exterior-2.webp&w=1920"
                alt="LANE Automotive Showroom Jetour T1"
                className="h-full w-full object-cover object-[center_58%]"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(0deg, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.52) 48%, rgba(8,8,8,0.2) 100%)',
                }}
              />

              {/* Top Brand Mark */}
              <div className="absolute top-6 ltr:left-6 rtl:right-6 sm:top-9 sm:ltr:left-9 sm:rtl:right-9">
                <span className="font-latin text-2xl font-extrabold tracking-tight text-[#f5f3ef]">
                  LANE<span className="text-[#ed1c24]">.</span>
                </span>
                <small className="mt-1 block font-latin text-[9px] font-bold tracking-[0.26em] text-[#d5d1cc]">
                  AUTOMOTIVE
                </small>
              </div>

              {/* Visual Bottom Headline & Stats */}
              <div className="absolute inset-x-6 bottom-6 max-w-md sm:inset-x-9 sm:bottom-12">
                <p className="font-latin text-[11px] font-bold tracking-[0.2em] text-[#f48387]">
                  {t.gateEyebrow}
                </p>
                <h2 className="mt-2.5 text-2xl font-bold leading-snug text-[#f5f3ef] sm:text-4xl">
                  {t.gateTitle}
                </h2>
                <p className="mt-3 hidden text-xs leading-relaxed text-[#d5d1cc] sm:block">
                  {t.gateDesc}
                </p>

                <div className="mt-6 hidden gap-8 border-t border-white/15 pt-5 sm:flex">
                  <div>
                    <strong className="block font-latin text-lg font-bold tabular-nums text-[#f5f3ef]">
                      04
                    </strong>
                    <span className="text-[11px] text-[#aaa6a1]">{t.gateStepsCount}</span>
                  </div>
                  <div>
                    <strong className="block font-latin text-lg font-bold tabular-nums text-[#f5f3ef]">
                      100%
                    </strong>
                    <span className="text-[11px] text-[#aaa6a1]">{t.gateNewOnly}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Concierge Form Panel */}
            <div className="flex items-center justify-center bg-[radial-gradient(ellipse_at_80%_12%,#271314_0%,#101010_45%,#090909_88%)] px-5 py-8 sm:px-10 lg:col-span-7 lg:py-12">
              <div className="w-full max-w-xl">
                {/* Gate Top Utility Row */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c7c2bc] underline underline-offset-4 transition-colors hover:text-white"
                  >
                    <span>{t.gateSkip}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Language"
                      value={lang}
                      onChange={(e) => onLangChange(e.target.value as Lang)}
                      className="h-9 rounded-sm border border-[#383838] bg-[#121212] px-3 text-xs text-[#f5f3ef] outline-none focus:border-[#ed1c24]"
                    >
                      <option value="ar">عربي</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="zh">中文</option>
                      <option value="de">Deutsch</option>
                    </select>

                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#383838] bg-[#121212] text-[#d5d1cc] transition-colors hover:border-[#ed1c24] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Gate Heading */}
                <div className="mt-7">
                  <span className="font-latin text-xs font-bold tracking-wider text-[#ed1c24] tabular-nums">
                    {showResults
                      ? 'LANE MATCH'
                      : `0${step + 1} / 04 · ${stepNames[step]}`}
                  </span>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#f5f3ef] sm:text-4xl">
                    {t.gateHeading}
                  </h1>
                  <p className="mt-2 text-xs leading-relaxed text-[#aaa6a1] sm:text-sm">
                    {t.gateIntro}
                  </p>
                </div>

                {/* Quiz Card */}
                <div className="mt-6 rounded-sm border border-white/15 bg-[#151515]/85 p-5 backdrop-blur-md sm:p-8">
                  {!showResults ? (
                    <>
                      {/* Progress Indicator */}
                      <div className="mb-2 flex items-center justify-between font-latin text-[11px] font-semibold tracking-wider text-[#98938e] tabular-nums">
                        <span>STEP 0{step + 1} / 04</span>
                        <span>{Math.round((step + 1) * 25)}%</span>
                      </div>
                      <div className="mb-6 grid grid-cols-4 gap-2" aria-hidden="true">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`h-1 rounded-full transition-colors ${
                              idx <= step ? 'bg-[#ed1c24]' : 'bg-[#333]'
                            }`}
                          />
                        ))}
                      </div>

                      <p className="font-latin text-[11px] font-bold tracking-wider text-[#ed1c24]">
                        {activeStep.kicker}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-[#f5f3ef]">{activeStep.title}</h3>
                      <p className="mt-1 text-xs text-[#aaa6a1]">{activeStep.sub}</p>

                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {activeStep.options.map((opt) => {
                          const isSelected = activeStep.selected === opt.val;
                          return (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => activeStep.onSelect(opt.val as never)}
                              className={`min-h-[54px] rounded-sm border px-4 py-3 text-start text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                                  : 'border-[#2f2f2f] bg-[#101010] text-[#d5d1cc] hover:border-[#ed1c24]/60 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#262626] pt-5">
                        <button
                          type="button"
                          onClick={handleBack}
                          disabled={step === 0}
                          className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#3a3a3a] px-4 text-xs font-semibold text-[#c7c2bc] transition-colors hover:border-white hover:text-white disabled:invisible"
                        >
                          {isRtl ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
                          <span>{t.quizBack}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleNext}
                          className="inline-flex h-10 items-center gap-2 rounded-sm bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff2c34]"
                        >
                          <span>{step === 3 ? t.quizShowResult : t.quizNext}</span>
                          {isRtl ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="inline-flex items-center gap-1.5 font-latin text-[11px] font-bold tracking-wider text-[#d8b789]">
                            <Sparkles className="h-3.5 w-3.5 text-[#ed1c24]" />
                            YOUR LANE MATCH
                          </span>
                          <h3 className="mt-1 text-xl font-bold text-[#f5f3ef]">
                            {t.quizResultTitle}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-[#3c3c3c] bg-[#111] px-3 text-xs text-[#d5d1cc] transition-colors hover:border-[#ed1c24] hover:text-white"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>{t.gateRetake}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onApplyMatches([], rankedMatches[0].car, true)}
                            className="h-9 rounded-sm border border-[#3c3c3c] bg-[#111] px-3 text-xs text-[#d5d1cc] transition-colors hover:border-white hover:text-white"
                          >
                            {t.gateShowAll}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                        {rankedMatches.map(({ car, score }) => (
                          <button
                            key={car.id}
                            type="button"
                            onClick={() => onInspectCar(car, matchedIds)}
                            className="flex w-full items-center gap-4 rounded-sm border border-[#2c2c2c] bg-[#101010] p-3 text-start transition-colors hover:border-[#ed1c24]"
                          >
                            <CarImage
                              src={car.img}
                              alt={car.name}
                              label={car.name}
                              className="h-16 w-24 shrink-0 rounded-sm object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <strong className="truncate font-latin text-sm font-bold text-[#f5f3ef] sm:text-base">
                                  {car.name}
                                </strong>
                                <span className="shrink-0 font-latin text-xs font-bold tabular-nums text-[#d8b789]">
                                  {score}% {t.matchLabel}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#aaa6a1]">
                                <span dir="ltr" className="font-latin font-semibold tabular-nums text-[#f5f3ef]">
                                  {formatPrice(car.priceEgp, currency, lang)}{' '}
                                  {CURRENCY_SYMBOLS[currency][lang]}
                                </span>
                                {' · '}
                                {car.quickSpecs[lang].join(' · ')}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => onApplyMatches(matchedIds, rankedMatches[0].car, true)}
                        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff2c34]"
                      >
                        <span>{t.gateEnter}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-[#7c7771]">
                  {t.gatePrivacy}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
