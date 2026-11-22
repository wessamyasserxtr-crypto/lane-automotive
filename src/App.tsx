/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ArrowUpRight, Calculator, CalendarCheck, GitCompareArrows, Sparkles } from 'lucide-react';
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
import { isSupabaseConfigured, supabase } from './lib/supabase';
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
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let active = true;
    const applySession = async (session: { user: { id: string } } | null) => {
      if (!session) {
        if (active) setIsAdminAuthenticated(false);
        return;
      }
      const { data, error } = await supabase.rpc('is_lane_admin');
      if (active) setIsAdminAuthenticated(!error && data === true);
    };
    void supabase.auth.getSession().then(({ data }) => applySession(data.session)).catch(() => {
      if (active) setIsAdminAuthenticated(false);
    }).finally(() => {
      if (active) setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAdminAuthenticated(false);
        return;
      }
      window.setTimeout(() => { void applySession(session); }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !isAdminAuthenticated) {
      setRemoteDataReady(false);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const [{ data: showroom, error: showroomError }, { data: bookingRows, error: bookingsError }] = await Promise.all([
          supabase.from('showroom_state').select('cars,settings').eq('id', 'primary').maybeSingle(),
          supabase.from('visit_bookings').select('*').order('created_at', { ascending: false }),
        ]);
        if (showroomError) throw showroomError;
        if (bookingsError) throw bookingsError;
        if (!active) return;
        if (showroom?.cars) setCars(showroom.cars as CarModel[]);
        if (showroom?.settings) setSettings(showroom.settings as ShowroomSettings);
        setBookings((bookingRows || []).map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          carId: row.car_id,
          date: row.visit_date,
          status: row.status,
          notes: row.notes || undefined,
          createdAt: row.created_at,
        })) as VisitBooking[]);
      } catch (error) {
        console.error('Could not load LANE data from Supabase:', error);
      } finally {
        if (active) setRemoteDataReady(true);
      }
    })();
    return () => { active = false; };
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (!supabase || !isAdminAuthenticated || !remoteDataReady) return;
    void supabase.from('showroom_state').upsert({
      id: 'primary', cars, settings, updated_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error('Could not save LANE showroom data:', error);
    });
  }, [cars, settings, isAdminAuthenticated, remoteDataReady]);

  useEffect(() => {
    if (!supabase || !isAdminAuthenticated || !remoteDataReady) return;
    const rows = bookings.map((booking) => ({
      id: booking.id,
      name: booking.name,
      phone: booking.phone,
      car_id: booking.carId,
      visit_date: booking.date,
      status: booking.status,
      notes: booking.notes || null,
      created_at: booking.createdAt,
    }));
    if (rows.length) void supabase.from('visit_bookings').upsert(rows).then(({ error }) => {
      if (error) console.error('Could not save LANE visit bookings:', error);
    });
  }, [bookings, isAdminAuthenticated, remoteDataReady]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.from('showroom_state').select('cars,settings').eq('id', 'primary').maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!active || !data) return;
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

  const handleWelcomeLogin = async (email: string, password: string) => {
    await handleAdminLogin(email, password);
    setWelcomeStep('recommendation');
  };

  const handleBookVisit = (carId: string) => {
    setActiveCar(null);
    setVisitCarId(carId);
    navigate({ page: 'visit' });
  };

  const handleAddBooking = (booking: VisitBooking) => {
    setBookings((prev) => [booking, ...prev]);
    if (supabase) {
      void supabase.from('visit_bookings').insert({
        id: booking.id,
        name: booking.name,
        phone: booking.phone,
        car_id: booking.carId,
        visit_date: booking.date,
        status: booking.status,
        notes: booking.notes || null,
        created_at: booking.createdAt,
      }).then(({ error }) => {
        if (error) console.error('Could not save LANE visit request:', error);
      });
    }
  };

  const handleAdminLogin = async (email: string, password: string) => {
    if (!supabase) throw new Error('إعداد قاعدة البيانات غير مكتمل بعد.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_lane_admin');
    if (roleError || !isAdmin) {
      await supabase.auth.signOut();
      throw new Error('الحساب غير مضاف لقائمة مديري LANE.');
    }
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = async () => {
    if (supabase) await supabase.auth.signOut();
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
        <WelcomeLogin lang={lang} loading={authLoading} onLogin={handleWelcomeLogin} onContinueAsGuest={() => setWelcomeStep('recommendation')} />
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
            authConfigured={isSupabaseConfigured}
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

function WelcomeLogin({ lang, loading, onLogin, onContinueAsGuest }: {
  lang: LangCode;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onContinueAsGuest: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAr = lang === 'ar';
  const c = isAr
    ? { title: 'أهلاً بك في LANE', subtitle: 'سجّل الدخول للمتابعة، أو تصفح كزائر.', email: 'البريد الإلكتروني', password: 'كلمة المرور', submit: 'تسجيل الدخول', guest: 'المتابعة كزائر', busy: 'جارٍ تسجيل الدخول…', invalid: 'تعذر تسجيل الدخول. راجع البريد وكلمة المرور.' }
    : { title: 'Welcome to LANE', subtitle: 'Sign in to continue, or browse as a guest.', email: 'Email address', password: 'Password', submit: 'Sign in', guest: 'Continue as guest', busy: 'Signing in…', invalid: 'Could not sign in. Check your email and password.' };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await onLogin(email.trim(), password); } catch { setError(c.invalid); } finally { setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[radial-gradient(ellipse_at_70%_12%,#281416_0%,#111_44%,#080809_82%)] px-5 py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md border border-white/10 bg-[#101012]/95 p-7 shadow-2xl shadow-black/50 sm:p-9">
        <div className="mb-8 text-center"><div className="font-latin text-5xl font-extrabold tracking-tight text-white">LANE<span className="text-[#ed1c24]">.</span></div><p className="mt-2 text-xs tracking-[0.35em] text-white/50">AUTOMOTIVE</p></div>
        <h1 className="text-2xl font-bold text-white">{c.title}</h1><p className="mt-2 text-sm text-white/60">{c.subtitle}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm text-white/75">{c.email}<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border border-white/15 bg-black/35 px-4 py-3 text-white outline-none focus:border-[#ed1c24]" /></label>
          <label className="block text-sm text-white/75">{c.password}<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border border-white/15 bg-black/35 px-4 py-3 text-white outline-none focus:border-[#ed1c24]" /></label>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitting || loading} className="w-full bg-[#ed1c24] px-4 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">{submitting ? c.busy : c.submit}</button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-white/35"><span className="h-px flex-1 bg-white/10" /><span>LANE</span><span className="h-px flex-1 bg-white/10" /></div>
        <button type="button" onClick={onContinueAsGuest} className="w-full border border-white/20 px-4 py-3 text-sm font-medium text-white/80 transition hover:border-white/50 hover:text-white">{c.guest}</button>
      </div>
    </div>
  );
}
