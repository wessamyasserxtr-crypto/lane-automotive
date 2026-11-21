import { type PointerEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Calculator, ExternalLink, GitCompare, Heart, MessageCircle, X } from 'lucide-react';
import { CURRENCY_SYMBOLS, formatPrice, type CarModel, type Currency, type Lang } from '../data/cars';
import { CarImage } from './CarImage';
import { SketchfabCarViewer } from './SketchfabCarViewer';
import { VEHICLE_3D_ASSETS } from '../data/vehicle3d';

interface CarDetailModalProps {
  car: CarModel | null;
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  onClose: () => void;
  favorites: string[];
  compareIds: string[];
  onToggleFavorite: (id: string) => void;
  onQuickCompare: (id: string) => void;
}

type ModalStage = 'specs' | 'price';
const modal3dLabels: Record<Lang, string> = { ar: 'مجسم 3D', en: '3D model', fr: 'Modèle 3D', zh: '3D 模型', de: '3D-Modell' };
const modelUnavailable: Record<Lang, string> = {
  ar: 'المجسم ثلاثي الأبعاد لهذه السيارة غير متاح حاليًا.',
  en: 'A matching 3D model for this vehicle is not available yet.',
  fr: 'Aucun modèle 3D correspondant n’est disponible pour le moment.',
  zh: '目前还没有这款车型的匹配 3D 模型。',
  de: 'Ein passendes 3D-Modell ist für dieses Fahrzeug noch nicht verfügbar.',
};

export function CarDetailModal({ car, lang, currency, t, onClose, favorites, compareIds, onToggleFavorite, onQuickCompare }: CarDetailModalProps) {
  const [stage, setStage] = useState<ModalStage>('specs');
  const [view, setView] = useState<'outside' | 'inside' | '3d'>('outside');
  const [downPct, setDownPct] = useState(30);
  const [months, setMonths] = useState(60);
  const reduceMotion = useReducedMotion();
  const handleShowcasePointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--showcase-tilt-x', `${-y * 4}deg`);
    event.currentTarget.style.setProperty('--showcase-tilt-y', `${x * 6}deg`);
  }, [reduceMotion]);
  const resetShowcasePointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--showcase-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--showcase-tilt-y', '0deg');
  }, []);

  useEffect(() => {
    setStage('specs');
    setView('outside');
    setDownPct(30);
    setMonths(60);
  }, [car?.id]);

  useEffect(() => {
    if (!car) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKeyDown); };
  }, [car, onClose]);

  const finance = useMemo(() => {
    if (!car) return { downAmount: 0, monthly: 0 };
    const downAmount = Math.round((car.priceEgp * downPct) / 100);
    const financed = car.priceEgp - downAmount;
    const totalInterest = Math.round(financed * 0.175 * (months / 12));
    return { downAmount, monthly: Math.round((financed + totalInterest) / months) };
  }, [car, downPct, months]);

  if (!car) return null;

  const model3d = VEHICLE_3D_ASSETS[car.id];
  const isFavorite = favorites.includes(car.id);
  const isCompared = compareIds.includes(car.id);
  const isRtl = lang === 'ar';
  const sym = CURRENCY_SYMBOLS[currency][lang];
  const viewingText: Record<Lang, string> = {
    ar: `مرحبًا LANE، أرغب في الاستفسار عن معاينة ${car.name} ومعرفة التوافر والسعر النهائي.`,
    en: `Hello LANE, I’d like to arrange a showroom viewing for the ${car.name} and confirm availability and final pricing.`,
    fr: `Bonjour LANE, je souhaite organiser une visite pour la ${car.name} et confirmer sa disponibilité et son prix final.`,
    zh: `你好 LANE，我想预约到店查看 ${car.name}，并确认库存和最终价格。`,
    de: `Hallo LANE, ich möchte eine Besichtigung des ${car.name} vereinbaren und Verfügbarkeit sowie Endpreis erfragen.`,
  };
  const viewingUrl = `https://wa.me/201274555677?text=${encodeURIComponent(viewingText[lang])}`;
  const stages: { key: ModalStage; label: string }[] = [
    { key: 'specs', label: t.stage1Label },
    { key: 'price', label: t.stage2Label },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key={car.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.22 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
        role="dialog" aria-modal="true" aria-labelledby="car-modal-title" onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 28, scale: reduceMotion ? 1 : 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.99 }}
          transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-sm border border-[#333] bg-[#101010] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 z-20 flex gap-2 ltr:right-4 rtl:left-4">
            <button type="button" onClick={() => onToggleFavorite(car.id)} aria-label={isFavorite ? t.savedFavorite : t.saveFavorite} title={isFavorite ? t.savedFavorite : t.saveFavorite} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border bg-black/75 text-white transition-colors hover:border-[#ed1c24] ${isFavorite ? 'border-[#ed1c24] text-[#ff6d72]' : 'border-white/40'}`}><Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} /></button>
            <button type="button" onClick={() => onQuickCompare(car.id)} aria-label={t.addToCompare} title={t.addToCompare} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border bg-black/75 text-white transition-colors hover:border-[#ed1c24] ${isCompared ? 'border-[#ed1c24] bg-[#ed1c24]' : 'border-white/40'}`}><GitCompare className="h-4 w-4" /></button>
            <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/75 text-white transition-colors hover:border-[#ed1c24] hover:bg-[#ed1c24]"><X className="h-5 w-5" /></button>
          </div>

          <div className={`car-showcase-3d group relative h-60 w-full overflow-hidden bg-[#181818] sm:h-80 ${view === '3d' ? 'car-showcase-model-view' : ''}`} onPointerMove={handleShowcasePointer} onPointerLeave={resetShowcasePointer}>
            {view === '3d' ? (
              model3d ? (
                <SketchfabCarViewer image={car.img} carName={car.name} asset={model3d} className="car-modal-3d" />
              ) : (
                <div className="car-modal-3d">
                  <CarImage src={car.img} alt={`${car.name} exterior`} label={car.name} className="h-full w-full object-contain" />
                  <p className="car-model-unavailable">{modelUnavailable[lang]}</p>
                </div>
              )
            ) : (
              <motion.div className="car-showcase-plane" initial={{ scale: reduceMotion ? 1 : 1.08 }} animate={{ scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.8 }}>
                <CarImage src={view === 'inside' ? car.insideImg : car.img} alt={`${car.name} — ${view === 'inside' ? t.modalInside : t.modalOutside}`} label={car.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
              </motion.div>
            )}
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/35 to-transparent ${view === '3d' && model3d ? 'opacity-0' : ''}`} />
            <div className="car-showcase-caption absolute bottom-4 inset-x-6 sm:inset-x-8"><p className="font-latin text-xs font-bold tracking-widest text-[#ff6d72]">{car.categoryLabel} · {car.year}</p><h2 id="car-modal-title" className="mt-1 font-latin text-3xl font-extrabold text-white sm:text-5xl">{car.name}</h2></div>
          </div>

          <div className="grid grid-cols-2 border-b border-[#262626] bg-[#141414]">
            {stages.map((item) => <button key={item.key} type="button" onClick={() => setStage(item.key)} className={`border-b-2 px-3 py-3.5 text-center text-xs font-bold transition-colors sm:text-sm ${stage === item.key ? 'border-[#ed1c24] bg-[#1c1314] text-white' : 'border-transparent text-[#9d9892] hover:text-white'}`}>{item.label}</button>)}
          </div>

          <AnimatePresence mode="wait">
            {stage === 'specs' ? (
              <motion.div key="specs" initial={{ opacity: 0, x: reduceMotion ? 0 : (isRtl ? 16 : -16) }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduceMotion ? 0 : (isRtl ? -10 : 10) }} transition={{ duration: reduceMotion ? 0 : 0.24 }} className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <div className="flex flex-wrap gap-2">{(['outside', 'inside', '3d'] as const).map((v) => <button key={v} type="button" onClick={() => setView(v)} className={`h-9 rounded-sm border px-4 text-xs font-semibold transition-colors ${view === v ? 'border-[#ed1c24] bg-[#ed1c24] text-white' : 'border-[#333] bg-[#161616] text-[#c7c2bc] hover:border-white'}`}>{v === 'outside' ? t.modalOutside : v === 'inside' ? t.modalInside : modal3dLabels[lang]}</button>)}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => onToggleFavorite(car.id)} className="inline-flex h-9 items-center gap-2 rounded-sm border border-[#333] px-3 text-xs font-semibold text-[#e5e0da] transition-colors hover:border-[#ed1c24] hover:text-white"><Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-[#ed1c24] text-[#ed1c24]' : ''}`} />{isFavorite ? t.savedFavorite : t.saveFavorite}</button>
                    <button type="button" onClick={() => onQuickCompare(car.id)} className="inline-flex h-9 items-center gap-2 rounded-sm border border-[#ed1c24]/70 bg-[#ed1c24]/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-[#ed1c24]"><GitCompare className="h-3.5 w-3.5" />{isCompared ? t.addedToCompare : t.addToCompare}</button>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-[#c9c4be]">{car.story[lang]}</p>
                  <h3 className="mt-6 text-sm font-bold text-[#f5f3ef]">{t.modalHighlights}</h3>
                  <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{car.features[lang].map((feat) => <li key={feat} className="rounded-sm border border-[#2a2a2a] bg-[#151515] px-3 py-2.5 text-xs text-[#e3dfd9]">{feat}</li>)}</ul>
                </div>
                <div className="flex flex-col justify-between rounded-sm border border-[#2a2a2a] bg-[#151515] p-5 sm:p-6 lg:col-span-6">
                  <div><h3 className="text-sm font-bold text-[#f5f3ef]">{t.modalSpecs}</h3><dl className="mt-4 grid grid-cols-2 gap-3">{[{ label: t.modalEngine, val: car.engine[lang] }, { label: t.modalPower, val: car.power }, { label: t.modalTorque, val: car.torque }, { label: t.modalGearbox, val: car.gearbox[lang] }, { label: t.modalDrive, val: car.drive }, { label: t.modalSeats, val: car.seats }].map((row) => <div key={row.label} className="rounded-sm border border-[#262626] bg-[#101010] p-3"><dt className="text-[11px] text-[#8d8882]">{row.label}</dt><dd className="mt-1 font-latin text-sm font-bold text-[#f5f3ef]">{row.val}</dd></div>)}</dl>
                    <div className="mt-4 space-y-1 text-[11px] leading-relaxed text-[#8b8781]">{car.availabilityNote && <p className="text-[#d8b789]">{car.availabilityNote[lang]}</p>}<a href={car.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#ff7479] underline hover:text-white"><span>{t.modalSource}</span><ExternalLink className="h-3 w-3" /></a></div>
                  </div>
                  <button type="button" onClick={() => setStage('price')} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#ed1c24] px-6 text-sm font-bold text-white transition-colors hover:bg-[#ff2c34]"><span>{t.nextToPrice}</span>{isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="price" initial={{ opacity: 0, x: reduceMotion ? 0 : (isRtl ? -16 : 16) }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.24 }} className="p-6 sm:p-9">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <div className="flex flex-col justify-between rounded-sm border border-[#2f2f2f] bg-[#151515] p-6 lg:col-span-5"><div><span className="text-xs font-semibold text-[#aaa6a1]">{t.indicativePrice}</span><div className="mt-3 flex items-baseline gap-2"><strong dir="ltr" className="font-latin text-4xl font-extrabold tabular-nums text-[#f5f3ef] sm:text-5xl">{formatPrice(car.priceEgp, currency, lang)}</strong><span className="text-lg font-bold text-[#ed1c24]">{sym}</span></div><p className="mt-4 text-xs leading-relaxed text-[#9c9790]">{t.modalDisclaimer}</p></div><div className="mt-8 border-t border-[#292929] pt-5"><span className="text-xs text-[#aaa6a1]">{t.calcMonthlyLabel}</span><div className="mt-1 flex items-baseline gap-2"><strong dir="ltr" className="font-latin text-3xl font-bold tabular-nums text-[#d8b789]">{formatPrice(finance.monthly, currency, lang)}</strong><span className="text-xs font-semibold text-[#d8b789]">{sym}</span></div></div></div>
                  <div className="flex flex-col justify-between rounded-sm border border-[#2a2a2a] bg-[#141414] p-6 lg:col-span-7"><div><div className="flex items-center gap-2 text-sm font-bold text-[#f5f3ef]"><Calculator className="h-4 w-4 text-[#ed1c24]" /><span>{t.quickCalcTitle}</span></div><div className="mt-5"><span className="block text-xs font-semibold text-[#c7c2bc]">{t.calcDownPayment}</span><div className="mt-2.5 grid grid-cols-3 gap-2">{[20, 30, 50].map((pct) => <button key={pct} type="button" onClick={() => setDownPct(pct)} className={`h-10 rounded-sm border font-latin text-xs font-bold tabular-nums transition-colors ${downPct === pct ? 'border-[#ed1c24] bg-[#ed1c24] text-white' : 'border-[#2f2f2f] bg-[#101010] text-[#c7c2bc] hover:border-[#ed1c24]/70'}`}>{pct}% ({formatPrice((car.priceEgp * pct) / 100, currency, lang)} {sym})</button>)}</div></div><div className="mt-5"><span className="block text-xs font-semibold text-[#c7c2bc]">{t.calcMonths}</span><div className="mt-2.5 grid grid-cols-4 gap-2">{[24, 36, 48, 60].map((m) => <button key={m} type="button" onClick={() => setMonths(m)} className={`h-10 rounded-sm border font-latin text-xs font-bold tabular-nums transition-colors ${months === m ? 'border-[#ed1c24] bg-[#ed1c24] text-white' : 'border-[#2f2f2f] bg-[#101010] text-[#c7c2bc] hover:border-[#ed1c24]/70'}`}>{m}</button>)}</div></div></div>
                    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#262626] pt-5"><button type="button" onClick={() => setStage('specs')} className="inline-flex h-11 items-center gap-2 rounded-sm border border-[#383838] px-4 text-xs font-semibold text-[#c7c2bc] hover:border-white hover:text-white">{isRtl ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}<span>{t.backToSpecs}</span></button><a href={viewingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-[#ed1c24] px-5 text-xs font-bold text-white transition-colors hover:bg-[#ff2c34]"><MessageCircle className="h-4 w-4" /><span>{t.modalBookVisit}</span><ExternalLink className="h-3.5 w-3.5" /></a></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
