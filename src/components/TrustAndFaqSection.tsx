import { useState } from 'react';
import { ChevronDown, Quote } from 'lucide-react';
import type { LangCode } from '../data/cars';
import type { ShowroomSettings } from '../data/store';

interface TrustAndFaqSectionProps {
  settings: ShowroomSettings;
  lang: LangCode;
}

export function TrustAndFaqSection({ settings, lang }: TrustAndFaqSectionProps) {
  const isAr = lang === 'ar';
  const [openFaqId, setOpenFaqId] = useState<string>(settings.faqs[0]?.id || '');

  return (
    <section className="border-t border-[#1e1e1e] bg-[#0b0b0c] px-[6%] py-20 lg:px-[8%]">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* Testimonials */}
        {settings.testimonials.length > 0 && (
          <div>
            <div className="flex flex-col justify-between gap-4 border-b border-[#232326] pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
                  LANE · CLIENT REVIEWS
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#f5f3ef] sm:text-4xl">
                  {isAr ? 'تجارب عملائنا في الشيخ زايد' : 'Trusted by Drivers Across Egypt'}
                </h2>
              </div>
              <p className="max-w-sm text-xs text-[#9e9993]">
                {isAr
                  ? 'تقييمات حقيقية لعملاء استلموا سياراتهم الجديدة بضمان الوكيل عبر LANE.'
                  : 'Verified experiences from owners who collected brand-new vehicles through LANE.'}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {settings.testimonials.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between border border-[#27272b] bg-[#121214] p-6 transition-colors hover:border-[#ed1c24]/60"
                >
                  <div>
                    <Quote className="h-5 w-5 text-[#ed1c24]" />
                    <p className="mt-4 text-xs leading-loose text-[#dcd8d2] sm:text-sm">
                      “{isAr ? item.quoteAr : item.quoteEn}”
                    </p>
                  </div>
                  <div className="mt-6 border-t border-[#222226] pt-4">
                    <strong className="block text-sm font-bold text-[#f5f3ef]">
                      {isAr ? item.authorAr : item.authorEn}
                    </strong>
                    <span className="font-latin mt-0.5 block text-[11px] font-medium text-[#d8b789]">
                      {item.carName}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {settings.faqs.length > 0 && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
                FREQUENT QUESTIONS
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#f5f3ef] sm:text-4xl">
                {isAr ? 'الأسئلة الشائعة قبل الشراء' : 'Frequently Asked Questions'}
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-[#a49f99] sm:text-sm">
                {isAr
                  ? 'كل ما تحتاج معرفته عن السيارات الجديدة فقط، التمويل البنكي، والأبيض اللؤلؤي في معرض LANE.'
                  : 'Key answers on zero-mileage warranty, Egyptian bank financing, and showroom pickup.'}
              </p>
            </div>

            <div className="divide-y divide-[#252529] border border-[#28282c] bg-[#111113]">
              {settings.faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-[#161619]"
                    >
                      <span className="text-xs font-bold text-[#f5f3ef] sm:text-sm">
                        {isAr ? faq.questionAr : faq.questionEn}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#ed1c24] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#1e1e22] bg-[#0d0d0f] px-5 py-4 text-xs leading-loose text-[#bbb6b0]">
                        {isAr ? faq.answerAr : faq.answerEn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
