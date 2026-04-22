import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveRental } from "@/hooks/useActiveRental";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Props {
  filmId: string;
  /** Price in USD (numeric, e.g. 6.99). */
  price: number;
  /** Display-only — DB schema does not store this. */
  rentalWindowHours: number;
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours >= 1 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export function RentalAccessCard({ filmId, price, rentalWindowHours }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rental, loading } = useActiveRental(filmId);
  const [, force] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
  const priceLabel = `${formatted} GBP`;

  const handleRent = async () => {
    if (!user) {
      navigate(`/signup?from=${encodeURIComponent("/")}&intent=rent&film=${filmId}`);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { filmId },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start checkout";
      toast({ title: "Checkout error", description: message, variant: "destructive" });
      setBusy(false);
    }
  };

  if (rental && !loading) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-primary text-primary-foreground p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-white/70 font-medium">RENTAL ACCESS</p>
            <p className="font-display text-3xl mt-1">Enjoy</p>
          </div>
          <Button
            asChild
            className="rounded-md bg-white text-primary hover:bg-white/90 px-5"
          >
            <Link to={`/watch/${rental.id}`}>Watch movie</Link>
          </Button>
        </div>
        <span className="inline-block rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[11px] text-white">
          {formatRemaining(rental.expires_at)} · {rentalWindowHours}-hour rental access
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-primary text-primary-foreground p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-white/70 font-medium">RENTAL ACCESS</p>
          <p className="font-display text-3xl mt-1">{priceLabel}</p>
        </div>
        <Button
          onClick={handleRent}
          disabled={busy}
          className="rounded-md bg-white text-primary hover:bg-white/90 px-5"
        >
          Rent now
        </Button>
      </div>
      <span className="inline-block rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[11px] text-white">
        {rentalWindowHours}-hour rental access
      </span>
    </div>
  );
}
