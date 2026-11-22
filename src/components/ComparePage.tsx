import { ArrowUpRight, CalendarCheck, Printer } from 'lucide-react';
import type { CarModel, CurrencyCode, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import type { ShowroomSettings } from '../data/store';
import {
  calculateTCO,
  formatPriceWithSymbol,
  getEffectivePriceEgp,
  type AppRoute,
} from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface ComparePageProps {
  cars: CarModel[];
  settings: ShowroomSettings;
  selectedIds: string[];
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  onSetSlotCar: (slotIndex: number, carId: string) => void;
  onNavigate: (route: AppRoute) => void;
  onBookVisit: (carId: string) => void;
}

export function ComparePage({
  cars,
  settings,
  selectedIds,
  t,
  lang,
  currency,
  onSetSlotCar,
  onNavigate,
  onBookVisit,
}: ComparePageProps) {
  const isAr = lang === 'ar';
  const effectiveIds: [string, string, string] = [
    selectedIds[0] || cars[0]?.id || '',
    selectedIds[1] || cars[1]?.id || '',
    selectedIds[2] || '',
  ];

  const slotCars = effectiveIds.map((id) => cars.find((c) => c.id === id) || null);
  const activeCars = slotCars.filter((c): c is CarModel => c !== null);

  const getCarTco = (car: CarModel) =>
    calculateTCO({
      car,
      monthlyKm: 1500,
      fuelPriceEgpPerLiter: settings.fuelPriceEgpPerLiter,
      electricityEgpPerKwh: settings.electricityEgpPerKwh,
      years: 3,
    });

  const specRows: Array<{ label: string; getVal: (car: CarModel) => string; isNumeric?: boolean }> = [
    {
      label: t.modalPrice,
      getVal: (c) => formatPriceWithSymbol(getEffectivePriceEgp(c), currency, lang),
      isNumeric: true,
    },
    { label: t.filterAll, getVal: (c) => `${c.categoryLabel[lang]} · ${c.year}` },
    { label: t.modalCapacity, getVal: (c) => c.engine[lang] },
    { label: t.modalPower, getVal: (c) => c.power },
    { label: t.modalTorque, getVal: (c) => c.torque },
    { label: t.modalGearbox, getVal: (c) => c.gearbox[lang] },
    { label: t.modalDrive, getVal: (c) => c.drive },
    { label: t.modalSeats, getVal: (c) => c.seats },
    {
      label: isAr ? 'الوقود / الشحن الشهري (1,500 كم)' : 'Monthly Energy (1,500 km)',
      getVal: (c) => formatPriceWithSymbol(getCarTco(c).monthlyEnergyEgp, currency, lang),
      isNumeric: true,
    },
    {
      label: isAr ? 'الصيانة السنوية التقديرية' : 'Est. Annual Service',
      getVal: (c) => formatPriceWithSymbol(getCarTco(c).annualServiceEgp, currency, lang),
      isNumeric: true,
    },
    {
      label: isAr ? 'إجمالي التشغيل لـ 3 سنوات' : '3-Year Total Running Cost',
      getVal: (c) => formatPriceWithSymbol(getCarTco(c).threeYearRunningEgp, currency, lang),
      isNumeric: true,
    },
  ];

  return (
    <section className="bg-[#0b0b0b] px-[6%] py-16 lg:px-[8%] lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#242424] pb-8">
          <div>
            <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
              LANE · COMPARE
            </p>
            <h1 className="mt-3 text-balance text-3xl font-bold text-[#f5f3ef] sm:text-5xl">
              {t.compareTitle}
            </h1>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#aaa6a1] sm:text-sm">
              {t.comparePickHint}
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex h-10 items-center gap-2 border border-[#3a3a3f] bg-[#131315] px-4 text-xs font-semibold text-[#f5f3ef] transition-colors hover:border-[#ed1c24]"
          >
            <Printer className="h-4 w-4 text-[#ed1c24]" />
            <span>{isAr ? 'طباعة / حفظ PDF للمقارنة' : 'Print / Save PDF'}</span>
          </button>
        </div>

        {/* 3 Model Selectors */}
        <div className="no-print mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div key={slot} className="border border-[#2b2b2b] bg-[#121212] p-4">
              <label
                htmlFor={`compare-slot-${slot}`}
                className="mb-2 block text-[11px] font-semibold tracking-wider text-[#9d9892]"
              >
                {t.compareSlotLabel} 0{slot + 1}
              </label>
              <select
                id={`compare-slot-${slot}`}
                value={effectiveIds[slot]}
                onChange={(e) => onSetSlotCar(slot, e.target.value)}
                className="h-10 w-full border border-[#383838] bg-[#0a0a0a] px-3 text-xs text-[#f5f3ef] focus:border-[#ed1c24] focus:outline-none"
              >
                {slot === 2 && <option value="">{t.compareNoneOpt}</option>}
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name} — {formatPriceWithSymbol(getEffectivePriceEgp(car), currency, lang)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Visual Cards Header */}
        {activeCars.length > 0 && (
          <div className="mt-8 overflow-x-auto border border-[#2b2b2b] bg-[#111]">
            <table className="w-full min-w-[680px] border-collapse text-start">
              <thead>
                <tr className="border-b border-[#292929] bg-[#161616]">
                  <th className="w-52 p-5 align-top text-xs font-semibold text-[#9a9590]">
                    {t.compareSubtitle}
                  </th>
                  {activeCars.map((car) => {
                    const effective = getEffectivePriceEgp(car);
                    const hasDeal = effective < car.priceEgp;
                    return (
                      <th key={car.id} className="p-5 align-top">
                        <CarVisual
                          car={car}
                          src={car.img}
                          alt={car.name}
                          className="mb-4 h-36 w-full"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-[#f5f3ef]">
                            {car.name}
                          </span>
                          {hasDeal && (
                            <span className="bg-[#ed1c24] px-2 py-0.5 text-[10px] font-bold text-white">
                              {car.dealLabel?.[lang] || (isAr ? 'خصم' : 'Deal')}
                            </span>
                          )}
                        </div>
                        <div className="no-print mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onNavigate({ page: 'car-detail', carId: car.id })}
                            className="inline-flex h-8 items-center gap-1 bg-[#ed1c24] px-3 text-[11px] font-bold text-white hover:bg-[#ff3037]"
                          >
                            <span>{t.openFullPage}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onBookVisit(car.id)}
                            className="inline-flex h-8 items-center gap-1 border border-[#3e3e3e] px-3 text-[11px] font-medium text-[#ddd] hover:border-white"
                          >
                            <CalendarCheck className="h-3.5 w-3.5" />
                            <span>{t.modalBookVisit}</span>
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {specRows.map((row) => (
                  <tr key={row.label} className="border-b border-[#222]">
                    <th className="p-4 text-xs font-medium text-[#9f9a94]">
                      {row.label}
                    </th>
                    {activeCars.map((car) => (
                      <td
                        key={`${car.id}-${row.label}`}
                        dir={row.isNumeric ? 'ltr' : undefined}
                        className={`p-4 text-xs font-semibold text-[#f5f3ef] ${
                          row.isNumeric ? 'font-latin tabular-nums text-sm text-[#d8b789]' : ''
                        }`}
                      >
                        {row.getVal(car)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
