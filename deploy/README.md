# Client Supabase Deployment Walkthrough

The frontend is wired to the client's Supabase project (`dhbyembenuuscgqwbpwq.supabase.co`). The database schema and seed data already exist there — only **two things** still need to happen.

---

## 1. Schema is already in place

The client's Supabase project already has the following tables (no SQL to run):

| Table | Purpose |
|---|---|
| `films` | Catalog. Columns: `title`, `description`, `thumbnail_url`, `video_asset_id` (full Cloudflare HLS URL), `price` (USD numeric), `price_gbp`, `price_inr` |
| `users` | App-level user record. Columns: `email`, `role` |
| `purchases` | Rental records. Columns: `user_id`, `film_id`, `stripe_session_id`, `purchased_at`, `expires_at` |
| `watch_history` | Resume position. Columns: `user_id`, `film_id`, `progress_seconds`, `last_watched_at` |
| `newsletter_subscribers` | Email list. Columns: `email`, `subscribed_at` |

**Hardcoded in app code** (not stored in DB):
- Rental window: **72 hours** (`RENTAL_WINDOW_HOURS` in `src/hooks/useFeaturedFilm.ts` and `supabase/functions/verify-payment/index.ts`)
- Trailer: YouTube ID `xPK_ScLIAxQ` (`TRAILER_YOUTUBE_ID` in `src/pages/Index.tsx`)

If those need to change later, edit the constants in those files.

---

## 2. Configure Authentication

In the Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://your-production-domain.com` (or the Lovable preview URL during dev)
- **Redirect URLs**: add both
  - `https://your-production-domain.com/**`
  - `http://localhost:5173/**`

In **Authentication → Providers → Email**: enable **Email** provider. For testing you can disable "Confirm email" temporarily — re-enable before launch.

---

## 3. Deploy the three Edge Functions

You need the [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally.

```bash
supabase login
supabase link --project-ref dhbyembenuuscgqwbpwq
```

### 3a. Add the secrets the functions need

In the Supabase dashboard → **Edge Functions → Manage secrets**, add:

| Secret name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | The Stripe secret key (`sk_live_...` or `sk_test_...`) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-provided to all edge functions.

### 3b. Deploy each function

From the project root:

```bash
supabase functions deploy create-checkout
supabase functions deploy verify-payment
supabase functions deploy get-stream-playback
```

What each one does (against the **`purchases`** table, not `rentals`):
- `create-checkout` — creates a Stripe Checkout session, attaches `user_id` + `film_id` as metadata.
- `verify-payment` — called from the success page; on a paid session, inserts a `purchases` row with `expires_at = now + 72h`.
- `get-stream-playback` — verifies the caller owns an unexpired purchase, then returns the film's `video_asset_id` (HLS URL) for playback.

---

## 4. RLS policies you'll want on the client's project

The frontend assumes these policies exist. Verify in the Supabase dashboard → **Authentication → Policies**:

- `films` — public SELECT (anyone can read the catalog).
- `purchases` — SELECT only where `auth.uid() = user_id`. INSERT/UPDATE only via service-role (the edge functions).
- `watch_history` — SELECT/INSERT/UPDATE only where `auth.uid() = user_id`.
- `newsletter_subscribers` — public INSERT only (no SELECT for normal users).
- `users` — SELECT only where `auth.uid() = id` (if used at all).

If any of these are missing, the app will get 401/403 errors against that table.

---

## 5. Test the full flow

1. Visit the site, click **Rent now**, sign up.
2. Use Stripe test card `4242 4242 4242 4242`, any future date, any CVC.
3. After redirect you should land on `/checkout/success`, then `/watch/:purchaseId`.
4. Confirm a row appears in **Table Editor → purchases**.

You can also visit `/dev/watch` to play the feature directly (paywall bypassed) to verify the `video_asset_id` URL streams correctly.

---

## What's running where

| Piece | Hosted on |
|---|---|
| Frontend (this repo) | Lovable / Vercel / wherever you publish |
| Database + auth | Client's Supabase (`dhbyembenuuscgqwbpwq`) |
| Edge functions | Client's Supabase |
| Stripe | Your Stripe account |
| Video streams | Cloudflare Stream (`customer-mkfuixutdaumge7k`) |

The Lovable Cloud Supabase project is no longer used by the app.
