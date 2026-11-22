import { useState } from 'react';
import { HERO_IMAGE_URL, type LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import type { ShowroomSettings } from '../data/store';
import { buildHashForRoute, type AppRoute } from '../utils/laneLogic';

interface HeroSectionProps {
  t: TranslationPack;
  lang: LangCode;
  settings: ShowroomSettings;
  carCount: number;
  onNavigate: (route: AppRoute) => void;
}

export function HeroSection({
  t,
  lang,
  settings,
  carCount,
  onNavigate,
}: HeroSectionProps) {
  const [heroImgError, setHeroImgError] = useState(false);

  const eyebrowText =
    lang === 'ar'
      ? settings.heroEyebrowAr || t.eyebrow
      : lang === 'en'
        ? settings.heroEyebrowEn || t.eyebrow
        : t.eyebrow;

  return (
    <>
      <section
        id="home"
        className="relative flex min-h-[600px] items-center overflow-hidden bg-[#0b0b0d] py-16 lg:min-h-[calc(100svh-110px)] lg:max-h-[760px] lg:py-20"
      >
        <div className="absolute inset-0 z-0">
          {!heroImgError ? (
            <img
              src={HERO_IMAGE_URL}
              alt="LANE Automotive Flagship SUV"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="h-full w-full object-cover object-[center_58%] opacity-75"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_68%_50%,#2d1215_0%,#111215_45%,#090909_85%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070707]/90 via-[#070707]/60 to-[#070707]/30 rtl:bg-gradient-to-l" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-[#090909]/40" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 sm:px-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-[#f5d8d8]">
              <span className="h-px w-8 bg-[#ed1c24]" aria-hidden="true" />
              <span>{eyebrowText}</span>
            </div>

            <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.08] tracking-tight text-[#f5f3ef] sm:text-7xl lg:text-8xl">
              {t.heroTitleLine1}
              <span className="mt-2 block text-[#ed1c24]">{t.heroTitleLine2}</span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#d5d1cc] sm:text-base sm:leading-loose">
              {t.heroDesc}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={buildHashForRoute({ page: 'quiz' })}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate({ page: 'quiz' });
                }}
                className="inline-flex h-12 items-center justify-center whitespace-nowrap bg-[#ed1c24] px-7 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff3037] hover:shadow-[0_10px_28px_rgba(237,28,36,0.35)] focus-visible:outline-2 focus-visible:outline-white"
              >
                {t.heroButton}
              </a>
              <a
                href={buildHashForRoute({ page: 'cars' })}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate({ page: 'cars' });
                }}
                className="inline-flex h-12 items-center justify-center whitespace-nowrap border border-white/55 px-6 text-xs font-medium text-white transition-colors hover:border-[#ed1c24] hover:text-[#ff9ea2] focus-visible:outline-2 focus-visible:outline-white"
              >
                {t.heroSecondary}
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 border-t border-white/20 pt-6 sm:gap-12">
              <div>
                <strong className="font-latin tabular-nums block text-2xl font-bold text-[#f5f3ef]">
                  100%
                </strong>
                <span className="text-xs text-[#c1bdb8]">{t.statNew}</span>
              </div>
              <div>
                <strong className="font-latin tabular-nums block text-2xl font-bold text-[#f5f3ef]">
                  5
                </strong>
                <span className="text-xs text-[#c1bdb8]">{t.statLang}</span>
              </div>
              <div>
                <strong className="font-latin tabular-nums block text-2xl font-bold text-[#f5f3ef]">
                  {carCount < 10 ? `0${carCount}` : carCount}
                </strong>
                <span className="text-xs text-[#c1bdb8]">{t.navcars}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="font-latin pointer-events-none absolute bottom-4 inset-x-0 hidden justify-center text-[10px] font-semibold tracking-[0.28em] text-[#b8b4af] md:flex">
          {t.scrollCue}
        </div>
      </section>

      <div className="relative flex h-12 items-center overflow-hidden bg-[#ed1c24] text-white">
        <div className="lane-marquee-track font-latin flex items-center gap-10 whitespace-nowrap text-xs font-bold tracking-[0.18em]">
          <span>{settings.marqueeText}</span>
          <span>{settings.marqueeText}</span>
          <span>{settings.marqueeText}</span>
          <span>{settings.marqueeText}</span>
        </div>
      </div>
    </>
  );
}
