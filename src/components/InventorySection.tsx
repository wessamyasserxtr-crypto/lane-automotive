import { type PointerEvent, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, GitCompare, Heart, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CARS,
  CURRENCY_SYMBOLS,
  formatPrice,
  type CarModel,
  type CarType,
  type Currency,
  type Lang,
} from '../data/cars';
import { CarImage } from './CarImage';

interface InventorySectionProps {
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  favorites: string[];
  compareIds: string[];
  recommendedIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onClearCompare: () => void;
  onClearRecommendations: () => void;
  onOpenCompareModal: () => void;
  onOpenConcierge: () => void;
  onSelectCar: (car: CarModel) => void;
}

type FilterValue = 'all' | 'recommended' | CarType;
type SortValue = 'default' | 'price-asc' | 'price-desc' | 'power-desc';

function tiltCard(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse') return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  event.currentTarget.style.setProperty('--card-tilt-x', `${-y * 5}deg`);
  event.currentTarget.style.setProperty('--card-tilt-y', `${x * 7}deg`);
}

function resetCardTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--card-tilt-x', '0deg');
  event.currentTarget.style.setProperty('--card-tilt-y', '0deg');
}

export function InventorySection({
  lang,
  currency,
  t,
  favorites,
  compareIds,
  recommendedIds,
  onToggleFavorite,
  onToggleCompare,
  onClearCompare,
  onClearRecommendations,
  onOpenCompareModal,
  onOpenConcierge,
  onSelectCar,
}: InventorySectionProps) {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortValue>('default');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (filter === 'recommended' && recommendedIds.length === 0) {
      setFilter('all');
    }
  }, [filter, recommendedIds]);

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = CARS.filter((car) => {
      if (filter === 'recommended') {
        if (!recommendedIds.includes(car.id)) return false;
      } else if (filter !== 'all' && car.type !== filter) {
        return false;
      }
      if (!q) return true;
      const hay = [
        car.name,
        car.categoryLabel,
        car.engine[lang],
        car.gearbox[lang],
        ...car.features[lang],
        ...car.quickSpecs[lang],
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });

    if (sort === 'price-asc') return [...list].sort((a, b) => a.priceEgp - b.priceEgp);
    if (sort === 'price-desc') return [...list].sort((a, b) => b.priceEgp - a.priceEgp);
    if (sort === 'power-desc') return [...list].sort((a, b) => b.horsepower - a.horsepower);

    if (recommendedIds.length > 0) {
      return [...list].sort((a, b) => {
        const ia = recommendedIds.indexOf(a.id);
        const ib = recommendedIds.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }

    return list;
  }, [filter, search, sort, lang, recommendedIds]);

  const compareCars = useMemo(
    () => compareIds.map((id) => CARS.find((c) => c.id === id)).filter((c): c is CarModel => Boolean(c)),
    [compareIds]
  );

  const filterButtons: { value: FilterValue; label: string }[] = [
    { value: 'all', label: t.filterAll },
    ...(recommendedIds.length > 0 ? [{ value: 'recommended' as FilterValue, label: t.filterRecommended }] : []),
    { value: 'suv', label: t.filterSuv },
    { value: 'sedan', label: t.filterSedan },
    { value: 'electric', label: t.filterElectric },
  ];

  return (
    <section id="inventory" className="bg-[#0d0d0d] py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-[6%]">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#242424] pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-latin text-xs font-semibold tracking-wider text-[#ed1c24]">
              {t.inventoryKicker}
            </p>
            <h2
              className="mt-2 font-bold tracking-tight text-[#f5f3ef]"
              style={{ fontSize: 'clamp(1.85rem, 3.6vw, 3.1rem)', textWrap: 'balance' }}
            >
              {t.inventoryTitle}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#aaa6a1]">{t.inventoryDesc}</p>
        </div>

        {/* Filter, Search & Sort Toolbar */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map((btn) => {
              const active = filter === btn.value;
              const isRecFilter = btn.value === 'recommended';
              return (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => setFilter(btn.value)}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-sm border px-4 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                      : isRecFilter
                        ? 'border-[#d8b789]/60 bg-[#1a1510] text-[#d8b789] hover:border-[#ed1c24] hover:text-white'
                        : 'border-[#2f2f2f] bg-[#141414] text-[#c7c2bc] hover:border-[#ed1c24] hover:text-white'
                  }`}
                >
                  {isRecFilter && <Sparkles className="h-3.5 w-3.5" />}
                  <span>{btn.label}</span>
                </button>
              );
            })}

            {recommendedIds.length > 0 && (
              <button
                type="button"
                onClick={onClearRecommendations}
                className="inline-flex h-10 items-center gap-1 rounded-sm border border-[#2f2f2f] bg-transparent px-3 text-[11px] font-medium text-[#aaa6a1] transition-colors hover:border-white hover:text-white whitespace-nowrap"
              >
                <X className="h-3 w-3" />
                <span>{t.clearRecommendations}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a84] ltr:left-3.5 rtl:right-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-10 w-full rounded-sm border border-[#2f2f2f] bg-[#141414] text-xs text-[#f5f3ef] placeholder-[#7f7a74] outline-none transition-colors focus:border-[#ed1c24] ltr:pl-10 ltr:pr-8 rtl:pr-10 rtl:pl-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 -translate-y-1/2 text-[#8f8a84] hover:text-white ltr:right-2.5 rtl:left-2.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <SlidersHorizontal className="pointer-events-none absolute h-3.5 w-3.5 text-[#8f8a84] ltr:left-3 rtl:right-3" />
              <select
                aria-label="Sort cars"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="h-10 w-full rounded-sm border border-[#2f2f2f] bg-[#141414] text-xs text-[#f5f3ef] outline-none focus:border-[#ed1c24] ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 sm:w-auto"
              >
                <option value="default">{t.sortDefault}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
                <option value="power-desc">{t.sortPowerDesc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comparison Tray (visible when 1+ cars selected) */}
        {compareCars.length > 0 && (
          <div className="mt-6 flex flex-col justify-between gap-4 rounded-sm border border-[#3a2224] bg-[#161112] p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#f5f3ef]">
                <GitCompare className="h-4 w-4 text-[#ed1c24]" />
                {t.compareTrayTitle} ({compareCars.length}/3):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {compareCars.map((car) => (
                  <span
                    key={car.id}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-[#363636] bg-[#111] px-2.5 py-1 text-xs text-[#f5f3ef]"
                  >
                    {car.name}
                    <button
                      type="button"
                      onClick={() => onToggleCompare(car.id)}
                      className="text-[#aaa6a1] hover:text-[#ed1c24]"
                      aria-label={`Remove ${car.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onClearCompare}
                className="h-9 rounded-sm border border-[#333] px-3 text-xs text-[#bbb] transition-colors hover:border-white hover:text-white whitespace-nowrap"
              >
                {t.clearCompare}
              </button>
              <button
                type="button"
                onClick={onOpenCompareModal}
                disabled={compareCars.length < 2}
                className="h-9 rounded-sm bg-[#ed1c24] px-4 text-xs font-bold text-white transition-colors hover:bg-[#ff2c34] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
              >
                {t.openCompare} ({compareCars.length})
              </button>
            </div>
          </div>
        )}

        {/* Vehicle Cards Grid (3 columns desktop, studio-lit uniform cards) */}
        {filteredCars.length === 0 ? (
          <div className="mt-10 rounded-sm border border-[#262626] bg-[#121212] px-6 py-14 text-center">
            <h3 className="text-lg font-bold text-[#f5f3ef]">{t.noResultsTitle}</h3>
            <p className="mt-2 text-sm text-[#aaa6a1]">{t.noResultsDesc}</p>
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setSearch('');
                setSort('default');
              }}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-sm bg-[#ed1c24] px-5 text-xs font-bold text-white hover:bg-[#ff2c34]"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCars.map((car, cardIndex) => {
              const isFav = favorites.includes(car.id);
              const isCompared = compareIds.includes(car.id);
              const isRecommended = recommendedIds.includes(car.id);

              return (
                <motion.article
                  key={car.id}
                  id={`car-card-${car.id}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  whileHover={reduceMotion ? undefined : { y: -7, scale: 1.008, rotateX: 0.5 }}
                  transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : Math.min(cardIndex * 0.055, 0.28), ease: [0.2, 0.8, 0.2, 1] }}
                  style={{ transformPerspective: 900, transformOrigin: 'center bottom' }}
                  onPointerMove={reduceMotion ? undefined : tiltCard}
                  onPointerLeave={resetCardTilt}
                  className={`group flex flex-col overflow-hidden rounded-sm border bg-gradient-to-br from-[#191a1c] to-[#101113] transition-colors duration-300 ${
                    isRecommended
                      ? 'border-[#d88789]/85 shadow-[0_0_0_1px_rgba(237,28,36,0.35),0_20px_50px_rgba(237,28,36,0.16)]'
                      : 'border-[#2b2d30] hover:border-[#ed1c24]/70'
                  }`}
                >
                  <div className="car-card-depth flex min-h-full flex-1 flex-col">
                  {/* 4:3 Studio-lit Real Vehicle Photography Frame */}
                  <div className="car-depth-media relative aspect-[4/3] w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_88%,#393a3d_0%,#181a1c_38%,#0d0e10_78%)]">
                    <button
                      type="button"
                      onClick={() => onSelectCar(car)}
                      className="block h-full w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ed1c24]"
                      aria-label={`${t.askDetails}: ${car.name}`}
                    >
                      <CarImage
                        src={car.img}
                        alt={`${car.name} ${car.year}`}
                        label={car.name}
                        className="h-full w-full object-cover object-[center_58%] transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-85 transition-opacity group-hover:opacity-95" />
                      <span className="pointer-events-none absolute inset-x-3 bottom-2.5 text-center text-[11px] font-medium text-[#e5e0da] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {t.tapToExplore}
                      </span>
                    </button>

                    {/* Single subtle top tag (Match highlight takes precedence when active) */}
                    <span
                      className={`pointer-events-none absolute top-3 inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ltr:left-3 rtl:right-3 ${
                        isRecommended
                          ? 'bg-[#ed1c24] text-white shadow-[0_4px_16px_rgba(237,28,36,0.4)]'
                          : 'bg-[#090909]/85 text-[#f5f3ef]'
                      }`}
                    >
                      {isRecommended && <Sparkles className="h-3 w-3" />}
                      <span>{isRecommended ? t.recommendedBadge : car.tag[lang]}</span>
                    </span>

                    {/* Heart & Compare action buttons */}
                    <div className="absolute top-3 flex items-center gap-2 ltr:right-3 rtl:left-3">
                      <button
                        type="button"
                        onClick={() => onToggleCompare(car.id)}
                        aria-label={isCompared ? t.addedToCompare : t.addToCompare}
                        title={isCompared ? t.addedToCompare : t.addToCompare}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
                          isCompared
                            ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                            : 'border-white/30 bg-[#090909]/75 text-white hover:border-[#ed1c24]'
                        }`}
                      >
                        <GitCompare className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(car.id)}
                        aria-label={isFav ? t.savedFavorite : t.saveFavorite}
                        title={isFav ? t.savedFavorite : t.saveFavorite}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
                          isFav
                            ? 'border-[#ed1c24] bg-[#090909]/90 text-[#ed1c24]'
                            : 'border-white/30 bg-[#090909]/75 text-white hover:border-[#ed1c24]'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-[#ed1c24]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="car-depth-info flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2 font-latin text-[11px] font-semibold tracking-wider text-[#aaa6a1]">
                        <span>{car.categoryLabel}</span>
                        <span className="tabular-nums">{car.year}</span>
                      </div>

                      <h3 className="mt-2 font-latin text-xl font-bold text-[#f5f3ef]">
                        <button
                          type="button"
                          onClick={() => onSelectCar(car)}
                          className="text-start transition-colors hover:text-[#ed1c24]"
                        >
                          {car.name}
                        </button>
                      </h3>

                      {/* Unboxed clean metadata with typographic dot separators */}
                      <p className="mt-2.5 text-xs text-[#c0bcb6]">
                        {car.quickSpecs[lang].join(' · ')}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#262626] pt-4">
                      <span dir="ltr" className="font-latin text-sm font-semibold tabular-nums text-[#aaa6a1]">
                        {formatPrice(car.priceEgp, currency, lang)} {CURRENCY_SYMBOLS[currency][lang]}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectCar(car)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-[#ed1c24] px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#ff2c34] whitespace-nowrap"
                      >
                        <span>{t.askDetails}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Inventory Footer Concierge Prompt */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onOpenConcierge}
            className="inline-flex h-11 items-center gap-2 rounded-sm border border-[#3a3a3a] bg-[#141414] px-6 text-xs font-semibold text-[#f5f3ef] transition-colors hover:border-[#ed1c24] hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#ed1c24]" />
            <span>{t.gateHeading}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
