import { useEffect, useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';
import type { Currency, Lang } from '../data/cars';

interface NavbarProps {
  lang: Lang;
  currency: Currency;
  savedCount: number;
  t: Record<string, string>;
  onLangChange: (lang: Lang) => void;
  onCurrencyChange: (currency: Currency) => void;
  onOpenGarage: () => void;
}

export function Navbar({
  lang,
  currency,
  savedCount,
  t,
  onLangChange,
  onCurrencyChange,
  onOpenGarage,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { href: '#home', label: t.navHome },
    { href: '#inventory', label: t.navCars },
    { href: '#finance', label: t.navFinance },
    { href: '#ai', label: t.navAi },
    { href: '#location', label: t.navVisit },
  ];

  return (
    <>
      {/* Slim Utility Strip (non-sticky for clean mobile viewport budget) */}
      <div className="relative z-40 h-9 border-b border-[#202020] bg-[#0b0b0b] px-4 text-xs text-[#aaa6a1] sm:px-[5.5%]">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <span className="hidden truncate sm:inline">{t.topline}</span>
            <a
              href="tel:+201274555677"
              dir="ltr"
              className="font-latin font-semibold text-[#f5f3ef] transition-colors hover:text-[#ed1c24] whitespace-nowrap"
            >
              012 7455 5677
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenGarage}
              className="inline-flex h-7 items-center gap-1.5 rounded border border-[#2d2d2d] bg-[#141414] px-2.5 text-[11px] font-medium text-[#f5f3ef] transition-colors hover:border-[#ed1c24] whitespace-nowrap shrink-0"
              aria-label={t.savedGarage}
            >
              <Heart className={`h-3.5 w-3.5 ${savedCount > 0 ? 'fill-[#ed1c24] text-[#ed1c24]' : 'text-[#aaa6a1]'}`} />
              <span>{t.savedGarage}</span>
              <span className="font-latin tabular-nums text-[#d8b789]">({savedCount})</span>
            </button>

            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => onLangChange(e.target.value as Lang)}
              className="h-7 rounded border border-[#2d2d2d] bg-[#141414] px-2 text-[11px] text-[#f5f3ef] outline-none focus:border-[#ed1c24]"
            >
              <option value="ar">عربي</option>
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="zh">中文</option>
              <option value="de">DE</option>
            </select>

            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              className="h-7 rounded border border-[#2d2d2d] bg-[#141414] px-2 font-latin text-[11px] text-[#f5f3ef] outline-none focus:border-[#ed1c24]"
            >
              <option value="EGP">EGP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Top Navigation */}
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
          scrolled
            ? 'border-[#262626] bg-[#090909]/95 backdrop-blur-md'
            : 'border-white/10 bg-[#090909]/85 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-[5.5%]">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#home"
            className="font-latin text-2xl font-extrabold tracking-tight text-[#f5f3ef] whitespace-nowrap shrink-0"
          >
            LANE<span className="text-[#ed1c24]">.</span>
          </a>

          {/* Zone 2: 5 concise single-line text links */}
          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative py-1 text-sm font-medium text-[#dedbd6] transition-colors hover:text-[#f5f3ef] whitespace-nowrap shrink-0 after:absolute after:inset-x-0 after:bottom-0 after:h-[1px] after:scale-x-0 after:bg-[#ed1c24] after:transition-transform hover:after:scale-x-100"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 Primary CTA + Mobile menu toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/201274555677?text=${encodeURIComponent(t.contactViewingCta || t.navBookCta)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center justify-center rounded-sm bg-[#ed1c24] px-5 text-xs font-bold text-white transition-colors hover:bg-[#ff2c34] whitespace-nowrap shrink-0 sm:inline-flex"
            >
              {t.navBookCta}
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#333] text-[#f5f3ef] md:hidden"
              aria-label="Toggle Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileOpen && (
          <nav className="border-t border-[#242424] bg-[#0c0c0c] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-medium text-[#dedbd6] hover:text-[#ed1c24]"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={`https://wa.me/201274555677?text=${encodeURIComponent(t.contactViewingCta || t.navBookCta)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-sm bg-[#ed1c24] px-5 text-sm font-bold text-white"
              >
                {t.navBookCta}
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
