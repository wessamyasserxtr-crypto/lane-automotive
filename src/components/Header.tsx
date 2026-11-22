import { useEffect, useState } from 'react';
import { Lock, Menu, X } from 'lucide-react';
import {
  CURRENCY_LABELS,
  type CurrencyCode,
  type LangCode,
} from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import type { ShowroomSettings } from '../data/store';
import { buildHashForRoute, type AppRoute } from '../utils/laneLogic';


interface HeaderProps {
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
  currentPage: AppRoute['page'];
  settings: ShowroomSettings;
  isAdminAuthenticated: boolean;
  onLangChange: (lang: LangCode) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onNavigate: (route: AppRoute) => void;
}

export function Header({
  t,
  lang,
  currency,
  currentPage,
  settings,
  isAdminAuthenticated,
  onLangChange,
  onCurrencyChange,
  onNavigate,
}: HeaderProps) {
  const [sticky, setSticky] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setSticky(window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: Array<{ route: AppRoute; label: string; isActive: boolean }> = [
    { route: { page: 'home' }, label: t.navhome, isActive: currentPage === 'home' },
    {
      route: { page: 'cars' },
      label: t.navcars,
      isActive: currentPage === 'cars' || currentPage === 'car-detail',
    },
    { route: { page: 'compare' }, label: t.navcompare, isActive: currentPage === 'compare' },
    { route: { page: 'finance' }, label: t.navfinance, isActive: currentPage === 'finance' },
    { route: { page: 'quiz' }, label: t.navquiz, isActive: currentPage === 'quiz' },
    { route: { page: 'visit' }, label: t.navlocation, isActive: currentPage === 'visit' },
  ];

  const handleLinkClick = (e: React.MouseEvent, route: AppRoute) => {
    e.preventDefault();
    setMenuOpen(false);
    onNavigate(route);
  };

  return (
    <>
      <div className="no-print hidden h-9 items-center justify-between border-b border-[#202020] bg-[#0e0e0e] px-[5.5%] text-[11px] text-[#aaa6a1] sm:flex">
        <span className="truncate">{t.topline}</span>
        <div className="flex shrink-0 items-center gap-4">
          <a
            href={buildHashForRoute({ page: 'admin' })}
            onClick={(e) => handleLinkClick(e, { page: 'admin' })}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors ${
              currentPage === 'admin'
                ? 'text-[#ed1c24]'
                : 'text-[#aaa6a1] hover:text-white'
            }`}
          >
            <Lock className="h-3 w-3" />
            <span>
              {t.navadmin}
              {isAdminAuthenticated ? ' ✓' : ''}
            </span>
          </a>
          <a
            href={`tel:${settings.phoneDisplay.replace(/\s+/g, '')}`}
            dir="ltr"
            className="font-latin shrink-0 font-semibold tracking-wider text-[#f5f3ef] transition-colors hover:text-[#ed1c24]"
          >
            {settings.phoneDisplay}
          </a>
        </div>
      </div>

      <header
        className={`no-print inset-x-0 z-40 flex items-center justify-between gap-4 border-b border-white/15 px-[5.5%] transition-all duration-200 ${
          sticky
            ? 'fixed top-0 h-[66px] bg-[#090909]/95 backdrop-blur-md'
            : 'relative h-[74px] bg-[#090909]/90'
        }`}
      >
        <a
          href={buildHashForRoute({ page: 'home' })}
          onClick={(e) => handleLinkClick(e, { page: 'home' })}
          dir="ltr"
          className="font-latin flex shrink-0 items-baseline gap-0.5 whitespace-nowrap text-2xl font-extrabold tracking-tighter text-[#f5f3ef] focus-visible:outline-2 focus-visible:outline-[#ed1c24]"
        >
          <span>LANE</span>
          <span className="text-[#ed1c24]">.</span>
        </a>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-5 text-xs font-medium text-[#dedbd6] lg:flex xl:gap-7"
        >
          {navItems.map((item) => (
            <a
              key={item.route.page}
              href={buildHashForRoute(item.route)}
              onClick={(e) => handleLinkClick(e, item.route)}
              aria-current={item.isActive ? 'page' : undefined}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-[#ed1c24] ${
                item.isActive
                  ? 'border-b-2 border-[#ed1c24] font-bold text-white'
                  : 'text-[#dedbd6] hover:text-[#ed1c24]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <label htmlFor="header-lang" className="sr-only">
            Language
          </label>
          <select
            id="header-lang"
            aria-label="Language"
            value={lang}
            onChange={(e) => onLangChange(e.target.value as LangCode)}
            className="h-9 rounded-sm border border-white/25 bg-[#111111] px-2.5 text-xs text-[#f5f3ef] focus-visible:outline-2 focus-visible:outline-[#ed1c24]"
          >
            <option value="ar">عربي</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="zh">中文</option>
            <option value="de">Deutsch</option>
          </select>

          <label htmlFor="header-currency" className="sr-only">
            Currency
          </label>
          <select
            id="header-currency"
            aria-label="Currency"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            className="font-latin h-9 rounded-sm border border-white/25 bg-[#111111] px-2.5 text-xs text-[#f5f3ef] focus-visible:outline-2 focus-visible:outline-[#ed1c24]"
          >
            {(Object.keys(CURRENCY_LABELS) as CurrencyCode[]).map((code) => (
              <option key={code} value={code}>
                {CURRENCY_LABELS[code]}
              </option>
            ))}
          </select>

          <a
            href={buildHashForRoute({ page: 'quiz' })}
            onClick={(e) => handleLinkClick(e, { page: 'quiz' })}
            className="hidden h-9 items-center whitespace-nowrap shrink-0 bg-[#ed1c24] px-4 text-xs font-bold text-white transition-colors hover:bg-[#ff3037] focus-visible:outline-2 focus-visible:outline-white sm:inline-flex"
          >
            {t.navcta}
          </a>

          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center border border-white/30 text-[#f5f3ef] lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="no-print fixed inset-x-0 top-[66px] z-30 border-b border-[#292929] bg-[#0a0a0a]/98 px-6 py-5 backdrop-blur-lg lg:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.route.page}
                href={buildHashForRoute(item.route)}
                onClick={(e) => handleLinkClick(e, item.route)}
                className={`border-b border-[#1d1d1d] py-2.5 text-sm font-medium ${
                  item.isActive ? 'font-bold text-[#ed1c24]' : 'text-[#dedbd6] hover:text-[#ed1c24]'
                }`}
              >
                {item.label}
              </a>
            ))}
            <a
              href={buildHashForRoute({ page: 'admin' })}
              onClick={(e) => handleLinkClick(e, { page: 'admin' })}
              className="flex items-center gap-2 border-b border-[#1d1d1d] py-2.5 text-sm font-medium text-[#d8b789] hover:text-white"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{t.navadmin}</span>
            </a>
            <div className="pt-1">
            </div>
            <a
              href={buildHashForRoute({ page: 'quiz' })}
              onClick={(e) => handleLinkClick(e, { page: 'quiz' })}
              className="mt-2 inline-flex h-11 items-center justify-center bg-[#ed1c24] px-4 text-xs font-bold text-white"
            >
              {t.navcta}
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
