# LANE Automotive

A multilingual showroom website for new cars in Egypt, with inventory management, comparisons, financing estimates, and an email-authenticated admin dashboard.

## Live website

The `main` branch is published to [GitHub Pages](https://wessamyasserxtr-crypto.github.io/lane-automotive/).

## Run locally

Prerequisite: Node.js 22 or later.

1. Install dependencies with `npm install` (or `pnpm install`).
2. Copy `.env.example` to `.env.local` and set the Gemini and Supabase values you want to use.
3. Run `npm run dev`.

The local website opens at `http://localhost:3000`.

## Admin dashboard

Open [the admin page](https://wessamyasserxtr-crypto.github.io/lane-automotive/#/admin) and sign in with the email/password account provisioned in Supabase.

See [Supabase setup](SUPABASE_SETUP.md) to create the database, restrict access to approved admin accounts, and configure the GitHub Pages build.
