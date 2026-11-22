import { useState } from 'react';
import { ArrowUpRight, Camera, GitCompareArrows, Heart, Search } from 'lucide-react';
import type { CarModel, CurrencyCode, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import {
  formatPriceWithSymbol,
  getEffectivePriceEgp,
  searchAndSortCars,
  type AppRoute,
  type InventoryFilter,
  type SortOption,
} from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface InventorySectionProps {
  cars: CarModel[];
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  filter: InventoryFilter;
  favorites: string[];
  compareIds: string[];
  recommendedCarId: string | null;
  previewLimit?: number;
  onFilterChange: (filter: InventoryFilter) => void;
  onToggleFavorite: (carId: string) => void;
  onToggleCompare: (carId: string) => void;
  onOpenCompare: () => void;
  onClearCompare: () => void;
  onOpenCar: (car: CarModel) => void;
  onNavigate: (route: AppRoute) => void;
}

export function InventorySection({
  cars,
  t,
  lang,
  currency,
  filter,
  favorites,
  compareIds,
  recommendedCarId,
  previewLimit,
  onFilterChange,
  onToggleFavorite,
  onToggleCompare,
  onOpenCompare,
  onClearCompare,
  onOpenCar,
  onNavigate,
}: InventorySectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('featured');
  const [expandedAll, setExpandedAll] = useState(false);
  const [selectedColorByCar, setSelectedColorByCar] = useState<Record<string, number | undefined>>({});
  const isAr = lang === 'ar';

  const filteredCars = searchAndSortCars(cars, {
    filter,
    favoriteIds: favorites,
    searchQuery,
    sort,
    lang,
  });

  const visibleCars =
    previewLimit && !expandedAll
      ? filteredCars.slice(0, previewLimit)
      : filteredCars;

  const filterButtons: { id: InventoryFilter; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'suv', label: t.filterSuv },
    { id: 'sedan', label: t.filterSedan },
    { id: 'electric', label: t.filterElectric },
    {
      id: 'favorites',
      label: `${t.filterFavorites} (${favorites.length})`,
    },
  ];

  const isFavoritesEmpty = filter === 'favorites' && filteredCars.length === 0;

  return (
    <section id="inventory" className="bg-[#0d0d0d] py-20 px-[6%] lg:px-[8%]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 border-b border-[#242424] pb-8 md:flex-row md:items-end">
          <div>
            <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
              {t.inventoryKicker}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[#f5f3ef] sm:text-5xl">
              {t.inventoryTitle}
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-[#aaa6a1] sm:text-sm">
            {t.inventoryDesc}
          </p>
        </div>

        {/* Search + Sort Bar on Full Catalog View */}
        {!previewLimit && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-[#7c7771]" />
              <label htmlFor="catalog-search" className="sr-only">
                {t.searchPlaceholder}
              </label>
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-11 w-full border border-[#303034] bg-[#141416] pe-4 ps-10 text-xs text-white placeholder-[#7c7771] focus:border-[#ed1c24] focus:outline-none"
              />
            </div>

            <select
              aria-label="Sort models"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-11 border border-[#303034] bg-[#141416] px-4 text-xs text-[#f5f3ef] focus:border-[#ed1c24] focus:outline-none"
            >
              <option value="featured">{t.sortFeatured}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
            </select>
          </div>
        )}

        {/* Filter Bar + Compare Action */}
        <div className="mt-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Car category filter">
            {filterButtons.map((btn) => {
              const active = filter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onFilterChange(btn.id)}
                  className={`h-10 whitespace-nowrap border px-4 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                      : 'border-[#353535] bg-transparent text-[#c4c0ba] hover:border-[#ed1c24]/70 hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {compareIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={compareIds.length < 2}
                onClick={onOpenCompare}
                className="inline-flex h-10 items-center gap-2 whitespace-nowrap bg-[#ed1c24] px-4 text-xs font-bold text-white transition-colors hover:bg-[#ff3037] disabled:cursor-not-allowed disabled:bg-[#3a1d1f] disabled:text-[#aaa]"
              >
                <GitCompareArrows className="h-4 w-4" />
                <span>
                  {t.compareSelectedBtn} ({compareIds.length}/3)
                </span>
              </button>
              <button
                type="button"
                onClick={onClearCompare}
                className="h-10 whitespace-nowrap border border-[#3a3a3a] px-3 text-xs text-[#aaa6a1] hover:border-white hover:text-white"
              >
                {t.clearCompareBtn}
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {visibleCars.length === 0 ? (
          <div className="border border-[#2b2b2b] bg-[#141414] px-6 py-14 text-center">
            <h3 className="text-lg font-bold text-[#f5f3ef]">
              {isFavoritesEmpty ? t.emptyFavoritesTitle : t.noSearchMatchTitle}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#aaa6a1]">
              {isFavoritesEmpty ? t.emptyFavoritesDesc : t.noSearchMatchDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onFilterChange('all');
              }}
              className="mt-6 h-10 bg-[#ed1c24] px-6 text-xs font-bold text-white hover:bg-[#ff3037]"
            >
              {t.showAllCarsBtn}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5" data-testid="inventory-list">
            {visibleCars.map((car) => {
              const isFav = favorites.includes(car.id);
              const isComparing = compareIds.includes(car.id);
              const isRecommended = recommendedCarId === car.id;
              const effectivePrice = getEffectivePriceEgp(car);
              const hasDiscount = effectivePrice < car.priceEgp;
              const chosenColorIdx = selectedColorByCar[car.id];
              const chosenColor =
                typeof chosenColorIdx === 'number' && car.colors?.[chosenColorIdx]
                  ? car.colors[chosenColorIdx]
                  : null;
              const status = car.availability || 'available';
              const statusLabel =
                status === 'soldout'
                  ? isAr
                    ? 'نفدت الكمية'
                    : 'Sold Out'
                  : status === 'preorder'
                    ? isAr
                      ? 'حجز مسبق'
                      : 'Pre-Order'
                    : isAr
                      ? 'متوفرة للاستلام'
                      : 'In Stock';
              const statusClass =
                status === 'soldout'
                  ? 'border-[#5a2225] bg-[#1d0c0e]/95 text-[#ff9fa3]'
                  : status === 'preorder'
                    ? 'border-[#6d5324] bg-[#1e170a]/95 text-[#f2cf94]'
                    : 'border-[#255436] bg-[#0d1c12]/95 text-[#9ee6b8]';

              return (
                <article
                  key={car.id}
                  id={`car-card-${car.id}`}
                  data-testid={`car-card-${car.id}`}
                  className={`group grid grid-cols-1 overflow-hidden border transition-all duration-200 md:grid-cols-[minmax(280px,0.9fr)_1.1fr] ${
                    isRecommended
                      ? 'border-[#ed1c24] bg-gradient-to-br from-[#201415] to-[#111214] shadow-[0_18px_45px_rgba(237,28,36,0.16)]'
                      : 'border-[#2b2d30] bg-gradient-to-br from-[#191a1c] to-[#101113] hover:border-[#8f373b]'
                  }`}
                >
                  {/* Visual Column */}
                  <div className="relative min-h-[250px] bg-[#181a1c] md:min-h-[300px]">
                    <CarVisual
                      car={car}
                      src={car.img}
                      forceStudio={chosenColor !== null}
                      paintColorHex={chosenColor?.hex || car.accentHex}
                      paintColorName={
                        chosenColor
                          ? isAr
                            ? chosenColor.nameAr
                            : chosenColor.nameEn
                          : undefined
                      }
                      alt={`${car.name} ${car.year}`}
                      className="h-full w-full"
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    <button
                      type="button"
                      aria-label={`${isFav ? 'Remove' : 'Save'} ${car.name} to favorites`}
                      aria-pressed={isFav}
                      onClick={() => onToggleFavorite(car.id)}
                      className={`absolute top-3.5 start-3.5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                        isFav
                          ? 'border-[#ed1c24] bg-[#14090a]/90 text-[#ed1c24]'
                          : 'border-white/40 bg-black/60 text-white hover:border-white'
                      }`}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={isFav ? 'currentColor' : 'none'}
                      />
                    </button>

                    {chosenColor && car.img && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedColorByCar((prev) => ({ ...prev, [car.id]: undefined }))
                        }
                        className="absolute bottom-3.5 start-3.5 z-20 inline-flex h-8 items-center gap-1.5 border border-white/30 bg-black/75 px-2.5 text-[10px] font-semibold text-white hover:border-[#ed1c24]"
                      >
                        <Camera className="h-3 w-3" />
                        <span>{isAr ? 'الصورة الحقيقية' : 'Real Photo'}</span>
                      </button>
                    )}

                    <div className="absolute top-3.5 end-3.5 z-20 flex flex-col items-end gap-1.5">
                      <span
                        className={`border px-2.5 py-1 text-[10px] font-bold tracking-wide ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                      {hasDiscount && (
                        <span className="bg-[#ed1c24] px-2.5 py-1 text-[10px] font-bold text-white">
                          {car.dealLabel?.[lang] || (isAr ? 'عرض خاص' : 'Flash Deal')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Column */}
                  <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold tracking-wider text-[#b6b0a8]">
                        <span>
                          {car.categoryLabel[lang]} ·{' '}
                          <span className="font-latin tabular-nums">{car.year}</span>
                        </span>
                        <span className="text-[#d8b789]">
                          {isRecommended ? t.recommendedBadge : car.tag[lang]}
                        </span>
                      </div>

                      <h3 className="mt-3 text-2xl font-bold text-[#f5f3ef] sm:text-3xl">
                        {car.name}
                      </h3>

                      <p className="mt-3 text-xs leading-relaxed text-[#b2ada7] sm:text-sm">
                        {car.story[lang]}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-[#2d2e32] pb-5 text-xs text-[#d1cdc7]">
                        {car.specs[lang].map((spec, i) => (
                          <span key={`${spec}-${i}`} className="inline-flex items-center gap-2">
                            {i > 0 && (
                              <span aria-hidden="true" className="text-[#ed1c24]">
                                ·
                              </span>
                            )}
                            <span>{spec}</span>
                          </span>
                        ))}
                      </div>

                      {/* Interactive Color Swatches Row directly on Card */}
                      {car.colors && car.colors.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-[#9b9690]">
                            {isAr ? 'جرّب اللون:' : 'Try Paint:'}
                          </span>
                          {car.colors.map((col, cIdx) => {
                            const isActiveSwatch =
                              chosenColorIdx === cIdx ||
                              (chosenColorIdx === undefined && !car.img && cIdx === 0);
                            return (
                              <button
                                key={col.nameEn}
                                type="button"
                                aria-label={`${car.name} — ${isAr ? col.nameAr : col.nameEn}`}
                                aria-pressed={isActiveSwatch}
                                title={isAr ? col.nameAr : col.nameEn}
                                onClick={() =>
                                  setSelectedColorByCar((prev) => ({
                                    ...prev,
                                    [car.id]: cIdx,
                                  }))
                                }
                                className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                                  isActiveSwatch
                                    ? 'ring-2 ring-[#ed1c24] ring-offset-2 ring-offset-[#121214] border-white'
                                    : 'border-white/40'
                                }`}
                                style={{ backgroundColor: col.hex }}
                              />
                            );
                          })}
                          {chosenColor && (
                            <span className="text-[11px] font-semibold text-[#d8b789]">
                              {isAr ? chosenColor.nameAr : chosenColor.nameEn}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="block text-[11px] text-[#9b9690]">
                          {t.cardPriceLabel}
                        </span>
                        <div className="mt-0.5 flex flex-wrap items-baseline gap-2.5">
                          <strong
                            dir="ltr"
                            className={`font-latin tabular-nums text-xl font-bold sm:text-2xl ${
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

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleCompare(car.id)}
                          aria-pressed={isComparing}
                          className={`h-10 whitespace-nowrap border px-3.5 text-xs font-medium transition-colors ${
                            isComparing
                              ? 'border-[#d8b789] bg-[#2a2319] text-[#f5dec0]'
                              : 'border-[#3a3b3f] bg-transparent text-[#d4d0ca] hover:border-white hover:text-white'
                          }`}
                        >
                          {isComparing ? t.removeCompare : t.addToCompare}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenCar(car)}
                          className="h-10 whitespace-nowrap border border-[#444] px-3.5 text-xs font-medium text-[#f5f3ef] transition-colors hover:border-[#ed1c24] hover:text-[#ff9ea2]"
                        >
                          {t.cardAskDetails}
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigate({ page: 'car-detail', carId: car.id })}
                          className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap bg-[#ed1c24] px-4 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
                        >
                          <span>{t.openFullPage}</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {previewLimit && filteredCars.length > visibleCars.length && (
            <button
              type="button"
              onClick={() => setExpandedAll(true)}
              className="inline-flex h-11 items-center bg-[#ed1c24] px-7 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
            >
              {t.viewFullCatalog} ({filteredCars.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate({ page: 'cars' })}
            className="inline-flex h-11 items-center border border-[#ed1c24]/60 px-6 text-xs font-semibold text-[#f5f3ef] transition-colors hover:bg-[#ed1c24] hover:text-white"
          >
            {isAr ? 'صفحة المعرض الكاملة والبحث' : 'Open Full Showroom & Search'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ page: 'quiz' })}
            className="inline-flex h-11 items-center border border-white/40 px-6 text-xs font-medium text-[#f5f3ef] transition-colors hover:border-[#ed1c24] hover:text-[#ff9ea2]"
          >
            {t.findMatch}
          </button>
        </div>
      </div>
    </section>
  );
}

