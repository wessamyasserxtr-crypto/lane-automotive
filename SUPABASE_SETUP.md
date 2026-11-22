# LANE database and email admin sign-in

The site is static on GitHub Pages, so its database and authentication run in Supabase. The browser uses only the Supabase URL and publishable/anon key; never use a `service_role` or secret key in this website.

## One-time Supabase setup

1. Create a Supabase project and copy its Project URL and publishable key from **Project Settings → API**.
2. In **SQL Editor**, run `supabase/migrations/202611220001_lane_admin_and_data.sql`.
3. In **Authentication → URL Configuration**, set Site URL to `https://wessamyasserxtr-crypto.github.io/lane-automotive/` and add that URL to the allowed redirect URLs.
4. Turn off public sign-ups in **Authentication → Providers → Email**.
5. In **Authentication → Users**, add the admin email and password. Copy the new user's UUID, then run this in SQL Editor with that UUID:

   ```sql
   insert into public.lane_admin_users (user_id)
   values ('PASTE-ADMIN-USER-UUID-HERE');
   ```

6. In GitHub, open **Settings → Secrets and variables → Actions** and add repository secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the Project URL and publishable key. Save them, then run **Actions → Deploy LANE Automotive to GitHub Pages → Run workflow** (or push a commit).

For local development, copy `.env.example` to `.env.local`, fill in the Supabase URL and publishable key, then run the dev script. The migration lets visitors submit visit requests; only UUIDs in `lane_admin_users` can read bookings or edit the showroom catalog/settings. Admin email/password accounts are created in Supabase and cannot be self-registered from the website.
