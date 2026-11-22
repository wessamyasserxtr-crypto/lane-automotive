# LANE Automotive

A multilingual showroom website for new cars in Egypt, with inventory management, comparisons, financing estimates, Google sign-in, and an admin dashboard.

## Live website

The `main` branch is published to [GitHub Pages](https://wessamyasserxtr-crypto.github.io/lane-automotive/).

## Run locally

Prerequisite: Node.js 22 or later.

1. Install dependencies with `npm install` (or `pnpm install`).
2. Copy `.env.example` to `.env.local` and set Firebase's public web config if you use a different Firebase project.
3. Run `npm run dev`.

The local website opens at `http://localhost:3000`.

## Admin dashboard

Open [the admin page](https://wessamyasserxtr-crypto.github.io/lane-automotive/#/admin) and sign in with Google. Only the verified `wessamy2012@gmail.com` account receives admin access.

See [Firebase setup](FIREBASE_SETUP.md) for the Google sign-in, Firestore database, and security-rule configuration. The deployed app uses Firebase project `lane-automotive`.
