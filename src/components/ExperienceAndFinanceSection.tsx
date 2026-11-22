import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Clock,
  Compass,
  Fuel,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  EXPERIENCE_IMAGE_URL,
  type CarModel,
  type CurrencyCode,
  type LangCode,
} from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import type { ShowroomSettings } from '../data/store';
import {
  buildFinanceSchedule,
  buildHashForRoute,
  calculateFinancing,
  calculateMaxAffordableCarPrice,
  calculateTCO,
  findCarsWithinMonthlyBudget,
  formatPriceWithSymbol,
  getEffectivePriceEgp,
  type AppRoute,
} from '../utils/laneLogic';

interface ExperienceAndFinanceSectionProps {
  cars: CarModel[];
  settings: ShowroomSettings;
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  showScheduleTable?: boolean;
  onNavigate?: (route: AppRoute) => void;
}

export function ExperienceSection({
  t,
  onNavigate,
}: {
  t: TranslationPack;
  onNavigate?: (route: AppRoute) => void;
}) {
  const [expImgError, setExpImgError] = useState(false);

  const features = [
    { icon: Sparkles, title: t.f1, desc: t.f1d },
    { icon: ShieldCheck, title: t.f2, desc: t.f2d },
    { icon: Compass, title: t.f3, desc: t.f3d },
    { icon: Clock, title: t.f4, desc: t.f4d },
  ];

  return (
    <>
      <section
        id="journey"
        className="relative flex min-h-[440px] items-center overflow-hidden bg-[#0a0a0a]"
      >
        {!expImgError ? (
          <img
            src={EXPERIENCE_IMAGE_URL}
            alt="LANE Automotive Experience"
            referrerPolicy="no-referrer"
            onError={() => setExpImgError(true)}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,#291215_0%,#111_55%,#090909_90%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/80 to-[#090909]/25 rtl:bg-gradient-to-l" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-[6%] py-20 lg:px-[8%]">
          <div className="max-w-xl">
            <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
              {t.expKicker}
            </p>
            <h2 className="mt-3 text-balance text-4xl font-bold leading-tight text-[#f5f3ef] sm:text-6xl">
              {t.expTitleLine1}
              <br />
              {t.expTitleLine2}
            </h2>
            <p className="mt-5 max-w-md text-xs leading-loose text-[#d1ceca] sm:text-sm">
              {t.expDesc}
            </p>
            <a
              href={buildHashForRoute({ page: 'quiz' })}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate({ page: 'quiz' });
                }
              }}
              className="mt-7 inline-flex h-11 items-center bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
            >
              {t.meetAi}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[#090909] px-[6%] pb-20 lg:px-[8%]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 border-y border-[#2d2d2d] sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className={`p-7 transition-colors hover:bg-[#141111] ${
                  idx > 0 ? 'border-t border-[#2d2d2d] lg:border-t-0 lg:border-s' : ''
                }`}
              >
                <Icon className="h-5 w-5 text-[#ed1c24]" />
                <h3 className="mt-4 text-sm font-bold text-[#f5f3ef]">
                  {feat.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#9f9a94]">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function FinanceCalculatorSection({
  cars,
  settings,
  t,
  lang,
  currency,
  showScheduleTable = false,
  onNavigate,
}: ExperienceAndFinanceSectionProps) {
  const isAr = lang === 'ar';
  const [selectedCarId, setSelectedCarId] = useState<string>(cars[0]?.id || '');
  const [downPaymentPct, setDownPaymentPct] = useState<number>(25);
  const [months, setMonths] = useState<number>(60);
  const [annualRatePct, setAnnualRatePct] = useState<number>(settings.defaultAnnualRatePct);
  const [monthlyBudgetEgp, setMonthlyBudgetEgp] = useState<number>(28000);

  useEffect(() => {
    setAnnualRatePct(settings.defaultAnnualRatePct);
  }, [settings.defaultAnnualRatePct]);

  useEffect(() => {
    if (!cars.some((c) => c.id === selectedCarId) && cars[0]) {
      setSelectedCarId(cars[0].id);
    }
  }, [cars, selectedCarId]);

  const activeCar = cars.find((c) => c.id === selectedCarId) || cars[0];
  if (!activeCar) return null;

  const activePrice = getEffectivePriceEgp(activeCar);
  const financing = calculateFinancing({
    priceEgp: activePrice,
    downPaymentPct,
    months,
    annualRatePct,
  });

  const tco = calculateTCO({
    car: activeCar,
    monthlyKm: 1500,
    fuelPriceEgpPerLiter: settings.fuelPriceEgpPerLiter,
    electricityEgpPerKwh: settings.electricityEgpPerKwh,
    years: 3,
  });

  const schedule = showScheduleTable
    ? buildFinanceSchedule(activePrice, downPaymentPct, annualRatePct)
    : [];

  const maxAffordableCarPrice = calculateMaxAffordableCarPrice({
    monthlyBudgetEgp,
    downPaymentPct,
    months,
    annualRatePct,
  });

  const affordableCars = findCarsWithinMonthlyBudget(cars, {
    monthlyBudgetEgp,
    downPaymentPct,
    months,
    annualRatePct,
  });

  const EnergyIcon = tco.isElectric ? Zap : Fuel;

  return (
    <section
      id="finance"
      className="border-t border-[#1e1e1e] bg-[#0e0e0e] py-20 px-[6%] lg:px-[8%]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 pb-10 md:flex-row md:items-end">
          <div>
            <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
              {t.financeKicker}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-[#f5f3ef] sm:text-5xl">
              {t.financeTitleLine1}
              <br />
              {t.financeTitleLine2}
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-[#aaa6a1] sm:text-sm">
            {t.financeDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 border border-[#2f2f2f] bg-gradient-to-br from-[#171717] to-[#101010] lg:grid-cols-2">
          <div className="flex flex-col justify-between border-b border-[#292929] p-7 sm:p-10 lg:border-b-0 lg:border-e">
            <div>
              <p className="font-latin text-[11px] font-bold tracking-[0.16em] text-[#d8b789] uppercase">
                LANE × FINANCE PARTNERS
              </p>
              <h3 className="mt-3 text-2xl font-bold leading-snug text-[#f5f3ef] sm:text-3xl">
                {t.financeHLine1}
                <br />
                {t.financeHLine2}
              </h3>
              <p className="mt-3 text-xs leading-loose text-[#b2ada7] sm:text-sm">
                {t.financeP}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="border border-[#2d2d2d] bg-[#0b0b0b] p-5">
                <span className="block text-xs text-[#9d9892]">
                  {t.calcMonthlyEst}
                </span>
                <strong
                  data-testid="finance-monthly-output"
                  dir="ltr"
                  className="font-latin tabular-nums mt-1.5 inline-block text-3xl font-extrabold text-[#ed1c24] sm:text-4xl"
                >
                  {formatPriceWithSymbol(financing.monthlyPaymentEgp, currency, lang)}
                </strong>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#222] pt-4">
                  <div>
                    <span className="block text-[11px] text-[#8d8882]">
                      {t.calcDownAmount}
                    </span>
                    <strong
                      dir="ltr"
                      className="font-latin tabular-nums mt-1 inline-block text-sm font-bold text-[#f5f3ef]"
                    >
                      {formatPriceWithSymbol(financing.downPaymentEgp, currency, lang)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#8d8882]">
                      {t.calcLoanAmount}
                    </span>
                    <strong
                      dir="ltr"
                      className="font-latin tabular-nums mt-1 inline-block text-sm font-bold text-[#f5f3ef]"
                    >
                      {formatPriceWithSymbol(financing.loanPrincipalEgp, currency, lang)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* TCO Preview strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 border border-[#2a2a2e] bg-[#121215] px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-[#dedbd6]">
                  <EnergyIcon className="h-4 w-4 text-[#d8b789]" />
                  <span>
                    {isAr
                      ? 'تشغيل شهري + صيانة (1,500 كم):'
                      : 'Est. Monthly Energy (1,500 km):'}
                  </span>
                </div>
                <strong dir="ltr" className="font-latin tabular-nums font-bold text-[#d8b789]">
                  {formatPriceWithSymbol(tco.monthlyEnergyEgp, currency, lang)} / {isAr ? '3 سنين:' : '3Y:'}{' '}
                  {formatPriceWithSymbol(tco.threeYearRunningEgp, currency, lang)}
                </strong>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={`https://wa.me/${settings.whatsappDigits}?text=${encodeURIComponent(
                  `${activeCar.name} — ${downPaymentPct}% down / ${months} months`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
              >
                {t.financeCta}
              </a>
              <p className="mt-3 text-[11px] text-[#7f7a74]">{t.calcDisclaimer}</p>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6 p-7 sm:p-10">
            <div>
              <label
                htmlFor="calc-car-select"
                className="mb-2 block text-xs font-semibold text-[#dedbd6]"
              >
                {t.calcCarLabel}
              </label>
              <select
                id="calc-car-select"
                value={activeCar.id}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="h-11 w-full border border-[#3a3a3a] bg-[#0e0e0e] px-3 text-sm text-[#f5f3ef] focus-visible:outline-2 focus-visible:outline-[#ed1c24]"
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {formatPriceWithSymbol(getEffectivePriceEgp(c), currency, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <label htmlFor="calc-down-range" className="font-semibold text-[#dedbd6]">
                  {t.calcDownLabel}
                </label>
                <span className="font-latin tabular-nums font-bold text-[#d8b789]">
                  {downPaymentPct}%
                </span>
              </div>
              <input
                id="calc-down-range"
                type="range"
                min={15}
                max={60}
                step={5}
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                className="w-full accent-[#ed1c24]"
              />
            </div>

            <div>
              <span className="mb-2 block text-xs font-semibold text-[#dedbd6]">
                {t.calcTermLabel}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 36, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonths(m)}
                    className={`font-latin tabular-nums h-10 border text-xs font-semibold transition-colors ${
                      months === m
                        ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                        : 'border-[#383838] bg-[#0e0e0e] text-[#ccc] hover:border-white'
                    }`}
                  >
                    {m} {t.calcMonthsSuffix}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <label htmlFor="calc-rate-range" className="font-semibold text-[#dedbd6]">
                  {t.calcRateLabel}
                </label>
                <span className="font-latin tabular-nums font-bold text-[#d8b789]">
                  {annualRatePct}%
                </span>
              </div>
              <input
                id="calc-rate-range"
                type="range"
                min={8}
                max={20}
                step={1}
                value={annualRatePct}
                onChange={(e) => setAnnualRatePct(Number(e.target.value))}
                className="w-full accent-[#ed1c24]"
              />
            </div>
          </div>
        </div>

        {/* Affordability Reverse Solver ("تناسب دخلك الشهري؟") */}
        <div className="mt-10 border border-[#2b2b2f] bg-[#121215] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#242429] pb-6 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[#ed1c24]">
                <Wallet className="h-4 w-4" />
                <span className="font-latin text-xs font-bold tracking-[0.16em] uppercase">
                  MONTHLY AFFORDABILITY FINDER
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-[#f5f3ef] sm:text-2xl">
                {isAr
                  ? 'ما السيارة التي تناسب قسطك الشهري؟'
                  : 'Which Cars Fit Your Monthly Budget?'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {[18000, 25000, 35000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMonthlyBudgetEgp(preset)}
                    className={`font-latin tabular-nums h-9 border px-3 text-xs font-semibold transition-colors ${
                      monthlyBudgetEgp === preset
                        ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                        : 'border-[#333] bg-[#0b0b0d] text-[#ccc] hover:border-white'
                    }`}
                  >
                    {new Intl.NumberFormat('en-US').format(preset)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="budget-monthly-input" className="sr-only">
                  {isAr ? 'القسط الشهري بالجنيه' : 'Target Monthly Budget EGP'}
                </label>
                <input
                  id="budget-monthly-input"
                  data-testid="budget-monthly-input"
                  type="number"
                  min={5000}
                  step={1000}
                  dir="ltr"
                  value={monthlyBudgetEgp}
                  onChange={(e) => setMonthlyBudgetEgp(Math.max(0, Number(e.target.value)))}
                  className="font-latin h-9 w-32 border border-[#3a3a3f] bg-[#0a0a0c] px-3 text-xs font-bold text-white focus:border-[#ed1c24] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[#a5a09a]">
              {isAr
                ? `بمقدم ${downPaymentPct}% ومدة ${months} شهر بفائدة ${annualRatePct}%، الحد الأقصى التقريبي لسعر السيارة هو:`
                : `With ${downPaymentPct}% down over ${months} mos at ${annualRatePct}% APR, your max car budget is:`}
            </span>
            <strong
              dir="ltr"
              data-testid="max-affordable-price"
              className="font-latin tabular-nums text-base font-extrabold text-[#d8b789]"
            >
              {formatPriceWithSymbol(maxAffordableCarPrice, currency, lang)}
            </strong>
          </div>

          {affordableCars.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {affordableCars.map(({ car, monthlyEgp }) => (
                <div
                  key={car.id}
                  className="flex flex-col justify-between border border-[#2a2a2f] bg-[#0d0d0f] p-4 transition-colors hover:border-[#ed1c24]"
                >
                  <div>
                    <strong className="block text-sm font-bold text-[#f5f3ef]">
                      {car.name}
                    </strong>
                    <span
                      dir="ltr"
                      className="font-latin tabular-nums mt-1 block text-xs text-[#9b9690]"
                    >
                      {formatPriceWithSymbol(getEffectivePriceEgp(car), currency, lang)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#222] pt-3">
                    <span
                      dir="ltr"
                      className="font-latin tabular-nums text-xs font-extrabold text-[#ed1c24]"
                    >
                      {formatPriceWithSymbol(monthlyEgp, currency, lang)} / mo
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCarId(car.id);
                        if (onNavigate) onNavigate({ page: 'car-detail', carId: car.id });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-white hover:text-[#ed1c24]"
                    >
                      <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 border border-[#3a2628] bg-[#160f10] p-4 text-xs text-[#e5bdbd]">
              {isAr
                ? 'لا توجد سيارة ضمن هذا القسط الشهري بالإعدادات الحالية. جرّب زيادة القسط أو المقدم أو مدة التمويل.'
                : 'No model fits this exact monthly target with the current down payment and term. Try adjusting down payment or duration.'}
            </div>
          )}
        </div>

        {showScheduleTable && schedule.length > 0 && (
          <div className="mt-10 border border-[#2b2b2b] bg-[#121214] p-6 sm:p-8">
            <h3 className="text-base font-bold text-[#f5f3ef]">{t.scheduleTitle}</h3>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-start text-xs">
                <thead>
                  <tr className="border-b border-[#29292d] text-[#9b9690]">
                    <th className="py-3 pe-4">{t.scheduleTerm}</th>
                    <th className="py-3 pe-4">{t.scheduleDown}</th>
                    <th className="py-3 pe-4">{t.scheduleLoan}</th>
                    <th className="py-3 pe-4">{t.scheduleInterest}</th>
                    <th className="py-3">{t.scheduleMonthly}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202024]">
                  {schedule.map((row) => {
                    const isSelected = row.months === months;
                    return (
                      <tr
                        key={row.months}
                        onClick={() => setMonths(row.months)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#221214]' : 'hover:bg-[#17171a]'
                        }`}
                      >
                        <td className="font-latin tabular-nums py-3.5 pe-4 font-bold text-white">
                          {row.months} {t.calcMonthsSuffix}
                        </td>
                        <td dir="ltr" className="font-latin tabular-nums py-3.5 pe-4 text-[#ccc]">
                          {formatPriceWithSymbol(row.downPaymentEgp, currency, lang)}
                        </td>
                        <td dir="ltr" className="font-latin tabular-nums py-3.5 pe-4 text-[#ccc]">
                          {formatPriceWithSymbol(row.loanPrincipalEgp, currency, lang)}
                        </td>
                        <td dir="ltr" className="font-latin tabular-nums py-3.5 pe-4 text-[#d8b789]">
                          {formatPriceWithSymbol(row.totalInterestEgp, currency, lang)}
                        </td>
                        <td
                          dir="ltr"
                          className="font-latin tabular-nums py-3.5 font-extrabold text-[#ed1c24]"
                        >
                          {formatPriceWithSymbol(row.monthlyPaymentEgp, currency, lang)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function ExperienceAndFinanceSection(props: ExperienceAndFinanceSectionProps) {
  return (
    <>
      <ExperienceSection t={props.t} onNavigate={props.onNavigate} />
      <FinanceCalculatorSection {...props} />
    </>
  );
}
