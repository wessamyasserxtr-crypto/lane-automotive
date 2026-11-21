import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { CARS, CURRENCY_RATES, CURRENCY_SYMBOLS, type Currency, type Lang } from './src/data/cars.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const SHOWROOM_CATALOG_CONTEXT = [
  'LANE Automotive Egypt | New vehicles only. LANE does not buy or sell used cars.',
  'Showroom: Waslet Dahshur — Sheikh Zayed, 6 October, Giza, Egypt.',
  'Phone/WhatsApp: +20 127 455 5677 (https://wa.me/201274555677).',
  'Showroom hours listed on the website: daily 11:00 AM–10:00 PM. Ask the team to confirm before visiting.',
  'The following catalog is the same source used by the website. Prices are indicative EGP, not live stock or final quotes:',
  ...CARS.map((car) => `- ${car.name} (${car.year}; ${car.categoryLabel}; ${car.type}; ${car.seats} seats): ${car.priceEgp.toLocaleString('en-US')} EGP. Engine: ${car.engine.en}; power: ${car.power}; torque: ${car.torque}; transmission: ${car.gearbox.en}; drive: ${car.drive}. Features: ${car.features.en.join(', ')}.`),
  'Finance calculator outputs are illustrative and not lender offers or guaranteed approval. Exact terms depend on the finance provider and vehicle.',
  'There is no online appointment database. When asked for a showroom viewing, direct the customer to WhatsApp so LANE staff can arrange it. Never claim a visit is booked or confirmed.',
].join('\n');

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'lane-automotive' });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        message?: unknown;
        history?: unknown;
        lang?: unknown;
        currency?: unknown;
      };

      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message || message.length > 1500) {
        res.status(400).json({ error: 'Please provide a valid message (1-1500 characters).' });
        return;
      }

      const lang: Lang = typeof body.lang === 'string' && ['ar', 'en', 'fr', 'zh', 'de'].includes(body.lang)
        ? body.lang as Lang
        : 'ar';
      const currency: Currency = typeof body.currency === 'string' && ['EGP', 'USD', 'EUR', 'GBP', 'CNY'].includes(body.currency)
        ? body.currency as Currency
        : 'EGP';
      const rawHistory = Array.isArray(body.history) ? body.history : [];
      const history: ChatHistoryMessage[] = rawHistory
        .filter(
          (item): item is ChatHistoryMessage =>
            typeof item === 'object' &&
            item !== null &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.text === 'string' &&
            item.text.trim().length > 0
        )
        .slice(-8);

      const ai = getAiClient();

      const languageNames: Record<Lang, string> = {
        ar: 'Arabic (natural, refined Egyptian Arabic mixed with clear technical terms)',
        en: 'English',
        fr: 'French',
        zh: 'Simplified Chinese',
        de: 'German',
      };

      const activeRate = CURRENCY_RATES[currency];
      const currencySymbols = CURRENCY_SYMBOLS[currency];
      const displayCurrencyContext = CARS.map((car) => {
        const converted = Math.round(car.priceEgp * activeRate).toLocaleString('en-US');
        return `- ${car.name}: approx. ${converted} ${currencySymbols.en} (base ${car.priceEgp.toLocaleString('en-US')} EGP)`;
      }).join('\n');

      const systemInstruction = [
        'You are LANE AI, the official digital automotive advisor for LANE Automotive in Sheikh Zayed, Egypt.',
        `Respond strictly in ${languageNames[lang]}.`,
        `The page displays ${currency}. Use these approximate conversions based on the site's current local display rate; EGP is the source amount. Clearly label all prices as indicative, not live quotes.\n${displayCurrencyContext}`,
        'Be concise, helpful, and grounded in the showroom catalog below for all LANE-specific facts. Do not invent models, specifications, live stock, warranty terms, delivery promises, or guaranteed finance rates.',
        'Use Google Search only when the customer requests current public automotive or competitor research, and URL Context only for URLs they provide. Treat web findings as external context, never as LANE inventory, prices, or policy. When web sources are used, make that distinction clear; citations are surfaced as source links.',
        'When comparing cars, highlight concrete differences using catalog facts (price, engine, horsepower, seating, features). Recommend based on stated budget, passenger needs, and preferred body style. If the user asks about used cars, clarify that LANE sells new cars only and does not buy or sell used cars.',
        'The site has no online appointment booking system. For showroom viewing requests, invite the customer to arrange it directly with the team on WhatsApp (+20 127 455 5677). Never claim a viewing is booked or confirmed. For live availability, final prices, or finance terms, direct them to the LANE team on WhatsApp.',
        'Keep answers concise (under 160 words unless comparing 3+ models). Plain clean text or simple bullet lines (no markdown tables or code blocks).',
        SHOWROOM_CATALOG_CONTEXT,
      ].join('\n\n');

      const wantsSearch = /\b(search|research|competitor|competitors|website|websites|review|news|latest models|new launches)\b|ابحث|مواقع|منافس|منافسين|أحدث الموديلات|إطلاقات|مراجعة|لينك|رابط|سوق السيارات|recherche|concurrent|concurrents|sites web|actualités|nouveautés|recherche|wettbewerb|konkurrenz|webseiten|neuigkeiten|neuheiten|搜索|竞品|竞争对手|网站|最新车型|新车发布|汽车新闻/i.test(message);
      const includesUrl = /https?:\/\/\S+/i.test(message);
      const tools = [
        ...(wantsSearch ? [{ type: 'google_search' as const }] : []),
        ...(includesUrl ? [{ type: 'url_context' as const }] : []),
      ];
      const conversation = [
        ...history.map((item) => `${item.role === 'assistant' ? 'LANE AI' : 'Customer'}: ${item.text}`),
        `Customer: ${message}`,
      ].join('\n\n');

      const interaction = await ai.interactions.create({
        model: 'gemini-4-hydrogen',
        input: conversation,
        system_instruction: systemInstruction,
        tools: tools.length ? tools : undefined,
        store: false,
        generation_config: { max_output_tokens: 700 },
      });

      const reply = interaction.output_text?.trim();
      if (!reply) {
        res.status(502).json({ error: 'No response returned from LANE AI.' });
        return;
      }

      const citations = (interaction.steps || [])
        .filter((step) => step.type === 'model_output')
        .flatMap((step) => step.content || [])
        .flatMap((block) => block.type === 'text' ? block.annotations || [] : [])
        .filter((annotation) => annotation.type === 'url_citation' && typeof annotation.url === 'string' && /^https?:\/\//i.test(annotation.url))
        .map((annotation) => ({ title: annotation.title || new URL(annotation.url!).hostname, url: annotation.url! }))
        .filter((item, index, list) => list.findIndex((x) => x.url === item.url) === index)
        .slice(0, 4);

      res.json({ reply, citations });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Unexpected server error';
      console.error('LANE AI /api/chat error:', errMessage);
      res.status(500).json({
        error: errMessage.includes('GEMINI_API_KEY')
          ? 'GEMINI_API_KEY is missing. Please configure it in Settings > Secrets.'
          : 'Unable to reach LANE AI right now. Please try again or contact our advisor on WhatsApp.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LANE Automotive server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});



