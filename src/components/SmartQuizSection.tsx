import { useState } from 'react';
import type { CarModel, CurrencyCode, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import type { ShowroomSettings } from '../data/store';
import {
  formatPriceWithSymbol,
  matchCarsForQuiz,
  type QuizAnswers,
} from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface SmartQuizSectionProps {
  cars: CarModel[];
  settings: ShowroomSettings;
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  onSelectRecommended: (carId: string) => void;
  onOpenCar: (car: CarModel) => void;
}

export function SmartQuizSection({
  cars,
  settings,
  t,
  lang,
  currency,
  onSelectRecommended,
  onOpenCar,
}: SmartQuizSectionProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResult, setShowResult] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  const stepKeys: (keyof QuizAnswers)[] = ['who', 'type', 'budget', 'priority'];
  const matches = matchCarsForQuiz(cars, answers);

  const choose = (key: keyof QuizAnswers, val: string) => {
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
      const top = matchCarsForQuiz(cars, answers)[0];
      if (top) onSelectRecommended(top.id);
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
    <section
      id="quiz"
      className="border-t border-[#1e1e1e] bg-[#111111] py-20 px-[6%] lg:px-[8%]"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
            {t.quizKicker}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-[#f5f3ef] sm:text-5xl">
            {t.quizTitleLine1}
            <br />
            {t.quizTitleLine2}
          </h2>
          <p className="mt-5 max-w-md text-xs leading-loose text-[#aaa6a1] sm:text-sm">
            {t.quizDesc}
          </p>
        </div>

        <div className="border border-[#323232] bg-[#191919] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:p-9">
          <div className="mb-7 flex gap-1.5">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`h-0.5 flex-1 transition-colors ${
                  showResult || idx <= step ? 'bg-[#ed1c24]' : 'bg-[#444]'
                }`}
              />
            ))}
          </div>

          {!showResult && step === 0 && (
            <div>
              <span className="font-latin tabular-nums text-[11px] font-bold tracking-[0.14em] text-[#ed1c24]">
                STEP 01 / 04
              </span>
              <h3 className="mt-2 text-2xl font-bold text-[#f5f3ef]">{t.q1}</h3>
              <p className="mt-1.5 mb-6 text-xs text-[#a9a39d]">{t.q1sub}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { val: 'personal', label: t.personal },
                  { val: 'business', label: t.business },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => choose('who', opt.val)}
                    className={`min-h-[58px] border px-4 py-3 text-start text-xs font-medium transition-colors sm:text-sm ${
                      answers.who === opt.val
                        ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                        : 'border-[#333] bg-[#111] text-[#e5e2dd] hover:border-[#ed1c24]/70'
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
              <span className="font-latin tabular-nums text-[11px] font-bold tracking-[0.14em] text-[#ed1c24]">
                STEP 02 / 04
              </span>
              <h3 className="mt-2 text-2xl font-bold text-[#f5f3ef]">{t.q2}</h3>
              <p className="mt-1.5 mb-6 text-xs text-[#a9a39d]">{t.q2sub}</p>
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
                    onClick={() => choose('type', opt.val)}
                    className={`min-h-[58px] border px-4 py-3 text-start text-xs font-medium transition-colors sm:text-sm ${
                      answers.type === opt.val
                        ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                        : 'border-[#333] bg-[#111] text-[#e5e2dd] hover:border-[#ed1c24]/70'
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
              <span className="font-latin tabular-nums text-[11px] font-bold tracking-[0.14em] text-[#ed1c24]">
                STEP 03 / 04
              </span>
              <h3 className="mt-2 text-2xl font-bold text-[#f5f3ef]">{t.q3}</h3>
              <p className="mt-1.5 mb-6 text-xs text-[#a9a39d]">{t.q3sub}</p>
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
                    onClick={() => choose('budget', opt.val)}
                    className={`min-h-[58px] border px-4 py-3 text-start text-xs font-medium transition-colors sm:text-sm ${
                      answers.budget === opt.val
                        ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                        : 'border-[#333] bg-[#111] text-[#e5e2dd] hover:border-[#ed1c24]/70'
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
              <span className="font-latin tabular-nums text-[11px] font-bold tracking-[0.14em] text-[#ed1c24]">
                STEP 04 / 04
              </span>
              <h3 className="mt-2 text-2xl font-bold text-[#f5f3ef]">{t.q4}</h3>
              <p className="mt-1.5 mb-6 text-xs text-[#a9a39d]">{t.q4sub}</p>
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
                    onClick={() => choose('priority', opt.val)}
                    className={`min-h-[58px] border px-4 py-3 text-start text-xs font-medium transition-colors sm:text-sm ${
                      answers.priority === opt.val
                        ? 'border-[#ed1c24] bg-[#2a1214] text-white'
                        : 'border-[#333] bg-[#111] text-[#e5e2dd] hover:border-[#ed1c24]/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showResult && (
            <div data-testid="quiz-results">
              <span className="font-latin text-[11px] font-bold tracking-[0.14em] text-[#ed1c24]">
                {t.resultKicker}
              </span>
              <h3 className="mt-2 text-2xl font-bold text-[#f5f3ef]">{t.resultTitle}</h3>

              <div className="mt-4 space-y-3">
                {matches.map((car) => (
                  <div
                    key={car.id}
                    className="flex flex-wrap items-center justify-between gap-4 border border-[#2d2d2d] bg-[#101010] p-3"
                  >
                    <div className="flex items-center gap-4">
                      <CarVisual
                        car={car}
                        src={car.img}
                        alt={car.name}
                        className="h-16 w-24 shrink-0"
                      />
                      <div>
                        <strong className="block text-sm font-bold text-[#f5f3ef]">
                          {car.name}
                        </strong>
                        <span
                          dir="ltr"
                          className="font-latin tabular-nums mt-1 inline-block text-xs text-[#d8b789]"
                        >
                          {formatPriceWithSymbol(car.priceEgp, currency, lang)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCar(car)}
                      className="h-9 border border-[#444] px-3.5 text-xs font-medium text-[#f5f3ef] hover:border-[#ed1c24] hover:text-[#ff9ea2]"
                    >
                      {t.viewCar}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${settings.whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center bg-[#ed1c24] px-5 text-xs font-bold text-white hover:bg-[#ff3037]"
                >
                  {t.talkAdvisor}
                </a>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="h-10 border border-[#444] px-4 text-xs text-[#ccc] hover:border-white hover:text-white"
                >
                  {t.retakeQuiz}
                </button>
              </div>
            </div>
          )}

          {validationMsg && (
            <p role="alert" className="mt-4 text-xs font-medium text-[#ff7c80]">
              {validationMsg}
            </p>
          )}

          {!showResult && (
            <div className="mt-7 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 0}
                className={`h-10 border border-[#444] px-5 text-xs text-[#bbb] transition-opacity ${
                  step === 0 ? 'pointer-events-none opacity-0' : 'hover:border-white hover:text-white'
                }`}
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="h-10 bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
              >
                {step === 3 ? t.finishQuiz : t.next}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
