export type CarType = 'suv' | 'sedan' | 'electric';
export type Lang = 'ar' | 'en' | 'fr' | 'zh' | 'de';
export type Currency = 'EGP' | 'USD' | 'EUR' | 'GBP' | 'CNY';

export interface CarModel {
  id: string;
  name: string;
  year: number;
  type: CarType;
  categoryLabel: string;
  priceEgp: number;
  horsepower: number;
  img: string;
  insideImg: string;
  sourceUrl: string;
  tag: Record<Lang, string>;
  quickSpecs: Record<Lang, string[]>;
  engine: Record<Lang, string>;
  power: string;
  torque: string;
  gearbox: Record<Lang, string>;
  drive: string;
  seats: string;
  features: Record<Lang, string[]>;
  story: Record<Lang, string>;
  availabilityNote?: Record<Lang, string>;
  idealFor: {
    usage: ('personal' | 'business')[];
    priority: ('comfort' | 'economy' | 'tech' | 'performance')[];
  };
}

export const CURRENCY_RATES: Record<Currency, number> = {
  EGP: 1,
  USD: 0.0202,
  EUR: 0.0186,
  GBP: 0.0159,
  CNY: 0.145,
};

export const CURRENCY_SYMBOLS: Record<Currency, Record<Lang, string>> = {
  EGP: { ar: 'ج.م', en: 'EGP', fr: 'EGP', zh: '埃镑', de: 'EGP' },
  USD: { ar: '$', en: '$', fr: '$', zh: '$', de: '$' },
  EUR: { ar: '€', en: '€', fr: '€', zh: '€', de: '€' },
  GBP: { ar: '£', en: '£', fr: '£', zh: '£', de: '£' },
  CNY: { ar: '¥', en: '¥', fr: '¥', zh: '¥', de: '¥' },
};

export function formatPrice(amountEgp: number, currency: Currency, lang: Lang): string {
  const converted = amountEgp * CURRENCY_RATES[currency];
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(converted);
}

export const CARS: CarModel[] = [
  {
    id: 'jetour-t1',
    name: 'Jetour T1',
    year: 2026,
    type: 'suv',
    categoryLabel: 'SUV · PREMIUM',
    priceEgp: 1730000,
    horsepower: 184,
    img: 'https://egypt.yallamotor.com/_next/image?q=75&url=https%3A%2F%2Fymimg1.b8cdn.com%2Fresized%2Fcar_model%2F11834%2Fpictures%2F13647399%2Fwebp_listing_main_Jetour-T1-2025-Exterior-2.webp&w=1920',
    insideImg:
      'https://media.egypttelegraph.com/ArticleUpload/2025/5/21/%D9%85%D9%82%D8%B5%D9%88%D8%B1%D8%A9_1774_015117.jpg',
    sourceUrl: 'https://jetouregypt.com/models/T1/',
    tag: { ar: 'الأكثر طلبًا', en: 'Popular', fr: 'Populaire', zh: '热门', de: 'Beliebt' },
    quickSpecs: {
      ar: ['1.5 تيربو', '184 حصان', '7DCT'],
      en: ['1.5 Turbo', '184 hp', '7DCT'],
      fr: ['1.5 Turbo', '184 ch', '7DCT'],
      zh: ['1.5 涡轮', '184 马力', '7DCT'],
      de: ['1.5 Turbo', '184 PS', '7DCT'],
    },
    engine: {
      ar: '1.5 لتر تيربو بنزين',
      en: '1.5L turbo petrol',
      fr: '1.5L essence turbo',
      zh: '1.5L 涡轮增压汽油',
      de: '1.5L Turbobenziner',
    },
    power: '184 hp',
    torque: '290 Nm',
    gearbox: {
      ar: 'أوتوماتيك 7 سرعات DCT',
      en: '7-speed DCT',
      fr: 'DCT 7 rapports',
      zh: '7速双离合',
      de: '7-Gang DCT',
    },
    drive: 'FWD',
    seats: '5',
    features: {
      ar: ['شاشة 15.6 بوصة', 'كاميرا 540°', 'سقف بانوراما', 'مقاعد أمامية مهواة'],
      en: ['15.6-inch screen', '540° camera', 'Panoramic roof', 'Ventilated front seats'],
      fr: ['Écran 15,6 pouces', 'Caméra 540°', 'Toit panoramique', 'Sièges ventilés'],
      zh: ['15.6英寸大屏', '540°全景影像', '全景天窗', '前排座椅通风'],
      de: ['15,6-Zoll-Display', '540°-Kamera', 'Panoramadach', 'Belüftete Vordersitze'],
    },
    story: {
      ar: 'جيتور T1 تجمع بين شكل الـ SUV الجريء ومقصورة تقنية واسعة؛ خمسة مقاعد وتجهيزات متطورة للرحلات والقيادة اليومية.',
      en: 'The Jetour T1 pairs a bold SUV silhouette with a tech-focused five-seat cabin built for daily drives and longer trips.',
      fr: 'Le Jetour T1 associe une silhouette SUV affirmée à un habitacle technologique spacieux pour 5 passagers.',
      zh: '捷途 T1 兼具硬朗 SUV 造型与科技感五座座舱，适合日常通勤与长途自驾。',
      de: 'Der Jetour T1 verbindet ein markantes SUV-Design mit einem modernen Fünfsitzer-Interieur für Alltag und Reisen.',
    },
    idealFor: {
      usage: ['personal', 'business'],
      priority: ['tech', 'performance', 'comfort'],
    },
  },
  {
    id: 'citroen-c4-shine',
    name: 'Citroën C4 Shine',
    year: 2026,
    type: 'suv',
    categoryLabel: 'CROSSOVER · SHINE',
    priceEgp: 1540000,
    horsepower: 130,
    img: 'https://legion-images.hatla2ee.com/original_image/3c96062a-49c6-470a-93b0-aa3e4e56e5d2/large.jpg',
    insideImg:
      'https://s.auto.drom.ru/i24298/c/photos/fullsize/citroen/c4/citroen_c4_1229072.jpg',
    sourceUrl: 'https://www.citroen-eg.com/content/dam/citroen/egypt/CITROEN-C4-Brochure-1.pdf',
    tag: { ar: 'جديد 2026', en: 'New', fr: 'Nouveau', zh: '新款', de: 'Neu' },
    quickSpecs: {
      ar: ['1.2 تيربو', '130 حصان', '8 سرعات AT'],
      en: ['1.2 Turbo', '130 hp', '8-Speed AT'],
      fr: ['1.2 Turbo', '130 ch', 'BVA 8'],
      zh: ['1.2 涡轮', '130 马力', '8速自动'],
      de: ['1.2 Turbo', '130 PS', '8-Gang AT'],
    },
    engine: {
      ar: '1.2 لتر PureTech تيربو',
      en: '1.2L PureTech turbo petrol',
      fr: '1.2L PureTech turbo',
      zh: '1.2L PureTech 涡轮',
      de: '1.2L PureTech Turbo',
    },
    power: '130 hp',
    torque: '230 Nm',
    gearbox: {
      ar: 'أوتوماتيك 8 سرعات',
      en: '8-speed automatic',
      fr: 'Automatique 8 rapports',
      zh: '8速手自一体',
      de: '8-Stufen-Automatik',
    },
    drive: 'FWD',
    seats: '5',
    features: {
      ar: ['عدادات رقمية', 'مقاعد راحة متقدمة', 'شنطة 380 لتر', 'أنظمة مساعدة القيادة'],
      en: ['Digital cockpit', 'Advanced comfort seats', '380L luggage space', 'Driver assistance'],
      fr: ['Cockpit numérique', 'Sièges Advanced Comfort', 'Coffre 380L', 'Aides à la conduite'],
      zh: ['全液晶仪表', '高舒适座椅', '380L 后备箱', '驾驶辅助系统'],
      de: ['Digitales Cockpit', 'Advanced Comfort Sitze', '380L Kofferraum', 'Fahrassistenz'],
    },
    story: {
      ar: 'سيتروين C4 Shine كروس أوفر أوروبية مريحة بمحرك PureTech تيربو، مع نظام تعليق يركّز على راحة الركوب ومساحة عملية.',
      en: 'The Citroën C4 Shine is a comfort-oriented European crossover with a PureTech turbo powertrain and serene suspension.',
      fr: 'La Citroën C4 Shine privilégie le confort de conduite avec son moteur PureTech turbo et son habitacle soigné.',
      zh: '雪铁龙 C4 Shine 主打欧式驾乘舒适性，搭载 PureTech 涡轮动力与实用空间。',
      de: 'Der Citroën C4 Shine bietet europäischen Fahrkomfort mit PureTech-Turbomotor und durchdachtem Raumangebot.',
    },
    idealFor: {
      usage: ['personal'],
      priority: ['comfort', 'economy'],
    },
  },
  {
    id: 'hyundai-elantra-ad',
    name: 'Hyundai Elantra AD',
    year: 2026,
    type: 'sedan',
    categoryLabel: 'SEDAN · SMART',
    priceEgp: 1120000,
    horsepower: 127.5,
    img: 'https://images.dubizzle.com.eg/thumbnails/156279067-800x600.jpeg',
    insideImg:
      'https://ymimg1.b8cdn.com/resized/car_model/10544/pictures/12924426/webp_listing_main_2024-Hyundai-Elantra-AD-Interior-1.webp',
    sourceUrl: 'https://hyundai-egypt.net/wp-content/uploads/2024/08/Elantra-AD-Brochure_updated.pdf',
    tag: { ar: 'الأكثر مبيعًا', en: 'Bestseller', fr: 'Best-seller', zh: '畅销款', de: 'Bestseller' },
    quickSpecs: {
      ar: ['1.6 MPI', '127.5 حصان', '6 سرعات AT'],
      en: ['1.6 MPI', '127.5 hp', '6-Speed AT'],
      fr: ['1.6 MPI', '127,5 ch', 'BVA 6'],
      zh: ['1.6 MPI', '127.5 马力', '6速自动'],
      de: ['1.6 MPI', '127,5 PS', '6-Gang AT'],
    },
    engine: {
      ar: '1.6 لتر MPI بنزين',
      en: '1.6L MPI petrol',
      fr: '1.6L MPI essence',
      zh: '1.6L MPI 自然吸气',
      de: '1.6L MPI Benzin',
    },
    power: '127.5 hp',
    torque: '155 Nm',
    gearbox: {
      ar: 'أوتوماتيك 6 سرعات',
      en: '6-speed automatic',
      fr: 'Automatique 6 rapports',
      zh: '6速自动变速箱',
      de: '6-Stufen-Automatik',
    },
    drive: 'FWD',
    seats: '5',
    features: {
      ar: ['شاشة لمس وسطية', 'عجلة قيادة متعددة الوظائف', 'كاميرا خلفية', 'مقصورة عملية موثوقة'],
      en: ['Touchscreen infotainment', 'Multi-function steering', 'Rear camera', 'Practical sedan cabin'],
      fr: ['Écran tactile', 'Volant multifonction', 'Caméra de recul', 'Habitacle pratique'],
      zh: ['触控中控屏', '多功能方向盘', '倒车影像', '实用轿车座舱'],
      de: ['Touchscreen-Infotainment', 'Multifunktionslenkrad', 'Rückfahrkamera', 'Praktischer Innenraum'],
    },
    story: {
      ar: 'هيونداي إلنترا AD سيدان اعتمادية بمحرك MPI اقتصادي وتجهيزات يومية مناسبة للتنقل داخل المدينة وعلى الطرق السريعة.',
      en: 'The Hyundai Elantra AD is a dependable everyday sedan with an economical MPI engine suited for city and highway commutes.',
      fr: 'La Hyundai Elantra AD est une berline fiable dotée d’un moteur MPI économique pour la ville et l’autoroute.',
      zh: '现代 Elantra AD 以可靠耐用著称，搭载经济型 MPI 发动机，兼顾城市与高速出行。',
      de: 'Der Hyundai Elantra AD überzeugt als zuverlässige Limousine mit sparsamem MPI-Motor für Stadt und Autobahn.',
    },
    idealFor: {
      usage: ['personal', 'business'],
      priority: ['economy', 'comfort'],
    },
  },
  {
    id: 'chery-tiggo-8-pro',
    name: 'Chery Tiggo 8 Pro',
    year: 2026,
    type: 'suv',
    categoryLabel: 'SUV · FAMILY 7-SEAT',
    priceEgp: 1690000,
    horsepower: 197,
    img: 'https://legion-images.hatla2ee.com/listing_image/acfe226d-be46-42a9-8328-048699d59be7/large.jpg',
    insideImg: 'https://material.chery.cn/media/gsnp2spn/1680700_1.jpg',
    sourceUrl:
      'https://www.chery-eg.com/media/files/TIGGO_8_PRO_MAXbrochure_2025-07-30_121132.684057.pdf',
    tag: { ar: 'عائلية 7 مقاعد', en: 'Family', fr: 'Familiale', zh: '7座家用', de: 'Familien-SUV' },
    quickSpecs: {
      ar: ['1.6 تيربو', '197 حصان', '7 مقاعد'],
      en: ['1.6 Turbo', '197 hp', '7 Seats'],
      fr: ['1.6 Turbo', '197 ch', '7 Places'],
      zh: ['1.6 涡轮', '197 马力', '7座'],
      de: ['1.6 Turbo', '197 PS', '7-Sitzer'],
    },
    engine: {
      ar: '1.6 لتر TGDI تيربو بنزين',
      en: '1.6L TGDI turbo petrol',
      fr: '1.6L TGDI turbo',
      zh: '1.6L TGDI 涡轮增压',
      de: '1.6L TGDI Turbo',
    },
    power: '197 hp',
    torque: '290 Nm',
    gearbox: {
      ar: '7 سرعات Wet DCT',
      en: '7-speed wet DCT',
      fr: 'DCT 7 rapports à bain d’huile',
      zh: '7速湿式双离合',
      de: '7-Gang-Nasskupplungs-DCT',
    },
    drive: 'FWD',
    seats: '7',
    features: {
      ar: ['ثلاثة صفوف مقاعد', 'شاشتان 12.3 بوصة', 'رؤية محيطية 540°', 'أنظمة أمان متقدمة'],
      en: ['Three-row seating', 'Dual 12.3-inch displays', '540° surround view', 'Driver assistance'],
      fr: ['3 rangées de sièges', 'Double écran 12,3"', 'Vision 540°', 'Aides à la conduite'],
      zh: ['三排七座布局', '双12.3英寸联屏', '540°环视系统', '智能驾驶辅助'],
      de: ['Drei Sitzreihen', 'Duales 12,3"-Display', '540°-Rundumsicht', 'Assistenzsysteme'],
    },
    story: {
      ar: 'تيجو 8 برو SUV عائلية بثلاثة صفوف تتسع لـ 7 ركاب، محرك تيربو 197 حصان ومقصورة مليئة بالتقنيات الحديثة.',
      en: 'The Chery Tiggo 8 Pro is a three-row family SUV with a 197 hp turbo engine and a dual-screen digital cockpit.',
      fr: 'Le Chery Tiggo 8 Pro offre 7 places, un moteur turbo de 197 ch et un double écran numérique.',
      zh: '奇瑞瑞虎 8 Pro 采用三排七座设计，搭载 197 马力涡轮动力与双联屏智能座舱。',
      de: 'Der Chery Tiggo 8 Pro ist ein Siebensitzer-Familien-SUV mit 197 PS Turbomotor und digitalem Cockpit.',
    },
    idealFor: {
      usage: ['personal', 'business'],
      priority: ['comfort', 'tech', 'performance'],
    },
  },
  {
    id: 'mg-5',
    name: 'MG 5',
    year: 2026,
    type: 'sedan',
    categoryLabel: 'SEDAN · COMFORT',
    priceEgp: 990000,
    horsepower: 120,
    img: 'https://egypt.yallamotor.com/_next/image?q=75&url=https%3A%2F%2Fymimg1.b8cdn.com%2Fresized%2Fcar_model%2F10751%2Fpictures%2F15159493%2Fwebp_listing_main_mg-5-side-view-785034.webp&w=1920',
    insideImg:
      'https://www.dubicars.com/images/bda9b3/w_1300x760/genuine-international-automobile-fzco/e0c8388e-f0a0-427a-ad68-0519e0bc3c00.jpg',
    sourceUrl: 'https://www.mgmotor.com.eg/model/mg5/',
    tag: { ar: 'أفضل قيمة', en: 'Best Value', fr: 'Meilleur rapport', zh: '高性价比', de: 'Preis-Tipp' },
    quickSpecs: {
      ar: ['1.5 لتر', '120 حصان', 'CVT'],
      en: ['1.5L', '120 hp', 'CVT'],
      fr: ['1.5L', '120 ch', 'CVT'],
      zh: ['1.5L', '120 马力', 'CVT'],
      de: ['1.5L', '120 PS', 'CVT'],
    },
    engine: {
      ar: '1.5 لتر بنزين',
      en: '1.5L petrol',
      fr: '1.5L essence',
      zh: '1.5L 自然吸气',
      de: '1.5L Benzin',
    },
    power: '120 hp',
    torque: '150 Nm',
    gearbox: {
      ar: 'ناقل CVT أوتوماتيك',
      en: 'CVT automatic',
      fr: 'Boîte CVT',
      zh: 'CVT 无级变速',
      de: 'CVT-Automatik',
    },
    drive: 'FWD',
    seats: '5',
    features: {
      ar: ['شاشة 10.1 بوصة', 'دعم Apple CarPlay', 'فتحات تكييف خلفية', 'مساحة خلفية رحبة'],
      en: ['10.1-inch screen', 'Apple CarPlay', 'Rear air vents', 'Spacious sedan cabin'],
      fr: ['Écran 10,1 pouces', 'Apple CarPlay', 'Aérateurs arrière', 'Habitacle spacieux'],
      zh: ['10.1英寸中控屏', 'Apple CarPlay', '后排出风口', '宽敞乘坐空间'],
      de: ['10,1-Zoll-Display', 'Apple CarPlay', 'Fond-Lüftungsdüsen', 'Geräumiger Innenraum'],
    },
    story: {
      ar: 'MG 5 سيدان عملية تجمع بين سعر اقتصادي منافس ومساحة داخلية مريحة مع ناقل CVT سلس للقيادة اليومية.',
      en: 'The MG 5 delivers standout value with a spacious cabin, Apple CarPlay connectivity, and smooth CVT driving.',
      fr: 'La MG 5 combine un excellent rapport qualité-prix, un bel espace intérieur et une boîte CVT fluide.',
      zh: 'MG 5 兼具亲民价格、宽敞空间与平顺 CVT 变速箱，是日常代步的务实之选。',
      de: 'Der MG 5 bietet ein starkes Preis-Leistungs-Verhältnis, viel Platz und ein sanftes CVT-Getriebe.',
    },
    idealFor: {
      usage: ['personal', 'business'],
      priority: ['economy'],
    },
  },
  {
    id: 'byd-seal',
    name: 'BYD Seal',
    year: 2026,
    type: 'electric',
    categoryLabel: 'ELECTRIC · PREMIUM',
    priceEgp: 2250000,
    horsepower: 313,
    img: 'https://egypt.yallamotor.com/_next/image?q=75&url=https%3A%2F%2Fymimg1.b8cdn.com%2Fresized%2Fcar_model%2F11747%2Fpictures%2F13388435%2Fwebp_listing_main_2024-BYD-Seal-Exterior-2.webp&w=1920',
    insideImg:
      'https://www.byd-sw.de/fileadmin/_processed_/9/7/csm_byd-seal-interieur-03_f8eb340aea.jpg',
    sourceUrl: 'https://www.byd-egypt.com/',
    tag: { ar: 'كهربائية', en: 'Electric', fr: 'Électrique', zh: '纯电性能', de: 'Elektro' },
    quickSpecs: {
      ar: ['بطارية Blade', 'كهربائية بالكامل', 'RWD / AWD'],
      en: ['Blade Battery', 'Full EV', 'RWD / AWD'],
      fr: ['Batterie Blade', '100% Électrique', 'RWD / AWD'],
      zh: ['刀片电池', '纯电驱动', '后驱 / 四驱'],
      de: ['Blade-Batterie', 'Vollelektrisch', 'RWD / AWD'],
    },
    engine: {
      ar: 'محرك كهربائي بالكامل (حسب الفئة)',
      en: 'All-electric powertrain (trim-dependent)',
      fr: 'Motorisation 100% électrique',
      zh: '纯电驱动系统（视版本而定）',
      de: 'Vollelektrischer Antrieb',
    },
    power: 'Up to 313+ hp*',
    torque: '360+ Nm*',
    gearbox: {
      ar: 'سرعة واحدة كهربائية',
      en: 'Single-speed reduction',
      fr: 'Réducteur à 1 rapport',
      zh: '固定齿比单速',
      de: '1-Gang-Reduktionsgetriebe',
    },
    drive: 'RWD / AWD',
    seats: '5',
    features: {
      ar: ['بطارية Blade الآمنة', 'شاشة دوارة ذكية', 'سقف زجاجي بانوراما', 'شحن سريع DC'],
      en: ['Blade Battery tech', 'Rotating center display', 'Panoramic glass roof', 'DC fast charging'],
      fr: ['Technologie Blade Battery', 'Écran rotatif', 'Toit vitré panoramique', 'Charge rapide DC'],
      zh: ['比亚迪刀片电池', '自适应旋转大屏', '全景玻璃天幕', '直流快充'],
      de: ['Blade-Batterietechnik', 'Drehbares Display', 'Panorama-Glasdach', 'DC-Schnellladen'],
    },
    story: {
      ar: 'BYD Seal سيدان كهربائية رياضية بتصميم انسيابي ومقصورة رقمية متطورة وبطارية Blade؛ تتوفر حسب الطلب والتأكيد.',
      en: 'The BYD Seal is an athletic electric sport sedan featuring Blade Battery architecture and a rotating digital display.',
      fr: 'La BYD Seal est une berline électrique sportive dotée de la batterie Blade et d’un écran central rotatif.',
      zh: '比亚迪海豹是一款兼具运动造型与刀片电池技术的纯电轿跑，配备标志性旋转中控屏。',
      de: 'Der BYD Seal ist eine sportliche Elektro-Limousine mit Blade-Batterie und drehbarem Zentraldisplay.',
    },
    availabilityNote: {
      ar: 'ملاحظة: التوافر والفئة النهائية للسوق المصري تُؤكد مباشرة مع مستشاري LANE.',
      en: 'Availability and final Egypt-market trim must be confirmed with LANE.',
      fr: 'Remarque : la disponibilité et la finition finale pour l’Égypte doivent être confirmées avec LANE.',
      zh: '提示：埃及市场现货与最终配置需向 LANE 确认。',
      de: 'Hinweis: Verfügbarkeit und finale Ausstattung für Ägypten müssen mit LANE bestätigt werden.',
    },
    idealFor: {
      usage: ['personal', 'business'],
      priority: ['tech', 'performance', 'economy'],
    },
  },
];
