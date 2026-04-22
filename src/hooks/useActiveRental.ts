import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveRental {
  id: string;
  expires_at: string;
}

/**
 * Returns the user's most-recent unexpired purchase for a given film.
 * Backed by the `purchases` table in the client's Supabase schema.
 */
export function useActiveRental(filmId: string | undefined) {
  const { user } = useAuth();
  const [rental, setRental] = useState<ActiveRental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !filmId) {
      setRental(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("film_id", filmId)
        .order("purchased_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data && new Date((data as ActiveRental).expires_at).getTime() > Date.now()) {
        setRental(data as ActiveRental);
      } else {
        setRental(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, filmId]);

  return { rental, loading };
}
