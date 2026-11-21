import { useEffect } from 'react';
import { X } from 'lucide-react';
import { CURRENCY_SYMBOLS, formatPrice, type CarModel, type Currency, type Lang } from '../data/cars';
import { CarImage } from './CarImage';

interface CompareModalProps {
  open: boolean;
  cars: CarModel[];
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  onClose: () => void;
  onSelectCar: (car: CarModel) => void;
}

export function CompareModal({
  open,
  cars,
  lang,
  currency,
  t,
  onClose,
  onSelectCar,
}: CompareModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || cars.length < 2) return null;

  const sym = CURRENCY_SYMBOLS[currency][lang];

  const rows = [
    {
      label: t.compareRowCategory,
      render: (c: CarModel) => c.categoryLabel,
    },
    {
      label: t.compareRowPrice,
      render: (c: CarModel) => (
        <span dir="ltr" className="font-latin font-bold tabular-nums text-[#d8b789]">
          {formatPrice(c.priceEgp, currency, lang)} {sym}
        </span>
      ),
    },
    {
      label: t.compareRowEngine,
      render: (c: CarModel) => c.engine[lang],
    },
    {
      label: t.compareRowPower,
      render: (c: CarModel) => <span className="font-latin font-semibold">{c.power}</span>,
    },
    {
      label: t.compareRowTorque,
      render: (c: CarModel) => <span className="font-latin">{c.torque}</span>,
    },
    {
      label: t.compareRowGearbox,
      render: (c: CarModel) => c.gearbox[lang],
    },
    {
      label: t.compareRowSeats,
      render: (c: CarModel) => <span className="font-latin tabular-nums">{c.seats}</span>,
    },
    {
      label: t.compareRowFeatures,
      render: (c: CarModel) => (
        <ul className="space-y-1 text-xs text-[#c7c2bc]">
          {c.features[lang].map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.compareModalTitle}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-sm border border-[#333] bg-[#111111] p-5 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#292929] pb-5">
          <div>
            <h2 className="text-xl font-bold text-[#f5f3ef] sm:text-2xl">{t.compareModalTitle}</h2>
            <p className="mt-1 text-xs text-[#aaa6a1]">{t.compareModalSub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#3a3a3a] text-white hover:border-[#ed1c24] hover:bg-[#ed1c24]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-start text-sm">
            <thead>
              <tr>
                <th className="w-40 border-b border-[#292929] p-3 text-start text-xs font-semibold text-[#8f8a84]" />
                {cars.map((car) => (
                  <th key={car.id} className="border-b border-[#292929] p-3 text-start align-top">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectCar(car);
                      }}
                      className="group block w-full text-start"
                    >
                      <CarImage
                        src={car.img}
                        alt={car.name}
                        label={car.name}
                        className="h-28 w-full rounded-sm object-cover"
                      />
                      <span className="mt-2.5 block font-latin text-base font-bold text-[#f5f3ef] group-hover:text-[#ed1c24]">
                        {car.name}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[#222]">
                  <td className="p-3 text-xs font-semibold text-[#aaa6a1]">{row.label}</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 align-top text-xs text-[#ece8e1]">
                      {row.render(car)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
