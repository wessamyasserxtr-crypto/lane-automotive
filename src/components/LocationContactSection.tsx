import { Clock, ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Lang } from '../data/cars';

interface LocationContactSectionProps {
  lang: Lang;
  t: Record<string, string>;
}

const viewingMessage: Record<Lang, string> = {
  ar: 'مرحبًا LANE، أرغب في الاستفسار عن معاينة السيارات الجديدة المتاحة في المعرض.',
  en: 'Hello LANE, I would like to ask about viewing the new cars currently available at the showroom.',
  fr: 'Bonjour LANE, je souhaite me renseigner sur la visite et les voitures neuves disponibles au showroom.',
  zh: '你好 LANE，我想咨询展厅看车以及目前可选的新车。',
  de: 'Hallo LANE, ich möchte mich nach einer Besichtigung und den verfügbaren Neuwagen erkundigen.',
};

export function LocationContactSection({ lang, t }: LocationContactSectionProps) {
  const whatsappUrl = `https://wa.me/201274555677?text=${encodeURIComponent(viewingMessage[lang])}`;

  return (
    <section id="location" className="bg-[#0b0b0b] py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 sm:px-[6%] lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <p className="font-latin text-xs font-semibold tracking-wider text-[#ed1c24]">{t.locKicker}</p>
            <h2 className="mt-3 font-bold leading-tight tracking-tight text-[#f5f3ef]" style={{ fontSize: 'clamp(1.9rem, 3.6vw, 3rem)', textWrap: 'balance' }}>
              {t.locTitle}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#aaa6a1]">{t.locDesc}</p>

            <div className="mt-7 space-y-4 border-y border-[#242424] py-6 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ed1c24]" />
                <div><strong className="block text-xs text-[#f5f3ef]">{t.address}</strong><span className="mt-0.5 block text-xs text-[#aaa6a1]">{t.addressVal}</span></div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#ed1c24]" />
                <div><strong className="block text-xs text-[#f5f3ef]">{t.phone}</strong><a href="tel:+201274555677" dir="ltr" className="mt-0.5 inline-block font-latin text-xs font-semibold text-[#aaa6a1] hover:text-white">+20 127 455 5677</a></div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#ed1c24]" />
                <div><strong className="block text-xs text-[#f5f3ef]">{t.hours}</strong><span className="mt-0.5 block text-xs text-[#aaa6a1]">{t.hoursVal}</span></div>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-sm border border-[#292929]">
            <div className="relative h-60 w-full bg-[#161616]">
              <iframe title="LANE Automotive Sheikh Zayed Map" src="https://maps.google.com/maps?q=Sheikh%20Zayed%20City%2C%20Egypt&t=&z=13&ie=UTF8&iwloc=&output=embed" loading="lazy" className="h-full w-full border-0 opacity-75 grayscale invert-[0.9] contrast-[0.85]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090909]/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 ltr:left-3 rtl:right-3"><a href="https://www.google.com/maps/search/?api=1&query=Lane+Automotive+Sheikh+Zayed+Egypt" target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-sm border border-[#ed1c24] bg-[#0e0e0e]/95 px-4 text-xs font-bold text-white transition-colors hover:bg-[#ed1c24]"><span>{t.mapCta}</span><ExternalLink className="h-3.5 w-3.5" /></a></div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-center rounded-sm border border-[#2a2a2a] bg-[radial-gradient(ellipse_at_85%_10%,rgba(237,28,36,0.12),transparent_48%),#141414] p-7 sm:p-10 lg:col-span-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#ed1c24]/40 bg-[#ed1c24]/10 text-[#ed1c24] shadow-[0_0_32px_rgba(237,28,36,0.13)]"><MessageCircle className="h-5 w-5" /></div>
          <p className="font-latin text-[10px] font-bold tracking-[0.2em] text-[#ed1c24]">LANE · SHEIKH ZAYED</p>
          <h3 className="mt-3 text-2xl font-bold text-[#f5f3ef]">{t.navBookCta}</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#aaa6a1]">{t.contactViewingDesc}</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#ed1c24] px-6 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff2c34] hover:shadow-[0_12px_32px_rgba(237,28,36,0.22)]">
            <MessageCircle className="h-4 w-4" /><span>{t.contactViewingCta}</span><ExternalLink className="h-3.5 w-3.5 opacity-75" />
          </a>
          <p className="mt-4 font-latin text-xs text-[#89847f]" dir="ltr">+20 127 455 5677</p>
        </aside>
      </div>
    </section>
  );
}
