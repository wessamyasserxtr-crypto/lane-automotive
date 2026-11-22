import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CalendarCheck,
  ExternalLink,
  FlipHorizontal2,
  Fuel,
  GitCompareArrows,
  Heart,
  Lightbulb,
  Palette,
  Printer,
  Zap,
} from 'lucide-react';
import type { CarModel, CurrencyCode, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import type { ShowroomSettings } from '../data/store';
import {
  buildHashForRoute,
  calculateFinancing,
  calculateTCO,
  formatPriceWithSymbol,
  getEffectivePriceEgp,
  type AppRoute,
} from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface CarDetailPageProps {
  car: CarModel | null;
  allCars: CarModel[];
  settings: ShowroomSettings;
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  favorites: string[];
  compareIds: string[];
  onToggleFavorite: (carId: string) => void;
  onToggleCompare: (carId: string) => void;
  onNavigate: (route: AppRoute) => void;
  onBookVisit: (carId: string) => void;
}

export function CarDetailPage({
  car,
  allCars,
  settings,
  t,
  lang,
  currency,
  favorites,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onNavigate,
  onBookVisit,
}: CarDetailPageProps) {
  const isAr = lang === 'ar';
  const [view, setView] = useState<'studio' | 'outside' | 'inside'>('outside');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedTrimId, setSelectedTrimId] = useState<string>('');
  const [studioSide, setStudioSide] = useState<'left' | 'right'>('left');
  const [headlightsOn, setHeadlightsOn] = useState(true);

  useEffect(() => {
    setView(car?.img ? 'outside' : 'studio');
    setSelectedColorIdx(0);
    setStudioSide('left');
    setHeadlightsOn(true);
    if (car?.trims && car.trims.length > 0) {
      const zeroTrim = car.trims.find((tr) => tr.priceDeltaEgp === 0);
      setSelectedTrimId(zeroTrim?.id || car.trims[0].id);
    } else {
      setSelectedTrimId('');
    }
  }, [car]);

  if (!car) {
    return (
      <section className="min-h-[65vh] bg-[#0b0b0b] px-[6%] py-24 lg:px-[8%]">
        <div className="mx-auto max-w-3xl border border-[#2a2a2a] bg-[#131313] p-10 text-center">
          <h1 className="text-2xl font-bold text-[#f5f3ef]">
            {t.noSearchMatchTitle}
          </h1>
          <p className="mt-2 text-xs text-[#a5a09a]">{t.noSearchMatchDesc}</p>
          <a
            href={buildHashForRoute({ page: 'cars' })}
            onClick={(e) => {
              e.preventDefault();
              onNavigate({ page: 'cars' });
            }}
            className="mt-6 inline-flex h-10 items-center bg-[#ed1c24] px-6 text-xs font-bold text-white hover:bg-[#ff3037]"
          >
            {t.backToCars}
          </a>
        </div>
      </section>
    );
  }

  const isFav = favorites.includes(car.id);
  const isComparing = compareIds.includes(car.id);
  const activeSrc = view === 'inside' ? car.insideImg : car.img;

  const selectedColor = car.colors?.[selectedColorIdx] || null;
  const selectedColorName = selectedColor
    ? isAr
      ? selectedColor.nameAr
      : selectedColor.nameEn
    : undefined;
  const selectedTrim = car.trims?.find((tr) => tr.id === selectedTrimId) || null;
  const trimDelta = selectedTrim?.priceDeltaEgp || 0;
  const effectivePrice = getEffectivePriceEgp(car, trimDelta);
  const listPriceForTrim = Math.max(0, car.priceEgp + trimDelta);
  const hasDiscount =
    typeof car.discountPriceEgp === 'number' &&
    car.discountPriceEgp > 0 &&
    car.discountPriceEgp < car.priceEgp;

  const financePreview = calculateFinancing({
    priceEgp: effectivePrice,
    downPaymentPct: 25,
    months: 60,
    annualRatePct: settings.defaultAnnualRatePct,
  });

  const tco = calculateTCO({
    car,
    monthlyKm: 1500,
    fuelPriceEgpPerLiter: settings.fuelPriceEgpPerLiter,
    electricityEgpPerKwh: settings.electricityEgpPerKwh,
    years: 3,
  });

  const status = car.availability || 'available';
  const statusLabel =
    status === 'soldout'
      ? isAr
        ? 'نفدت الكمية حاليًا — الحجز لقائمة الانتظار'
        : 'Currently Sold Out — Waitlist Open'
      : status === 'preorder'
        ? isAr
          ? 'حجز مسبق — استعلام لتحديد موعد الاستلام'
          : 'Pre-Order — Confirm delivery schedule'
        : isAr
          ? 'متوفرة بالمعرض للتسليم الفوري'
          : 'In Stock — Ready for Pickup';

  const engineSpecs = [
    { label: t.modalCapacity, value: car.engine[lang] },
    { label: t.modalPower, value: car.power },
    { label: t.modalTorque, value: car.torque },
    { label: t.modalGearbox, value: car.gearbox[lang] },
    { label: t.modalDrive, value: car.drive },
    { label: t.modalSeats, value: car.seats },
  ];

  const relatedCars = allCars.filter((c) => c.id !== car.id).slice(0, 3);
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;
  const EnergyIcon = tco.isElectric ? Zap : Fuel;

  const isStudioMode = view === 'studio' || (view === 'outside' && !car.img);

  return (
    <section className="bg-[#0b0b0b] px-[6%] py-14 lg:px-[8%] lg:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Print Quote Header */}
        <div className="mb-6 hidden border-b border-black pb-4 print:block">
          <div className="flex items-center justify-between">
            <strong className="font-latin text-2xl font-extrabold">LANE AUTOMOTIVE · OFFICIAL QUOTE</strong>
            <span className="font-latin text-xs">{settings.phoneDisplay} · {settings.addressEn}</span>
          </div>
        </div>

        {/* Top Breadcrumb */}
        <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#242424] pb-5">
          <button
            type="button"
            onClick={() => onNavigate({ page: 'cars' })}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#d5d1cc] transition-colors hover:text-[#ed1c24]"
          >
            <BackIcon className="h-4 w-4" />
            <span>{t.backToCars}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-1.5 border border-[#333] px-3.5 text-xs font-medium text-[#d5d1cc] transition-colors hover:border-[#ed1c24] hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / PDF Quote'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(car.id)}
              aria-pressed={isFav}
              className={`inline-flex h-9 items-center gap-1.5 border px-3.5 text-xs font-medium transition-colors ${
                isFav
                  ? 'border-[#ed1c24] bg-[#2a1214] text-[#ff9ea2]'
                  : 'border-[#333] text-[#d5d1cc] hover:border-white'
              }`}
            >
              <Heart className="h-3.5 w-3.5" fill={isFav ? 'currentColor' : 'none'} />
              <span>{t.filterFavorites}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleCompare(car.id)}
              aria-pressed={isComparing}
              className={`inline-flex h-9 items-center gap-1.5 border px-3.5 text-xs font-medium transition-colors ${
                isComparing
                  ? 'border-[#d8b789] bg-[#2a2319] text-[#f5dec0]'
                  : 'border-[#333] text-[#d5d1cc] hover:border-white'
              }`}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              <span>{isComparing ? t.removeCompare : t.addToCompare}</span>
            </button>
          </div>
        </div>

        {/* Hero Split */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="relative overflow-hidden border border-[#2d2d2d] bg-[#141517]">
              <CarVisual
                key={`${car.id}-${view}`}
                car={car}
                src={activeSrc}
                forceStudio={isStudioMode}
                isInteriorStudio={view === 'inside'}
                paintColorHex={selectedColor?.hex || car.accentHex}
                paintColorName={selectedColorName}
                studioSide={studioSide}
                headlightsOn={headlightsOn}
                alt={`${car.name} — ${view === 'inside' ? t.modalInside : t.modalOutside}`}
                className="h-[300px] w-full sm:h-[420px]"
              />
              {hasDiscount && (
                <div className="absolute top-4 start-4 z-20 bg-[#ed1c24] px-3 py-1 text-xs font-bold text-white">
                  {car.dealLabel?.[lang] || (isAr ? 'عرض خاص' : 'Flash Deal')}
                </div>
              )}
            </div>

            <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isStudioMode}
                  onClick={() => setView('studio')}
                  className={`inline-flex h-10 items-center gap-1.5 border px-4 text-xs font-semibold transition-colors ${
                    isStudioMode
                      ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                      : 'border-[#383838] bg-[#151515] text-[#bbb] hover:text-white'
                  }`}
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>{isAr ? 'استوديو الألوان' : 'Paint Studio'}</span>
                </button>
                {car.img && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'outside'}
                    onClick={() => setView('outside')}
                    className={`h-10 border px-4 text-xs font-semibold transition-colors ${
                      view === 'outside'
                        ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                        : 'border-[#383838] bg-[#151515] text-[#bbb] hover:text-white'
                    }`}
                  >
                    {isAr ? 'صورة المعرض' : 'Showroom Photo'}
                  </button>
                )}
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'inside'}
                  onClick={() => setView('inside')}
                  className={`h-10 border px-4 text-xs font-semibold transition-colors ${
                    view === 'inside'
                      ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                      : 'border-[#383838] bg-[#151515] text-[#bbb] hover:text-white'
                  }`}
                >
                  {t.modalInside}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isStudioMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStudioSide((s) => (s === 'left' ? 'right' : 'left'))}
                      className="inline-flex h-9 items-center gap-1.5 border border-[#35353a] bg-[#131316] px-3 text-[11px] font-medium text-[#e0dcd6] hover:border-[#ed1c24]"
                    >
                      <FlipHorizontal2 className="h-3.5 w-3.5 text-[#d8b789]" />
                      <span>{isAr ? 'عكس الزاوية' : 'Flip Angle'}</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={headlightsOn}
                      onClick={() => setHeadlightsOn((on) => !on)}
                      className={`inline-flex h-9 items-center gap-1.5 border px-3 text-[11px] font-medium transition-colors ${
                        headlightsOn
                          ? 'border-[#d8b789] bg-[#221c12] text-[#f5dec0]'
                          : 'border-[#35353a] bg-[#131316] text-[#aaa]'
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>{isAr ? 'إضاءة LED' : 'LED Lights'}</span>
                    </button>
                  </>
                )}

                <a
                  href={car.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#ff7479] underline underline-offset-4"
                >
                  <span>{t.modalSource}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="mt-8 border border-[#262626] bg-[#121212] p-6">
              <h2 className="text-sm font-bold text-[#f5f3ef]">
                {t.modalHighlights}
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {car.features[lang].map((feat) => (
                  <li
                    key={feat}
                    className="border border-[#2b2b2b] bg-[#171717] px-3.5 py-2.5 text-xs text-[#e0dcd6]"
                  >
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* 3-Year Running Cost (TCO) */}
            <div className="mt-6 border border-[#262626] bg-[#121214] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <EnergyIcon className="h-4 w-4 text-[#ed1c24]" />
                  <h2 className="text-sm font-bold text-[#f5f3ef]">
                    {isAr
                      ? 'تكلفة التشغيل التقديرية (1,500 كم/شهر)'
                      : 'Estimated Running Cost (1,500 km/mo)'}
                  </h2>
                </div>
                <span className="font-latin text-[11px] text-[#9b9690]">TCO · 3 YRS</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="border border-[#252528] bg-[#0c0c0e] p-3.5">
                  <span className="block text-[11px] text-[#959089]">
                    {tco.isElectric
                      ? isAr
                        ? 'شحن الكهرباء الشهري'
                        : 'Monthly Charging'
                      : isAr
                        ? 'استهلاك الوقود الشهري'
                        : 'Monthly Fuel'}
                  </span>
                  <strong
                    dir="ltr"
                    className="font-latin tabular-nums mt-1 inline-block text-sm font-bold text-[#f5f3ef]"
                  >
                    {formatPriceWithSymbol(tco.monthlyEnergyEgp, currency, lang)}
                  </strong>
                </div>

                <div className="border border-[#252528] bg-[#0c0c0e] p-3.5">
                  <span className="block text-[11px] text-[#959089]">
                    {isAr ? 'الصيانة الدورية السنوية' : 'Est. Annual Service'}
                  </span>
                  <strong
                    dir="ltr"
                    className="font-latin tabular-nums mt-1 inline-block text-sm font-bold text-[#f5f3ef]"
                  >
                    {formatPriceWithSymbol(tco.annualServiceEgp, currency, lang)}
                  </strong>
                </div>

                <div className="border border-[#472527] bg-[#190d0e] p-3.5">
                  <span className="block text-[11px] text-[#d5b9b9]">
                    {isAr ? 'إجمالي التشغيل لـ 3 سنوات' : '3-Year Total Running'}
                  </span>
                  <strong
                    dir="ltr"
                    data-testid="detail-tco-3yr"
                    className="font-latin tabular-nums mt-1 inline-block text-sm font-extrabold text-[#ed1c24]"
                  >
                    {formatPriceWithSymbol(tco.threeYearRunningEgp, currency, lang)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Spec & Action Sidebar */}
          <div className="space-y-6">
            <div className="border border-[#2f2f2f] bg-[#131313] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#d8b789]">
                <span className="font-latin tracking-[0.14em]">
                  {car.categoryLabel[lang]} · {car.year}
                </span>
                <span>{car.tag[lang]}</span>
              </div>

              <h1 className="mt-3 text-3xl font-bold text-[#f5f3ef] sm:text-4xl">
                {car.name}
              </h1>

              <div
                className={`mt-3 border px-3 py-2 text-xs font-semibold ${
                  status === 'soldout'
                    ? 'border-[#5c2528] bg-[#1c0c0d] text-[#ffa3a7]'
                    : status === 'preorder'
                      ? 'border-[#614a22] bg-[#1c1509] text-[#f5d093]'
                      : 'border-[#255436] bg-[#0c1a10] text-[#9be8b5]'
                }`}
              >
                {statusLabel}
              </div>

              <p className="mt-4 text-xs leading-loose text-[#c4c0ba] sm:text-sm">
                {car.story[lang]}
              </p>

              {/* Price Display */}
              <div className="mt-6 border-y border-[#272727] py-5">
                <span className="block text-[11px] text-[#9b9690]">
                  {t.modalPrice} {selectedTrim ? `· ${isAr ? selectedTrim.nameAr : selectedTrim.nameEn}` : ''}
                </span>
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <strong
                    dir="ltr"
                    data-testid="detail-effective-price"
                    className={`font-latin tabular-nums text-3xl font-extrabold ${
                      hasDiscount ? 'text-[#ed1c24]' : 'text-[#f5f3ef]'
                    }`}
                  >
                    {formatPriceWithSymbol(effectivePrice, currency, lang)}
                  </strong>
                  {hasDiscount && (
                    <span
                      dir="ltr"
                      className="font-latin tabular-nums text-sm text-[#8a857f] line-through"
                    >
                      {formatPriceWithSymbol(listPriceForTrim, currency, lang)}
                    </span>
                  )}
                </div>
              </div>

              {/* Exterior Color Swatches — auto-activates live Paint Studio */}
              {car.colors && car.colors.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#dedbd6]">
                      {isAr ? 'اختر لون السيارة (يتطبق مباشرة):' : 'Select Paint Color (Live Preview):'}
                    </span>
                    <span className="font-medium text-[#d8b789]">
                      {selectedColorName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {car.colors.map((col, idx) => {
                      const active = idx === selectedColorIdx;
                      return (
                        <button
                          key={col.nameEn}
                          type="button"
                          aria-label={isAr ? col.nameAr : col.nameEn}
                          aria-pressed={active}
                          onClick={() => {
                            setSelectedColorIdx(idx);
                            setView('studio');
                          }}
                          className={`inline-flex items-center gap-2 border px-2.5 py-1.5 text-[11px] transition-colors ${
                            active
                              ? 'border-[#ed1c24] bg-[#211011] text-white'
                              : 'border-[#333] bg-[#0e0e10] text-[#bbb] hover:border-white'
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/50"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{isAr ? col.nameAr : col.nameEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trim Selector */}
              {car.trims && car.trims.length > 0 && (
                <div className="mt-5">
                  <span className="mb-2 block text-xs font-semibold text-[#dedbd6]">
                    {isAr ? 'اختر الفئة (Trim):' : 'Select Trim Level:'}
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {car.trims.map((tr) => {
                      const active = tr.id === selectedTrimId;
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedTrimId(tr.id)}
                          className={`border p-2.5 text-start transition-colors ${
                            active
                              ? 'border-[#ed1c24] bg-[#211011] text-white'
                              : 'border-[#2f2f34] bg-[#0d0d0f] text-[#ccc] hover:border-[#666]'
                          }`}
                        >
                          <strong className="font-latin block text-xs font-bold">
                            {isAr ? tr.nameAr : tr.nameEn}
                          </strong>
                          <span className="mt-0.5 block text-[11px] text-[#9b9690]">
                            {isAr ? tr.highlightAr : tr.highlightEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <h2 className="mt-6 mb-3 text-sm font-bold text-[#f5f3ef]">
                {t.modalEngine}
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {engineSpecs.map((spec) => (
                  <div
                    key={spec.label}
                    className="border border-[#292929] bg-[#0e0e0e] p-3"
                  >
                    <span className="block text-[11px] text-[#8d8882]">
                      {spec.label}
                    </span>
                    <strong className="font-latin mt-1 block text-xs font-bold text-[#f3f0eb] sm:text-sm">
                      {spec.value}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="mt-6 border border-[#2d2d2d] bg-[#0c0c0c] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[11px] text-[#9c9791]">
                      {t.detailQuickFinance}
                    </span>
                    <strong
                      dir="ltr"
                      className="font-latin tabular-nums mt-1 inline-block text-lg font-bold text-[#ed1c24]"
                    >
                      {formatPriceWithSymbol(financePreview.monthlyPaymentEgp, currency, lang)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'finance' })}
                    className="no-print inline-flex h-9 items-center gap-1.5 border border-[#3c3c3c] px-3 text-xs font-medium text-[#e5e2dd] hover:border-[#ed1c24]"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>{t.detailOpenFinance}</span>
                  </button>
                </div>
              </div>

              <div className="no-print mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onBookVisit(car.id)}
                  className="inline-flex h-11 items-center justify-center gap-2 border border-white/45 px-4 text-xs font-semibold text-white transition-colors hover:border-[#ed1c24] hover:text-[#ff9ea2]"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>
                    {status === 'soldout'
                      ? isAr
                        ? 'تسجيل بقائمة الانتظار'
                        : 'Join Waitlist'
                      : t.modalBookVisit}
                  </span>
                </button>
                <a
                  href={`https://wa.me/${settings.whatsappDigits}?text=${encodeURIComponent(
                    `LANE Inquiry: ${car.name} (${car.year}) — ${selectedColor?.nameEn || 'Standard'} / ${selectedTrim?.nameEn || 'Base'}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center bg-[#ed1c24] px-5 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
                >
                  {t.modalAsk}
                </a>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-[#8d8882]">
                {t.modalNote} {car.availabilityNote ? car.availabilityNote[lang] : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Related Cars Strip */}
        {relatedCars.length > 0 && (
          <div className="no-print mt-14 border-t border-[#222] pt-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[#f5f3ef]">
                {t.viewFullCatalog}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'cars' })}
                className="text-xs font-semibold text-[#ed1c24] hover:underline"
              >
                {t.filterAll} →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedCars.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onNavigate({ page: 'car-detail', carId: rel.id })}
                  className="group border border-[#2a2a2a] bg-[#121212] p-4 text-start transition-colors hover:border-[#ed1c24]"
                >
                  <CarVisual
                    car={rel}
                    src={rel.img}
                    alt={rel.name}
                    className="h-36 w-full"
                    imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <strong className="text-sm font-bold text-[#f5f3ef]">
                      {rel.name}
                    </strong>
                    <span
                      dir="ltr"
                      className="font-latin tabular-nums text-xs font-semibold text-[#d8b789]"
                    >
                      {formatPriceWithSymbol(getEffectivePriceEgp(rel), currency, lang)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
