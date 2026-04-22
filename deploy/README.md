# Client Supabase Deployment Walkthrough

The frontend is now wired to the client's Supabase project (`dhbyembenuuscgqwbpwq.supabase.co`). Three things still need to be done **inside that Supabase project** before the app fully works.

---

## 1. Run the database schema

1. Open the Supabase dashboard → **SQL Editor** → **+ New query**.
2. Paste the entire contents of [`deploy/01-schema.sql`](./01-schema.sql).
3. Click **Run**. You should see "Success. No rows returned."

This creates: `profiles`, `user_roles`, `films`, `rentals`, `watch_history`, `newsletter_subscribers`, plus the RLS policies, the `handle_new_user` trigger, and a placeholder `films` row.

After it runs, go to **Table Editor → films** and update the row:
- `title`, `tagline`, `synopsis`, `runtime_seconds`
- `feature_stream_id` (Cloudflare Stream UID for the full feature)
- `trailer_stream_id` (Cloudflare Stream UID for the trailer)
- `poster_url`

---

## 2. Configure Authentication

In the Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://your-production-domain.com` (or your Lovable preview URL during dev)
- **Redirect URLs**: add both
  - `https://your-production-domain.com/**`
  - `http://localhost:5173/**` (for local dev)

In **Authentication → Providers → Email**:
- Enable **Email** provider.
- For testing, you can disable "Confirm email" temporarily. **Re-enable it before launch.**

---

## 3. Deploy the three Edge Functions

You need the [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally.

```bash
# Log in once
supabase login

# Link this repo to the client's project
supabase link --project-ref dhbyembenuuscgqwbpwq
```

### 3a. Add the secrets the functions need

In the Supabase dashboard → **Edge Functions → Manage secrets**, add:

| Secret name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | The Stripe secret key (`sk_live_...` or `sk_test_...`) |

Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-provided to all edge functions — no need to set those manually.

### 3b. Deploy each function

From the project root:

```bash
supabase functions deploy create-checkout
supabase functions deploy verify-payment
supabase functions deploy get-stream-playback
```

All three are configured with `verify_jwt = true` in [`supabase/config.toml`](../supabase/config.toml) — the CLI picks that up automatically.

### 3c. Configure Stripe webhook (optional but recommended)

For now the app uses `verify-payment` (called from the success page) to confirm payments. This works for the happy path. If you want to handle edge cases like users closing the browser before the success page loads, add a Stripe webhook later — not required for launch.

---

## 4. Test the full flow

1. Visit the site, click **Rent now**, sign up.
2. Use Stripe test card `4242 4242 4242 4242`, any future date, any CVC.
3. After redirect you should land on `/checkout/success`, then `/watch/:rentalId`.
4. Confirm a row appears in **Table Editor → rentals** with `status = active`.

---

## What's running where

| Piece | Hosted on |
|---|---|
| Frontend (this repo) | Lovable / Vercel / wherever you publish |
| Supabase database + auth | Client's Supabase (`dhbyembenuuscgqwbpwq`) |
| Edge functions | Client's Supabase |
| Stripe | Your Stripe account |
| Video streams | Cloudflare Stream (`customer-mkfuixutdaumge7k`) |

The Lovable Cloud Supabase project is no longer used by the app — it can be ignored.
