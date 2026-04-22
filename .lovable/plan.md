

## Move pricing out of code, into Stripe + the `films` table

Right now the price is hardcoded in `supabase/functions/create-checkout/index.ts` as `PRICE_ID`. Every Stripe product change = code edit. Let's fix that.

### The approach

Store the Stripe **price ID** on each film row in the database. The edge function reads it from there. Stripe owns the actual amount/currency; the DB just holds the pointer.

Your `films` table already has `price_cents` and `currency` columns — we'll add one more: `stripe_price_id`.

### Changes

**1. Database migration**
- Add `stripe_price_id text` column to `films`.
- Backfill the current film's row with your new GBP price ID (you'll paste it in — must start with `price_`, not `prod_`).

**2. Edge function: `supabase/functions/create-checkout/index.ts`**
- Remove the hardcoded `PRICE_ID` constant.
- After auth, query `films` for the row matching `filmId` and read `stripe_price_id`.
- Pass that into `stripe.checkout.sessions.create({ line_items: [{ price: filmRow.stripe_price_id, quantity: 1 }] })`.
- Return a clear 400 if the film has no `stripe_price_id` set.

**3. Frontend display price (optional cleanup)**
- `useFeaturedFilm.ts` already selects `price_gbp`. Keep using that for the UI label so the card shows £ without a Stripe round-trip.
- The actual charged amount comes from Stripe via the `stripe_price_id` — single source of truth.

### Result

- New product in Stripe? → just update the `stripe_price_id` value on the film row in the Lovable Cloud table editor. No code deploy.
- Display price stays driven by `price_gbp` on the row (or we can drop that column later and fetch from Stripe if you want zero duplication).

### What I need from you

The new GBP **price ID** from Stripe (starts with `price_`, found under your product's Pricing section). I'll put it in the migration as the backfill value.

