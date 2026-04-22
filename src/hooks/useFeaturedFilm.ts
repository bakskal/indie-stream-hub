import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Hardcoded rental window — DB schema doesn't store it. */
export const RENTAL_WINDOW_HOURS = 72;

export interface Film {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  /** Full Cloudflare Stream HLS URL (e.g. .../manifest/video.m3u8). */
  video_asset_id: string | null;
  /** Price in USD (numeric, e.g. 6.99). */
  price: number;
  price_gbp: number | null;
  price_inr: number | null;
}

export function useFeaturedFilm() {
  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("films")
        .select("id, title, description, thumbnail_url, video_asset_id, price, price_gbp, price_inr")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      setFilm((data as Film) ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { film, loading, error };
}
