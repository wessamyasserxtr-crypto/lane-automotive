/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ArrowUpRight, Calculator, CalendarCheck, GitCompareArrows, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  CARS,
  HERO_IMAGE_URL,
  type CarModel,
  type CurrencyCode,
  type LangCode,
} from './data/cars';
import { TRANSLATIONS } from './data/i18n';
import {
  DEFAULT_SETTINGS,
  type FinanceEntry,
  INITIAL_BOOKINGS,
  loadStoredBookings,
  loadStoredCars,
  loadStoredSettings,
  STORAGE_KEYS,
  type CustomerLead,
  type ShowroomSettings,
  type VisitBooking,
} from './data/store';
import { firebaseAuth, firestore, isFirebaseConfigured, LANE_ADMIN_EMAIL } from './lib/firebase';
import {
  buildHashForRoute,
  parseRouteFromHash,
  type AppRoute,
  type InventoryFilter,
} from './utils/laneLogic';
import { Header } from './components/Header';
import { QuizGate } from './components/QuizGate';
import { HeroSection } from './components/HeroSection';
import { InventorySection } from './components/InventorySection';
import { SmartQuizSection } from './components/SmartQuizSection';
import {
  ExperienceSection,
  FinanceCalculatorSection,
} from './components/ExperienceAndFinanceSection';
import { AiAssistantSection } from './components/AiAssistantSection';
import { SiteFooter, VisitSection } from './components/LocationAndFooter';
import { CarDetailModal } from './components/CarDetailModal';
import { CompareModal } from './components/CompareModal';
import { CarDetailPage } from './components/CarDetailPage';
import { ComparePage } from './components/ComparePage';
import { AdminPage } from './components/AdminPage';
import { TrustAndFaqSection } from './components/TrustAndFaqSection';
import { DriftIntro } from './components/DriftIntro';

type WelcomeStep = 'intro' | 'login' | 'recommendation' | 'site';

function shouldSkipGateInitially(): boolean {
  if (typeof window === 'undefined') return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1' || params.get('browse') === '1') {
    return true;
  }
  const initialRoute = parseRouteFromHash(window.location.hash);
  if (initialRoute.page !== 'home') {
    return true;
  }
  try {
    return sessionStorage.getItem('laneGateSeen') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [lang, setLang] = useState<LangCode>('ar');
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined'
      ? parseRouteFromHash(window.location.hash)
      : { page: 'home' },
  );
  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>(() => {
    if (typeof window === 'undefined') return 'site';
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('browse') === '1') return 'site';
    try { return sessionStorage.getItem('laneWelcomeSeen') === '1' ? 'site' : 'intro'; }
    catch { return 'intro'; }
  });
  const gateOpen = welcomeStep === 'recommendation';

  const [cars, setCars] = useState<CarModel[]>(() => loadStoredCars());
  const [bookings, setBookings] = useState<VisitBooking[]>(() => loadStoredBookings());
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [financeStatus, setFinanceStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [customerLeads, setCustomerLeads] = useState<CustomerLead[]>([]);
  const [crmStatus, setCrmStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [settings, setSettings] = useState<ShowroomSettings>(() => loadStoredSettings());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [remoteDataReady, setRemoteDataReady] = useState(false);

  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.favorites);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [activeCar, setActiveCar] = useState<CarModel | null>(null);
  const [recommendedCarId, setRecommendedCarId] = useState<string | null>(null);
  const [visitCarId, setVisitCarId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!firebaseAuth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        setIsAdminAuthenticated(false);
      } else {
        const isLaneAdmin = user.email?.toLowerCase() === LANE_ADMIN_EMAIL && user.emailVerified;
        setIsAdminAuthenticated(isLaneAdmin);
        setWelcomeStep((current) => {
          if (current === 'login') return 'recommendation';
          if (current === 'intro') return 'site';
          return current;
        });
        try { sessionStorage.setItem('laneWelcomeSeen', '1'); } catch { /* Ignore */ }
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firestore || !isAdminAuthenticated) {
      setRemoteDataReady(false);
      setFinanceStatus('loading');
      setCrmStatus('loading');
      return;
    }
    let active = true;
    setFinanceStatus('loading');
    setCrmStatus('loading');
    void (async () => {
      try {
        const [showroomSnapshot, bookingSnapshot] = await Promise.all([
          getDoc(doc(firestore, 'showroom_state', 'primary')),
          getDocs(query(collection(firestore, 'visit_bookings'), orderBy('createdAt', 'desc'))),
        ]);
        if (!active) return;
        const showroom = showroomSnapshot.exists() ? showroomSnapshot.data() : null;
        if (showroom?.cars) setCars(showroom.cars as CarModel[]);
        if (showroom?.settings) setSettings(showroom.settings as ShowroomSettings);
        setBookings(bookingSnapshot.docs.map((row) => ({
          ...row.data(),
          id: row.id,
        })) as VisitBooking[]);
        try {
          const financeSnapshot = await getDocs(query(collection(firestore, 'finance_entries'), orderBy('occurredOn', 'desc')));
          if (!active) return;
          setFinanceEntries(financeSnapshot.docs.map((row) => ({
            ...row.data(),
            id: row.id,
          })) as FinanceEntry[]);
          setFinanceStatus('ready');
        } catch (error) {
          console.error('Could not load private LANE accounting entries:', error);
          if (active) setFinanceStatus('error');
        }
        try {
          const crmSnapshot = await getDocs(query(collection(firestore, 'crm_leads'), orderBy('updatedAt', 'desc')));
          if (!active) return;
          setCustomerLeads(crmSnapshot.docs.map((row) => ({ ...row.data(), id: row.id })) as CustomerLead[]);
          setCrmStatus('ready');
        } catch (error) {
          console.error('Could not load private LANE customer records:', error);
          if (active) setCrmStatus('error');
        }
      } catch (error) {
        console.error('Could not load LANE data from Firebase:', error);
      } finally {
        if (active) setRemoteDataReady(true);
      }
    })();
    return () => { active = false; };
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (!firestore || !isAdminAuthenticated || !remoteDataReady) return;
    void setDoc(doc(firestore, 'showroom_state', 'primary'), {
      cars, settings, updatedAt: serverTimestamp(),
    }, { merge: true }).catch((error) => console.error('Could not save LANE showroom data:', error));
  }, [cars, settings, isAdminAuthenticated, remoteDataReady]);

  useEffect(() => {
    if (!firestore || !isAdminAuthenticated || !remoteDataReady) return;
    const db = firestore;
    void Promise.all(bookings.map((booking) => setDoc(doc(db, 'visit_bookings', booking.id), {
      name: booking.name,
      phone: booking.phone,
      carId: booking.carId,
      date: booking.date,
      status: booking.status,
      notes: booking.notes || null,
      createdAt: booking.createdAt,
    }, { merge: true }))).catch((error) => console.error('Could not save LANE visit bookings:', error));
  }, [bookings, isAdminAuthenticated, remoteDataReady]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (!firestore) return;
    let active = true;
    void getDoc(doc(firestore, 'showroom_state', 'primary'))
      .then((snapshot) => {
        if (!active || !snapshot.exists()) return;
        const data = snapshot.data();
        if (data.cars) setCars(data.cars as CarModel[]);
        if (data.settings) setSettings(data.settings as ShowroomSettings);
      })
      .catch((error) => console.error('Could not load public LANE catalog:', error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseRouteFromHash(window.location.hash);
      setRoute(parsed);
      if (parsed.page === 'admin') {
        setWelcomeStep('site');
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cars, JSON.stringify(cars));
    } catch {
      // Ignore storage failures
    }
  }, [cars]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    } catch {
      // Ignore storage failures
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore storage failures
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
    } catch {
      // Ignore storage failures
    }
  }, [favorites]);

  const navigate = (nextRoute: AppRoute) => {
    const nextHash = buildHashForRoute(nextRoute);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    } else {
      setRoute(nextRoute);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (nextRoute.page === 'admin') {
      setWelcomeStep('site');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2600);
  };

  const handleToggleFavorite = (carId: string) => {
    setFavorites((prev) =>
      prev.includes(carId) ? prev.filter((id) => id !== carId) : [...prev, carId],
    );
  };

  const handleToggleCompare = (carId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(carId)) {
        return prev.filter((id) => id !== carId);
      }
      if (prev.length >= 3) {
        showToast(
          lang === 'ar'
            ? 'يمكن مقارنة 3 سيارات كحد أقصى في نفس الوقت'
            : 'You can compare up to 3 cars at once',
        );
        return prev;
      }
      return [...prev, carId];
    });
  };

  const handleSetCompareSlot = (slotIndex: number, carId: string) => {
    setCompareIds((prev) => {
      const next = [
        prev[0] || cars[0]?.id || '',
        prev[1] || cars[1]?.id || '',
        prev[2] || '',
      ];
      next[slotIndex] = carId;
      return next.filter(Boolean);
    });
  };

  const handleGateComplete = (topCarId?: string) => {
    setWelcomeStep('site');
    try {
      sessionStorage.setItem('laneGateSeen', '1');
    } catch {
      // Ignore
    }
    if (topCarId) {
      setRecommendedCarId(topCarId);
      setFilter('all');
      navigate({ page: 'cars' });
    }
  };

  const handleGateSkip = () => {
    setWelcomeStep('site');
    try {
      sessionStorage.setItem('laneGateSeen', '1');
      sessionStorage.setItem('laneWelcomeSeen', '1');
    } catch {
      // Ignore
    }
  };

  const finishWelcome = () => {
    setWelcomeStep('site');
    try { sessionStorage.setItem('laneWelcomeSeen', '1'); } catch { /* Ignore */ }
  };

  const handleWelcomeGoogleLogin = async () => {
    if (!firebaseAuth) throw new Error('إعداد تسجيل الدخول غير مكتمل بعد.');
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(firebaseAuth, provider);
    setWelcomeStep('recommendation');
  };

  const handleBookVisit = (carId: string) => {
    setActiveCar(null);
    setVisitCarId(carId);
    navigate({ page: 'visit' });
  };

  const handleAddBooking = (booking: VisitBooking) => {
    setBookings((prev) => [booking, ...prev]);
    if (firestore) {
      void setDoc(doc(firestore, 'visit_bookings', booking.id), {
        name: booking.name,
        phone: booking.phone,
        carId: booking.carId,
        date: booking.date,
        status: booking.status,
        notes: booking.notes || null,
        createdAt: booking.createdAt,
      }).catch((error) => console.error('Could not save LANE visit request:', error));
    }
  };

  const handleAddFinanceEntry = async (entry: FinanceEntry) => {
    if (!firestore || !isAdminAuthenticated) throw new Error('Admin access is required.');
    const { id, ...data } = entry;
    await setDoc(doc(firestore, 'finance_entries', id), data);
    setFinanceEntries((current) => [entry, ...current.filter((item) => item.id !== id)]);
  };

  const handleVoidFinanceEntry = async (entry: FinanceEntry) => {
    if (!firestore || !isAdminAuthenticated) throw new Error('Admin access is required.');
    const { id, ...data } = entry;
    await setDoc(doc(firestore, 'finance_entries', id), data);
    setFinanceEntries((current) => current.map((item) => item.id === id ? entry : item));
  };

  const handleSaveCustomerLead = async (lead: CustomerLead) => {
    if (!firestore || !isAdminAuthenticated) throw new Error('Admin access is required.');
    const { id, ...data } = lead;
    await setDoc(doc(firestore, 'crm_leads', id), data);
    setCustomerLeads((current) => [lead, ...current.filter((item) => item.id !== id)]);
  };

  const handleAdminLogin = async () => {
    if (!firebaseAuth) throw new Error('إعداد قاعدة البيانات غير مكتمل بعد.');
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const { user } = await signInWithPopup(firebaseAuth, provider);
    if (user.email?.toLowerCase() !== LANE_ADMIN_EMAIL || !user.emailVerified) {
      await signOut(firebaseAuth);
      throw new Error('الحساب غير مضاف لقائمة مديري LANE.');
    }
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = async () => {
    if (firebaseAuth) await signOut(firebaseAuth);
  };

  const handleResetFactory = () => {
    setCars(CARS);
    setBookings(INITIAL_BOOKINGS);
    setSettings(DEFAULT_SETTINGS);
  };

  const compareCars = cars.filter((c) => compareIds.includes(c.id));
  const detailCar =
    route.page === 'car-detail'
      ? cars.find((c) => c.id === route.carId) || null
      : null;

  return (
    <div className="min-h-screen bg-[#090909] text-[#f5f3ef]">
      <DriftIntro visible={welcomeStep === 'intro'} lang={lang} onFinish={() => setWelcomeStep('login')} />
      {welcomeStep === 'login' && (
        <WelcomeLogin lang={lang} loading={authLoading} onGoogleLogin={handleWelcomeGoogleLogin} />
      )}
      <QuizGate
        open={gateOpen && route.page !== 'admin'}
        cars={cars}
        t={t}
        lang={lang}
        currency={currency}
        onLangChange={setLang}
        onComplete={(id) => { handleGateComplete(id); try { sessionStorage.setItem('laneWelcomeSeen', '1'); } catch { /* Ignore */ } }}
        onSkip={handleGateSkip}
      />

      {welcomeStep === 'site' && <Header
        t={t}
        lang={lang}
        currency={currency}
        currentPage={route.page}
        settings={settings}
        isAdminAuthenticated={isAdminAuthenticated}
        onLangChange={setLang}
        onCurrencyChange={setCurrency}
        onNavigate={navigate}
      />}

      {welcomeStep === 'site' && <main>
        {route.page === 'home' && (
          <>
            <HeroSection
              t={t}
              lang={lang}
              settings={settings}
              carCount={cars.length}
              onNavigate={navigate}
            />

            <InventorySection
              cars={cars}
              t={t}
              lang={lang}
              currency={currency}
              filter={filter}
              favorites={favorites}
              compareIds={compareIds}
              recommendedCarId={recommendedCarId}
              previewLimit={6}
              onFilterChange={setFilter}
              onToggleFavorite={handleToggleFavorite}
              onToggleCompare={handleToggleCompare}
              onOpenCompare={() => navigate({ page: 'compare' })}
              onClearCompare={() => setCompareIds([])}
              onOpenCar={setActiveCar}
              onNavigate={navigate}
            />

            {/* Multi-page Hub Cards */}
            <section className="border-t border-[#1e1e1e] bg-[#0b0b0b] px-[6%] py-16 lg:px-[8%]">
              <div className="mx-auto max-w-6xl">
                <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
                  {t.quickLinksKicker}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#f5f3ef] sm:text-3xl">
                  {t.quickLinksTitle}
                </h2>
                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      route: { page: 'compare' } as AppRoute,
                      icon: GitCompareArrows,
                      title: t.navcompare,
                      desc: t.compareSubtitle,
                    },
                    {
                      route: { page: 'finance' } as AppRoute,
                      icon: Calculator,
                      title: t.navfinance,
                      desc: t.scheduleTitle,
                    },
                    {
                      route: { page: 'quiz' } as AppRoute,
                      icon: Sparkles,
                      title: t.navquiz,
                      desc: t.aiKicker,
                    },
                    {
                      route: { page: 'visit' } as AppRoute,
                      icon: CalendarCheck,
                      title: t.navlocation,
                      desc: t.visitFormTitle,
                    },
                  ].map((hub) => {
                    const Icon = hub.icon;
                    return (
                      <button
                        key={hub.route.page}
                        type="button"
                        onClick={() => navigate(hub.route)}
                        className="group flex flex-col justify-between border border-[#28282b] bg-[#121214] p-6 text-start transition-colors hover:border-[#ed1c24]"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <Icon className="h-5 w-5 text-[#ed1c24]" />
                            <ArrowUpRight className="h-4 w-4 text-[#7c7772] transition-colors group-hover:text-white" />
                          </div>
                          <h3 className="mt-4 text-base font-bold text-[#f5f3ef]">
                            {hub.title}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-[#9b9690]">
                            {hub.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <ExperienceSection t={t} onNavigate={navigate} />

            <TrustAndFaqSection settings={settings} lang={lang} />

            <VisitSection
              cars={cars}
              settings={settings}
              t={t}
              lang={lang}
              preselectedCarId={visitCarId}
              onAddBooking={handleAddBooking}
            />
          </>
        )}

        {route.page === 'cars' && (
          <InventorySection
            cars={cars}
            t={t}
            lang={lang}
            currency={currency}
            filter={filter}
            favorites={favorites}
            compareIds={compareIds}
            recommendedCarId={recommendedCarId}
            onFilterChange={setFilter}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onOpenCompare={() => navigate({ page: 'compare' })}
            onClearCompare={() => setCompareIds([])}
            onOpenCar={setActiveCar}
            onNavigate={navigate}
          />
        )}

        {route.page === 'car-detail' && (
          <CarDetailPage
            car={detailCar}
            allCars={cars}
            settings={settings}
            t={t}
            lang={lang}
            currency={currency}
            favorites={favorites}
            compareIds={compareIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onNavigate={navigate}
            onBookVisit={handleBookVisit}
          />
        )}

        {route.page === 'compare' && (
          <ComparePage
            cars={cars}
            settings={settings}
            selectedIds={compareIds}
            t={t}
            lang={lang}
            currency={currency}
            onSetSlotCar={handleSetCompareSlot}
            onNavigate={navigate}
            onBookVisit={handleBookVisit}
          />
        )}

        {route.page === 'finance' && (
          <FinanceCalculatorSection
            cars={cars}
            settings={settings}
            t={t}
            lang={lang}
            currency={currency}
            showScheduleTable
            onNavigate={navigate}
          />
        )}

        {route.page === 'quiz' && (
          <>
            <SmartQuizSection
              cars={cars}
              settings={settings}
              t={t}
              lang={lang}
              currency={currency}
              onSelectRecommended={(carId) => setRecommendedCarId(carId)}
              onOpenCar={(car) => navigate({ page: 'car-detail', carId: car.id })}
            />
            <AiAssistantSection cars={cars} t={t} lang={lang} currency={currency} />
          </>
        )}

        {route.page === 'visit' && (
          <VisitSection
            cars={cars}
            settings={settings}
            t={t}
            lang={lang}
            preselectedCarId={visitCarId}
            onAddBooking={handleAddBooking}
          />
        )}

        {route.page === 'admin' && (
          <AdminPage
            lang={lang}
            currency={currency}
            cars={cars}
            bookings={bookings}
            financeEntries={financeEntries}
            financeStatus={financeStatus}
            customerLeads={customerLeads}
            crmStatus={crmStatus}
            settings={settings}
            isAuthenticated={isAdminAuthenticated}
            authConfigured={isFirebaseConfigured}
            authLoading={authLoading}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            onUpdateCars={setCars}
            onUpdateBookings={setBookings}
            onAddFinanceEntry={handleAddFinanceEntry}
            onVoidFinanceEntry={handleVoidFinanceEntry}
            onSaveCustomerLead={handleSaveCustomerLead}
            onUpdateSettings={setSettings}
            onResetFactory={handleResetFactory}
            onNavigate={navigate}
          />
        )}
      </main>}

      {welcomeStep === 'site' && <SiteFooter t={t} settings={settings} onNavigate={navigate} />}

      {welcomeStep === 'site' && <CarDetailModal
        car={activeCar}
        whatsappDigits={settings.whatsappDigits}
        t={t}
        lang={lang}
        currency={currency}
        onClose={() => setActiveCar(null)}
        onBookVisit={handleBookVisit}
      />}

      {welcomeStep === 'site' && <CompareModal
        cars={compareCars}
        open={compareOpen}
        t={t}
        lang={lang}
        currency={currency}
        onClose={() => setCompareOpen(false)}
        onSelectCar={(car) => {
          setCompareOpen(false);
          navigate({ page: 'car-detail', carId: car.id });
        }}
      />}


      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-6 start-6 z-50 border border-[#444] bg-[#151515] px-4 py-3 text-xs text-white shadow-xl"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

function WelcomeLogin({ lang, loading, onGoogleLogin }: {
  lang: LangCode;
  loading: boolean;
  onGoogleLogin: () => Promise<void>;
}) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<'create' | 'signin' | null>(null);
  const copy = {
    ar: {
      title: 'أهلاً بك في LANE', subtitle: 'أنشئي حسابًا جديدًا أو سجّلي الدخول بحساب Google. أول دخول ينشئ حسابك تلقائيًا.', create: 'إنشاء حساب جديد', signin: 'تسجيل الدخول', hint: 'اختاري حساب Google من النافذة. لو معندكيش حساب، اختاري «إنشاء حساب» هناك.', busy: 'جارٍ فتح Google…', invalid: 'تعذر فتح تسجيل Google. حاولي مرة أخرى أو تواصلي مع إدارة الموقع.',
      kicker: 'اختيار أذكى · مشوار أهدى', hero: 'سيارتك الجديدة أقرب مما تتخيّلي.', heroBody: 'اكتشفي سيارات جديدة مختارة، قارني بينها، وابدئي رحلتك مع LANE.', model: 'اختيار LANE لهذا الموسم', safe: 'دخول سريع وآمن عبر Google', showroom: 'معرض سيارات جديدة · الشيخ زايد',
    },
    en: {
      title: 'Welcome to LANE', subtitle: 'Create an account or sign in with Google. Your account is created automatically the first time.', create: 'Create a new account', signin: 'Sign in', hint: 'Choose a Google account. To create one, select “Create account” in the Google window.', busy: 'Opening Google…', invalid: 'Could not start Google sign-in. Try again or contact the site administrator.',
      kicker: 'A smarter choice · A smoother drive', hero: 'Your next car is closer than you think.', heroBody: 'Discover a curated selection of new cars, compare your favourites, and start your next journey with LANE.', model: 'LANE seasonal pick', safe: 'Quick, secure Google sign-in', showroom: 'New cars showroom · Sheikh Zayed',
    },
    fr: {
      title: 'Bienvenue chez LANE', subtitle: 'Créez un compte ou connectez-vous avec Google. Votre compte sera créé automatiquement lors de la première connexion.', create: 'Créer un compte', signin: 'Se connecter', hint: 'Choisissez un compte Google. Pour en créer un, sélectionnez « Créer un compte » dans la fenêtre Google.', busy: 'Ouverture de Google…', invalid: 'Impossible de démarrer la connexion Google. Réessayez ou contactez le site.',
      kicker: 'Un choix plus malin · Une route plus sereine', hero: 'Votre prochaine voiture est plus proche que vous ne le pensez.', heroBody: 'Découvrez une sélection de voitures neuves, comparez vos préférées et commencez votre prochain voyage avec LANE.', model: 'La sélection LANE du moment', safe: 'Connexion Google rapide et sécurisée', showroom: 'Voitures neuves · Sheikh Zayed',
    },
    zh: {
      title: '欢迎来到 LANE', subtitle: '使用 Google 创建账户或登录。首次登录时会自动创建您的账户。', create: '创建新账户', signin: '登录', hint: '选择 Google 账户。要创建账户，请在 Google 弹窗中选择“创建账户”。', busy: '正在打开 Google…', invalid: '无法启动 Google 登录。请重试或联系网站管理员。',
      kicker: '更明智的选择 · 更轻松的旅程', hero: '您的下一辆新车，比想象中更近。', heroBody: '探索精选新车，比较心仪车型，与 LANE 一起开启新的旅程。', model: 'LANE 本季精选', safe: 'Google 快速安全登录', showroom: '新车展厅 · Sheikh Zayed',
    },
    de: {
      title: 'Willkommen bei LANE', subtitle: 'Erstelle ein Konto oder melde dich mit Google an. Beim ersten Login wird dein Konto automatisch erstellt.', create: 'Neues Konto erstellen', signin: 'Anmelden', hint: 'Wähle ein Google-Konto aus. Um ein Konto zu erstellen, wähle im Google-Fenster „Konto erstellen“.', busy: 'Google wird geöffnet…', invalid: 'Google-Anmeldung konnte nicht gestartet werden. Bitte erneut versuchen oder den Website-Administrator kontaktieren.',
      kicker: 'Besser wählen · Entspannter fahren', hero: 'Dein nächstes Auto ist näher, als du denkst.', heroBody: 'Entdecke ausgewählte Neuwagen, vergleiche deine Favoriten und starte mit LANE in deine nächste Fahrt.', model: 'Die LANE-Auswahl der Saison', safe: 'Schnelle, sichere Google-Anmeldung', showroom: 'Neuwagen · Sheikh Zayed',
    },
  }[lang];
  const rtl = lang === 'ar';
  const continueWithGoogle = async (intent: 'create' | 'signin') => {
    setError(''); setSubmitting(intent);
    try { await onGoogleLogin(); } catch { setError(copy.invalid); setSubmitting(null); }
  };
  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#070809] text-white" dir="ltr">
      <motion.img
        src={HERO_IMAGE_URL}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 0.72, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,5,6,.24)_0%,rgba(4,5,6,.56)_42%,rgba(5,6,7,.94)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_55%,rgba(237,28,36,.20),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ed1c24]/80 to-transparent" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1480px] items-center gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)] lg:gap-12 lg:px-14 lg:py-10">
        <motion.section
          dir={rtl ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, x: rtl ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
          className="hidden min-h-[74vh] flex-col justify-between py-4 lg:flex"
        >
          <div>
            <div className="font-latin text-5xl font-extrabold tracking-tight text-white">LANE<span className="text-[#ed1c24]">.</span></div>
            <div className="mt-2 font-latin text-[10px] font-semibold tracking-[0.5em] text-white/55">AUTOMOTIVE</div>
          </div>
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.15em] text-white/65">
              <span className="h-px w-10 bg-[#ed1c24]" />
              <span>{copy.kicker}</span>
            </div>
            <h2 className="max-w-xl text-5xl font-bold leading-[1.15] tracking-tight text-white xl:text-6xl">{copy.hero}</h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/70">{copy.heroBody}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/65">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ed1c24]" />{copy.model}</span>
              <span className="h-4 w-px bg-white/20" />
              <span>{copy.showroom}</span>
            </div>
          </div>
          <span className="font-latin text-[10px] tracking-[0.3em] text-white/35">FIND YOUR ROAD · 2026</span>
        </motion.section>

        <motion.section
          dir={rtl ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="mx-auto w-full max-w-[500px] lg:mx-0 lg:justify-self-end"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0b0c0e]/75 p-6 shadow-[0_32px_100px_rgba(0,0,0,.58)] backdrop-blur-2xl sm:p-9">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ed1c24] to-transparent" />
            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="lg:hidden">
                <div className="font-latin text-3xl font-extrabold tracking-tight text-white">LANE<span className="text-[#ed1c24]">.</span></div>
                <div className="mt-1 font-latin text-[8px] font-semibold tracking-[0.42em] text-white/45">AUTOMOTIVE</div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-latin text-[10px] tracking-[0.12em] text-white/55">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ed1c24]" />
                LANE · ACCOUNT
              </span>
              <span dir="ltr" className="font-latin text-xs font-semibold tracking-[0.12em] text-white/30">01 / 02</span>
            </div>

            <span className="font-latin text-[10px] font-semibold tracking-[0.25em] text-[#ed1c24]">{copy.kicker}</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{copy.title}</h1>
            <p className="mt-3 text-sm leading-7 text-white/60">{copy.subtitle}</p>
            {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}

            <div className="mt-8 grid gap-3">
              {(['create', 'signin'] as const).map((intent) => (
                <motion.button
                  key={intent}
                  type="button"
                  onClick={() => void continueWithGoogle(intent)}
                  disabled={submitting !== null || loading}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={intent === 'create'
                    ? 'group flex min-h-[58px] items-center justify-between gap-3 rounded-xl border border-[#ff353d]/70 bg-[#ed1c24] px-5 text-sm font-bold text-white shadow-lg shadow-[#ed1c24]/15 transition-colors hover:bg-[#cf1720] disabled:cursor-wait disabled:opacity-60'
                    : 'group flex min-h-[58px] items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.045] px-5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.09] disabled:cursor-wait disabled:opacity-60'}
                >
                  <span>{submitting === intent ? copy.busy : copy[intent]}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"/></svg>
                  </span>
                </motion.button>
              ))}
            </div>

            <p className="mt-4 text-center text-xs leading-6 text-white/45">{copy.hint}</p>
            <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-[11px] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{copy.safe}</span>
            </div>
          </div>
          <p className="mt-5 text-center font-latin text-[9px] tracking-[0.25em] text-white/35 lg:hidden">NEW CARS · SHEIKH ZAYED</p>
        </motion.section>
      </div>
    </div>
  );
}
