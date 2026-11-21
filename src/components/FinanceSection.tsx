import { useMemo } from 'react';
import { Calculator, MessageCircle } from 'lucide-react';
import { CARS, CURRENCY_SYMBOLS, formatPrice, type Currency, type Lang } from '../data/cars';

interface FinanceSectionProps {
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  selectedCarId: string;
  downPaymentPct: number;
  months: number;
  annualRatePct: number;
  onCarChange: (carId: string) => void;
  onDownPaymentChange: (pct: number) => void;
  onMonthsChange: (months: number) => void;
  onRateChange: (rate: number) => void;
}

export function FinanceSection({
  lang,
  currency,
  t,
  selectedCarId,
  downPaymentPct,
  months,
  annualRatePct,
  onCarChange,
  onDownPaymentChange,
  onMonthsChange,
  onRateChange,
}: FinanceSectionProps) {
  const selectedCar = useMemo(
    () => CARS.find((c) => c.id === selectedCarId) || CARS[0],
    [selectedCarId]
  );

  // Standard flat/declining blended illustrative auto loan calculation
  const calculation = useMemo(() => {
    const price = selectedCar.priceEgp;
    const downAmount = Math.round((price * downPaymentPct) / 100);
    const financed = price - downAmount;
    const years = months / 12;
    const totalInterest = Math.round(financed * (annualRatePct / 100) * years);
    const totalRepayable = financed + totalInterest;
    const monthlyPayment = Math.round(totalRepayable / months);
    return {
      price,
      downAmount,
      financed,
      totalInterest,
      monthlyPayment,
    };
  }, [selectedCar, downPaymentPct, months, annualRatePct]);

  const sym = CURRENCY_SYMBOLS[currency][lang];
  const whatsappText = encodeURIComponent(
    `LANE Financing Inquiry — ${selectedCar.name}: Down Payment ${downPaymentPct}% (${formatPrice(
      calculation.downAmount,
      currency,
      lang
    )} ${sym}), ${months} months, Est. Monthly: ${formatPrice(
      calculation.monthlyPayment,
      currency,
      lang
    )} ${sym}`
  );

  const tenureOptions = [12, 24, 36, 48, 60, 72];

  return (
    <section id="finance" className="bg-[#0d0d0d] py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-[6%]">
        <div className="flex flex-col justify-between gap-6 border-b border-[#242424] pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-latin text-xs font-semibold tracking-wider text-[#ed1c24]">
              {t.financeKicker}
            </p>
            <h2
              className="mt-2 font-bold tracking-tight text-[#f5f3ef]"
              style={{ fontSize: 'clamp(1.85rem, 3.6vw, 3.1rem)', textWrap: 'balance' }}
            >
              {t.financeTitle}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#aaa6a1]">{t.financeDesc}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Controls Column */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#141414] p-6 sm:p-8 lg:col-span-7">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="finance-car" className="block text-xs font-semibold text-[#d5d1cc]">
                  {t.calcSelectCar}
                </label>
                <select
                  id="finance-car"
                  value={selectedCar.id}
                  onChange={(e) => onCarChange(e.target.value)}
                  className="mt-2 h-11 w-full rounded-sm border border-[#333] bg-[#0f0f0f] px-3 font-latin text-sm text-[#f5f3ef] outline-none focus:border-[#ed1c24]"
                >
                  {CARS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatPrice(c.priceEgp, currency, lang)} {sym})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#d5d1cc]">{t.calcCarPrice}</span>
                <div className="mt-2 flex h-11 items-center rounded-sm border border-[#292929] bg-[#0f0f0f] px-3 font-latin text-sm font-bold tabular-nums text-[#d8b789]">
                  <span dir="ltr">
                    {formatPrice(calculation.price, currency, lang)} {sym}
                  </span>
                </div>
              </div>
            </div>

            {/* Down Payment Slider */}
            <div className="mt-7">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="down-slider" className="font-semibold text-[#d5d1cc]">
                  {t.calcDownPayment}
                </label>
                <span className="font-latin text-sm font-bold tabular-nums text-[#f5f3ef]">
                  {downPaymentPct}% ({formatPrice(calculation.downAmount, currency, lang)} {sym})
                </span>
              </div>
              <input
                id="down-slider"
                type="range"
                min={10}
                max={70}
                step={5}
                value={downPaymentPct}
                onChange={(e) => onDownPaymentChange(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#2a2a2a] accent-[#ed1c24]"
              />
              <div className="mt-1.5 flex justify-between font-latin text-[11px] tabular-nums text-[#888]">
                <span>10%</span>
                <span>30%</span>
                <span>50%</span>
                <span>70%</span>
              </div>
            </div>

            {/* Tenure Selector */}
            <div className="mt-7">
              <span className="block text-xs font-semibold text-[#d5d1cc]">{t.calcMonths}</span>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {tenureOptions.map((m) => {
                  const active = months === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onMonthsChange(m)}
                      className={`h-10 rounded-sm border font-latin text-xs font-bold tabular-nums transition-colors ${
                        active
                          ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                          : 'border-[#2f2f2f] bg-[#101010] text-[#c7c2bc] hover:border-[#ed1c24]/70'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Indicative Annual Rate Slider */}
            <div className="mt-7">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="rate-slider" className="font-semibold text-[#d5d1cc]">
                  {t.calcRate}
                </label>
                <span className="font-latin text-sm font-bold tabular-nums text-[#f5f3ef]">
                  {annualRatePct}%
                </span>
              </div>
              <input
                id="rate-slider"
                type="range"
                min={12}
                max={24}
                step={0.5}
                value={annualRatePct}
                onChange={(e) => onRateChange(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#2a2a2a] accent-[#ed1c24]"
              />
            </div>
          </div>

          {/* Summary Column */}
          <div className="flex flex-col justify-between rounded-sm border border-[#2f2f2f] bg-[#161616] p-6 sm:p-8 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#d8b789]">
                <Calculator className="h-4 w-4 text-[#ed1c24]" />
                <span className="font-latin tracking-wider">LANE × FINANCE PARTNERS</span>
              </div>

              <div className="mt-6 border-b border-[#292929] pb-6">
                <span className="text-xs text-[#aaa6a1]">{t.calcMonthlyLabel}</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <strong
                    dir="ltr"
                    className="font-latin text-4xl font-extrabold tabular-nums text-[#f5f3ef] sm:text-5xl"
                  >
                    {formatPrice(calculation.monthlyPayment, currency, lang)}
                  </strong>
                  <span className="text-base font-semibold text-[#ed1c24]">{sym}</span>
                </div>
              </div>

              <dl className="mt-6 space-y-3.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#aaa6a1]">{t.calcDownAmount}</dt>
                  <dd dir="ltr" className="font-latin font-bold tabular-nums text-[#f5f3ef]">
                    {formatPrice(calculation.downAmount, currency, lang)} {sym}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#aaa6a1]">{t.calcFinancedAmount}</dt>
                  <dd dir="ltr" className="font-latin font-bold tabular-nums text-[#f5f3ef]">
                    {formatPrice(calculation.financed, currency, lang)} {sym}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#aaa6a1]">{t.calcTotalInterest}</dt>
                  <dd dir="ltr" className="font-latin font-bold tabular-nums text-[#d8b789]">
                    {formatPrice(calculation.totalInterest, currency, lang)} {sym}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 space-y-3">
              <a
                href={`https://wa.me/201274555677?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-[#383838] bg-[#111111] px-5 text-xs font-semibold text-[#f5f3ef] transition-colors hover:border-[#ed1c24]"
              >
                <MessageCircle className="h-4 w-4 text-[#ed1c24]" />
                <span>{t.calcSendWhatsapp}</span>
              </a>

              <p className="pt-2 text-[11px] leading-relaxed text-[#88847e]">{t.calcDisclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
