import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveRental {
  id: string;
  expires_at: string;
}

/** Returns the user's most-recent active, unexpired rental for a given film. */
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
        .from("rentals")
        .select("id, expires_at, status")
        .eq("user_id", user.id)
        .eq("film_id", filmId)
        .eq("status", "active")
        .order("purchased_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data && new Date(data.expires_at).getTime() > Date.now()) {
        setRental({ id: data.id, expires_at: data.expires_at });
      } else {
        setRental(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, filmId]);

  return { rental, loading };
}
