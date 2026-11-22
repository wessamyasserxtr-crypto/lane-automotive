import { useEffect, useState } from 'react';
import { HERO_IMAGE_URL, type CarModel, type LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import { formatPriceWithSymbol, matchCarsForQuiz, type QuizAnswers } from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface QuizGateProps {
  open: boolean;
  cars: CarModel[];
  t: TranslationPack;
  lang: LangCode;
  currency: 'EGP' | 'USD' | 'EUR' | 'GBP' | 'CNY';
  onLangChange: (lang: LangCode) => void;
  onComplete: (recommendedCarId?: string) => void;
  onSkip: () => void;
}

export function QuizGate({
  open,
  cars,
  t,
  lang,
  currency,
  onLangChange,
  onComplete,
  onSkip,
}: QuizGateProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResult, setShowResult] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const stepKeys: (keyof QuizAnswers)[] = ['who', 'type', 'budget', 'priority'];
  const matches = matchCarsForQuiz(cars, answers);

  const selectAnswer = (key: keyof QuizAnswers, val: string) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
    setValidationMsg(null);
  };

  const handleNext = () => {
    const key = stepKeys[step];
    if (!answers[key]) {
      setValidationMsg(t.gateValidation);
      return;
    }
    setValidationMsg(null);
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    setValidationMsg(null);
    if (showResult) {
      setShowResult(false);
      return;
    }
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
    setValidationMsg(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.gateHeading}
      className="fixed inset-0 z-50 grid overflow-y-auto bg-[radial-gradient(ellipse_at_76%_12%,#2a1718_0%,#111_42%,#090909_82%)] lg:grid-cols-[0.88fr_1.12fr]"
    >
      {/* Visual side panel */}
      <div className="relative min-h-[200px] overflow-hidden border-b border-white/10 lg:min-h-screen lg:border-b-0 lg:border-e">
        <img
          src={HERO_IMAGE_URL}
          alt="LANE Automotive Showroom"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/65 to-[#080808]/30" />
        <div className="font-latin relative z-10 flex h-full flex-col justify-between p-6 lg:p-12">
          <div dir="ltr" className="w-fit text-2xl font-extrabold tracking-tighter text-[#f5f3ef]">
            LANE<span className="text-[#ed1c24]">.</span>
            <span className="mt-1 block text-[10px] font-semibold tracking-[0.26em] text-[#d1d1d1]">
              AUTOMOTIVE
            </span>
          </div>

          <div className="max-w-lg py-4 lg:py-8">
            <p className="font-latin text-[11px] font-bold tracking-[0.2em] text-[#ff7c80]">
              {t.gateEyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-snug text-[#f5f3ef] lg:text-5xl">
              {t.gateTitle}
            </h2>
            <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-[#dedbd6] lg:block">
              {t.gateDesc}
            </p>
            <div className="mt-6 hidden gap-8 lg:flex">
              <div>
                <strong className="font-latin tabular-nums block text-xl font-bold text-[#f5f3ef]">
                  04
                </strong>
                <span className="text-xs text-[#aaa6a1]">{t.gateStepsLabel}</span>
              </div>
              <div>
                <strong className="font-latin tabular-nums block text-xl font-bold text-[#f5f3ef]">
                  100%
                </strong>
                <span className="text-xs text-[#aaa6a1]">{t.gateNewLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quiz Panel */}
      <div className="flex items-center justify-center p-5 sm:p-8 lg:p-14">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-[#c5c0ba] underline underline-offset-4 transition-colors hover:text-white"
            >
              {t.gateSkip}
            </button>

            <select
              aria-label="Gate Language"
              value={lang}
              onChange={(e) => onLangChange(e.target.value as LangCode)}
              className="h-9 rounded-sm border border-[#393939] bg-[#111111] px-3 text-xs text-[#f5f3ef]"
            >
              <option value="ar">عربي</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="zh">中文</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div className="mb-6">
            <p className="font-latin text-xs font-bold tracking-[0.14em] text-[#ed1c24]">
              {showResult
                ? t.resultKicker
                : `0${step + 1} / 04 · ${t.stepNames[step]}`}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#f5f3ef] sm:text-4xl">
              {t.gateHeading}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[#a9a39d] sm:text-sm">
              {t.gateIntro}
            </p>
          </div>

          <div className="border border-white/12 bg-[#151515]/90 p-6 backdrop-blur-md sm:p-8">
            {!showResult && (
              <>
                <div className="mb-2 flex justify-between text-[11px] font-semibold tracking-wider text-[#98938e]">
                  <span className="font-latin tabular-nums">
                    STEP 0{step + 1} / 04
                  </span>
                  <span className="font-latin tabular-nums">{(step + 1) * 25}%</span>
                </div>
                <div className="mb-7 flex gap-1.5">
                  {[0, 1, 2, 3].map((idx) => (
                    <span
                      key={idx}
                      className={`h-0.5 flex-1 transition-colors ${
                        idx <= step ? 'bg-[#ed1c24]' : 'bg-[#3f3f3f]'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {!showResult && step === 0 && (
              <div>
                <h3 className="text-xl font-bold text-[#f5f3ef]">{t.q1}</h3>
                <p className="mt-1.5 mb-5 text-xs text-[#a9a39d]">{t.q1sub}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { val: 'personal', label: t.personal },
                    { val: 'business', label: t.business },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => selectAnswer('who', opt.val)}
                      className={`min-h-[56px] border px-4 py-3 text-start text-sm transition-colors ${
                        answers.who === opt.val
                          ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                          : 'border-[#333] bg-[#111] text-[#dedbd6] hover:border-[#ed1c24]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showResult && step === 1 && (
              <div>
                <h3 className="text-xl font-bold text-[#f5f3ef]">{t.q2}</h3>
                <p className="mt-1.5 mb-5 text-xs text-[#a9a39d]">{t.q2sub}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { val: 'suv', label: t.suvOpt },
                    { val: 'sedan', label: t.sedanOpt },
                    { val: 'electric', label: t.electricOpt },
                    { val: 'any', label: t.openOpt },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => selectAnswer('type', opt.val)}
                      className={`min-h-[56px] border px-4 py-3 text-start text-sm transition-colors ${
                        answers.type === opt.val
                          ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                          : 'border-[#333] bg-[#111] text-[#dedbd6] hover:border-[#ed1c24]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showResult && step === 2 && (
              <div>
                <h3 className="text-xl font-bold text-[#f5f3ef]">{t.q3}</h3>
                <p className="mt-1.5 mb-5 text-xs text-[#a9a39d]">{t.q3sub}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { val: 'under1.5', label: t.under15 },
                    { val: '1.5-2.5', label: t.mid1525 },
                    { val: '2.5-4', label: t.high2540 },
                    { val: 'flexible', label: t.flexibleOpt },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => selectAnswer('budget', opt.val)}
                      className={`min-h-[56px] border px-4 py-3 text-start text-sm transition-colors ${
                        answers.budget === opt.val
                          ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                          : 'border-[#333] bg-[#111] text-[#dedbd6] hover:border-[#ed1c24]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showResult && step === 3 && (
              <div>
                <h3 className="text-xl font-bold text-[#f5f3ef]">{t.q4}</h3>
                <p className="mt-1.5 mb-5 text-xs text-[#a9a39d]">{t.q4sub}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { val: 'comfort', label: t.comfortOpt },
                    { val: 'economy', label: t.economyOpt },
                    { val: 'tech', label: t.techOpt },
                    { val: 'performance', label: t.performanceOpt },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => selectAnswer('priority', opt.val)}
                      className={`min-h-[56px] border px-4 py-3 text-start text-sm transition-colors ${
                        answers.priority === opt.val
                          ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                          : 'border-[#333] bg-[#111] text-[#dedbd6] hover:border-[#ed1c24]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showResult && (
              <div>
                <h3 className="text-xl font-bold text-[#f5f3ef]">{t.resultTitle}</h3>
                <p className="mt-1 mb-4 text-xs text-[#aaa6a1]">{t.gateResultLead}</p>
                <div className="max-h-[42vh] space-y-2.5 overflow-y-auto pe-1">
                  {matches.map((car) => (
                    <div
                      key={car.id}
                      className="flex items-center gap-4 border border-[#292929] bg-[#101010] p-3"
                    >
                      <CarVisual
                        car={car}
                        src={car.img}
                        alt={car.name}
                        className="h-16 w-24 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-[#f5f3ef]">
                          {car.name}
                        </div>
                        <div
                          dir="ltr"
                          className="font-latin tabular-nums mt-1 text-xs font-semibold text-[#d8b789]"
                        >
                          {formatPriceWithSymbol(car.priceEgp, currency, lang)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="border border-[#454545] bg-[#111] px-4 py-2.5 text-xs text-[#ddd] hover:border-white"
                  >
                    {t.gateRetake}
                  </button>
                  <button
                    type="button"
                    onClick={onSkip}
                    className="border border-[#454545] bg-[#111] px-4 py-2.5 text-xs text-[#ddd] hover:border-white"
                  >
                    {t.gateShowAll}
                  </button>
                </div>
              </div>
            )}

            {validationMsg && (
              <p role="alert" className="mt-4 text-xs font-medium text-[#ff7c80]">
                {validationMsg}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              {!showResult ? (
                <>
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={step === 0}
                    className={`border border-[#444] px-5 py-2.5 text-xs text-[#bbb] transition-opacity ${
                      step === 0 ? 'pointer-events-none opacity-0' : 'hover:border-white hover:text-white'
                    }`}
                  >
                    {t.back}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#ed1c24] px-6 py-3 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
                  >
                    {step === 3 ? t.finishQuiz : t.next}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onComplete(matches[0]?.id)}
                  className="flex h-12 w-full items-center justify-center bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
                >
                  {t.gateEnter}
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-[#7c7772]">{t.gatePrivacy}</p>
        </div>
      </div>
    </div>
  );
}
