# LANE Automotive

A multilingual showroom website for new cars in Egypt, with inventory management, comparisons, financing estimates, and a local admin dashboard.

## Live website

The `main` branch is published to [GitHub Pages](https://wessamyasserxtr.github.io/lane-automotive/).

## Run locally

Prerequisite: Node.js 22 or later.

1. Install dependencies with `npm install` (or `pnpm install`).
2. Copy `.env.example` to `.env.local` and add `GEMINI_API_KEY` to enable the server assistant.
3. Run `npm run dev`.

The local website opens at `http://localhost:3000`.

## Admin dashboard

Open [the admin page](https://wessamyasserxtr.github.io/lane-automotive/#/admin). On first access, create a private passcode with at least 8 characters.

The dashboard currently saves its passcode, vehicle catalog, bookings, and showroom settings in the current browser only. It has no shared server database or server-side authentication; use it as a single-browser demo dashboard.
