import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RentalDetail {
  id: string;
  status: string;
  expires_at: string;
  films: { id: string; title: string; feature_stream_id: string | null } | null;
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours >= 1 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export default function Watch() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const [rental, setRental] = useState<RentalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [, force] = useState(0);

  useEffect(() => {
    if (!rentalId) return;
    (async () => {
      const { data } = await supabase
        .from("rentals")
        .select("id, status, expires_at, films(id, title, feature_stream_id)")
        .eq("id", rentalId)
        .maybeSingle();
      setRental(data as unknown as RentalDetail);
      setLoading(false);
    })();
  }, [rentalId]);

  useEffect(() => {
    if (rental?.films?.title) document.title = `Watching ${rental.films.title} — Indie Reel`;
  }, [rental]);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const expired = rental ? new Date(rental.expires_at).getTime() <= Date.now() : false;
  const active = rental?.status === "active" && !expired;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {loading ? (
          <div className="container py-24 text-center text-muted-foreground">Loading…</div>
        ) : !rental ? (
          <div className="container max-w-xl py-24 text-center">
            <h1 className="font-display text-2xl mb-4">Rental not found</h1>
            <Button asChild><Link to="/library">Back to library</Link></Button>
          </div>
        ) : !active ? (
          <div className="container max-w-xl py-24 text-center">
            <h1 className="font-display text-2xl mb-2">Rental ended</h1>
            <p className="text-muted-foreground mb-6">Your viewing window for this rental has closed.</p>
            <Button asChild><Link to="/">Rent again</Link></Button>
          </div>
        ) : (
          <>
            <div className="container max-w-6xl pt-6 flex items-center justify-between">
              <div>
                <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">
                  ← Library
                </Link>
                <h1 className="font-display text-2xl mt-1">{rental.films?.title}</h1>
              </div>
              <Badge>{formatRemaining(rental.expires_at)}</Badge>
            </div>
            <div className="container max-w-6xl py-6">
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                {rental.films?.feature_stream_id ? (
                  <iframe
                    src={`https://iframe.videodelivery.net/${rental.films.feature_stream_id}`}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    className="w-full h-full"
                    title={rental.films.title}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
                    Feature playback will appear here once Cloudflare Stream signing is wired up and the film's stream ID is set.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
