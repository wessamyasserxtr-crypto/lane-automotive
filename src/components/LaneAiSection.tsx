import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Send, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { CARS, type CarModel, type Currency, type Lang } from '../data/cars';

interface LaneAiSectionProps {
  lang: Lang;
  currency: Currency;
  t: Record<string, string>;
  onSelectCar: (car: CarModel) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  citations?: { title: string; url: string }[];
}

function findMentionedCars(text: string): CarModel[] {
  const lower = text.toLowerCase();
  const normalized = lower.replace('ë', 'e');
  return CARS.filter((car) => {
    const target = car.name.toLowerCase().replace('ë', 'e');
    return normalized.includes(target);
  }).slice(0, 3);
}

export function LaneAiSection({ lang, currency, t, onSelectCar }: LaneAiSectionProps) {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: t.aiWelcome },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync initial welcome message when language switches if user hasn't started chatting
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ id: 'welcome', role: 'assistant', text: t.aiWelcome }];
      }
      return prev;
    });
  }, [t.aiWelcome]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const historyForApi = messages
      .filter((m): m is { id: string; role: 'user' | 'assistant'; text: string } => m.role !== 'error')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          lang,
          currency,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        citations?: { title: string; url: string }[];
      };

      if (!response.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'error',
            text: t.aiError || data.error || 'Unable to reach LANE AI right now.',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.reply as string,
            citations: Array.isArray(data.citations) ? data.citations.filter((item) => /^https?:\/\//i.test(item.url)) : [],
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'error',
          text: t.aiError || 'Network error while connecting to LANE AI.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const quickPrompts = [t.aiPrompt1, t.aiPrompt2, t.aiPrompt3, t.aiPrompt4];

  return (
    <section id="ai" className="border-y border-[#222] bg-[#111111] py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-5 sm:px-[6%] lg:grid-cols-12">
        {/* Copy Column */}
        <div className="lg:col-span-5">
          <p className="font-latin text-xs font-semibold tracking-wider text-[#ed1c24]">
            {t.aiKicker}
          </p>
          <h2
            className="mt-3 font-bold leading-tight tracking-tight text-[#f5f3ef]"
            style={{ fontSize: 'clamp(1.9rem, 3.6vw, 3.1rem)', textWrap: 'balance' }}
          >
            {t.aiTitle}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#aaa6a1]">{t.aiDesc}</p>

          <p className="mt-6 border-t border-[#262626] pt-5 text-xs font-medium text-[#d5d1cc]">
            {t.aiCapabilities}
          </p>
        </div>

        {/* Chat Interface Column */}
        <div className="lg:col-span-7">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative overflow-hidden rounded-sm border border-[#2f2f2f] bg-[#171717] shadow-[0_22px_70px_rgba(0,0,0,0.34)]"
            aria-busy={loading}
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-1/2 top-0 h-px bg-gradient-to-r from-transparent via-[#ed1c24] to-transparent"
              animate={reduceMotion ? undefined : { x: ['-15%', '145%'] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
            />
            <div className="relative flex items-center gap-3 border-b border-[#292929] bg-[#141414] px-5 py-4">
              <motion.div animate={reduceMotion ? undefined : { boxShadow: ['0 0 14px rgba(237,28,36,.25)', '0 0 28px rgba(237,28,36,.6)', '0 0 14px rgba(237,28,36,.25)'], scale: [1, 1.04, 1] }} transition={{ duration: 2.8, repeat: Infinity }} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ed1c24] text-white shrink-0">
                <Sparkles className="h-4 w-4" />
              </motion.div>
              <div>
                <h3 className="font-latin text-sm font-bold text-[#f5f3ef]">LANE AI</h3>
                <p className="text-xs text-[#aaa6a1]">{t.aiSubtitle}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex h-80 flex-col gap-3 overflow-y-auto p-5">
              {messages.map((msg) => {
                const mentioned =
                  msg.role === 'assistant' && msg.id !== 'welcome'
                    ? findMentionedCars(msg.text)
                    : [];

                return (
                  <motion.div
                    key={msg.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    className={`flex max-w-[85%] flex-col gap-2 ${
                      msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div
                      className={`rounded-sm border px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'border-[#792229] bg-[#501116] text-[#f5f3ef]'
                          : msg.role === 'error'
                            ? 'border-[#7a2e2e] bg-[#2a1212] text-[#f4b6b6]'
                            : 'border-[#2e2e2e] bg-[#222222] text-[#ece8e1]'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {mentioned.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {mentioned.map((car) => (
                          <button
                            key={car.id}
                            type="button"
                            onClick={() => onSelectCar(car)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-[#3a2628] bg-[#141112] px-3 text-[11px] font-semibold text-[#f5f3ef] transition-colors hover:border-[#ed1c24] hover:text-white"
                          >
                            <span>
                              {t.aiExploreModel}: {car.name}
                            </span>
                            <ArrowUpRight className="h-3 w-3 text-[#ed1c24]" />
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1" aria-label={t.aiSources}>
                        <span className="w-full text-[10px] font-semibold text-[#aaa6a1]">{t.aiSources}</span>
                        {msg.citations.map((source) => (
                          <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 rounded-sm border border-[#343434] bg-[#151515] px-2.5 py-1.5 text-[10px] text-[#d8b789] transition-colors hover:border-[#ed1c24] hover:text-white">
                            <span className="truncate">{source.title}</span><ArrowUpRight className="h-3 w-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {loading && (
                <div
                  aria-label={t.aiSending}
                  className="inline-flex items-center gap-1.5 self-start rounded-sm border border-[#2e2e2e] bg-[#222222] px-4 py-3"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e8e3dc] animate-bounce [animation-delay:-0.25s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e8e3dc] animate-bounce [animation-delay:-0.12s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e8e3dc] animate-bounce" />
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="flex flex-wrap gap-2 border-t border-[#242424] bg-[#131313] px-4 py-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-sm border border-[#3a2426] bg-[#191415] px-3 py-1.5 text-xs text-[#e7cfd1] transition-colors hover:border-[#ed1c24] hover:text-white disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex border-t border-[#292929] bg-[#101010]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.aiPlaceholder}
                disabled={loading}
                className="h-12 flex-1 bg-transparent px-4 text-sm text-[#f5f3ef] placeholder-[#78746e] outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="inline-flex h-12 w-14 items-center justify-center bg-[#ed1c24] text-white transition-colors hover:bg-[#ff2c34] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="flex justify-end border-t border-[#242424] bg-[#131313] px-4 py-2.5">
              <a
                href={`https://wa.me/201274555677?text=${encodeURIComponent(t.contactViewingCta || t.talkAdvisor)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#d8b789] transition-colors hover:text-white"
              >
                {t.contactViewingCta || t.talkAdvisor}<ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
