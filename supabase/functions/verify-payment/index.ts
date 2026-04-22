import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Hardcoded rental window — DB schema doesn't store it. */
const RENTAL_WINDOW_HOURS = 72;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr) throw userErr;
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId || typeof sessionId !== "string") {
      throw new Error("sessionId is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ status: session.payment_status, rentalId: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const metaUserId = session.metadata?.user_id;
    const filmId = session.metadata?.film_id;
    if (!metaUserId || !filmId) throw new Error("Missing session metadata");
    if (metaUserId !== user.id) throw new Error("Session does not belong to user");

    // Service-role client to bypass RLS for purchase creation
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Idempotency: return existing purchase if we've already processed this session
    const { data: existing } = await admin
      .from("purchases")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "paid", rentalId: (existing as { id: string }).id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const purchasedAt = new Date();
    const expiresAt = new Date(
      purchasedAt.getTime() + RENTAL_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const { data: purchase, error: insertErr } = await admin
      .from("purchases")
      .insert({
        user_id: user.id,
        film_id: filmId,
        stripe_session_id: sessionId,
        purchased_at: purchasedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ status: "paid", rentalId: (purchase as { id: string }).id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("verify-payment error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
