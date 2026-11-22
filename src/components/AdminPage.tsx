import { useMemo, useRef, useState } from 'react';
import {
  CarFront,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  ImagePlus,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquareQuote,
  Pencil,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CARS,
  type CarAvailability,
  type CarModel,
  type CarType,
  type CurrencyCode,
  type LangCode,
} from '../data/cars';
import {
  createLocalizedRecord,
  DEFAULT_SETTINGS,
  INITIAL_BOOKINGS,
  type BookingStatus,
  type FaqItem,
  type ShowroomSettings,
  type TestimonialItem,
  type VisitBooking,
} from '../data/store';
import {
  bookingsToCsv,
  formatPriceWithSymbol,
  getEffectivePriceEgp,
  upsertCarInCatalog,
  updateBookingStatusInList,
  type AppRoute,
} from '../utils/laneLogic';
import { CarVisual } from './CarVisual';

interface AdminPageProps {
  lang: LangCode;
  currency: CurrencyCode;
  cars: CarModel[];
  bookings: VisitBooking[];
  settings: ShowroomSettings;
  isAuthenticated: boolean;
  authConfigured: boolean;
  authLoading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => void;
  onUpdateCars: (nextCars: CarModel[]) => void;
  onUpdateBookings: (nextBookings: VisitBooking[]) => void;
  onUpdateSettings: (nextSettings: ShowroomSettings) => void;
  onResetFactory: () => void;
  onNavigate: (route: AppRoute) => void;
}

type AdminTab = 'overview' | 'cars' | 'bookings' | 'content' | 'settings';

interface CarDraft {
  id: string;
  name: string;
  type: CarType;
  year: number;
  priceEgp: number;
  discountPriceEgp: number;
  dealLabelAr: string;
  dealLabelEn: string;
  availability: CarAvailability;
  img: string;
  insideImg: string;
  engineAr: string;
  engineEn: string;
  power: string;
  torque: string;
  gearboxAr: string;
  gearboxEn: string;
  drive: string;
  seats: string;
  tagAr: string;
  tagEn: string;
  storyAr: string;
  storyEn: string;
  featuresAr: string;
  featuresEn: string;
  sourceUrl: string;
  fuelLitersPer100Km: number;
  kwhPer100Km: number;
  annualServiceEgp: number;
}

function carToDraft(car: CarModel): CarDraft {
  return {
    id: car.id,
    name: car.name,
    type: car.type,
    year: car.year,
    priceEgp: car.priceEgp,
    discountPriceEgp: car.discountPriceEgp || 0,
    dealLabelAr: car.dealLabel?.ar || '',
    dealLabelEn: car.dealLabel?.en || '',
    availability: car.availability || 'available',
    img: car.img,
    insideImg: car.insideImg,
    engineAr: car.engine.ar,
    engineEn: car.engine.en,
    power: car.power,
    torque: car.torque,
    gearboxAr: car.gearbox.ar,
    gearboxEn: car.gearbox.en,
    drive: car.drive,
    seats: car.seats,
    tagAr: car.tag.ar,
    tagEn: car.tag.en,
    storyAr: car.story.ar,
    storyEn: car.story.en,
    featuresAr: car.features.ar.join(' | '),
    featuresEn: car.features.en.join(' | '),
    sourceUrl: car.sourceUrl,
    fuelLitersPer100Km: car.fuelLitersPer100Km ?? 7.2,
    kwhPer100Km: car.kwhPer100Km ?? 16.5,
    annualServiceEgp: car.annualServiceEgp ?? 14000,
  };
}

function emptyDraft(): CarDraft {
  return {
    id: '',
    name: '',
    type: 'suv',
    year: 2026,
    priceEgp: 1650000,
    discountPriceEgp: 0,
    dealLabelAr: 'عرض خاص',
    dealLabelEn: 'Flash Deal',
    availability: 'available',
    img: '',
    insideImg: '',
    engineAr: '1.5 لتر تيربو',
    engineEn: '1.5L Turbo',
    power: '170 hp',
    torque: '260 Nm',
    gearboxAr: 'أوتوماتيك 7 سرعات',
    gearboxEn: '7-Speed DCT',
    drive: 'FWD',
    seats: '5',
    tagAr: 'جديد بالمعرض',
    tagEn: 'New Arrival',
    storyAr: 'سيارة جديدة بتجهيزات متكاملة ومناسبة للطرق المصرية.',
    storyEn: 'Brand-new trim tailored for Egyptian roads with modern driver assistance.',
    featuresAr: 'شاشة لمس 12 بوصة | فتحة سقف بانوراما | حساسات ركن وكاميرا 360',
    featuresEn: '12-inch Touchscreen | Panoramic Sunroof | 360 Camera & Sensors',
    sourceUrl: 'https://www.google.com/search?q=lane+automotive+egypt',
    fuelLitersPer100Km: 7.4,
    kwhPer100Km: 16.5,
    annualServiceEgp: 15000,
  };
}

const CATEGORY_LABELS: Record<CarType, { ar: string; en: string }> = {
  suv: { ar: 'SUV / كروس أوفر', en: 'SUV / Crossover' },
  sedan: { ar: 'سيدان', en: 'Sedan' },
  electric: { ar: 'كهربائية بالكامل', en: 'All-Electric' },
};

async function compressImageToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 840;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function AdminPage({
  lang,
  currency,
  cars,
  bookings,
  settings,
  isAuthenticated,
  authConfigured,
  authLoading,
  onLogin,
  onLogout,
  onUpdateCars,
  onUpdateBookings,
  onUpdateSettings,
  onResetFactory,
  onNavigate,
}: AdminPageProps) {
  const isAr = lang === 'ar';
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [tab, setTab] = useState<AdminTab>('overview');
  const [carSearch, setCarSearch] = useState('');
  const [editingDraft, setEditingDraft] = useState<CarDraft | null>(null);
  const [isNewCar, setIsNewCar] = useState(false);
  const [carFormError, setCarFormError] = useState<string | null>(null);

  const [bookingFilter, setBookingFilter] = useState<'all' | BookingStatus>('all');
  const [settingsDraft, setSettingsDraft] = useState<ShowroomSettings>(settings);
  const [adminBanner, setAdminBanner] = useState<string | null>(null);

  // Content CMS drafts
  const [newReview, setNewReview] = useState<Omit<TestimonialItem, 'id'>>({
    authorAr: '',
    authorEn: '',
    carName: '',
    quoteAr: '',
    quoteEn: '',
  });
  const [newFaq, setNewFaq] = useState<Omit<FaqItem, 'id'>>({
    questionAr: '',
    questionEn: '',
    answerAr: '',
    answerEn: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const extImgUploadRef = useRef<HTMLInputElement>(null);
  const intImgUploadRef = useRef<HTMLInputElement>(null);

  const showAdminBanner = (msg: string) => {
    setAdminBanner(msg);
    window.setTimeout(() => setAdminBanner(null), 3200);
  };

  const stats = useMemo(() => {
    const totalCars = cars.length;
    const avgPrice =
      totalCars > 0
        ? Math.round(cars.reduce((sum, c) => sum + getEffectivePriceEgp(c), 0) / totalCars)
        : 0;
    const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
    const byType = {
      suv: cars.filter((c) => c.type === 'suv').length,
      sedan: cars.filter((c) => c.type === 'sedan').length,
      electric: cars.filter((c) => c.type === 'electric').length,
    };
    return { totalCars, avgPrice, totalBookings: bookings.length, pendingBookings, byType };
  }, [cars, bookings]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authConfigured) {
      setLoginError(isAr ? 'تسجيل الدخول يحتاج إعداد اتصال قاعدة البيانات أولًا.' : 'Database connection must be configured first.');
      return;
    }
    if (!emailInput.trim() || !passwordInput) {
      setLoginError(isAr ? 'اكتب البريد الإلكتروني وكلمة المرور.' : 'Enter your email and password.');
      return;
    }
    try {
      await onLogin(emailInput.trim(), passwordInput);
      setLoginError(null);
      setPasswordInput('');
    } catch {
      setLoginError(isAr ? 'تعذر تسجيل الدخول. راجع البريد وكلمة المرور أو إعدادات الحساب.' : 'Sign in failed. Check your email, password, or account setup.');
    }
  };

  const handleOpenAddCar = () => {
    setIsNewCar(true);
    setCarFormError(null);
    setEditingDraft(emptyDraft());
  };

  const handleOpenEditCar = (car: CarModel) => {
    setIsNewCar(false);
    setCarFormError(null);
    setEditingDraft(carToDraft(car));
  };

  const handleCarImageUpload = async (
    targetField: 'img' | 'insideImg',
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingDraft) return;
    const compressed = await compressImageToDataUrl(file);
    setEditingDraft({ ...editingDraft, [targetField]: compressed });
    showAdminBanner(isAr ? 'تم ضغط الصورة وإدراجها مجانًا بنجاح.' : 'Photo compressed and attached.');
    e.target.value = '';
  };

  const handleSaveCarDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;
    const cleanName = editingDraft.name.trim();
    if (!cleanName || editingDraft.priceEgp <= 0) {
      setCarFormError(
        isAr
          ? 'يرجى كتابة اسم السيارة وسعر صحيح بالجنيه المصري.'
          : 'Please enter a valid model name and EGP price.',
      );
      return;
    }

    const slug =
      editingDraft.id.trim() ||
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      `lane-car-${Date.now()}`;

    const catInfo = CATEGORY_LABELS[editingDraft.type];
    const existing = cars.find((c) => c.id === slug);

    const parsedFeaturesAr = editingDraft.featuresAr
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedFeaturesEn = editingDraft.featuresEn
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    const discountPrice =
      editingDraft.discountPriceEgp > 0 && editingDraft.discountPriceEgp < editingDraft.priceEgp
        ? Math.round(editingDraft.discountPriceEgp)
        : undefined;

    const nextCar: CarModel = {
      id: slug,
      name: cleanName,
      type: editingDraft.type,
      year: Number(editingDraft.year) || 2026,
      priceEgp: Math.round(Number(editingDraft.priceEgp)),
      discountPriceEgp: discountPrice,
      dealLabel: discountPrice
        ? createLocalizedRecord(
            editingDraft.dealLabelAr || 'عرض خاص',
            editingDraft.dealLabelEn || 'Flash Deal',
          )
        : undefined,
      availability: editingDraft.availability,
      img: editingDraft.img.trim(),
      insideImg: editingDraft.insideImg.trim(),
      categoryLabel: createLocalizedRecord(catInfo.ar, catInfo.en),
      tag: createLocalizedRecord(editingDraft.tagAr, editingDraft.tagEn),
      story: createLocalizedRecord(editingDraft.storyAr, editingDraft.storyEn),
      specs: {
        ar: [
          editingDraft.engineAr.trim() || 'محرك قياسي',
          editingDraft.power.trim() || '-',
          editingDraft.gearboxAr.trim() || 'أوتوماتيك',
        ],
        en: [
          editingDraft.engineEn.trim() || 'Standard powertrain',
          editingDraft.power.trim() || '-',
          editingDraft.gearboxEn.trim() || 'Automatic',
        ],
        fr: [editingDraft.engineEn.trim(), editingDraft.power.trim(), editingDraft.gearboxEn.trim()],
        zh: [editingDraft.engineEn.trim(), editingDraft.power.trim(), editingDraft.gearboxEn.trim()],
        de: [editingDraft.engineEn.trim(), editingDraft.power.trim(), editingDraft.gearboxEn.trim()],
      },
      engine: createLocalizedRecord(editingDraft.engineAr, editingDraft.engineEn),
      power: editingDraft.power.trim() || '-',
      torque: editingDraft.torque.trim() || '-',
      gearbox: createLocalizedRecord(editingDraft.gearboxAr, editingDraft.gearboxEn),
      drive: editingDraft.drive.trim() || 'FWD',
      seats: editingDraft.seats.trim() || '5',
      features: {
        ar: parsedFeaturesAr.length > 0 ? parsedFeaturesAr : ['ضمان الوكيل'],
        en: parsedFeaturesEn.length > 0 ? parsedFeaturesEn : ['Authorized warranty'],
        fr: parsedFeaturesEn.length > 0 ? parsedFeaturesEn : ['Authorized warranty'],
        zh: parsedFeaturesEn.length > 0 ? parsedFeaturesEn : ['Authorized warranty'],
        de: parsedFeaturesEn.length > 0 ? parsedFeaturesEn : ['Authorized warranty'],
      },
      sourceUrl:
        editingDraft.sourceUrl.trim() ||
        existing?.sourceUrl ||
        'https://www.google.com/search?q=lane+automotive+egypt',
      availabilityNote: existing?.availabilityNote,
      accentHex: existing?.accentHex || '#f6f7f9',
      colors: existing?.colors,
      trims: existing?.trims,
      fuelLitersPer100Km:
        editingDraft.type === 'electric' ? undefined : Number(editingDraft.fuelLitersPer100Km) || 7.2,
      kwhPer100Km:
        editingDraft.type === 'electric' ? Number(editingDraft.kwhPer100Km) || 16.5 : undefined,
      annualServiceEgp: Number(editingDraft.annualServiceEgp) || 14000,
    };

    const updated = upsertCarInCatalog(cars, nextCar);
    onUpdateCars(updated);
    setEditingDraft(null);
    showAdminBanner(
      isAr ? `تم حفظ «${nextCar.name}» وتحديث المعرض فورًا.` : `Saved "${nextCar.name}" to storefront catalog.`,
    );
  };

  const handleDeleteCar = (car: CarModel) => {
    if (cars.length <= 1) {
      showAdminBanner(
        isAr ? 'يجب الإبقاء على سيارة واحدة على الأقل في المعرض.' : 'At least one vehicle must remain in the catalog.',
      );
      return;
    }
    onUpdateCars(cars.filter((c) => c.id !== car.id));
    if (editingDraft?.id === car.id) {
      setEditingDraft(null);
    }
    showAdminBanner(isAr ? `تم حذف «${car.name}».` : `Removed "${car.name}".`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsDraft);
    showAdminBanner(
      isAr ? 'تم حفظ إعدادات المعرض وتطبيقها على الموقع.' : 'Showroom settings saved and applied live.',
    );
  };

  const handleAddTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.authorAr.trim() || !newReview.quoteAr.trim()) return;
    const item: TestimonialItem = {
      id: `rev-${Date.now()}`,
      authorAr: newReview.authorAr.trim(),
      authorEn: newReview.authorEn.trim() || newReview.authorAr.trim(),
      carName: newReview.carName.trim() || 'LANE Client',
      quoteAr: newReview.quoteAr.trim(),
      quoteEn: newReview.quoteEn.trim() || newReview.quoteAr.trim(),
    };
    const updated = { ...settingsDraft, testimonials: [item, ...settingsDraft.testimonials] };
    setSettingsDraft(updated);
    onUpdateSettings(updated);
    setNewReview({ authorAr: '', authorEn: '', carName: '', quoteAr: '', quoteEn: '' });
    showAdminBanner(isAr ? 'تمت إضافة تقييم العميل للصفحة الرئيسية.' : 'Added customer testimonial.');
  };

  const handleDeleteTestimonial = (id: string) => {
    const updated = {
      ...settingsDraft,
      testimonials: settingsDraft.testimonials.filter((item) => item.id !== id),
    };
    setSettingsDraft(updated);
    onUpdateSettings(updated);
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.questionAr.trim() || !newFaq.answerAr.trim()) return;
    const item: FaqItem = {
      id: `faq-${Date.now()}`,
      questionAr: newFaq.questionAr.trim(),
      questionEn: newFaq.questionEn.trim() || newFaq.questionAr.trim(),
      answerAr: newFaq.answerAr.trim(),
      answerEn: newFaq.answerEn.trim() || newFaq.answerAr.trim(),
    };
    const updated = { ...settingsDraft, faqs: [...settingsDraft.faqs, item] };
    setSettingsDraft(updated);
    onUpdateSettings(updated);
    setNewFaq({ questionAr: '', questionEn: '', answerAr: '', answerEn: '' });
    showAdminBanner(isAr ? 'تمت إضافة السؤال الشائع للموقع.' : 'Added FAQ item.');
  };

  const handleDeleteFaq = (id: string) => {
    const updated = {
      ...settingsDraft,
      faqs: settingsDraft.faqs.filter((item) => item.id !== id),
    };
    setSettingsDraft(updated);
    onUpdateSettings(updated);
  };

  const handleExportBookingsCsv = () => {
    const csv = bookingsToCsv(bookings, cars);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lane-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showAdminBanner(isAr ? 'تم تنزيل ملف الحجوزات CSV للإكسل.' : 'Exported bookings CSV.');
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      cars,
      bookings,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lane-automotive-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showAdminBanner(isAr ? 'تم تنزيل نسخة احتياطية JSON.' : 'Exported JSON backup file.');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        cars?: CarModel[];
        bookings?: VisitBooking[];
        settings?: Partial<ShowroomSettings>;
      };
      if (Array.isArray(parsed.cars) && parsed.cars.length > 0) {
        onUpdateCars(parsed.cars);
      }
      if (Array.isArray(parsed.bookings)) {
        onUpdateBookings(parsed.bookings);
      }
      if (parsed.settings) {
        const merged = { ...DEFAULT_SETTINGS, ...parsed.settings };
        onUpdateSettings(merged);
        setSettingsDraft(merged);
      }
      showAdminBanner(isAr ? 'تم استعادة البيانات من الملف بنجاح.' : 'Backup restored successfully.');
    } catch {
      showAdminBanner(isAr ? 'ملف النسخة الاحتياطية غير صالح.' : 'Invalid backup JSON file.');
    }
    e.target.value = '';
  };

  // -------------------------
  // 1) Admin Sign-In Screen
  // -------------------------
  if (!isAuthenticated) {
    return (
      <section className="flex min-h-[76vh] items-center justify-center bg-[#0a0a0a] px-6 py-16">
        <div className="w-full max-w-md border border-[#2c2c2c] bg-[#121213] p-7 sm:p-9">
          <div className="flex items-center justify-between border-b border-[#242424] pb-5">
            <div>
              <span className="font-latin text-[11px] font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
                LANE · ADMIN CONSOLE
              </span>
              <h1 className="mt-2 text-2xl font-bold text-[#f5f3ef]">
                {isAr ? 'تسجيل دخول الإدارة' : 'Admin Sign In'}
              </h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#19191b] text-[#ed1c24]">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#a8a39d]">
            {isAr
              ? 'ادخل لوحة تحكم LANE لتعديل السيارات، العروض، التوافر، الحجوزات، ومحتوى الواجهة مجانًا بالكامل.'
              : 'Access the LANE management console to edit inventory, flash deals, bookings, and storefront content.'}
          </p>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-medium text-[#dedbd6]"
              >
                {isAr ? 'البريد الإداري' : 'Admin Email'}
              </label>
              <input
                id="admin-email"
                type="email"
                dir="ltr"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="font-latin h-11 w-full border border-[#353535] bg-[#0b0b0c] px-3.5 text-sm text-white focus:border-[#ed1c24] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-medium text-[#dedbd6]"
              >
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPasscode ? 'text' : 'password'}
                  dir="ltr"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="••••••••"
                  className="font-latin h-11 w-full border border-[#353535] bg-[#0b0b0c] pe-11 ps-3.5 text-sm text-white focus:border-[#ed1c24] focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  onClick={() => setShowPasscode((s) => !s)}
                  className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-[#8e8983] hover:text-white"
                >
                  {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p role="alert" className="text-xs font-medium text-[#ff7c80]">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading || !authConfigured}
              className="h-11 w-full bg-[#ed1c24] text-xs font-bold text-white transition-colors hover:bg-[#ff3037] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {authLoading
                ? (isAr ? 'جارٍ التحقق…' : 'Checking…')
                : (isAr ? 'دخول لوحة الإدارة' : 'Sign In to Admin')}
            </button>
          </form>

          <div className="mt-6 border border-[#2a2a2d] bg-[#0d0d0f] p-3.5 text-xs text-[#b5b0aa]">
            <div className="font-semibold text-[#d8b789]">
              {isAr ? 'تسجيل آمن بالبريد الإلكتروني' : 'Secure email sign-in'}
            </div>
            <p className="mt-2 text-[11px] text-[#8d8882]">
              {!authConfigured
                ? (isAr ? 'يلزم ربط مشروع قاعدة البيانات قبل تفعيل الدخول.' : 'Connect the database project before enabling sign-in.')
                : (isAr ? 'الحسابات ينشئها مسؤول قاعدة البيانات، ولا يوجد تسجيل عام للأدمن.' : 'Admin accounts are provisioned by the database owner; public admin sign-up is disabled.')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------
  // 2) Authenticated Admin Console
  // -------------------------
  const filteredCars = cars.filter((car) =>
    car.name.toLowerCase().includes(carSearch.trim().toLowerCase()),
  );
  const filteredBookings =
    bookingFilter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === bookingFilter);

  const navTabs: Array<{
    id: AdminTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
    { id: 'cars', label: isAr ? `السيارات (${cars.length})` : `Cars (${cars.length})`, icon: CarFront },
    {
      id: 'bookings',
      label: isAr ? `الحجوزات (${bookings.length})` : `Bookings (${bookings.length})`,
      icon: ClipboardList,
      badge: stats.pendingBookings,
    },
    { id: 'content', label: isAr ? 'المحتوى والتقييمات' : 'Content & Reviews', icon: MessageSquareQuote },
    { id: 'settings', label: isAr ? 'الإعدادات والنسخ' : 'Settings & Backup', icon: Settings2 },
  ];

  return (
    <section className="min-h-[80vh] bg-[#0b0b0c] px-[5.5%] py-10">
      <div className="mx-auto max-w-6xl">
        {/* Top Console Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#252528] pb-6">
          <div>
            <span className="font-latin text-[11px] font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
              LANE · MANAGEMENT CONSOLE
            </span>
            <h1 className="mt-1.5 text-2xl font-bold text-[#f5f3ef] sm:text-3xl">
              {isAr ? 'لوحة تحكم المعرض' : 'Showroom Admin Console'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate({ page: 'cars' })}
              className="h-9 border border-[#3a3a3e] px-3.5 text-xs font-medium text-[#e5e2dd] hover:border-white"
            >
              {isAr ? 'معاينة المعرض ↗' : 'View Storefront ↗'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 items-center gap-1.5 border border-[#4a2628] bg-[#1a1011] px-3.5 text-xs font-medium text-[#ff9ea2] hover:border-[#ed1c24]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[#232326] pb-4" role="tablist">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`inline-flex h-10 items-center gap-2 border px-4 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                    : 'border-[#2f2f33] bg-[#131315] text-[#c7c3bd] hover:border-[#666] hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    data-testid="pending-bookings-badge"
                    className={`font-latin tabular-nums px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white text-[#ed1c24]' : 'bg-[#ed1c24] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {adminBanner && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2 border border-[#334b39] bg-[#101a12] px-4 py-3 text-xs font-medium text-[#a8e6b8]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{adminBanner}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-[#27272b] bg-[#121214] p-5">
                <span className="text-xs text-[#9b9690]">
                  {isAr ? 'إجمالي الموديلات' : 'Active Models'}
                </span>
                <strong className="font-latin tabular-nums mt-2 block text-3xl font-bold text-[#f5f3ef]">
                  {stats.totalCars}
                </strong>
              </div>
              <div className="border border-[#27272b] bg-[#121214] p-5">
                <span className="text-xs text-[#9b9690]">
                  {isAr ? 'متوسط السعر الفعلي' : 'Avg. Effective Price'}
                </span>
                <strong
                  dir="ltr"
                  className="font-latin tabular-nums mt-2 block text-xl font-bold text-[#d8b789]"
                >
                  {formatPriceWithSymbol(stats.avgPrice, currency, lang)}
                </strong>
              </div>
              <div className="border border-[#27272b] bg-[#121214] p-5">
                <span className="text-xs text-[#9b9690]">
                  {isAr ? 'إجمالي طلبات الزيارة' : 'Total Visit Requests'}
                </span>
                <strong className="font-latin tabular-nums mt-2 block text-3xl font-bold text-[#f5f3ef]">
                  {stats.totalBookings}
                </strong>
              </div>
              <div className="border border-[#27272b] bg-[#121214] p-5">
                <span className="text-xs text-[#9b9690]">
                  {isAr ? 'طلبات بانتظار التأكيد' : 'Pending Confirmation'}
                </span>
                <strong className="font-latin tabular-nums mt-2 block text-3xl font-bold text-[#ed1c24]">
                  {stats.pendingBookings}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="border border-[#27272b] bg-[#121214] p-6">
                <h2 className="text-sm font-bold text-[#f5f3ef]">
                  {isAr ? 'توزيع الفئات المعروضة' : 'Inventory by Category'}
                </h2>
                <div className="mt-5 space-y-4">
                  {(
                    [
                      { key: 'suv', label: isAr ? 'SUV / كروس أوفر' : 'SUV / Crossover', count: stats.byType.suv },
                      { key: 'sedan', label: isAr ? 'سيدان' : 'Sedan', count: stats.byType.sedan },
                      { key: 'electric', label: isAr ? 'كهربائية' : 'Electric', count: stats.byType.electric },
                    ] as const
                  ).map((row) => {
                    const pct = stats.totalCars > 0 ? Math.round((row.count / stats.totalCars) * 100) : 0;
                    return (
                      <div key={row.key}>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-[#dedbd6]">{row.label}</span>
                          <span className="font-latin tabular-nums text-[#d8b789]">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-[#232327]">
                          <div className="h-full bg-[#ed1c24]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border border-[#27272b] bg-[#121214] p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#f5f3ef]">
                    {isAr ? 'أحدث طلبات الزيارة' : 'Recent Showroom Bookings'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setTab('bookings')}
                    className="text-xs font-semibold text-[#ed1c24] hover:underline"
                  >
                    {isAr ? 'إدارة الحجوزات ←' : 'Manage All →'}
                  </button>
                </div>
                <div className="mt-4 divide-y divide-[#222226]">
                  {bookings.slice(0, 4).map((b) => {
                    const carName = cars.find((c) => c.id === b.carId)?.name || b.carId;
                    return (
                      <div key={b.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                        <div>
                          <strong className="block text-[#f5f3ef]">{b.name}</strong>
                          <span className="text-[#9b9690]">{carName}</span>
                        </div>
                        <span className="font-latin border border-[#323236] bg-[#19191c] px-2.5 py-1 text-[11px] uppercase text-[#d8b789]">
                          {b.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CARS MANAGER (CRUD) */}
        {tab === 'cars' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <input
                type="search"
                value={carSearch}
                onChange={(e) => setCarSearch(e.target.value)}
                placeholder={isAr ? 'ابحث في الموديلات...' : 'Filter models by name...'}
                className="h-10 w-full max-w-xs border border-[#353539] bg-[#121214] px-3.5 text-xs text-white placeholder-[#777] focus:border-[#ed1c24] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleOpenAddCar}
                className="inline-flex h-10 items-center gap-2 bg-[#ed1c24] px-5 text-xs font-bold text-white hover:bg-[#ff3037]"
              >
                <Plus className="h-4 w-4" />
                <span>{isAr ? 'إضافة سيارة جديدة' : 'Add New Car'}</span>
              </button>
            </div>

            {editingDraft && (
              <form
                onSubmit={handleSaveCarDraft}
                className="border border-[#ed1c24]/60 bg-[#141315] p-6 sm:p-8"
              >
                <div className="mb-5 flex items-center justify-between border-b border-[#28282c] pb-4">
                  <h2 className="text-base font-bold text-[#f5f3ef]">
                    {isNewCar
                      ? isAr
                        ? 'إضافة سيارة جديدة للكتالوج'
                        : 'Add New Vehicle'
                      : `${isAr ? 'تعديل:' : 'Edit:'} ${editingDraft.name}`}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingDraft(null)}
                    className="text-xs text-[#aaa] hover:text-white"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'اسم الموديل *' : 'Model Name *'}
                    </label>
                    <input
                      type="text"
                      value={editingDraft.name}
                      onChange={(e) => setEditingDraft({ ...editingDraft, name: e.target.value })}
                      className="h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'الفئة' : 'Category'}
                    </label>
                    <select
                      value={editingDraft.type}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, type: e.target.value as CarType })
                      }
                      className="h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    >
                      <option value="suv">SUV</option>
                      <option value="sedan">Sedan</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'حالة التوافر' : 'Stock Status'}
                    </label>
                    <select
                      value={editingDraft.availability}
                      onChange={(e) =>
                        setEditingDraft({
                          ...editingDraft,
                          availability: e.target.value as CarAvailability,
                        })
                      }
                      className="h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    >
                      <option value="available">{isAr ? 'متوفرة للاستلام' : 'In Stock'}</option>
                      <option value="preorder">{isAr ? 'حجز مسبق' : 'Pre-Order'}</option>
                      <option value="soldout">{isAr ? 'نفدت الكمية' : 'Sold Out'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'الموديل (السنة)' : 'Year'}
                    </label>
                    <input
                      type="number"
                      value={editingDraft.year}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, year: Number(e.target.value) })
                      }
                      className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'السعر الأساسي (EGP) *' : 'List Price (EGP) *'}
                    </label>
                    <input
                      type="number"
                      value={editingDraft.priceEgp}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, priceEgp: Number(e.target.value) })
                      }
                      className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'سعر العرض (0 = بدون خصم)' : 'Flash Deal Price (0 = none)'}
                    </label>
                    <input
                      type="number"
                      value={editingDraft.discountPriceEgp}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, discountPriceEgp: Number(e.target.value) })
                      }
                      className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'ملصق العرض (عربي)' : 'Deal Badge (AR)'}
                    </label>
                    <input
                      type="text"
                      value={editingDraft.dealLabelAr}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, dealLabelAr: e.target.value })
                      }
                      className="h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'صيانة سنوية تقديرية (EGP)' : 'Est. Annual Service (EGP)'}
                    </label>
                    <input
                      type="number"
                      value={editingDraft.annualServiceEgp}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, annualServiceEgp: Number(e.target.value) })
                      }
                      className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'الصورة الخارجية (رابط أو رفع من جهازك)' : 'Exterior Image (URL or Local Upload)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={editingDraft.img}
                        onChange={(e) => setEditingDraft({ ...editingDraft, img: e.target.value })}
                        placeholder="https://... أو اضغط رفع"
                        className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                      />
                      <input
                        ref={extImgUploadRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCarImageUpload('img', e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => extImgUploadRef.current?.click()}
                        className="inline-flex h-10 shrink-0 items-center gap-1.5 border border-[#444] bg-[#1a1a1d] px-3 text-[11px] font-semibold text-white hover:border-[#ed1c24]"
                      >
                        <ImagePlus className="h-3.5 w-3.5 text-[#ed1c24]" />
                        <span>{isAr ? 'رفع' : 'Upload'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'صورة المقصورة (رابط أو رفع من جهازك)' : 'Cabin Image (URL or Local Upload)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={editingDraft.insideImg}
                        onChange={(e) =>
                          setEditingDraft({ ...editingDraft, insideImg: e.target.value })
                        }
                        placeholder="https://..."
                        className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                      />
                      <input
                        ref={intImgUploadRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCarImageUpload('insideImg', e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => intImgUploadRef.current?.click()}
                        className="inline-flex h-10 shrink-0 items-center gap-1.5 border border-[#444] bg-[#1a1a1d] px-3 text-[11px] font-semibold text-white hover:border-[#ed1c24]"
                      >
                        <ImagePlus className="h-3.5 w-3.5 text-[#ed1c24]" />
                        <span>{isAr ? 'رفع' : 'Upload'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'القوة (مثال: 170 hp)' : 'Power'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={editingDraft.power}
                      onChange={(e) => setEditingDraft({ ...editingDraft, power: e.target.value })}
                      className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'العزم (مثال: 260 Nm)' : 'Torque'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={editingDraft.torque}
                      onChange={(e) => setEditingDraft({ ...editingDraft, torque: e.target.value })}
                      className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'المحرك (عربي)' : 'Engine (AR)'}
                    </label>
                    <input
                      type="text"
                      value={editingDraft.engineAr}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, engineAr: e.target.value })
                      }
                      className="h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {editingDraft.type === 'electric'
                        ? isAr
                          ? 'استهلاك الكهرباء (kWh/100km)'
                          : 'kWh / 100 km'
                        : isAr
                          ? 'استهلاك الوقود (L/100km)'
                          : 'Fuel L / 100 km'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={
                        editingDraft.type === 'electric'
                          ? editingDraft.kwhPer100Km
                          : editingDraft.fuelLitersPer100Km
                      }
                      onChange={(e) =>
                        setEditingDraft(
                          editingDraft.type === 'electric'
                            ? { ...editingDraft, kwhPer100Km: Number(e.target.value) }
                            : { ...editingDraft, fuelLitersPer100Km: Number(e.target.value) },
                        )
                      }
                      className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'وصف السيارة (عربي)' : 'Story (AR)'}
                    </label>
                    <textarea
                      rows={2}
                      value={editingDraft.storyAr}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, storyAr: e.target.value })
                      }
                      className="w-full border border-[#36363a] bg-[#0b0b0c] p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#bbb]">
                      {isAr ? 'وصف السيارة (إنجليزي)' : 'Story (EN)'}
                    </label>
                    <textarea
                      rows={2}
                      dir="ltr"
                      value={editingDraft.storyEn}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, storyEn: e.target.value })
                      }
                      className="font-latin w-full border border-[#36363a] bg-[#0b0b0c] p-3 text-xs text-white"
                    />
                  </div>
                </div>

                {carFormError && (
                  <p role="alert" className="mt-3 text-xs font-medium text-[#ff7c80]">
                    {carFormError}
                  </p>
                )}

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingDraft(null)}
                    className="h-10 border border-[#3a3a3f] px-5 text-xs text-[#ddd]"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="h-10 bg-[#ed1c24] px-6 text-xs font-bold text-white hover:bg-[#ff3037]"
                  >
                    {isAr ? 'حفظ التغييرات' : 'Save Vehicle'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto border border-[#27272b] bg-[#121214]">
              <table className="w-full min-w-[700px] border-collapse text-start text-xs">
                <thead>
                  <tr className="border-b border-[#27272b] bg-[#17171a] text-[#a5a09a]">
                    <th className="p-4">{isAr ? 'السيارة' : 'Model'}</th>
                    <th className="p-4">{isAr ? 'الحالة' : 'Stock'}</th>
                    <th className="p-4">{isAr ? 'السنة' : 'Year'}</th>
                    <th className="p-4">{isAr ? 'السعر الفعلي' : 'Effective Price'}</th>
                    <th className="p-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222226]">
                  {filteredCars.map((car) => {
                    const effective = getEffectivePriceEgp(car);
                    const hasDeal = effective < car.priceEgp;
                    return (
                      <tr key={car.id} className="hover:bg-[#171719]">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <CarVisual
                              car={car}
                              src={car.img}
                              alt={car.name}
                              compact
                              className="h-11 w-16 shrink-0"
                            />
                            <div>
                              <strong className="block text-sm text-[#f5f3ef]">
                                {car.name}
                              </strong>
                              <span className="font-latin text-[11px] text-[#8d8882]">
                                {car.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-latin uppercase text-[11px] text-[#ccc]">
                            {car.availability || 'available'}
                          </span>
                        </td>
                        <td className="font-latin tabular-nums p-4 text-[#ccc]">{car.year}</td>
                        <td
                          dir="ltr"
                          className="font-latin tabular-nums p-4 font-bold text-[#d8b789]"
                        >
                          {formatPriceWithSymbol(effective, currency, lang)}
                          {hasDeal && (
                            <span className="ms-2 bg-[#ed1c24] px-1.5 py-0.5 text-[10px] text-white">
                              DEAL
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-end">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCar(car)}
                              aria-label={`Edit ${car.name}`}
                              className="inline-flex h-8 items-center gap-1 border border-[#3a3a3e] px-3 text-[11px] font-medium text-white hover:border-[#ed1c24]"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>{isAr ? 'تعديل' : 'Edit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCar(car)}
                              aria-label={`Delete ${car.name}`}
                              className="inline-flex h-8 items-center gap-1 border border-[#4a2628] px-3 text-[11px] font-medium text-[#ff9ea2] hover:border-[#ed1c24]"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BOOKINGS MANAGER */}
        {tab === 'bookings' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'all', label: isAr ? 'الكل' : 'All' },
                    { id: 'pending', label: isAr ? 'قيد الانتظار' : 'Pending' },
                    { id: 'confirmed', label: isAr ? 'مؤكد' : 'Confirmed' },
                    { id: 'completed', label: isAr ? 'مكتمل' : 'Completed' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBookingFilter(f.id)}
                    className={`h-9 border px-4 text-xs font-semibold ${
                      bookingFilter === f.id
                        ? 'border-[#ed1c24] bg-[#ed1c24] text-white'
                        : 'border-[#333] bg-[#121214] text-[#bbb]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportBookingsCsv}
                className="inline-flex h-9 items-center gap-2 border border-[#3c3c40] bg-[#151518] px-4 text-xs font-semibold text-[#f5f3ef] transition-colors hover:border-[#ed1c24]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#ed1c24]" />
                <span>{isAr ? 'تصدير CSV (إكسل)' : 'Export CSV (Excel)'}</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-[#27272b] bg-[#121214]">
              <table className="w-full min-w-[700px] border-collapse text-start text-xs">
                <thead>
                  <tr className="border-b border-[#27272b] bg-[#17171a] text-[#a5a09a]">
                    <th className="p-4">{isAr ? 'رقم الطلب' : 'ID'}</th>
                    <th className="p-4">{isAr ? 'العميل' : 'Customer'}</th>
                    <th className="p-4">{isAr ? 'السيارة' : 'Vehicle'}</th>
                    <th className="p-4">{isAr ? 'التاريخ' : 'Preferred Date'}</th>
                    <th className="p-4">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-4 text-end">{isAr ? 'حذف' : 'Remove'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222226]">
                  {filteredBookings.map((booking) => {
                    const carName =
                      cars.find((c) => c.id === booking.carId)?.name || booking.carId;
                    return (
                      <tr key={booking.id} className="hover:bg-[#171719]">
                        <td className="font-latin p-4 font-bold text-[#d8b789]">
                          {booking.id}
                        </td>
                        <td className="p-4">
                          <strong className="block text-[#f5f3ef]">{booking.name}</strong>
                          <span dir="ltr" className="font-latin text-[11px] text-[#9b9690]">
                            {booking.phone}
                          </span>
                        </td>
                        <td className="p-4 text-[#e0dcd6]">{carName}</td>
                        <td className="font-latin p-4 text-[#bbb]">{booking.date}</td>
                        <td className="p-4">
                          <select
                            aria-label={`Status for ${booking.id}`}
                            value={booking.status}
                            onChange={(e) => {
                              const next = updateBookingStatusInList(
                                bookings,
                                booking.id,
                                e.target.value as BookingStatus,
                              );
                              onUpdateBookings(next);
                              showAdminBanner(
                                isAr ? `تم تحديث حالة الطلب ${booking.id}.` : `Updated ${booking.id} status.`,
                              );
                            }}
                            className="h-8 border border-[#36363a] bg-[#0b0b0c] px-2 text-xs text-white"
                          >
                            <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
                            <option value="confirmed">{isAr ? 'مؤكد' : 'Confirmed'}</option>
                            <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                          </select>
                        </td>
                        <td className="p-4 text-end">
                          <button
                            type="button"
                            aria-label={`Delete booking ${booking.id}`}
                            onClick={() =>
                              onUpdateBookings(bookings.filter((b) => b.id !== booking.id))
                            }
                            className="inline-flex h-8 items-center border border-[#4a2628] px-2.5 text-[#ff9ea2] hover:border-[#ed1c24]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CONTENT, TESTIMONIALS & FAQS CMS */}
        {tab === 'content' && (
          <div className="mt-8 space-y-8">
            {/* Hero & Marquee Editor */}
            <form
              onSubmit={handleSaveSettings}
              className="border border-[#27272b] bg-[#121214] p-6 sm:p-8"
            >
              <h2 className="border-b border-[#252529] pb-3 text-base font-bold text-[#f5f3ef]">
                {isAr ? 'نصوص الهيرو والشريط الإعلاني' : 'Hero & Announcement Marquee'}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'الشعار العلوي للهيرو (عربي)' : 'Hero Eyebrow (AR)'}
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.heroEyebrowAr}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, heroEyebrowAr: e.target.value })
                    }
                    className="h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'الشعار العلوي للهيرو (إنجليزي)' : 'Hero Eyebrow (EN)'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsDraft.heroEyebrowEn}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, heroEyebrowEn: e.target.value })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'نص الشريط الأحمر المتحرك (Marquee)' : 'Red Marquee Ticker Text'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsDraft.marqueeText}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, marqueeText: e.target.value })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 h-10 bg-[#ed1c24] px-6 text-xs font-bold text-white hover:bg-[#ff3037]"
              >
                {isAr ? 'تحديث نصوص الواجهة' : 'Update Headline & Ticker'}
              </button>
            </form>

            {/* Testimonials Manager */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="border border-[#27272b] bg-[#121214] p-6">
                <h2 className="border-b border-[#252529] pb-3 text-base font-bold text-[#f5f3ef]">
                  {isAr ? 'إدارة آراء العملاء' : 'Customer Reviews'} ({settingsDraft.testimonials.length})
                </h2>

                <div className="mt-4 space-y-3">
                  {settingsDraft.testimonials.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 border border-[#242428] bg-[#0d0d0f] p-3 text-xs"
                    >
                      <div>
                        <strong className="text-[#f5f3ef]">
                          {isAr ? item.authorAr : item.authorEn} ·{' '}
                          <span className="text-[#d8b789]">{item.carName}</span>
                        </strong>
                        <p className="mt-1 text-[#aaa6a1]">{isAr ? item.quoteAr : item.quoteEn}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(item.id)}
                        className="shrink-0 text-[#ff9ea2] hover:text-[#ed1c24]"
                        aria-label={`Delete testimonial ${item.authorEn}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddTestimonial} className="mt-5 space-y-3 border-t border-[#242428] pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={isAr ? 'اسم العميل (عربي) *' : 'Author AR *'}
                      value={newReview.authorAr}
                      onChange={(e) => setNewReview({ ...newReview, authorAr: e.target.value })}
                      className="h-9 border border-[#353539] bg-[#0b0b0c] px-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder={isAr ? 'اسم السيارة' : 'Car Name'}
                      value={newReview.carName}
                      onChange={(e) => setNewReview({ ...newReview, carName: e.target.value })}
                      className="h-9 border border-[#353539] bg-[#0b0b0c] px-2.5 text-xs text-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder={isAr ? 'رأي العميل (عربي) *' : 'Review quote *'}
                    value={newReview.quoteAr}
                    onChange={(e) => setNewReview({ ...newReview, quoteAr: e.target.value })}
                    className="w-full border border-[#353539] bg-[#0b0b0c] p-2.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="h-9 bg-[#ed1c24] px-4 text-xs font-bold text-white"
                  >
                    {isAr ? '+ إضافة تقييم' : '+ Add Review'}
                  </button>
                </form>
              </div>

              {/* FAQs Manager */}
              <div className="border border-[#27272b] bg-[#121214] p-6">
                <h2 className="border-b border-[#252529] pb-3 text-base font-bold text-[#f5f3ef]">
                  {isAr ? 'إدارة الأسئلة الشائعة' : 'FAQ Manager'} ({settingsDraft.faqs.length})
                </h2>

                <div className="mt-4 space-y-3">
                  {settingsDraft.faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="flex items-start justify-between gap-3 border border-[#242428] bg-[#0d0d0f] p-3 text-xs"
                    >
                      <div>
                        <strong className="text-[#f5f3ef]">
                          {isAr ? faq.questionAr : faq.questionEn}
                        </strong>
                        <p className="mt-1 text-[#aaa6a1]">{isAr ? faq.answerAr : faq.answerEn}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="shrink-0 text-[#ff9ea2] hover:text-[#ed1c24]"
                        aria-label={`Delete FAQ ${faq.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddFaq} className="mt-5 space-y-3 border-t border-[#242428] pt-4">
                  <input
                    type="text"
                    placeholder={isAr ? 'السؤال (عربي) *' : 'Question AR *'}
                    value={newFaq.questionAr}
                    onChange={(e) => setNewFaq({ ...newFaq, questionAr: e.target.value })}
                    className="h-9 w-full border border-[#353539] bg-[#0b0b0c] px-2.5 text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    placeholder={isAr ? 'الإجابة (عربي) *' : 'Answer AR *'}
                    value={newFaq.answerAr}
                    onChange={(e) => setNewFaq({ ...newFaq, answerAr: e.target.value })}
                    className="w-full border border-[#353539] bg-[#0b0b0c] p-2.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="h-9 bg-[#ed1c24] px-4 text-xs font-bold text-white"
                  >
                    {isAr ? '+ إضافة سؤال شائع' : '+ Add FAQ'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & BACKUP */}
        {tab === 'settings' && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <form
              onSubmit={handleSaveSettings}
              className="space-y-4 border border-[#27272b] bg-[#121214] p-6 sm:p-8"
            >
              <h2 className="border-b border-[#252529] pb-3 text-base font-bold text-[#f5f3ef]">
                {isAr ? 'إعدادات المعرض والتمويل والتشغيل' : 'Showroom, Financing & Energy Tariffs'}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'رقم الهاتف المعروض' : 'Display Phone'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsDraft.phoneDisplay}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, phoneDisplay: e.target.value })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'رقم واتساب (أرقام فقط)' : 'WhatsApp Digits'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsDraft.whatsappDigits}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, whatsappDigits: e.target.value })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'العنوان (عربي)' : 'Address (AR)'}
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.addressAr}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, addressAr: e.target.value })
                    }
                    className="h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'العنوان (إنجليزي)' : 'Address (EN)'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsDraft.addressEn}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, addressEn: e.target.value })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'سعر لتر البنزين 92/95 (EGP)' : 'Fuel Price / Liter (EGP)'}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={settingsDraft.fuelPriceEgpPerLiter}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        fuelPriceEgpPerLiter: Number(e.target.value),
                      })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'سعر الكيلووات كهرباء (EGP)' : 'Electricity / kWh (EGP)'}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={settingsDraft.electricityEgpPerKwh}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        electricityEgpPerKwh: Number(e.target.value),
                      })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#bbb]">
                    {isAr ? 'نسبة الفائدة الافتراضية (%)' : 'Default Annual Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={settingsDraft.defaultAnnualRatePct}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        defaultAnnualRatePct: Number(e.target.value),
                      })
                    }
                    className="font-latin h-10 w-full border border-[#36363a] bg-[#0b0b0c] px-3 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 h-10 bg-[#ed1c24] px-6 text-xs font-bold text-white hover:bg-[#ff3037]"
              >
                {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
              </button>
            </form>

            <div className="space-y-4 border border-[#27272b] bg-[#121214] p-6 sm:p-8">
              <h2 className="border-b border-[#252529] pb-3 text-base font-bold text-[#f5f3ef]">
                {isAr ? 'النسخ الاحتياطي والاستعادة (مجانًا بالكامل)' : 'Backup & Restore'}
              </h2>
              <p className="text-xs leading-relaxed text-[#a5a09a]">
                {isAr
                  ? 'تُحفظ بيانات المعرض في قاعدة البيانات المشتركة بعد ربط المشروع. يمكنك تنزيل نسخة JSON احتياطية أو استعادتها.'
                  : 'Showroom data is saved to the shared database once connected. Export or restore a JSON backup anytime.'}
              </p>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 border border-[#3c3c40] bg-[#18181b] text-xs font-semibold text-white hover:border-[#ed1c24]"
                >
                  <Download className="h-4 w-4" />
                  <span>{isAr ? 'تصدير نسخة احتياطية JSON' : 'Export JSON Backup'}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 border border-[#3c3c40] bg-[#18181b] text-xs font-semibold text-white hover:border-[#d8b789]"
                >
                  <Upload className="h-4 w-4" />
                  <span>{isAr ? 'استيراد نسخة احتياطية JSON' : 'Import JSON Backup'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onResetFactory();
                    setSettingsDraft(DEFAULT_SETTINGS);
                    showAdminBanner(
                      isAr
                        ? `تمت استعادة البيانات الافتراضية (${CARS.length} سيارات، ${INITIAL_BOOKINGS.length} حجوزات).`
                        : 'Restored default factory catalog and settings.',
                    );
                  }}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 border border-[#4a2628] bg-[#1a1011] text-xs font-semibold text-[#ff9ea2] hover:border-[#ed1c24]"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{isAr ? 'استعادة البيانات الأصلية للموقع' : 'Reset to Factory Defaults'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
