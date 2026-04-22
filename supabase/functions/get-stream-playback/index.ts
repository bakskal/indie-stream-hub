// Returns the Cloudflare Stream playback URL for a rental — but only if
// the calling user owns an active rental. The video UID is never exposed
// in client code; it only leaves the server when access is granted.
//
// TODO (next): once CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_STREAM_API_TOKEN are
// added as secrets, mint a signed Stream token here for short-TTL playback
// instead of returning the unsigned manifest URL.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client scoped to the caller (RLS will enforce ownership)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rentalId = String(body.rental_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(rentalId)) {
      return new Response(JSON.stringify({ error: "Invalid rental_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rental, error: rentalErr } = await userClient
      .from("rentals")
      .select("id, status, expires_at, user_id, films(id, title, feature_stream_id)")
      .eq("id", rentalId)
      .maybeSingle();

    if (rentalErr || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rental.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expired = new Date(rental.expires_at).getTime() <= Date.now();
    if (rental.status !== "active" || expired) {
      return new Response(JSON.stringify({ error: "Rental not active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const film = rental.films as { feature_stream_id: string | null; title: string } | null;
    if (!film?.feature_stream_id) {
      return new Response(JSON.stringify({ error: "Feature not available yet" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerSubdomain = "customer-mkfuixutdaumge7k.cloudflarestream.com";
    const videoId = film.feature_stream_id;

    // Unsigned URLs for now. When signing is enabled, swap to a tokenised URL.
    const hlsUrl = `https://${customerSubdomain}/${videoId}/manifest/video.m3u8`;
    const iframeUrl = `https://iframe.videodelivery.net/${videoId}`;
    const posterUrl = `https://${customerSubdomain}/${videoId}/thumbnails/thumbnail.jpg`;

    return new Response(
      JSON.stringify({
        title: film.title,
        expires_at: rental.expires_at,
        playback: {
          hls: hlsUrl,
          iframe: iframeUrl,
          poster: posterUrl,
          // Short TTL so the client refreshes periodically.
          // Once signed tokens are added, this becomes the token expiry.
          expires_in_seconds: 7200,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("get-stream-playback error", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
