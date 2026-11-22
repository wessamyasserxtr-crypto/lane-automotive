/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ArrowUpRight, Calculator, CalendarCheck, GitCompareArrows, Sparkles } from 'lucide-react';
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
  type CarModel,
  type CurrencyCode,
  type LangCode,
} from './data/cars';
import { TRANSLATIONS } from './data/i18n';
import {
  DEFAULT_SETTINGS,
  INITIAL_BOOKINGS,
  loadStoredBookings,
  loadStoredCars,
  loadStoredSettings,
  STORAGE_KEYS,
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
      return;
    }
    let active = true;
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
    void Promise.all(bookings.map((booking) => setDoc(doc(firestore, 'visit_bookings', booking.id), {
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
        <WelcomeLogin lang={lang} loading={authLoading} onGoogleLogin={handleWelcomeGoogleLogin} onContinueAsGuest={() => setWelcomeStep('recommendation')} />
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
            settings={settings}
            isAuthenticated={isAdminAuthenticated}
            authConfigured={isFirebaseConfigured}
            authLoading={authLoading}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            onUpdateCars={setCars}
            onUpdateBookings={setBookings}
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

function WelcomeLogin({ lang, loading, onGoogleLogin, onContinueAsGuest }: {
  lang: LangCode;
  loading: boolean;
  onGoogleLogin: () => Promise<void>;
  onContinueAsGuest: () => void;
}) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAr = lang === 'ar';
  const c = isAr
    ? { title: 'أهلاً بك في LANE', subtitle: 'اختاري حساب Google للمتابعة. أول دخول ينشئ حسابك تلقائياً.', google: 'المتابعة باستخدام Google', guest: 'المتابعة كزائرة', busy: 'جارٍ فتح Google…', invalid: 'تعذر فتح تسجيل Google. قد يحتاج مسؤول الموقع إلى إكمال إعداد المزوّد.' }
    : { title: 'Welcome to LANE', subtitle: 'Choose a Google account to continue. Your account is created automatically the first time.', google: 'Continue with Google', guest: 'Continue as a guest', busy: 'Opening Google…', invalid: 'Could not start Google sign-in. The site owner may need to finish provider setup.' };
  const signIn = async () => {
    setError(''); setSubmitting(true);
    try { await onGoogleLogin(); } catch { setError(c.invalid); setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[radial-gradient(ellipse_at_70%_12%,#281416_0%,#111_44%,#080809_82%)] px-5 py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md border border-white/10 bg-[#101012]/95 p-7 shadow-2xl shadow-black/50 sm:p-9">
        <div className="mb-8 text-center"><div className="font-latin text-5xl font-extrabold tracking-tight text-white">LANE<span className="text-[#ed1c24]">.</span></div><p className="mt-2 text-xs tracking-[0.35em] text-white/50">AUTOMOTIVE</p></div>
        <h1 className="text-2xl font-bold text-white">{c.title}</h1><p className="mt-2 text-sm text-white/60">{c.subtitle}</p>
        {error && <p role="alert" className="mt-5 text-sm text-red-400">{error}</p>}
        <button type="button" onClick={() => void signIn()} disabled={submitting || loading} className="mt-7 flex w-full items-center justify-center gap-3 border border-white/20 bg-white px-4 py-3 font-semibold text-[#202124] transition hover:bg-white/90 disabled:opacity-60">
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"/></svg>
          {submitting ? c.busy : c.google}
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-white/35"><span className="h-px flex-1 bg-white/10" /><span>LANE</span><span className="h-px flex-1 bg-white/10" /></div>
        <button type="button" onClick={onContinueAsGuest} className="w-full border border-white/20 px-4 py-3 text-sm font-medium text-white/80 transition hover:border-white/50 hover:text-white">{c.guest}</button>
      </div>
    </div>
  );
}
