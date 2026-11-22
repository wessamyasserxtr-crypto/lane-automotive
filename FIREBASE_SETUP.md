# LANE Automotive Firebase setup

The website uses Firebase Authentication for Google sign-in and Cloud Firestore for the showroom catalog and visit requests. The current project is `lane-automotive` on Firebase's Spark plan. Do not link a Cloud Billing account or upgrade the project: the site is intended to stay within Firebase's no-cost quotas.

## Google sign-in

The Firebase project has the Google provider enabled with the public-facing name `LANE Automotive` and support email `wessamy2012@gmail.com`.

The deployed GitHub Pages host is already in **Authentication → Settings → Authorized domains**. `localhost` is also authorized for local development.

If you publish from a different domain, add its host in that same Firebase setting before using Google sign-in.

The website's Google button opens Google's account chooser. New Google users are created automatically. The app only grants admin access to the verified `wessamy2012@gmail.com` account.

## Firestore

The default database is created on the Standard edition, in `me-central1` (Doha), close to the Egyptian audience. Its location cannot be changed later. It was created in production mode on the free Spark plan, with scheduled backups left off because they require Blaze. Firestore currently shows the empty default database as ready.

The current website expects these collections:

- `showroom_state/primary`: published car catalog and showroom settings; public read, admin write.
- `visit_bookings/{id}`: public visit requests; only the verified admin may read or change them.
- `finance_entries/{id}`: accounting ledger in EGP; only the verified admin may read and create entries, with one restricted update allowed to void a posted entry. Entries cannot be edited or deleted, so a correction remains auditable.

The checked-in [`firestore.rules`](firestore.rules) file contains the accounting collection policy. Publish it to Firestore before deploying code that uses a new collection; otherwise the site correctly disables accounting writes. The web app config is public browser configuration; the Firestore security rules enforce access.

Firebase Spark includes a daily Firestore quota (currently 50,000 reads and 20,000 writes per day, plus 1 GiB of stored data). If a Spark quota is reached, Firestore can stop serving requests until the quota resets. No billing account is needed; upgrading to Blaze is intentionally out of scope.

## Configuration and deploy

`src/lib/firebase.ts` contains this project's browser configuration as defaults, so GitHub Pages does not need private Firebase credentials or GitHub Actions secrets. For local use of another Firebase project, copy `.env.example` to `.env.local` and fill its `VITE_FIREBASE_*` values.

The `main` branch deploys to [GitHub Pages](https://wessamyasserxtr-crypto.github.io/lane-automotive/). Firebase's public configuration is bundled into that static site; never put service account credentials or private keys in `VITE_` variables.
