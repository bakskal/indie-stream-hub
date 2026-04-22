-- =====================================================================
-- Rock On Motion Pictures — Initial Schema
-- Run this ONCE in the Supabase SQL Editor on a fresh project.
-- =====================================================================

-- ---- Roles enum + user_roles table (separate from profiles to prevent privilege escalation) ----
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---- Profiles ----
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ---- Auto-create profile + default role on signup ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---- updated_at helper ----
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Films ----
CREATE TABLE public.films (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tagline TEXT,
  synopsis TEXT,
  poster_url TEXT,
  trailer_stream_id TEXT,
  feature_stream_id TEXT,
  runtime_seconds INTEGER,
  price_cents INTEGER NOT NULL DEFAULT 500,
  currency TEXT NOT NULL DEFAULT 'usd',
  rental_window_hours INTEGER NOT NULL DEFAULT 72,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active films"
  ON public.films FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins can manage films"
  ON public.films FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER films_set_updated_at
  BEFORE UPDATE ON public.films
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Rentals ----
CREATE TYPE public.rental_status AS ENUM ('active', 'expired', 'refunded');

CREATE TABLE public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id UUID NOT NULL REFERENCES public.films(id) ON DELETE RESTRICT,
  stripe_session_id TEXT UNIQUE,
  amount_cents INTEGER,
  currency TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status public.rental_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE INDEX rentals_user_id_idx ON public.rentals(user_id);
CREATE INDEX rentals_expires_at_idx ON public.rentals(expires_at);
CREATE UNIQUE INDEX rentals_stripe_session_id_key
  ON public.rentals (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

CREATE POLICY "Users can view their own rentals"
  ON public.rentals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all rentals"
  ON public.rentals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert rentals"
  ON public.rentals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update rentals"
  ON public.rentals FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER rentals_set_updated_at
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Watch history ----
CREATE TABLE public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  film_id UUID NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rental_id)
);
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch history"
  ON public.watch_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watch history"
  ON public.watch_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watch history"
  ON public.watch_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER watch_history_set_updated_at
  BEFORE UPDATE ON public.watch_history
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Newsletter ----
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to the newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND unsubscribed_at IS NULL
  );
CREATE POLICY "Admins can view subscribers"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subscribers"
  ON public.newsletter_subscribers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---- Seed the film row ----
-- IMPORTANT: replace feature_stream_id / trailer_stream_id with the real
-- Cloudflare Stream UIDs after upload.
INSERT INTO public.films (title, tagline, synopsis, runtime_seconds, price_cents, currency, trailer_stream_id)
VALUES (
  'Mr. Paanwala',
  'A Vijay Bhola film.',
  'Mr. Paanwala addresses the immigrant diaspora that struggles to define a new identity for themselves as they face the dilemma of progressing in the new environment and the one they grew up in. A story about love, family, career, marriage, and finding your true self.',
  5400,
  500,
  'usd',
  'youtube:xPK_ScLIAxQ'
);
