import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PurchaseRow {
  id: string;
  purchased_at: string;
  expires_at: string;
  films: { id: string; title: string; description: string | null; thumbnail_url: string | null } | null;
}

function formatRemaining(expiresAt: string): { label: string; expired: boolean } {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Rental ended", expired: true };
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return { label: `${hours}h ${minutes}m left`, expired: false };
  return { label: `${minutes}m left`, expired: false };
}

export default function Library() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, force] = useState(0);

  useEffect(() => { document.title = "My library — Rock On Motion Pictures"; }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, purchased_at, expires_at, films(id, title, description, thumbnail_url)")
        .order("purchased_at", { ascending: false });
      setPurchases((data as unknown as PurchaseRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background hero-bg">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-16">
        <h1 className="font-display text-4xl font-semibold display-tracking mb-2 text-white">Your library</h1>
        <p className="text-white/85 mb-10">Active rentals and viewing history.</p>

        {loading ? (
          <p className="text-white/85">Loading…</p>
        ) : purchases.length === 0 ? (
          <Card className="bg-white text-card-foreground border-border">
            <CardContent className="py-12 text-center">
              <p className="text-card-foreground/75 mb-6">No rentals yet.</p>
              <Button asChild>
                <Link to="/">Browse the film</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => {
              const remaining = formatRemaining(p.expires_at);
              const isActive = !remaining.expired;
              return (
                <Card key={p.id} className="bg-white text-card-foreground border-border">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="font-display text-xl">
                        {p.films?.title ?? "Untitled"}
                      </CardTitle>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? remaining.label : "Ended"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <p className="text-xs text-card-foreground/70">
                      Purchased {new Date(p.purchased_at).toLocaleString()}
                    </p>
                    {isActive ? (
                      <Button asChild>
                        <Link to={`/watch/${p.id}`}>Watch now</Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <Link to="/">Rent again</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
