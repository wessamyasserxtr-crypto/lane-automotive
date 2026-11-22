import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Lock, MapPin, Phone } from 'lucide-react';
import type { CarModel, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import type { ShowroomSettings, VisitBooking } from '../data/store';
import { buildHashForRoute, validateVisitForm, type AppRoute } from '../utils/laneLogic';

interface VisitSectionProps {
  cars: CarModel[];
  settings: ShowroomSettings;
  t: TranslationPack;
  lang: LangCode;
  preselectedCarId?: string | null;
  onAddBooking: (booking: VisitBooking) => void;
}

export function VisitSection({
  cars,
  settings,
  t,
  lang,
  preselectedCarId,
  onAddBooking,
}: VisitSectionProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [carId, setCarId] = useState(preselectedCarId || cars[0]?.id || '');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<VisitBooking | null>(null);

  useEffect(() => {
    if (preselectedCarId && cars.some((c) => c.id === preselectedCarId)) {
      setCarId(preselectedCarId);
    } else if (!cars.some((c) => c.id === carId) && cars[0]) {
      setCarId(cars[0].id);
    }
  }, [preselectedCarId, cars, carId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateVisitForm({ name, phone });
    if (validation === 'required') {
      setErrorMsg(t.visitErrorRequired);
      return;
    }
    if (validation === 'invalid_phone') {
      setErrorMsg(t.visitErrorPhone);
      return;
    }

    const booking: VisitBooking = {
      id: `LANE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      phone: phone.trim(),
      carId,
      date: date || 'Flexible',
      status: 'pending',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setErrorMsg(null);
    setLastSubmitted(booking);
    onAddBooking(booking);
  };

  const handleReset = () => {
    setLastSubmitted(null);
    setName('');
    setPhone('');
    setDate('');
    setNotes('');
    setErrorMsg(null);
  };

  const bookedCarName =
    cars.find((c) => c.id === lastSubmitted?.carId)?.name || cars[0]?.name || '';

  const addressDisplay = lang === 'ar' ? settings.addressAr : settings.addressEn;
  const hoursDisplay = lang === 'ar' ? settings.hoursAr : settings.hoursEn;

  return (
    <section
      id="location"
      className="border-t border-[#1e1e1e] bg-[#0b0b0b] py-20 px-[6%] lg:px-[8%]"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="flex flex-col justify-between">
          <div>
            <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
              {t.locKicker}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-[#f5f3ef] sm:text-5xl">
              {t.locTitleLine1}
              <br />
              {t.locTitleLine2}
            </h2>
            <p className="mt-4 max-w-md text-xs leading-loose text-[#aaa6a1] sm:text-sm">
              {t.locDesc}
            </p>

            <div className="mt-8 space-y-5 border-t border-[#242424] pt-6">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ed1c24]" />
                <div>
                  <strong className="block text-xs font-bold text-[#f5f3ef]">
                    {t.addressLabel}
                  </strong>
                  <span className="mt-1 block text-xs text-[#aaa6a1]">
                    {addressDisplay}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#ed1c24]" />
                <div>
                  <strong className="block text-xs font-bold text-[#f5f3ef]">
                    {t.phoneLabel}
                  </strong>
                  <a
                    href={`tel:${settings.phoneDisplay.replace(/\s+/g, '')}`}
                    dir="ltr"
                    className="font-latin mt-1 inline-block text-xs text-[#aaa6a1] hover:text-white"
                  >
                    {settings.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#ed1c24]" />
                <div>
                  <strong className="block text-xs font-bold text-[#f5f3ef]">
                    {t.hoursLabel}
                  </strong>
                  <span className="mt-1 block text-xs text-[#aaa6a1]">
                    {hoursDisplay}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 overflow-hidden border border-[#2c2c2c] bg-[#141517] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span
                  dir="ltr"
                  className="font-latin inline-block text-sm font-extrabold tracking-tight text-[#f5f3ef]"
                >
                  LANE<span className="text-[#ed1c24]">.</span> AUTOMOTIVE
                </span>
                <span className="font-latin mt-1 block text-[11px] tracking-[0.14em] text-[#9b9690]">
                  WASLET DAHSHUR · SHEIKH ZAYED
                </span>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Lane+Automotive+Sheikh+Zayed+Egypt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center bg-[#ed1c24] px-5 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
              >
                {t.mapCta}
              </a>
            </div>
          </div>
        </div>

        <div className="border border-[#2b2b2b] bg-[#131313] p-7 sm:p-10">
          <h3 className="text-xl font-bold text-[#f5f3ef] sm:text-2xl">
            {t.visitFormTitle}
          </h3>

          {lastSubmitted ? (
            <div
              data-testid="visit-confirmation"
              className="mt-6 border border-[#3a2a2b] bg-[#191213] p-6"
            >
              <div className="flex items-center gap-2.5 text-[#f5f3ef]">
                <CheckCircle2 className="h-5 w-5 text-[#ed1c24]" />
                <strong className="text-base font-bold">{t.visitSuccessTitle}</strong>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#c6c1bb]">
                {t.visitSuccessDesc}
              </p>

              <dl className="mt-5 space-y-2 border-t border-[#2f2223] pt-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#999]">{t.visitNameLabel}</dt>
                  <dd className="font-semibold text-white">{lastSubmitted.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#999]">{t.visitPhoneLabel}</dt>
                  <dd dir="ltr" className="font-latin text-white">
                    {lastSubmitted.phone}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#999]">{t.visitCarLabel}</dt>
                  <dd className="font-semibold text-[#d8b789]">{bookedCarName}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 h-10 border border-[#444] px-5 text-xs font-medium text-[#ddd] hover:border-white hover:text-white"
              >
                {t.visitAnotherBtn}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="visit-name"
                  className="mb-1.5 block text-xs font-medium text-[#d5d1cc]"
                >
                  {t.visitNameLabel}
                </label>
                <input
                  id="visit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full border border-[#353535] bg-[#0b0b0b] px-3.5 text-sm text-white focus:border-[#ed1c24] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="visit-phone"
                  className="mb-1.5 block text-xs font-medium text-[#d5d1cc]"
                >
                  {t.visitPhoneLabel}
                </label>
                <input
                  id="visit-phone"
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 12..."
                  className="font-latin h-11 w-full border border-[#353535] bg-[#0b0b0b] px-3.5 text-sm text-white placeholder-[#555] focus:border-[#ed1c24] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="visit-car"
                    className="mb-1.5 block text-xs font-medium text-[#d5d1cc]"
                  >
                    {t.visitCarLabel}
                  </label>
                  <select
                    id="visit-car"
                    value={carId}
                    onChange={(e) => setCarId(e.target.value)}
                    className="h-11 w-full border border-[#353535] bg-[#0b0b0b] px-3 text-xs text-white focus:border-[#ed1c24] focus:outline-none"
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="visit-date"
                    className="mb-1.5 block text-xs font-medium text-[#d5d1cc]"
                  >
                    {t.visitDateLabel}
                  </label>
                  <input
                    id="visit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="font-latin h-11 w-full border border-[#353535] bg-[#0b0b0b] px-3 text-xs text-white focus:border-[#ed1c24] focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <p role="alert" className="text-xs font-medium text-[#ff7c80]">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="mt-2 h-11 w-full bg-[#ed1c24] px-6 text-xs font-bold text-white transition-colors hover:bg-[#ff3037]"
              >
                {t.visitSubmitBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({
  t,
  settings,
  onNavigate,
}: {
  t: TranslationPack;
  settings: ShowroomSettings;
  onNavigate: (route: AppRoute) => void;
}) {
  const handleNav = (e: React.MouseEvent, route: AppRoute) => {
    e.preventDefault();
    onNavigate(route);
  };

  return (
    <footer className="border-t border-[#252525] bg-[#070707] px-[6%] pt-14 pb-8 lg:px-[8%]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-10 pb-10 md:flex-row">
          <div>
            <a
              href={buildHashForRoute({ page: 'home' })}
              onClick={(e) => handleNav(e, { page: 'home' })}
              dir="ltr"
              className="font-latin inline-block text-2xl font-extrabold tracking-tighter text-[#f5f3ef]"
            >
              LANE<span className="text-[#ed1c24]">.</span>
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.26em] text-[#ccc]">
                AUTOMOTIVE
              </span>
            </a>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-[#8f8a84]">
              {t.footerDesc}
            </p>
          </div>

          <div className="flex flex-wrap gap-12 sm:gap-14">
            <div>
              <h4 className="text-xs font-bold text-[#f5f3ef]">
                {t.footerExplore}
              </h4>
              <ul className="mt-3 space-y-2.5 text-xs text-[#9b9690]">
                <li>
                  <a
                    href={buildHashForRoute({ page: 'cars' })}
                    onClick={(e) => handleNav(e, { page: 'cars' })}
                    className="hover:text-white"
                  >
                    {t.navcars}
                  </a>
                </li>
                <li>
                  <a
                    href={buildHashForRoute({ page: 'compare' })}
                    onClick={(e) => handleNav(e, { page: 'compare' })}
                    className="hover:text-white"
                  >
                    {t.navcompare}
                  </a>
                </li>
                <li>
                  <a
                    href={buildHashForRoute({ page: 'quiz' })}
                    onClick={(e) => handleNav(e, { page: 'quiz' })}
                    className="hover:text-white"
                  >
                    {t.footerQuiz}
                  </a>
                </li>
                <li>
                  <a
                    href={buildHashForRoute({ page: 'finance' })}
                    onClick={(e) => handleNav(e, { page: 'finance' })}
                    className="hover:text-white"
                  >
                    {t.navfinance}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#f5f3ef]">
                {t.footerConnect}
              </h4>
              <ul className="mt-3 space-y-2.5 text-xs text-[#9b9690]">
                <li>
                  <a
                    href={`https://wa.me/${settings.whatsappDigits}`}
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
                  <a
                    href={buildHashForRoute({ page: 'visit' })}
                    onClick={(e) => handleNav(e, { page: 'visit' })}
                    className="hover:text-white"
                  >
                    {t.navlocation}
                  </a>
                </li>
                <li>
                  <a
                    href={buildHashForRoute({ page: 'admin' })}
                    onClick={(e) => handleNav(e, { page: 'admin' })}
                    className="inline-flex items-center gap-1.5 text-[#d8b789] hover:text-white"
                  >
                    <Lock className="h-3 w-3" />
                    <span>{t.navadmin}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-[#222] pt-6 text-[11px] text-[#7c7772] sm:flex-row">
          <span className="font-latin">{t.footerRights}</span>
          <span>{t.newOnly}</span>
        </div>
      </div>
    </footer>
  );
}
