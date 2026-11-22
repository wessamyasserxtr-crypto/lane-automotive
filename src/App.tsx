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
  loadAdminPasscode,
  loadStoredBookings,
  loadStoredCars,
  loadStoredSettings,
  STORAGE_KEYS,
  type ShowroomSettings,
  type VisitBooking,
} from './data/store';
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
  const [gateOpen, setGateOpen] = useState<boolean>(() => !shouldSkipGateInitially());

  const [cars, setCars] = useState<CarModel[]>(() => loadStoredCars());
  const [bookings, setBookings] = useState<VisitBooking[]>(() => loadStoredBookings());
  const [settings, setSettings] = useState<ShowroomSettings>(() => loadStoredSettings());
  const [adminPasscode, setAdminPasscode] = useState<string>(() => loadAdminPasscode());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.adminSession) === '1';
    } catch {
      return false;
    }
  });

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
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseRouteFromHash(window.location.hash);
      setRoute(parsed);
      if (parsed.page === 'admin') {
        setGateOpen(false);
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
      setGateOpen(false);
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
    setGateOpen(false);
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
    setGateOpen(false);
    try {
      sessionStorage.setItem('laneGateSeen', '1');
    } catch {
      // Ignore
    }
  };

  const handleBookVisit = (carId: string) => {
    setActiveCar(null);
    setVisitCarId(carId);
    navigate({ page: 'visit' });
  };

  const handleAddBooking = (booking: VisitBooking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem(STORAGE_KEYS.adminSession, '1');
    } catch {
      // Ignore
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.adminSession);
    } catch {
      // Ignore
    }
  };

  const handleUpdatePasscode = (nextPass: string) => {
    setAdminPasscode(nextPass);
    try {
      if (nextPass) localStorage.setItem(STORAGE_KEYS.adminPasscode, nextPass);
      else localStorage.removeItem(STORAGE_KEYS.adminPasscode);
    } catch {
      // Ignore
    }
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
      <QuizGate
        open={gateOpen && route.page !== 'admin'}
        cars={cars}
        t={t}
        lang={lang}
        currency={currency}
        onLangChange={setLang}
        onComplete={handleGateComplete}
        onSkip={handleGateSkip}
      />

      <Header
        t={t}
        lang={lang}
        currency={currency}
        currentPage={route.page}
        settings={settings}
        isAdminAuthenticated={isAdminAuthenticated}
        onLangChange={setLang}
        onCurrencyChange={setCurrency}
        onNavigate={navigate}
      />

      <main>
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
            adminPasscode={adminPasscode}
            isAuthenticated={isAdminAuthenticated}
            onLoginSuccess={handleAdminLogin}
            onLogout={handleAdminLogout}
            onUpdateCars={setCars}
            onUpdateBookings={setBookings}
            onUpdateSettings={setSettings}
            onUpdatePasscode={handleUpdatePasscode}
            onResetFactory={handleResetFactory}
            onNavigate={navigate}
          />
        )}
      </main>

      <SiteFooter t={t} settings={settings} onNavigate={navigate} />

      <CarDetailModal
        car={activeCar}
        whatsappDigits={settings.whatsappDigits}
        t={t}
        lang={lang}
        currency={currency}
        onClose={() => setActiveCar(null)}
        onBookVisit={handleBookVisit}
      />

      <CompareModal
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
      />


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
