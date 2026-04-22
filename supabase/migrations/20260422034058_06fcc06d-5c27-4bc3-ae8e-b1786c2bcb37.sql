-- Allow the verify-payment edge function (service role) to insert rentals after Stripe payment
CREATE POLICY "Service role can insert rentals"
ON public.rentals
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update rentals"
ON public.rentals
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Prevent duplicate rentals for the same Stripe session
CREATE UNIQUE INDEX IF NOT EXISTS rentals_stripe_session_id_key
ON public.rentals (stripe_session_id)
WHERE stripe_session_id IS NOT NULL;