import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { CarModel, CurrencyCode, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import { formatPriceWithSymbol } from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface CompareModalProps {
  cars: CarModel[];
  open: boolean;
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  onClose: () => void;
  onSelectCar: (car: CarModel) => void;
}

export function CompareModal({
  cars,
  open,
  t,
  lang,
  currency,
  onClose,
  onSelectCar,
}: CompareModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || cars.length < 2) return null;

  const rows: { label: string; getValue: (c: CarModel) => string }[] = [
    {
      label: t.modalPrice,
      getValue: (c) => formatPriceWithSymbol(c.priceEgp, currency, lang),
    },
    { label: t.modalCapacity, getValue: (c) => c.engine[lang] },
    { label: t.modalPower, getValue: (c) => c.power },
    { label: t.modalTorque, getValue: (c) => c.torque },
    { label: t.modalGearbox, getValue: (c) => c.gearbox[lang] },
    { label: t.modalDrive, getValue: (c) => c.drive },
    { label: t.modalSeats, getValue: (c) => c.seats },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto border border-[#393939] bg-[#101010] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#292929] pb-5">
          <div>
            <h2
              id="compare-modal-title"
              className="text-2xl font-bold text-[#f5f3ef]"
            >
              {t.compareTitle}
            </h2>
            <p className="mt-1 text-xs text-[#aaa6a1]">{t.compareSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.compareClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white hover:border-[#ed1c24] hover:bg-[#ed1c24]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-start text-xs">
            <thead>
              <tr className="border-b border-[#292929]">
                <th className="w-36 py-3 pe-4 text-start font-medium text-[#8d8882]" />
                {cars.map((car) => (
                  <th key={car.id} className="px-3 pb-5 text-start align-top">
                    <CarVisual
                      car={car}
                      src={car.img}
                      alt={car.name}
                      className="mb-3 h-32 w-full"
                    />
                    <span className="block text-base font-bold text-[#f5f3ef]">
                      {car.name}
                    </span>
                    <span className="font-latin mt-0.5 block text-[11px] font-normal text-[#aaa6a1]">
                      {car.categoryLabel[lang]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[#1f1f1f]">
                  <th className="py-3.5 pe-4 text-start font-semibold text-[#aaa6a1]">
                    {row.label}
                  </th>
                  {cars.map((car) => (
                    <td
                      key={car.id}
                      className="font-latin tabular-nums px-3 py-3.5 font-semibold text-[#f5f3ef]"
                    >
                      {row.getValue(car)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-4" />
                {cars.map((car) => (
                  <td key={car.id} className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectCar(car);
                      }}
                      className="h-9 bg-[#ed1c24] px-4 text-xs font-bold text-white hover:bg-[#ff3037]"
                    >
                      {t.cardAskDetails}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
