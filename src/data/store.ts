import { CARS, type CarModel, type LangCode } from './cars';

export type BookingStatus = 'pending' | 'confirmed' | 'completed';

export interface VisitBooking {
  id: string;
  name: string;
  phone: string;
  carId: string;
  date: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

export type FinanceEntryType = 'income' | 'expense';
export type FinanceCategory =
  | 'car-sale'
  | 'deposit'
  | 'commission'
  | 'other-income'
  | 'supplier'
  | 'operations'
  | 'marketing'
  | 'salaries'
  | 'delivery'
  | 'other-expense';
export type FinancePaymentMethod = 'cash' | 'bank' | 'wallet' | 'card' | 'other';
export type FinanceEntryStatus = 'posted' | 'voided';

/** One manually recorded EGP cashbook transaction. Visit requests are not accounting income. */
export interface FinanceEntry {
  id: string;
  type: FinanceEntryType;
  category: FinanceCategory;
  amountEgp: number;
  occurredOn: string;
  paymentMethod: FinancePaymentMethod;
  carId?: string;
  counterparty?: string;
  reference?: string;
  notes?: string;
  status: FinanceEntryStatus;
  createdAt: string;
  voidedAt?: string;
  voidReason?: string;
}

export type LeadStage = 'new' | 'contacted' | 'interested' | 'visit' | 'won' | 'lost';
export type LeadSource = 'whatsapp' | 'phone' | 'showroom' | 'website' | 'referral' | 'other';

export interface CustomerLead {
  id: string;
  name: string;
  phone: string;
  carId?: string;
  source: LeadSource;
  stage: LeadStage;
  nextFollowUp?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialItem {
  id: string;
  authorAr: string;
  authorEn: string;
  carName: string;
  quoteAr: string;
  quoteEn: string;
}

export interface FaqItem {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

export interface ShowroomSettings {
  phoneDisplay: string;
  whatsappDigits: string;
  addressAr: string;
  addressEn: string;
  hoursAr: string;
  hoursEn: string;
  defaultAnnualRatePct: number;
  heroEyebrowAr: string;
  heroEyebrowEn: string;
  marqueeText: string;
  fuelPriceEgpPerLiter: number;
  electricityEgpPerKwh: number;
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
}

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'rev-1',
    authorAr: 'طارق عبد الرحمن',
    authorEn: 'Tarek Abdelrahman',
    carName: 'Jetour T1 · أبيض لؤلؤي',
    quoteAr: 'استلمت سيارتي الجديدة من الشيخ زايد في نفس الأسبوع بدون أي تعقيد، وحاسبة التمويل كانت مطابقة للواقع.',
    quoteEn: 'Picked up my new car in Sheikh Zayed within the same week with zero hassle and transparent bank terms.',
  },
  {
    id: 'rev-2',
    authorAr: 'سلمى حسام',
    authorEn: 'Salma Hossam',
    carName: 'Toyota Corolla 2026',
    quoteAr: 'المقارنة الجانبية وتوضيح مصاريف التشغيل ساعدوني أختار الفئة الأنسب لميزانيتي بسهولة.',
    quoteEn: 'The side-by-side comparison and running cost breakdown made selecting the right trim effortless.',
  },
  {
    id: 'rev-3',
    authorAr: 'مهند فؤاد',
    authorEn: 'Mohanad Fouad',
    carName: 'BYD Seal Electric',
    quoteAr: 'تجربة راقية ومستشارون فاهمين تفاصيل السيارات الكهربائية والشحن المنزلي في مصر.',
    quoteEn: 'Refined showroom experience with advisors who truly understand EV ownership and home charging in Egypt.',
  },
];

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    questionAr: 'هل كل السيارات المعروضة جديدة (زيرو) بضمان الوكيل؟',
    questionEn: 'Are all listed vehicles brand-new with official warranty?',
    answerAr: 'نعم، LANE متخصصة 100% في السيارات الجديدة فقط بضمان الوكيل الرسمي في مصر، ولا نتعامل في السيارات المستعملة.',
    answerEn: 'Yes. LANE deals exclusively in brand-new zero-mileage vehicles backed by official Egypt distributor warranties.',
  },
  {
    id: 'faq-2',
    questionAr: 'ما الأوراق المطلوبة للتقسيط البنكي؟',
    questionEn: 'What documents are needed for bank financing?',
    answerAr: 'بطاقة رقم قومي سارية، إثبات دخل أو سجل تجاري/بطاقة ضريبية، وإيصال مرافق حديث، وتتم الموافقة المبدئية خلال 48–72 ساعة.',
    answerEn: 'Valid national ID, proof of income or commercial register, and a recent utility bill; initial approvals usually complete in 48–72 hours.',
  },
  {
    id: 'faq-3',
    questionAr: 'هل تتوفر السيارات باللون الأبيض اللؤلؤي والتسليم الفوري؟',
    questionEn: 'Are Pearl White editions available for immediate delivery?',
    answerAr: 'نوفر أبرز الموديلات باللون الأبيض اللؤلؤي والأسود والفضي حسب حالة كل موديل الظاهرة في الكتالوج (متوفرة أو حجز مسبق).',
    answerEn: 'Pearl White and flagship colors are stocked across core models; live stock badges on each card indicate immediate pickup or pre-order.',
  },
  {
    id: 'faq-4',
    questionAr: 'هل الأسعار المعروضة نهائية أم استرشادية؟',
    questionEn: 'Are displayed prices final or indicative?',
    answerAr: 'الأسعار تعكس قوائم السوق والوكلاء الرسمية لعام 2026، ويتم تأكيد السعر والفئة النهائية واللون عند حجز المعاينة مع مستشار المعرض.',
    answerEn: 'Prices reflect current 2026 Egypt distributor/market guides and are locked in upon showroom booking confirmation.',
  },
];

export const DEFAULT_SETTINGS: ShowroomSettings = {
  phoneDisplay: '+20 127 455 5677',
  whatsappDigits: '201274555677',
  addressAr: 'وصلة دهشور — الشيخ زايد، 6 أكتوبر',
  addressEn: 'Waslet Dahshur — Sheikh Zayed, 6 October',
  hoursAr: 'يوميًا من 11 صباحًا – 10 مساءً (تواصل للتأكيد)',
  hoursEn: 'Daily 11:00 AM – 10:00 PM (Contact to confirm)',
  defaultAnnualRatePct: 13,
  heroEyebrowAr: 'اختيار جديد. تجربة مختلفة.',
  heroEyebrowEn: 'A new choice. A different experience.',
  marqueeText: 'NEW CARS ONLY · PEARL WHITE EDITIONS · REAL 2026 EGYPT PRICES · LANE SHEIKH ZAYED ·',
  fuelPriceEgpPerLiter: 15.25,
  electricityEgpPerKwh: 2.25,
  testimonials: DEFAULT_TESTIMONIALS,
  faqs: DEFAULT_FAQS,
};

export const INITIAL_BOOKINGS: VisitBooking[] = [
  {
    id: 'LANE-2041',
    name: 'كريم المنصور',
    phone: '+20 100 442 8910',
    carId: 'jetour-t1',
    date: '2026-11-24',
    status: 'confirmed',
    notes: 'يفضل معاينة اللون الأبيض اللؤلؤي بعد الساعة 4 عصرًا',
    createdAt: '2026-11-20T14:20:00Z',
  },
  {
    id: 'LANE-2042',
    name: 'Nourhan El-Masry',
    phone: '+20 122 890 3145',
    carId: 'byd-seal',
    date: '2026-11-26',
    status: 'pending',
    notes: 'استفسار عن الشحن المنزلي والتمويل',
    createdAt: '2026-11-21T09:15:00Z',
  },
];

export const STORAGE_KEYS = {
  cars: 'lane_catalog_cars_v3',
  bookings: 'lane_visit_bookings_v1',
  settings: 'lane_showroom_settings_v2',
  favorites: 'lane_favorites',
  compare: 'lane_compare_selection_v1',
};

export function loadStoredCars(): CarModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cars);
    if (!raw) return CARS;
    const parsed = JSON.parse(raw) as CarModel[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : CARS;
  } catch {
    return CARS;
  }
}

export function loadStoredBookings(): VisitBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.bookings);
    if (!raw) return INITIAL_BOOKINGS;
    const parsed = JSON.parse(raw) as VisitBooking[];
    return Array.isArray(parsed) ? parsed : INITIAL_BOOKINGS;
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function loadStoredSettings(): ShowroomSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ShowroomSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
        ? parsed.testimonials
        : DEFAULT_TESTIMONIALS,
      faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0
        ? parsed.faqs
        : DEFAULT_FAQS,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function createLocalizedRecord(
  arText: string,
  enText: string,
): Record<LangCode, string> {
  const cleanAr = arText.trim() || enText.trim();
  const cleanEn = enText.trim() || arText.trim();
  return {
    ar: cleanAr,
    en: cleanEn,
    fr: cleanEn,
    zh: cleanEn,
    de: cleanEn,
  };
}
