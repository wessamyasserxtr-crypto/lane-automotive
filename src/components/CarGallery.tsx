import type { CarGalleryAngle, CarModel, LangCode } from '../data/cars';

export type CarGalleryItem = {
  angle: 'main' | 'interior' | CarGalleryAngle;
  src: string;
};

export function getCarGalleryItems(car: CarModel): CarGalleryItem[] {
  const items: CarGalleryItem[] = [];
  const seen = new Set<string>();
  const add = (item: CarGalleryItem) => {
    const src = item.src.trim();
    if (!src || seen.has(src)) return;
    seen.add(src);
    items.push({ ...item, src });
  };

  add({ angle: 'main', src: car.img });
  car.galleryImages?.forEach((image) => add(image));
  add({ angle: 'interior', src: car.insideImg });
  return items;
}

function angleLabel(angle: CarGalleryItem['angle'], lang: LangCode): string {
  const labels: Record<CarGalleryItem['angle'], Record<LangCode, string>> = {
    main: {
      ar: 'الصورة الرئيسية',
      en: 'Main view',
      fr: 'Vue principale',
      zh: '主视图',
      de: 'Hauptansicht',
    },
    front: {
      ar: 'من الأمام',
      en: 'Front',
      fr: 'Avant',
      zh: '前视图',
      de: 'Vorne',
    },
    left: {
      ar: 'الجانب الأيسر',
      en: 'Left side',
      fr: 'Côté gauche',
      zh: '左侧',
      de: 'Linke Seite',
    },
    right: {
      ar: 'الجانب الأيمن',
      en: 'Right side',
      fr: 'Côté droit',
      zh: '右侧',
      de: 'Rechte Seite',
    },
    rear: {
      ar: 'من الخلف',
      en: 'Rear',
      fr: 'Arrière',
      zh: '后视图',
      de: 'Hinten',
    },
    interior: {
      ar: 'المقصورة من الداخل',
      en: 'Interior',
      fr: 'Intérieur',
      zh: '内饰',
      de: 'Innenraum',
    },
  };
  return labels[angle][lang];
}

export function CarGalleryThumbnails({
  car,
  items,
  selectedIndex,
  lang,
  onSelect,
}: {
  car: CarModel;
  items: CarGalleryItem[];
  selectedIndex: number;
  lang: LangCode;
  onSelect: (index: number) => void;
}) {
  if (items.length < 2) return null;

  const title = {
    ar: 'صور السيارة من زوايا مختلفة',
    en: 'Explore every angle',
    fr: 'Découvrez chaque angle',
    zh: '探索不同视角',
    de: 'Alle Perspektiven ansehen',
  }[lang];

  return (
    <div className="mt-3 border border-[#29292c] bg-[#111113] p-3 sm:p-4" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold text-[#f5f3ef] sm:text-sm">{title}</h2>
        <span className="font-latin text-[10px] tabular-nums text-[#aaa6a1]">
          {String(selectedIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-color:#454548_transparent] [scrollbar-width:thin]">
        {items.map((item, index) => {
          const label = angleLabel(item.angle, lang);
          const active = index === selectedIndex;
          return (
            <button
              key={`${item.angle}-${item.src}`}
              type="button"
              aria-label={`${car.name} — ${label}`}
              aria-pressed={active}
              onClick={() => onSelect(index)}
              className={`w-[116px] shrink-0 overflow-hidden border text-start transition-colors sm:w-[138px] ${
                active
                  ? 'border-[#ed1c24] bg-[#281114]'
                  : 'border-[#333337] bg-[#171719] hover:border-[#9e4b50]'
              }`}
            >
              <img
                src={item.src}
                alt={`${car.name} — ${label}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-[66px] w-full bg-[#1d1d20] object-cover sm:h-[78px]"
              />
              <span className="block truncate px-2 py-2 text-[10px] font-semibold text-[#e7e3dd] sm:text-[11px]">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
