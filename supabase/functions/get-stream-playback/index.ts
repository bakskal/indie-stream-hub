// Returns the Cloudflare Stream playback URL for a purchase — but only if
// the calling user owns an unexpired purchase. The video URL is never
// exposed in client code; it only leaves the server when access is granted.

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
    const purchaseId = String(body.rental_id ?? body.purchase_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(purchaseId)) {
      return new Response(JSON.stringify({ error: "Invalid purchase id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: purchase, error: purchaseErr } = await userClient
      .from("purchases")
      .select("id, expires_at, user_id, films(id, title, video_asset_id, thumbnail_url)")
      .eq("id", purchaseId)
      .maybeSingle();

    if (purchaseErr || !purchase) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (purchase.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expired = new Date(purchase.expires_at).getTime() <= Date.now();
    if (expired) {
      return new Response(JSON.stringify({ error: "Rental not active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const film = purchase.films as {
      id: string;
      title: string;
      video_asset_id: string | null;
      thumbnail_url: string | null;
    } | null;

    if (!film?.video_asset_id) {
      return new Response(JSON.stringify({ error: "Feature not available yet" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // video_asset_id is a full HLS manifest URL.
    const hlsUrl = film.video_asset_id;
    // Derive the iframe / poster URLs by parsing the video UID out of the manifest URL.
    // Expected shape: https://customer-XXX.cloudflarestream.com/<uid>/manifest/video.m3u8
    const match = hlsUrl.match(/cloudflarestream\.com\/([^/]+)\/manifest/);
    const videoUid = match?.[1];
    const iframeUrl = videoUid ? `https://iframe.videodelivery.net/${videoUid}` : hlsUrl;
    const posterUrl =
      film.thumbnail_url ??
      (videoUid && match
        ? hlsUrl.replace(/\/manifest\/.*$/, "/thumbnails/thumbnail.jpg")
        : "");

    return new Response(
      JSON.stringify({
        title: film.title,
        film_id: film.id,
        expires_at: purchase.expires_at,
        playback: {
          hls: hlsUrl,
          iframe: iframeUrl,
          poster: posterUrl,
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
