import {
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
  type CarModel,
  type CurrencyCode,
  type LangCode,
} from '../data/cars';
import type { BookingStatus, VisitBooking } from '../data/store';

export interface QuizAnswers {
  who?: 'personal' | 'business';
  type?: 'suv' | 'sedan' | 'electric' | 'any';
  budget?: 'under1.5' | '1.5-2.5' | '2.5-4' | 'flexible';
  priority?: 'comfort' | 'economy' | 'tech' | 'performance';
}

export type InventoryFilter = 'all' | 'suv' | 'sedan' | 'electric' | 'favorites';
export type SortOption = 'featured' | 'price-asc' | 'price-desc';

export type AppRoute =
  | { page: 'home' }
  | { page: 'cars' }
  | { page: 'car-detail'; carId: string }
  | { page: 'compare' }
  | { page: 'finance' }
  | { page: 'quiz' }
  | { page: 'visit' }
  | { page: 'admin' };

export function parseRouteFromHash(hash: string): AppRoute {
  const clean = hash.replace(/^#/, '').trim();
  if (!clean || clean === '/' || clean === 'home') return { page: 'home' };
  if (clean.startsWith('/cars/')) {
    const carId = decodeURIComponent(clean.slice('/cars/'.length)).trim();
    if (carId) return { page: 'car-detail', carId };
    return { page: 'cars' };
  }
  if (clean === '/cars' || clean === 'inventory') return { page: 'cars' };
  if (clean === '/compare') return { page: 'compare' };
  if (clean === '/finance' || clean === 'finance') return { page: 'finance' };
  if (clean === '/quiz' || clean === 'quiz') return { page: 'quiz' };
  if (clean === '/visit' || clean === 'location') return { page: 'visit' };
  if (clean === '/admin' || clean === 'admin') return { page: 'admin' };
  return { page: 'home' };
}

export function buildHashForRoute(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '#/';
    case 'cars':
      return '#/cars';
    case 'car-detail':
      return `#/cars/${encodeURIComponent(route.carId)}`;
    case 'compare':
      return '#/compare';
    case 'finance':
      return '#/finance';
    case 'quiz':
      return '#/quiz';
    case 'visit':
      return '#/visit';
    case 'admin':
      return '#/admin';
  }
}

export interface FinancingInput {
  priceEgp: number;
  downPaymentPct: number;
  months: number;
  annualRatePct: number;
}

export interface FinancingResult {
  downPaymentEgp: number;
  loanPrincipalEgp: number;
  monthlyPaymentEgp: number;
  totalInterestEgp: number;
  totalPayableEgp: number;
}

export function formatCurrency(
  amountEgp: number,
  currency: CurrencyCode,
  lang: LangCode,
): string {
  const converted = amountEgp * CURRENCY_RATES[currency];
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(converted);
}

export function formatPriceWithSymbol(
  amountEgp: number,
  currency: CurrencyCode,
  lang: LangCode,
): string {
  const num = formatCurrency(amountEgp, currency, lang);
  const sym = CURRENCY_SYMBOLS[currency];
  return currency === 'EGP' ? `${num} ${sym}` : `${sym}${num}`;
}

export function filterCars(
  cars: CarModel[],
  filter: InventoryFilter,
  favoriteIds: string[],
): CarModel[] {
  if (filter === 'all') return cars;
  if (filter === 'favorites') {
    return cars.filter((c) => favoriteIds.includes(c.id));
  }
  return cars.filter((c) => c.type === filter);
}

export function getEffectivePriceEgp(car: CarModel, trimDeltaEgp = 0): number {
  const base =
    typeof car.discountPriceEgp === 'number' &&
    car.discountPriceEgp > 0 &&
    car.discountPriceEgp < car.priceEgp
      ? car.discountPriceEgp
      : car.priceEgp;
  return Math.max(0, base + trimDeltaEgp);
}

export function shadeHexColor(hex: string, amount: number): string {
  const clean = hex.trim().replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return '#d4d4d8';
  }
  const num = parseInt(expanded, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r0 = (num >> 16) & 255;
  const g0 = (num >> 8) & 255;
  const b0 = num & 255;

  const mix = (c: number) =>
    amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);

  const r = clamp(mix(r0)).toString(16).padStart(2, '0');
  const g = clamp(mix(g0)).toString(16).padStart(2, '0');
  const b = clamp(mix(b0)).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function searchAndSortCars(
  cars: CarModel[],
  options: {
    filter: InventoryFilter;
    favoriteIds: string[];
    searchQuery: string;
    sort: SortOption;
    lang: LangCode;
  },
): CarModel[] {
  const base = filterCars(cars, options.filter, options.favoriteIds);
  const q = options.searchQuery.trim().toLocaleLowerCase();

  const searched = q
    ? base.filter((car) => {
        const haystack = [
          car.name,
          car.categoryLabel[options.lang],
          car.engine[options.lang],
          car.tag[options.lang],
          ...(car.colors?.map((col) => `${col.nameAr} ${col.nameEn}`) || []),
          ...car.specs[options.lang],
        ]
          .join(' ')
          .toLocaleLowerCase();
        return haystack.includes(q);
      })
    : [...base];

  if (options.sort === 'price-asc') {
    searched.sort((a, b) => getEffectivePriceEgp(a) - getEffectivePriceEgp(b));
  } else if (options.sort === 'price-desc') {
    searched.sort((a, b) => getEffectivePriceEgp(b) - getEffectivePriceEgp(a));
  }
  return searched;
}

export function isBudgetMatch(
  priceEgp: number,
  budget?: QuizAnswers['budget'],
): boolean {
  if (!budget || budget === 'flexible') return true;
  if (budget === 'under1.5') return priceEgp < 1_500_000;
  if (budget === '1.5-2.5') return priceEgp >= 1_500_000 && priceEgp <= 2_500_000;
  if (budget === '2.5-4') return priceEgp > 2_500_000 && priceEgp <= 4_000_000;
  return true;
}

const PRIORITY_RANKING: Record<NonNullable<QuizAnswers['priority']>, string[]> = {
  comfort: ['citroen-c4', 'hyundai-tucson', 'toyota-corolla-white', 'chery-tiggo-8-pro', 'kia-sportage-white', 'byd-seal', 'jetour-t1', 'fiat-tipo', 'hyundai-elantra-ad', 'mg-zs', 'nissan-sunny', 'mg-5', 'chery-arrizo-5'],
  economy: ['nissan-sunny', 'chery-arrizo-5', 'fiat-tipo', 'mg-5', 'hyundai-elantra-ad', 'mg-zs', 'toyota-corolla-white', 'citroen-c4', 'jetour-t1', 'chery-tiggo-8-pro', 'hyundai-tucson', 'kia-sportage-white', 'byd-seal'],
  tech: ['byd-seal', 'jetour-t1', 'hyundai-tucson', 'kia-sportage-white', 'chery-tiggo-8-pro', 'citroen-c4', 'toyota-corolla-white', 'mg-zs', 'hyundai-elantra-ad', 'mg-5', 'fiat-tipo', 'chery-arrizo-5', 'nissan-sunny'],
  performance: ['byd-seal', 'chery-tiggo-8-pro', 'hyundai-tucson', 'kia-sportage-white', 'jetour-t1', 'citroen-c4', 'toyota-corolla-white', 'hyundai-elantra-ad', 'mg-5', 'mg-zs', 'fiat-tipo', 'chery-arrizo-5', 'nissan-sunny'],
};

export function matchCarsForQuiz(
  cars: CarModel[],
  answers: QuizAnswers,
): CarModel[] {
  let candidates = cars.filter(
    (c) =>
      (!answers.type || answers.type === 'any' || c.type === answers.type) &&
      isBudgetMatch(getEffectivePriceEgp(c), answers.budget),
  );

  if (candidates.length === 0) {
    candidates = cars.filter(
      (c) => !answers.type || answers.type === 'any' || c.type === answers.type,
    );
  }

  if (candidates.length === 0) {
    candidates = [...cars];
  } else {
    candidates = [...candidates];
  }

  const priorityOrder = answers.priority ? PRIORITY_RANKING[answers.priority] : null;

  candidates.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (priorityOrder) {
      const idxA = priorityOrder.indexOf(a.id);
      const idxB = priorityOrder.indexOf(b.id);
      scoreA += idxA === -1 ? 99 : idxA;
      scoreB += idxB === -1 ? 99 : idxB;
    }

    if (answers.who === 'business') {
      if (a.type === 'sedan') scoreA -= 0.5;
      if (b.type === 'sedan') scoreB -= 0.5;
    } else if (answers.who === 'personal') {
      if (a.type === 'suv') scoreA -= 0.25;
      if (b.type === 'suv') scoreB -= 0.25;
    }

    return scoreA - scoreB;
  });

  return candidates.slice(0, 3);
}

export function calculateFinancing(input: FinancingInput): FinancingResult {
  const safePrice = Math.max(0, input.priceEgp);
  const clampedDown = Math.min(85, Math.max(10, input.downPaymentPct));
  const safeMonths = Math.max(6, Math.min(84, Math.round(input.months)));
  const safeRate = Math.max(0, input.annualRatePct);

  const downPaymentEgp = Math.round((safePrice * clampedDown) / 100);
  const loanPrincipalEgp = Math.max(0, safePrice - downPaymentEgp);

  const years = safeMonths / 12;
  const totalInterestEgp = Math.round(loanPrincipalEgp * (safeRate / 100) * years);
  const totalPayableEgp = loanPrincipalEgp + totalInterestEgp;
  const monthlyPaymentEgp = Math.round(totalPayableEgp / safeMonths);

  return {
    downPaymentEgp,
    loanPrincipalEgp,
    monthlyPaymentEgp,
    totalInterestEgp,
    totalPayableEgp,
  };
}

export function buildFinanceSchedule(
  priceEgp: number,
  downPaymentPct: number,
  annualRatePct: number,
): Array<{ months: number } & FinancingResult> {
  return [12, 24, 36, 48, 60].map((months) => ({
    months,
    ...calculateFinancing({ priceEgp, downPaymentPct, months, annualRatePct }),
  }));
}

export function calculateMaxAffordableCarPrice(input: {
  monthlyBudgetEgp: number;
  downPaymentPct: number;
  months: number;
  annualRatePct: number;
}): number {
  const safeMonthly = Math.max(0, input.monthlyBudgetEgp);
  const clampedDown = Math.min(85, Math.max(10, input.downPaymentPct));
  const safeMonths = Math.max(6, Math.min(84, Math.round(input.months)));
  const safeRate = Math.max(0, input.annualRatePct);

  const totalPayable = safeMonthly * safeMonths;
  const years = safeMonths / 12;
  const interestFactor = 1 + (safeRate / 100) * years;
  const maxPrincipal = totalPayable / interestFactor;
  const loanShare = 1 - clampedDown / 100;
  if (loanShare <= 0) return 0;
  return Math.round(maxPrincipal / loanShare);
}

export function findCarsWithinMonthlyBudget(
  cars: CarModel[],
  input: {
    monthlyBudgetEgp: number;
    downPaymentPct: number;
    months: number;
    annualRatePct: number;
  },
): Array<{ car: CarModel; monthlyEgp: number }> {
  return cars
    .map((car) => ({
      car,
      monthlyEgp: calculateFinancing({
        priceEgp: getEffectivePriceEgp(car),
        downPaymentPct: input.downPaymentPct,
        months: input.months,
        annualRatePct: input.annualRatePct,
      }).monthlyPaymentEgp,
    }))
    .filter((item) => item.monthlyEgp <= input.monthlyBudgetEgp)
    .sort((a, b) => a.monthlyEgp - b.monthlyEgp);
}

export interface TcoResult {
  monthlyEnergyEgp: number;
  annualServiceEgp: number;
  threeYearRunningEgp: number;
  isElectric: boolean;
}

export function calculateTCO(input: {
  car: CarModel;
  monthlyKm: number;
  fuelPriceEgpPerLiter: number;
  electricityEgpPerKwh: number;
  years?: number;
}): TcoResult {
  const safeKm = Math.max(100, input.monthlyKm);
  const years = input.years ?? 3;
  const isElectric = input.car.type === 'electric';

  const monthlyEnergyEgp = isElectric
    ? Math.round(((safeKm / 100) * (input.car.kwhPer100Km || 16.5)) * input.electricityEgpPerKwh)
    : Math.round(((safeKm / 100) * (input.car.fuelLitersPer100Km || 7.2)) * input.fuelPriceEgpPerLiter);

  const annualServiceEgp =
    input.car.annualServiceEgp ?? (isElectric ? 6500 : input.car.type === 'suv' ? 17500 : 12000);
  const threeYearRunningEgp = monthlyEnergyEgp * 12 * years + annualServiceEgp * years;

  return {
    monthlyEnergyEgp,
    annualServiceEgp,
    threeYearRunningEgp,
    isElectric,
  };
}

export function validateVisitForm(input: {
  name: string;
  phone: string;
}): 'ok' | 'required' | 'invalid_phone' {
  const name = input.name.trim();
  const phoneDigits = input.phone.replace(/[^\d]/g, '');
  if (!name || !input.phone.trim()) {
    return 'required';
  }
  if (phoneDigits.length < 8) {
    return 'invalid_phone';
  }
  return 'ok';
}

export function upsertCarInCatalog(
  cars: CarModel[],
  car: CarModel,
): CarModel[] {
  const idx = cars.findIndex((c) => c.id === car.id);
  if (idx === -1) {
    return [car, ...cars];
  }
  return cars.map((c) => (c.id === car.id ? car : c));
}

export function updateBookingStatusInList(
  bookings: VisitBooking[],
  bookingId: string,
  status: BookingStatus,
): VisitBooking[] {
  return bookings.map((b) => (b.id === bookingId ? { ...b, status } : b));
}

export function bookingsToCsv(bookings: VisitBooking[], cars: CarModel[]): string {
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Booking ID', 'Customer Name', 'Phone', 'Car', 'Preferred Date', 'Status', 'Notes', 'Created At'].join(',');
  const rows = bookings.map((b) => {
    const carName = cars.find((c) => c.id === b.carId)?.name || b.carId;
    return [
      esc(b.id),
      esc(b.name),
      esc(b.phone),
      esc(carName),
      esc(b.date),
      esc(b.status),
      esc(b.notes || ''),
      esc(b.createdAt),
    ].join(',');
  });
  return '\uFEFF' + [header, ...rows].join('\n');
}

export function verifyAdminPasscode(
  entered: string,
  expected: string,
): boolean {
  return entered.trim().length > 0 && entered.trim() === expected.trim();
}

export function generateAssistantReply(
  query: string,
  cars: CarModel[],
  currency: CurrencyCode,
  lang: LangCode,
): string {
  const s = query.toLocaleLowerCase().trim();

  const messages: Record<
    LangCode,
    {
      compareHint: string;
      newOnly: string;
      finance: string;
      budget: string;
      spec: string;
      fallback: string;
      matchesPrefix: string;
      indicativeSuffix: string;
      seatsWord: string;
    }
  > = {
    ar: {
      compareHint: 'اكتب اسمي موديلين للمقارنة، مثل: قارن MG 5 و BYD Seal.',
      newOnly: 'LANE متخصصة في بيع السيارات الجديدة فقط، ولا تبيع أو تشتري سيارات مستعملة.',
      finance:
        'المقدم يبدأ عادةً من 20% إلى 50% بمدد سداد من 12 إلى 60 شهرًا حسب جهة التمويل. يمكنك تجربة صفحة التمويل لحساب القسط فورًا.',
      budget:
        'اكتب ميزانيتك بالجنيه المصري، مثل «أقل من 1.5 مليون»، لأرشح لك الموديلات الأقرب. الأسعار استرشادية.',
      spec: 'أقدر أوضح بيانات المحرك، القوة، ناقل الحركة، نظام الدفع وعدد المقاعد للموديلات المعروضة.',
      fallback:
        'اسألني عن موديل بالاسم، أو قارن بين موديلين، أو اكتب ميزانيتك. السعر والتوافر النهائي يُؤكدان مع المعرض.',
      matchesPrefix: 'الموديلات المناسبة من المعروض: ',
      indicativeSuffix: ' — الأسعار استرشادية.',
      seatsWord: 'مقاعد',
    },
    en: {
      compareHint: 'Enter two model names to compare, such as MG 5 and BYD Seal.',
      newOnly: 'LANE sells brand-new cars only and does not buy or trade used cars.',
      finance:
        'Down payments typically start around 20%–50% over 12–60 months depending on the lender. Open the Financing page to simulate payments.',
      budget:
        'Share your budget in EGP, e.g. "under 1.5 million", and I will suggest matching models.',
      spec: 'I can explain engine, power, gearbox, drivetrain, and seating for any listed model.',
      fallback:
        'Ask about a specific model, compare two cars, or share your budget. Final trim and pricing are confirmed with the showroom.',
      matchesPrefix: 'Matching models from our collection: ',
      indicativeSuffix: ' — indicative prices.',
      seatsWord: 'seats',
    },
    fr: {
      compareHint: 'Indiquez deux modèles à comparer, par exemple MG 5 et BYD Seal.',
      newOnly: 'LANE vend uniquement des voitures neuves et ne reprend pas de véhicules d’occasion.',
      finance:
        'L’apport se situe généralement entre 20 % et 50 % sur 12 à 60 mois. Essayez notre page Financement.',
      budget: 'Indiquez votre budget en EGP, par exemple « moins de 1,5 million ».',
      spec: 'Je peux détailler le moteur, la puissance, la boîte et le nombre de places.',
      fallback: 'Demandez un modèle, comparez deux voitures ou indiquez votre budget.',
      matchesPrefix: 'Modèles correspondants : ',
      indicativeSuffix: ' — prix indicatifs.',
      seatsWord: 'places',
    },
    zh: {
      compareHint: '请输入两个车型名称进行对比，例如 MG 5 和 BYD Seal。',
      newOnly: 'LANE 仅销售全新车辆，不提供二手车买卖服务。',
      finance: '首付通常在 20% 至 50% 之间，期限 12–60 个月。请前往金融测算页面计算。',
      budget: '请输入您的埃镑预算，例如“低于150万”，我将推荐匹配车型。',
      spec: '我可以介绍任意车型的发动机、功率、变速箱、驱动方式与座位数。',
      fallback: '您可以询问车型详情、对比两款车或告诉您的预算。',
      matchesPrefix: '为您匹配的展厅车型：',
      indicativeSuffix: ' — 仅供参考价。',
      seatsWord: '座',
    },
    de: {
      compareHint: 'Nennen Sie zwei Modelle zum Vergleich, z. B. MG 5 und BYD Seal.',
      newOnly: 'LANE verkauft ausschließlich Neuwagen und handelt nicht mit Gebrauchtwagen.',
      finance:
        'Anzahlungen liegen meist bei 20 %–50 % über 12–60 Monate. Nutzen Sie gerne unsere Finanzierungsseite.',
      budget: 'Nennen Sie Ihr Budget in EGP, z. B. „unter 1,5 Millionen“.',
      spec: 'Ich kann Motor, Leistung, Getriebe, Antrieb und Sitze aller Modelle erklären.',
      fallback: 'Fragen Sie nach einem Modell, vergleichen Sie zwei Autos oder nennen Sie Ihr Budget.',
      matchesPrefix: 'Passende Modelle aus unserer Auswahl: ',
      indicativeSuffix: ' — Richtpreise.',
      seatsWord: 'Sitze',
    },
  };

  const t = messages[lang] || messages.en;

  if (/مستعمل|بيع عرب|used|occasion|二手|gebraucht/.test(s)) {
    return t.newOnly;
  }

  const found = cars.filter((c) => {
    const lowerName = c.name.toLocaleLowerCase();
    const asciiName = lowerName.replace('citroën', 'citroen');
    const tokens = asciiName.split(' ');
    return (
      s.includes(lowerName) ||
      s.includes(asciiName) ||
      (tokens.length >= 2 && s.includes(tokens.slice(0, 2).join(' '))) ||
      (c.id === 'jetour-t1' && (s.includes('jetour') || s.includes('جيتور'))) ||
      (c.id === 'nissan-sunny' && (s.includes('sunny') || s.includes('nissan') || s.includes('صني') || s.includes('نيسان'))) ||
      (c.id === 'toyota-corolla-white' && (s.includes('corolla') || s.includes('كورولا') || s.includes('تويوتا'))) ||
      (c.id === 'kia-sportage-white' && (s.includes('sportage') || s.includes('سبورتاج') || s.includes('كيا'))) ||
      (c.id === 'hyundai-tucson' && (s.includes('tucson') || s.includes('توسان'))) ||
      (c.id === 'mg-zs' && (s.includes('zs') || s.includes('mg zs'))) ||
      (c.id === 'chery-arrizo-5' && (s.includes('arrizo') || s.includes('اريزو') || s.includes('أريزو'))) ||
      (c.id === 'fiat-tipo' && (s.includes('tipo') || s.includes('fiat') || s.includes('تيبو') || s.includes('فيات'))) ||
      (c.id === 'citroen-c4' && (s.includes('c4') || s.includes('citroen') || s.includes('سيتروين'))) ||
      (c.id === 'hyundai-elantra-ad' && (s.includes('elantra') || s.includes('إلنترا') || s.includes('النترا'))) ||
      (c.id === 'chery-tiggo-8-pro' && (s.includes('tiggo') || s.includes('تيجو'))) ||
      (c.id === 'byd-seal' && (s.includes('seal') || s.includes('byd')))
    );
  });

  if (found.length >= 2) {
    const [a, b] = found;
    const headers: Record<LangCode, string[]> = {
      ar: ['السعر', 'المحرك', 'القوة', 'ناقل الحركة', 'الدفع', 'المقاعد'],
      en: ['Price', 'Engine', 'Power', 'Gearbox', 'Drive', 'Seats'],
      fr: ['Prix', 'Moteur', 'Puissance', 'Boîte', 'Transmission', 'Places'],
      zh: ['价格', '发动机', '功率', '变速箱', '驱动', '座位'],
      de: ['Preis', 'Motor', 'Leistung', 'Getriebe', 'Antrieb', 'Sitze'],
    };
    const h = headers[lang] || headers.en;
    const rows = [
      [
        formatPriceWithSymbol(getEffectivePriceEgp(a), currency, lang),
        formatPriceWithSymbol(getEffectivePriceEgp(b), currency, lang),
      ],
      [a.engine[lang], b.engine[lang]],
      [a.power, b.power],
      [a.gearbox[lang], b.gearbox[lang]],
      [a.drive, b.drive],
      [a.seats, b.seats],
    ];
    return `${a.name} vs ${b.name}\n` + rows.map((r, i) => `${h[i]}: ${r[0]} | ${r[1]}`).join('\n');
  }

  if (found.length === 1) {
    const c = found[0];
    return `${c.name} · ${formatPriceWithSymbol(getEffectivePriceEgp(c), currency, lang)}\n${c.engine[lang]} · ${c.power} · ${c.gearbox[lang]} · ${c.drive} · ${c.seats} ${t.seatsWord}`;
  }

  if (/تمويل|قسط|finance|installment|financement|分期|金融|finanzier/.test(s)) {
    return t.finance;
  }

  if (/مقارن|قارن|compare|comparer|对比|比较|vergleich|فرق/.test(s)) {
    return t.compareHint;
  }

  let matched: CarModel[] = [];
  if (/suv|عائل|أسرة|اوفرو|越野|geländewagen/.test(s)) {
    matched = cars.filter((c) => c.type === 'suv');
  } else if (/سيدان|sedan|berline|轿车|limousine/.test(s)) {
    matched = cars.filter((c) => c.type === 'sedan');
  } else if (/كهرب|electric|électrique|电动|elektro|ev/.test(s)) {
    matched = cars.filter((c) => c.type === 'electric');
  }

  const budgetMatch = s.match(
    /(?:أقل من|اقل من|under|moins de|低于|unter)\s*(\d+(?:\.\d+)?)\s*(مليون|million|万|m)?/i,
  );
  if (budgetMatch) {
    const rawNum = Number(budgetMatch[1]);
    const unit = budgetMatch[2]?.toLowerCase();
    const thresholdEgp =
      unit === '万' ? rawNum * 10_000 : unit ? rawNum * 1_000_000 : rawNum < 100 ? rawNum * 1_000_000 : rawNum;
    matched = cars
      .filter((c) => getEffectivePriceEgp(c) <= thresholdEgp)
      .sort((a, b) => getEffectivePriceEgp(a) - getEffectivePriceEgp(b));
  }

  if (matched.length > 0) {
    return (
      t.matchesPrefix +
      matched
        .slice(0, 4)
        .map((c) => `${c.name} (${formatPriceWithSymbol(getEffectivePriceEgp(c), currency, lang)})`)
        .join(' · ') +
      t.indicativeSuffix
    );
  }

  if (/ميزان|budget|سعر|price|بكام|كم|€|\$|egp|جنيه/.test(s)) {
    return t.budget;
  }

  if (/موتور|محرك|engine|horsepower|قوة|قير|ناقل|مقاعد|seats|spécification|发动机|motor|leistung|spezifik/.test(s)) {
    return t.spec;
  }

  return t.fallback;
}
