import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { CARS, CURRENCY_SYMBOLS, formatPrice, type CarModel, type Currency, type Lang } from '../data/cars';
import { CarImage } from './CarImage';

interface QuizSectionProps {
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  onSelectCar: (car: CarModel) => void;
  onMatchesComputed: (matchedIds: string[], topCar: CarModel) => void;
  onShowToast: (msg: string) => void;
}

type UsageAnswer = 'personal' | 'business';
type BodyAnswer = 'suv' | 'sedan' | 'electric' | 'any';
type BudgetAnswer = 'under1.3' | '1.3-1.8' | 'above1.8' | 'flexible';
type PriorityAnswer = 'comfort' | 'economy' | 'tech' | 'performance';

export function QuizSection({
  lang,
  currency,
  t,
  onSelectCar,
  onMatchesComputed,
  onShowToast,
}: QuizSectionProps) {
  const [step, setStep] = useState(0);
  const [usage, setUsage] = useState<UsageAnswer | null>(null);
  const [body, setBody] = useState<BodyAnswer | null>(null);
  const [budget, setBudget] = useState<BudgetAnswer | null>(null);
  const [priority, setPriority] = useState<PriorityAnswer | null>(null);
  const [showResults, setShowResults] = useState(false);

  const isRtl = lang === 'ar';

  const currentAnswer = [usage, body, budget, priority][step];

  const handleNext = () => {
    if (!currentAnswer) {
      onShowToast(t.quizSelectPrompt);
      return;
    }
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      setShowResults(true);
      onMatchesComputed(
        rankedCars.map((r) => r.car.id),
        rankedCars[0].car
      );
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

  // Multi-factor compatibility scoring
  const rankedCars = CARS.map((car) => {
    let score = 45;
    if (usage && car.idealFor.usage.includes(usage)) score += 12;
    if (body === 'any' || body === car.type) score += 22;
    if (budget === 'flexible') {
      score += 10;
    } else if (budget === 'under1.3' && car.priceEgp <= 1300000) {
      score += 15;
    } else if (budget === '1.3-1.8' && car.priceEgp > 1300000 && car.priceEgp <= 1850000) {
      score += 15;
    } else if (budget === 'above1.8' && car.priceEgp > 1800000) {
      score += 15;
    }
    if (priority && car.idealFor.priority.includes(priority)) score += 16;

    return {
      car,
      score: Math.min(99, score),
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const stepsMeta = [
    {
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
      title: t.q3,
      sub: t.q3sub,
      selected: budget,
      options: [
        { val: 'under1.3' as BudgetAnswer, label: t.b1 },
        { val: '1.3-1.8' as BudgetAnswer, label: t.b2 },
        { val: 'above1.8' as BudgetAnswer, label: t.b3 },
        { val: 'flexible' as BudgetAnswer, label: t.bFlexible },
      ],
      onSelect: (v: BudgetAnswer) => setBudget(v),
    },
    {
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

  return (
    <section id="quiz" className="border-y border-[#222] bg-[#111111] py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-5 sm:px-[6%] lg:grid-cols-12">
        {/* Left / Start Lead Copy */}
        <div className="lg:col-span-5">
          <p className="font-latin text-xs font-semibold tracking-wider text-[#ed1c24]">
            {t.quizKicker}
          </p>
          <h2
            className="mt-3 font-bold leading-tight tracking-tight text-[#f5f3ef]"
            style={{ fontSize: 'clamp(1.9rem, 3.6vw, 3.1rem)', textWrap: 'balance' }}
          >
            {t.quizTitle}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#aaa6a1]">{t.quizDesc}</p>
        </div>

        {/* Interactive Quiz Card */}
        <div className="lg:col-span-7">
          <div className="rounded-sm border border-[#2c2c2c] bg-[#171717] p-6 sm:p-9">
            {/* Step Progress Bars */}
            {!showResults && (
              <div className="mb-7 grid grid-cols-4 gap-2" aria-hidden="true">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-colors ${
                      idx <= step ? 'bg-[#ed1c24]' : 'bg-[#333333]'
                    }`}
                  />
                ))}
              </div>
            )}

            {!showResults ? (
              <div>
                <div className="font-latin text-xs font-bold tracking-wider text-[#ed1c24] tabular-nums">
                  {t.stepLabel} 0{step + 1} / 04
                </div>
                <h3 className="mt-2 text-xl font-bold text-[#f5f3ef] sm:text-2xl">
                  {activeStep.title}
                </h3>
                <p className="mt-1.5 text-xs text-[#aaa6a1]">{activeStep.sub}</p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeStep.options.map((opt) => {
                    const isSelected = activeStep.selected === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => activeStep.onSelect(opt.val as never)}
                        className={`min-h-[56px] rounded-sm border px-4 py-3 text-start text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                            : 'border-[#2e2e2e] bg-[#111111] text-[#d5d1cc] hover:border-[#ed1c24]/60 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#262626] pt-5">
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
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-latin text-xs font-bold tracking-wider text-[#ed1c24]">
                      LANE MATCH
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-[#f5f3ef]">{t.quizResultTitle}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-[#383838] px-3 text-xs font-medium text-[#d5d1cc] transition-colors hover:border-[#ed1c24] hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{t.quizRetake}</span>
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {rankedCars.map(({ car, score }) => (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => onSelectCar(car)}
                      className="flex w-full items-center gap-4 rounded-sm border border-[#2a2a2a] bg-[#111111] p-3 text-start transition-colors hover:border-[#ed1c24]"
                    >
                      <CarImage
                        src={car.img}
                        alt={car.name}
                        label={car.name}
                        className="h-16 w-24 shrink-0 rounded-sm object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="truncate font-latin text-base font-bold text-[#f5f3ef]">
                            {car.name}
                          </strong>
                          <span className="font-latin text-xs font-bold tabular-nums text-[#d8b789] shrink-0">
                            {score}% {t.matchLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#aaa6a1]">
                          <span dir="ltr" className="font-latin font-semibold tabular-nums text-[#f5f3ef]">
                            {formatPrice(car.priceEgp, currency, lang)} {CURRENCY_SYMBOLS[currency][lang]}
                          </span>
                          {' · '}
                          {car.quickSpecs[lang].join(' · ')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#262626] pt-5">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="h-10 rounded-sm border border-[#383838] px-4 text-xs font-semibold text-[#c7c2bc] hover:border-white hover:text-white"
                  >
                    {t.quizBack}
                  </button>

                  <a
                    href={`https://wa.me/201274555677?text=${encodeURIComponent(
                      `LANE Match: ${rankedCars.map((r) => r.car.name).join(', ')}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-sm bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff2c34]"
                  >
                    {t.talkAdvisor}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
