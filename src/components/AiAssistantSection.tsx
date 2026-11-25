import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import type { CarModel, CurrencyCode, LangCode } from '../data/cars';
import type { TranslationPack } from '../data/i18n';
import { generateAssistantReply } from '../utils/laneLogic';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

interface AiAssistantSectionProps {
  cars: CarModel[];
  t: TranslationPack;
  lang: LangCode;
  currency: CurrencyCode;
}

export function AiAssistantSection({
  cars,
  t,
  lang,
  currency,
}: AiAssistantSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: t.welcomeMsg },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ id: 'welcome', role: 'assistant', text: t.welcomeMsg }];
      }
      return prev;
    });
  }, [t.welcomeMsg]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const sendPrompt = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isThinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    window.setTimeout(() => {
      const reply = generateAssistantReply(trimmed, cars, currency, lang);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: reply },
      ]);
      setIsThinking(false);
    }, 180);
  };

  return (
    <section
      id="ai"
      className="border-t border-[#1e1e1e] bg-[#111111] py-24 px-[6%] lg:px-[8%]"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="font-latin text-xs font-bold tracking-[0.18em] text-[#ed1c24] uppercase">
            {t.aiKicker}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-[#f5f3ef] sm:text-5xl">
            {t.aiTitleLine1}
            <br />
            {t.aiTitleLine2}
          </h2>
          <p className="mt-5 max-w-md text-xs leading-loose text-[#aaa6a1] sm:text-sm">
            {t.aiDesc}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#d6d2cc]">
            <span>{t.tagCompare}</span>
            <span aria-hidden="true" className="text-[#ed1c24]">·</span>
            <span>{t.tagBudget}</span>
            <span aria-hidden="true" className="text-[#ed1c24]">·</span>
            <span>{t.tagFinance}</span>
            <span aria-hidden="true" className="text-[#ed1c24]">·</span>
            <span>{t.tagLang}</span>
          </div>

          <p className="mt-5 text-[11px] text-[#7c7772]">{t.aiNote}</p>
        </div>

        <div className="border border-[#333] bg-[#171717] shadow-[0_22px_65px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#333] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ed1c24] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <strong className="font-latin block text-xs font-bold text-[#f5f3ef]">
                  LANE Assistant
                </strong>
                <span className="block text-[11px] text-[#aaa6a1]">
                  {t.onlineLabel}
                </span>
              </div>
            </div>
          </div>

          <div
            ref={bodyRef}
            data-testid="assistant-messages"
            role="log"
            aria-label={t.onlineLabel}
            aria-live="polite"
            aria-relevant="additions text"
            className="flex h-[280px] flex-col gap-3 overflow-y-auto p-5"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[88%] whitespace-pre-line border px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'self-end border-[#792229] bg-[#501116] text-white'
                    : 'self-start border-[#333] bg-[#242424] text-[#ece9e4]'
                }`}
              >
                {msg.text}
              </div>
            ))}

            {isThinking && (
              <div role="status" className="self-start border border-[#333] bg-[#242424] px-4 py-2.5 text-xs text-[#aaa6a1]">
                <span className="sr-only">
                  {lang === 'ar' ? 'المساعد يكتب الرد' : lang === 'fr' ? 'L’assistant rédige une réponse' : lang === 'zh' ? '助手正在回复' : lang === 'de' ? 'Der Assistent schreibt' : 'The assistant is typing'}
                </span>
                <span aria-hidden="true" className="flex items-center gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ed1c24]" style={{ animationDelay: `${dot * 120}ms` }} />
                  ))}
                </span>
              </div>
            )}

            <div className="mt-1 flex flex-wrap gap-2">
              {t.chatPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendPrompt(prompt)}
                  disabled={isThinking}
                  className="border border-[#5e3033] px-3 py-1.5 text-[11px] text-[#f4cacc] transition-colors hover:border-[#ed1c24] hover:bg-[#ed1c24]/15 disabled:cursor-wait disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(inputValue);
            }}
            className="flex border-t border-[#333]"
          >
            <label htmlFor="lane-assistant-input" className="sr-only">
              {t.chatPlaceholder}
            </label>
            <input
              id="lane-assistant-input"
              type="text"
              maxLength={600}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="h-12 flex-1 bg-[#101010] px-4 text-xs text-white placeholder-[#7d7974] focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t.chatSendAria}
              disabled={isThinking || !inputValue.trim()}
              className="flex h-12 w-14 items-center justify-center bg-[#ed1c24] text-white transition-colors hover:bg-[#ff3037] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
