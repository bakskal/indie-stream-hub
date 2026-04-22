
# Indie Film Rental Platform

A minimal, cinematic site to sell 72-hour digital rentals of a single indie film, with secure Cloudflare Stream playback, Stripe checkout, and a subscriber list.

## Visual direction
- **Palette:** Midnight Indigo — `#0a0a1a` background, `#141432` surfaces, `#1e1e5a` borders, `#4f46e5` primary accent. Atmospheric, cinematic.
- **Typography:** Space Grotesk for headlines, DM Sans for body. Generous tracking on display headlines.
- **Layout:** Single-column editorial. Centered hero with film title, poster/key art, trailer, and a single "Rent — 72 hours" CTA. Feels like a film's official site, not a storefront.
- **Motion:** Subtle fade-ins on scroll, smooth hover states on the rent CTA. Player UI stays out of the way.

## Public pages
1. **Landing (`/`)** — Hero with film title + tagline, embedded trailer (Cloudflare Stream), short synopsis, single rent CTA, footer with newsletter signup, FAQ accordion (how rentals work, devices, support), and credits/contact.
2. **Checkout return (`/checkout/success`, `/checkout/cancel`)** — Confirms purchase, links to library.
3. **Auth (`/login`, `/signup`)** — Email + password (magic link optional). Email verification on.
4. **My Library (`/library`)** — Lists user's rentals with countdown timer (time remaining of 72hrs), "Watch now" button, and expired/active state.
5. **Watch (`/watch/:rentalId`)** — Full-bleed Cloudflare Stream player loaded with a short-lived signed token. Shows time remaining badge.
6. **Account (`/account`)** — Email, password change, purchase history, newsletter preferences, sign out.

## Purchase & rental flow
1. Visitor clicks **Rent**. If not signed in, prompted to sign up / log in (account required so we can attach the rental).
2. Stripe Checkout opens (one-time payment, single SKU, configurable price + currency).
3. Stripe webhook creates a `rental` record: `user_id`, `film_id`, `purchased_at`, `expires_at = purchased_at + 72h`, `status = active`.
4. **72hr window starts at purchase**, regardless of whether they press play (per your spec).
5. User redirected to `/library`, sees countdown and Watch button.
6. Clicking Watch hits an edge function that verifies the rental is active and returns a **signed Cloudflare Stream playback token** scoped to that video and short TTL (e.g., 2 hours, refreshed on demand). Token is never exposed in plain HTML.
7. A scheduled job marks rentals `expired` once `expires_at` passes; expired rentals show "Rental ended — rent again" in the library.
8. Watch progress (resume position) is saved every ~15s to `watch_history`.

## Backend (Lovable Cloud / Supabase)
- **Auth:** Email + password with verification, password reset page, session-aware routes.
- **Tables:**
  - `profiles` (id → auth.users, display_name, created_at)
  - `films` (id, title, synopsis, poster_url, trailer_stream_id, feature_stream_id, runtime, price_cents, currency, active) — seeded with the one film, but structured to support more later.
  - `rentals` (id, user_id, film_id, stripe_session_id, purchased_at, expires_at, status: active/expired/refunded)
  - `watch_history` (id, user_id, rental_id, film_id, position_seconds, updated_at)
  - `newsletter_subscribers` (id, email, source, subscribed_at, unsubscribed_at) — simple collection now, export-ready for Mailchimp/Beehiiv/ConvertKit later.
  - `user_roles` + `has_role()` for admin access (separate table, security-definer pattern).
- **RLS:** Users can only read their own rentals/watch history/profile. Films are publicly readable. Newsletter inserts allowed anonymously; reads admin-only.
- **Edge functions:**
  - `create-checkout` — creates Stripe Checkout session for the film.
  - `stripe-webhook` — verifies signature, creates rental on `checkout.session.completed`, handles refunds.
  - `get-stream-token` — validates active rental, returns signed Cloudflare Stream playback URL/token.
  - `expire-rentals` — cron-style sweep marking expired rentals (also enforced at token-issue time).
- **Secrets needed:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_API_TOKEN`, `CLOUDFLARE_STREAM_SIGNING_KEY` (+ key ID).

## Cloudflare Stream
- Film and trailer uploaded to your Cloudflare Stream account; we store the video UIDs in the `films` table.
- Trailer uses a public/unsigned embed.
- Feature uses **signed URLs with required signing**, generated server-side per playback request, scoped to the user's active rental window.
- Player: Cloudflare Stream's web player embed (works with signed tokens, handles adaptive bitrate, captions, mobile).

## Stripe
- Built-in Lovable Stripe payments (test mode immediately, live after verification).
- Single product = "Film Rental — 72 hours" with one price. Multi-currency optional later.
- Webhook is the source of truth for granting access — no client-side trust.

## Newsletter
- Footer signup form writes to `newsletter_subscribers`. Confirmation toast, no double opt-in for now.
- Admin can export CSV later for import into a sending tool when you're ready.

## Deployment
- App is a standard Vite/React SPA — deploys cleanly to **Cloudflare Pages**. SPA routing works via Pages' built-in fallback.
- Edge functions run on Lovable Cloud (Supabase Edge Functions). Stripe webhook URL and the Cloudflare Stream signed-URL endpoint will be Supabase function URLs, which is fine alongside Pages hosting.

## What I'll need from you after approval
- Stripe: nothing upfront — built-in payments will spin up a test account; you can claim it for live mode later.
- Cloudflare Stream: account ID, API token (Stream:Edit), and a Stream signing key. I'll prompt for these as secrets when wiring playback.
- Film assets: title, synopsis, poster image, trailer video UID, feature video UID, price, runtime. We can use placeholders to start.

## Out of scope (for now, easy to add later)
- Buy-to-own, bundles, tipping, promo codes, geo-blocking, gifting, festival screener codes, in-app newsletter sending, reviews/ratings, multiple films catalog UI.
