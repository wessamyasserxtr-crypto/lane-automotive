import { useEffect, useMemo, useState } from 'react';
import { Calculator, CarFront, GitCompare, Headphones } from 'lucide-react';
import { CARS, type CarModel, type Currency, type Lang } from './data/cars';
import { DICTIONARY } from './data/i18n';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { InventorySection } from './components/InventorySection';
import { QuizSection } from './components/QuizSection';
import { FinanceSection } from './components/FinanceSection';
import { LaneAiSection } from './components/LaneAiSection';
import { LocationContactSection } from './components/LocationContactSection';
import { CarDetailModal } from './components/CarDetailModal';
import { CompareModal } from './components/CompareModal';
import { GarageDrawer } from './components/GarageDrawer';
import { DriftIntro } from './components/DriftIntro';

import { ConciergeGate } from './components/ConciergeGate';

const STORAGE_FAV_KEY = 'lane_saved_garage_v1';
const STORAGE_LANG_KEY = 'lane_lang_v1';
const STORAGE_CURRENCY_KEY = 'lane_currency_v1';
const SESSION_GATE_SEEN_KEY = 'lane_gate_seen_v1';

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as Lang | null;
      return saved && saved in DICTIONARY ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENCY_KEY) as Currency | null;
      return saved && ['EGP', 'USD', 'EUR', 'GBP', 'CNY'].includes(saved) ? saved : 'EGP';
    } catch {
      return 'EGP';
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FAV_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

  const [showIntro, setShowIntro] = useState(true);
  const [showGate, setShowGate] = useState(false);
  const [gatePendingAfterIntro, setGatePendingAfterIntro] = useState<boolean>(() => {
    try {
      if (new URLSearchParams(window.location.search).get('browse') === '1') return false;
      return sessionStorage.getItem(SESSION_GATE_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [garageOpen, setGarageOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Financing calculator state
  const [financeCarId, setFinanceCarId] = useState<string>(CARS[0].id);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(30);
  const [months, setMonths] = useState<number>(60);
  const [annualRatePct, setAnnualRatePct] = useState<number>(17.5);

  const t = DICTIONARY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENCY_KEY, currency);
    } catch {
      // Ignore storage errors
    }
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage errors
    }
  }, [favorites]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(''), 3000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const markGateSeen = () => {
    try {
      sessionStorage.setItem(SESSION_GATE_SEEN_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  };

  const handleIntroFinish = () => {
    setShowIntro(false);
    if (gatePendingAfterIntro) {
      setGatePendingAfterIntro(false);
      setShowGate(true);
    }
  };

  const handleCloseGate = () => {
    markGateSeen();
    setShowGate(false);
  };

  const handleApplyMatches = (matchedIds: string[], topCar: CarModel, jumpToInventory: boolean) => {
    markGateSeen();
    setRecommendedIds(matchedIds);
    setFinanceCarId(topCar.id);
    setShowGate(false);

    if (jumpToInventory) {
      setTimeout(() => {
        const target =
          matchedIds.length > 0
            ? document.getElementById(`car-card-${topCar.id}`) || document.getElementById('inventory')
            : document.getElementById('inventory');
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 180);
    }
  };

  const handleQuizMatchesComputed = (matchedIds: string[], topCar: CarModel) => {
    setRecommendedIds(matchedIds);
    setFinanceCarId(topCar.id);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleCompare = (id: string) => {
    if (!compareIds.includes(id) && compareIds.length === 1) setCompareOpen(true);
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        showToast(t.maxCompareToast);
        return prev;
      }
      return [...prev, id];
    });
  };

  const quickCompare = (id: string) => {
    const alreadySelected = compareIds.includes(id);
    const hasOtherCar = compareIds.some((selectedId) => selectedId !== id);
    if (!alreadySelected && compareIds.length >= 3) {
      showToast(t.maxCompareToast);
      return;
    }
    if (!alreadySelected) setCompareIds((prev) => [...prev, id]);
    if (hasOtherCar) setCompareOpen(true);
  };

  const savedCars = useMemo(
    () => favorites.map((id) => CARS.find((c) => c.id === id)).filter((c): c is CarModel => Boolean(c)),
    [favorites]
  );

  const compareCars = useMemo(
    () => compareIds.map((id) => CARS.find((c) => c.id === id)).filter((c): c is CarModel => Boolean(c)),
    [compareIds]
  );

  const experiencePillars = [
    { icon: CarFront, title: t.f1, desc: t.f1d },
    { icon: Calculator, title: t.f2, desc: t.f2d },
    { icon: GitCompare, title: t.f3, desc: t.f3d },
    { icon: Headphones, title: t.f4, desc: t.f4d },
  ];

  return (
    <div className="min-h-screen bg-[#090909] text-[#f5f3ef]">
      <DriftIntro visible={showIntro} lang={lang} onFinish={handleIntroFinish} />

      <ConciergeGate
        open={showGate}
        lang={lang}
        currency={currency}
        t={t}
        onLangChange={setLang}
        onClose={handleCloseGate}
        onApplyMatches={handleApplyMatches}
        onInspectCar={(car, matchedIds) => {
          markGateSeen();
          setRecommendedIds(matchedIds);
          setFinanceCarId(car.id);
          setShowGate(false);
          setSelectedCar(car);
        }}
        onShowToast={showToast}
      />

      <Navbar
        lang={lang}
        currency={currency}
        savedCount={favorites.length}
        t={t}
        onLangChange={setLang}
        onCurrencyChange={setCurrency}
        onOpenGarage={() => setGarageOpen(true)}
      />

      <main>
        <HeroSection
          lang={lang}
          sceneActive={!showIntro && !showGate && !selectedCar}
          t={t}
          onReplayIntro={() => setShowIntro(true)}
          onOpenConcierge={() => setShowGate(true)}
          onSelectCar={setSelectedCar}
        />

        {/* Editorial Ticker Strip */}
        <div className="relative overflow-hidden bg-[#ed1c24] py-3" aria-hidden="true">
          <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap font-latin text-xs font-bold tracking-[0.2em] text-white">
            <span>{t.tickerText}</span>
            <span>{t.tickerText}</span>
            <span>{t.tickerText}</span>
            <span>{t.tickerText}</span>
          </div>
        </div>

        <InventorySection
          lang={lang}
          currency={currency}
          t={t}
          favorites={favorites}
          compareIds={compareIds}
          recommendedIds={recommendedIds}
          onToggleFavorite={toggleFavorite}
          onToggleCompare={toggleCompare}
          onClearCompare={() => setCompareIds([])}
          onClearRecommendations={() => setRecommendedIds([])}
          onOpenCompareModal={() => setCompareOpen(true)}
          onOpenConcierge={() => setShowGate(true)}
          onSelectCar={setSelectedCar}
        />

        <QuizSection
          lang={lang}
          currency={currency}
          t={t}
          onSelectCar={setSelectedCar}
          onMatchesComputed={handleQuizMatchesComputed}
          onShowToast={showToast}
        />

        {/* Experience Section */}
        <section id="journey" className="bg-[#090909] py-20 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-[6%]">
            <div className="max-w-2xl">
              <p className="font-latin text-xs font-semibold tracking-wider text-[#ed1c24]">
                {t.expKicker}
              </p>
              <h2
                className="mt-3 font-bold leading-tight tracking-tight text-[#f5f3ef]"
                style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)', textWrap: 'balance' }}
              >
                {t.expTitle}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#aaa6a1]">{t.expDesc}</p>
            </div>

            <div className="mt-12 grid grid-cols-1 border-y border-[#262626] sm:grid-cols-2 lg:grid-cols-4">
              {experiencePillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className={`p-7 ${
                      idx > 0 ? 'border-t border-[#262626] lg:border-t-0 lg:border-s' : ''
                    } ${idx === 2 ? 'sm:border-s-0 lg:border-s' : ''} ${
                      idx === 1 ? 'sm:border-s sm:border-t-0' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5 text-[#ed1c24]" />
                    <h3 className="mt-4 text-sm font-bold text-[#f5f3ef]">{pillar.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#aaa6a1]">{pillar.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <FinanceSection
          lang={lang}
          currency={currency}
          t={t}
          selectedCarId={financeCarId}
          downPaymentPct={downPaymentPct}
          months={months}
          annualRatePct={annualRatePct}
          onCarChange={setFinanceCarId}
          onDownPaymentChange={setDownPaymentPct}
          onMonthsChange={setMonths}
          onRateChange={setAnnualRatePct}
        />

        <LaneAiSection lang={lang} currency={currency} t={t} onSelectCar={setSelectedCar} />

        <LocationContactSection
          lang={lang}
          t={t}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#222] bg-[#070707] py-14">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-[6%]">
          <div className="flex flex-col justify-between gap-10 pb-10 md:flex-row">
            <div>
              <a href="#home" className="font-latin text-2xl font-extrabold tracking-tight text-[#f5f3ef]">
                LANE<span className="text-[#ed1c24]">.</span>
              </a>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#8b8781]">{t.footerDesc}</p>
            </div>

            <div className="flex flex-wrap gap-12">
              <div>
                <h3 className="text-xs font-bold text-[#f5f3ef]">{t.footerExplore}</h3>
                <ul className="mt-3 space-y-2.5 text-xs text-[#9c9790]">
                  <li>
                    <a href="#inventory" className="hover:text-white">
                      {t.navCars}
                    </a>
                  </li>
                  <li>
                    <a href="#quiz" className="hover:text-white">
                      {t.heroPrimaryCta}
                    </a>
                  </li>
                  <li>
                    <a href="#finance" className="hover:text-white">
                      {t.navFinance}
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#f5f3ef]">{t.footerConnect}</h3>
                <ul className="mt-3 space-y-2.5 text-xs text-[#9c9790]">
                  <li>
                    <a
                      href="https://wa.me/201274555677"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      WhatsApp
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/laneautomotive1/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a href="#location" className="hover:text-white">
                      {t.navVisit}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-[#1e1e1e] pt-6 text-[11px] text-[#77736e] sm:flex-row">
            <span className="font-latin">{t.footerRights}</span>
            <span>{t.footerDisclaimer}</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CarDetailModal
        car={selectedCar}
        lang={lang}
        currency={currency}
        t={t}
        onClose={() => setSelectedCar(null)}
        favorites={favorites}
        compareIds={compareIds}
        onToggleFavorite={toggleFavorite}
        onQuickCompare={quickCompare}
      />

      <CompareModal
        open={compareOpen}
        cars={compareCars}
        lang={lang}
        currency={currency}
        t={t}
        onClose={() => setCompareOpen(false)}
        onSelectCar={(car) => setSelectedCar(car)}
      />

      <GarageDrawer
        open={garageOpen}
        cars={savedCars}
        lang={lang}
        currency={currency}
        t={t}
        onClose={() => setGarageOpen(false)}
        onRemove={toggleFavorite}
        onClearAll={() => setFavorites([])}
        onSelectCar={(car) => setSelectedCar(car)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 z-50 rounded-sm border border-[#3a3a3a] bg-[#161616] px-4 py-3 text-xs font-medium text-[#f5f3ef] shadow-xl ltr:left-5 rtl:right-5"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
