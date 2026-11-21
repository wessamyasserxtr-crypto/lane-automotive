# LANE Automotive

A multilingual new-car showroom experience for Egypt.

## Open the working preview

Visit **[https://wessamyasserxtr-crypto.github.io/lane-automotive/](https://wessamyasserxtr-crypto.github.io/lane-automotive/)** for the live standalone website preview (GitHub Pages). It includes the complete visual experience and client-side interactions. Internet access is needed for remote car imagery, fonts, and Sketchfab 3D models.

`preview.html` is the same standalone preview at the repository root.

## Full React project

The React/Vite source is also included in `src/`. GitHub Pages serves the standalone preview, not the server-powered React app.

Prerequisites: Node.js 22 or later.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` for the server-powered AI assistant.
3. Run `npm run dev`.

The local app opens at `http://localhost:3000`. Building locally: `npm run build`.

## Features

- Arabic, English, French, Chinese, and German interface
- New-car inventory, favorites, and comparison
- Vehicle details with selected interactive 3D model embeds
- Financing estimator and WhatsApp contact for showroom visits
- Standalone interactive preview at `preview.html`
