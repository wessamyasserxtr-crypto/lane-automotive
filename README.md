# LANE Automotive

LANE is a multilingual new-car showroom site for Egypt. The app includes a first-visit vehicle questionnaire, searchable inventory, comparisons, a finance estimator, a Gemini-powered assistant, and showroom contact details.

The intro cycles through catalog car photos, and the landing hero is a photo carousel with manual and automatic selection. Vehicle details include a 3D tab: interactive Sketchfab models are connected for Jetour T1, Chery Tiggo 8 Pro, and BYD Seal. Other vehicles show a clear status until a suitable model is available under a usable license. See [3D-DESIGN.md](3D-DESIGN.md) for asset details.

Open `preview.html` directly to see the standalone visual preview. Its interactive 3D model streams from Sketchfab and needs an internet connection. The full React app and its server-powered features run through the setup steps below.

## Run locally

Prerequisites: Node.js 22 or later.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add a Gemini API key as `GEMINI_API_KEY`.
3. Start the app with `npm run dev`.

The local app opens at `http://localhost:3000`.

## LANE assistant

The server uses Google's `@google/genai` Interactions API. It answers vehicle questions from the same catalog used by the site. Google Search is used only for questions requesting current public or competitor research; URL Context is enabled when the customer provides a URL. External research is labeled and source links are returned with the response. Live stock, confirmed prices, or finance offers must be verified with LANE.

The assistant does not record showroom appointments. Vehicle viewing requests and questions about availability are sent to LANE through WhatsApp.

## Project commands

- `npm run dev` — start the Vite development server through the Express server.
- `npm run build` — create the production build in `dist/`.
- `npm run preview` — preview the Vite build.
- `npm run lint` — run the TypeScript check.
