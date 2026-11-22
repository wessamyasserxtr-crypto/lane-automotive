import { useEffect, useState } from 'react';
import { ExternalLink, Palette, X } from 'lucide-react';
import type { CarModel, CurrencyCode, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import { formatPriceWithSymbol, getEffectivePriceEgp } from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface CarDetailModalProps {
  car: CarModel | null;
  whatsappDigits: string;
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  onClose: () => void;
  onBookVisit: (carId: string) => void;
}

export function CarDetailModal({
  car,
  whatsappDigits,
  t,
  lang,
  currency,
  onClose,
  onBookVisit,
}: CarDetailModalProps) {
  const isAr = lang === 'ar';
  const [view, setView] = useState<'studio' | 'outside' | 'inside'>('outside');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  useEffect(() => {
    setView(car?.img ? 'outside' : 'studio');
    setSelectedColorIdx(0);
  }, [car]);

  useEffect(() => {
    if (!car) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [car, onClose]);

  if (!car) return null;

  const activeSrc = view === 'inside' ? car.insideImg : car.img;
  const selectedColor = car.colors?.[selectedColorIdx] || null;
  const selectedColorName = selectedColor
    ? isAr
      ? selectedColor.nameAr
      : selectedColor.nameEn
    : undefined;
  const effectivePrice = getEffectivePriceEgp(car);
  const hasDiscount = effectivePrice < car.priceEgp;
  const isStudioMode = view === 'studio' || (view === 'outside' && !car.img);

  const engineSpecs = [
    { label: t.modalCapacity, value: car.engine[lang] },
    { label: t.modalPower, value: car.power },
    { label: t.modalTorque, value: car.torque },
    { label: t.modalGearbox, value: car.gearbox[lang] },
    { label: t.modalDrive, value: car.drive },
    { label: t.modalSeats, value: car.seats },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="car-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto border border-[#393939] bg-[#101010] shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close car details"
          className="absolute top-3.5 end-3.5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/70 text-white transition-colors hover:border-[#ed1c24] hover:bg-[#ed1c24]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Visual */}
        <div className="relative h-[240px] bg-[#181818] sm:h-[310px]">
          <CarVisual
            key={`${car.id}-${view}`}
            car={car}
            src={activeSrc}
            forceStudio={isStudioMode}
            isInteriorStudio={view === 'inside'}
            paintColorHex={selectedColor?.hex || car.accentHex}
            paintColorName={selectedColorName}
            alt={`${car.name} — ${view === 'inside' ? t.modalInside : t.modalOutside}`}
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101010] via-black/25 to-transparent" />
          <div className="absolute bottom-4 inset-x-6 sm:inset-x-8">
            <span className="font-latin text-xs font-bold tracking-[0.18em] text-[#ff7479]">
              {car.categoryLabel[lang]} · {car.year}
            </span>
            <h2
              id="car-modal-title"
              className="mt-1 text-3xl font-bold text-[#f5f3ef] sm:text-4xl"
            >
              {car.name}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-5 flex flex-wrap gap-2" role="tablist">
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
                  {t.modalOutside}
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

            {car.colors && car.colors.length > 0 && (
              <div className="mb-5 border border-[#242428] bg-[#141416] p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#dedbd6]">
                    {isAr ? 'تغيير لون العربية مباشرة:' : 'Live Paint Color:'}
                  </span>
                  <span className="font-medium text-[#d8b789]">{selectedColorName}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {car.colors.map((col, idx) => {
                    const active = idx === selectedColorIdx;
                    return (
                      <button
                        key={col.nameEn}
                        type="button"
                        onClick={() => {
                          setSelectedColorIdx(idx);
                          setView('studio');
                        }}
                        className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] transition-colors ${
                          active
                            ? 'border-[#ed1c24] bg-[#211011] text-white'
                            : 'border-[#333] bg-[#0e0e10] text-[#bbb] hover:border-white'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-white/50"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span>{isAr ? col.nameAr : col.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs leading-loose text-[#c4c0ba] sm:text-sm">
              {car.story[lang]}
            </p>

            <h3 className="mt-7 mb-3 text-sm font-bold text-[#f5f3ef]">
              {t.modalHighlights}
            </h3>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {car.features[lang].map((feat) => (
                <li
                  key={feat}
                  className="border border-[#2b2b2b] bg-[#151515] px-3.5 py-2.5 text-xs text-[#e0dcd6]"
                >
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#303030] bg-[#151515] p-6">
            <h3 className="mb-4 text-base font-bold text-[#f5f3ef]">
              {t.modalEngine}
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {engineSpecs.map((spec) => (
                <div
                  key={spec.label}
                  className="border border-[#292929] bg-[#101010] p-3"
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

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#2e2e2e] pt-5">
              <div>
                <span className="block text-[11px] text-[#9b9690]">
                  {t.modalPrice}
                </span>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                  <strong
                    dir="ltr"
                    className={`font-latin tabular-nums text-2xl font-bold ${
                      hasDiscount ? 'text-[#ed1c24]' : 'text-[#f5f3ef]'
                    }`}
                  >
                    {formatPriceWithSymbol(effectivePrice, currency, lang)}
                  </strong>
                  {hasDiscount && (
                    <span
                      dir="ltr"
                      className="font-latin tabular-nums text-xs text-[#8f8a84] line-through"
                    >
                      {formatPriceWithSymbol(car.priceEgp, currency, lang)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onBookVisit(car.id)}
                  className="h-10 border border-white/40 px-4 text-xs font-semibold text-white transition-colors hover:border-[#ed1c24] hover:text-[#ff9ea2]"
                >
                  {t.modalBookVisit}
                </button>
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                    `LANE Inquiry: ${car.name} (${selectedColor?.nameEn || 'Standard'})`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center bg-[#ed1c24] px-5 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
                >
                  {t.modalAsk}
                </a>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-[#8d8882]">
              {t.modalNote}{' '}
              {car.availabilityNote ? car.availabilityNote[lang] : ''}
            </p>
            <a
              href={car.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#ff7479] underline underline-offset-4"
            >
              <span>{t.modalSource}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
