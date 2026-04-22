import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Film {
  id: string;
  title: string;
  tagline: string | null;
  synopsis: string | null;
  poster_url: string | null;
  trailer_stream_id: string | null;
  feature_stream_id: string | null;
  runtime_seconds: number | null;
  price_cents: number;
  currency: string;
  rental_window_hours: number;
  active: boolean;
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
        .select("*")
        .eq("active", true)
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
