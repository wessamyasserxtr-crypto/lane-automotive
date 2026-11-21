import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Gauge, Sparkles } from 'lucide-react';
import { CARS, type Lang } from '../data/cars';
import { CarImage } from './CarImage';

interface HeroVehicleStageProps {
  lang: Lang;
  active: boolean;
  onSelectCar: (car: (typeof CARS)[number]) => void;
}

const labels: Record<Lang, { collection: string; explore: string; previous: string; next: string }> = {
  ar: { collection: 'مجموعة LANE المختارة', explore: 'تفاصيل السيارة', previous: 'السيارة السابقة', next: 'السيارة التالية' },
  en: { collection: 'THE LANE COLLECTION', explore: 'Vehicle details', previous: 'Previous vehicle', next: 'Next vehicle' },
  fr: { collection: 'LA COLLECTION LANE', explore: 'Détails du véhicule', previous: 'Véhicule précédent', next: 'Véhicule suivant' },
  zh: { collection: 'LANE 精选车系', explore: '车型详情', previous: '上一款', next: '下一款' },
  de: { collection: 'DIE LANE KOLLEKTION', explore: 'Fahrzeugdetails', previous: 'Vorheriges Fahrzeug', next: 'Nächstes Fahrzeug' },
};

export function HeroVehicleStage({ lang, active, onSelectCar }: HeroVehicleStageProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const car = CARS[activeIndex];
  const copy = labels[lang];
  const advance = (delta: number) => setActiveIndex((index) => (index + delta + CARS.length) % CARS.length);

  useEffect(() => {
    if (!active || reduceMotion || CARS.length < 2) return;
    const timer = window.setInterval(() => advance(1), 6200);
    return () => window.clearInterval(timer);
  }, [active, reduceMotion]);

  return (
    <div className="hero-vehicle-stage" role="region" aria-label={copy.collection}>
      <div className="hero-stage-grid" aria-hidden="true" />
      <div className="hero-stage-orbit hero-stage-orbit-one" aria-hidden="true" />
      <div className="hero-stage-orbit hero-stage-orbit-two" aria-hidden="true" />
      <div className="hero-stage-platform" aria-hidden="true" />
      <div className="hero-stage-car">
        <AnimatePresence mode="wait">
          <motion.div key={car.id} className="hero-stage-photo" initial={reduceMotion ? false : { opacity: 0, x: 30, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, x: -24, scale: 1.015 }} transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.2, 0.8, 0.2, 1] }}>
            <CarImage src={car.img} alt={`${car.name} ${car.year} exterior`} label={car.name} className="hero-stage-image" />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="hero-stage-change-beam" aria-hidden="true" />
      <div className="hero-stage-topline"><span className="hero-stage-live-dot" />{copy.collection}<span className="hero-stage-index">0{activeIndex + 1} / 0{CARS.length}</span></div>
      <AnimatePresence mode="wait">
        <motion.div key={`${car.id}-hud`} className="hero-stage-hud" aria-live="polite" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : 0.32 }}>
          <div className="hero-stage-category"><Sparkles size={12} />{car.categoryLabel} · {car.year}</div>
          <strong>{car.name}</strong>
          <div className="hero-stage-specs"><span><Gauge size={13} />{car.power}</span><i />{car.quickSpecs[lang][0]}</div>
          <button type="button" className="hero-stage-open" onClick={() => onSelectCar(car)} aria-label={`${copy.explore}: ${car.name}`}>{copy.explore}<ArrowUpRight size={16} /></button>
        </motion.div>
      </AnimatePresence>
      <div className="hero-stage-controls" role="group" aria-label={copy.collection}>
        <button type="button" onClick={() => advance(-1)} aria-label={copy.previous}><ArrowLeft size={16} /></button>
        <div className="hero-stage-dots">{CARS.map((item, index) => <button key={item.id} type="button" onClick={() => setActiveIndex(index)} aria-label={item.name} aria-current={index === activeIndex ? 'true' : undefined} className={index === activeIndex ? 'active' : ''} />)}</div>
        <button type="button" onClick={() => advance(1)} aria-label={copy.next}><ArrowRight size={16} /></button>
      </div>
      <div className="hero-stage-side-label" aria-hidden="true">LANE / 2026</div>
    </div>
  );
}
