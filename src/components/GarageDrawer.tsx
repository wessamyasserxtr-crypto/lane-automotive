import { useEffect } from 'react';
import { MessageCircle, Trash2, X } from 'lucide-react';
import { CURRENCY_SYMBOLS, formatPrice, type CarModel, type Currency, type Lang } from '../data/cars';
import { CarImage } from './CarImage';

interface GarageDrawerProps {
  open: boolean;
  cars: CarModel[];
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  onClose: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onSelectCar: (car: CarModel) => void;
}

export function GarageDrawer({
  open,
  cars,
  lang,
  currency,
  t,
  onClose,
  onRemove,
  onClearAll,
  onSelectCar,
}: GarageDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sym = CURRENCY_SYMBOLS[currency][lang];
  const whatsappAllText = encodeURIComponent(
    `LANE Saved Garage Inquiry: ${cars.map((c) => c.name).join(', ')}`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.garageTitle}
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col border-s border-[#292929] bg-[#111111]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#242424] px-6 py-5">
          <h2 className="text-lg font-bold text-[#f5f3ef]">
            {t.garageTitle}{' '}
            <span className="font-latin text-sm tabular-nums text-[#d8b789]">({cars.length})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#333] text-white hover:border-[#ed1c24]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cars.length === 0 ? (
            <p className="mt-10 text-center text-sm leading-relaxed text-[#aaa6a1]">
              {t.garageEmpty}
            </p>
          ) : (
            <div className="space-y-4">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="flex items-center gap-3.5 rounded-sm border border-[#262626] bg-[#161616] p-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectCar(car);
                    }}
                    className="h-16 w-24 shrink-0 overflow-hidden rounded-sm"
                  >
                    <CarImage
                      src={car.img}
                      alt={car.name}
                      label={car.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectCar(car);
                      }}
                      className="block truncate font-latin text-sm font-bold text-[#f5f3ef] hover:text-[#ed1c24]"
                    >
                      {car.name}
                    </button>
                    <span dir="ltr" className="mt-1 block font-latin text-xs font-semibold tabular-nums text-[#d8b789]">
                      {formatPrice(car.priceEgp, currency, lang)} {sym}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(car.id)}
                    aria-label={t.garageRemove}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[#8f8a84] hover:text-[#ed1c24]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cars.length > 0 && (
          <div className="space-y-3 border-t border-[#242424] bg-[#0e0e0e] p-6">
            <a
              href={`https://wa.me/201274555677?text=${whatsappAllText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#ed1c24] px-5 text-xs font-bold text-white hover:bg-[#ff2c34]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t.garageWhatsappAll}</span>
            </a>

            <button
              type="button"
              onClick={onClearAll}
              className="h-10 w-full rounded-sm border border-[#333] text-xs font-semibold text-[#aaa6a1] hover:border-white hover:text-white"
            >
              {t.garageClear}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
