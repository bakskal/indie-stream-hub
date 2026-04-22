import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveRental } from "@/hooks/useActiveRental";
import { toast } from "@/hooks/use-toast";

interface Props {
  filmId: string;
  priceCents: number;
  currency: string;
  rentalWindowHours: number;
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours >= 1 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

/**
 * The "Rental Access" card on the landing page.
 * - Visitors / signed-in users without an active rental: see price + Rent CTA
 * - Users with an active rental: see "Enjoy" + Watch movie CTA, with countdown
 */
export function RentalAccessCard({ filmId, priceCents, currency, rentalWindowHours }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rental, loading } = useActiveRental(filmId);
  const [, force] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(priceCents / 100);

  const handleRent = async () => {
    if (!user) {
      navigate(`/signup?from=${encodeURIComponent("/")}&intent=rent&film=${filmId}`);
      return;
    }
    setBusy(true);
    toast({
      title: "Checkout coming online",
      description: "Payments will be activated once Stripe is connected. Your account is ready.",
    });
    setBusy(false);
  };

  // ACTIVE RENTAL — show "Enjoy" / Watch movie
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
        <span className="inline-block rounded-full bg-secondary/40 border border-white/10 px-3 py-1 text-[11px] text-white/80">
          {formatRemaining(rental.expires_at)} · {rentalWindowHours}-hour rental access
        </span>
      </div>
    );
  }

  // NO RENTAL — show price + Rent CTA
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-primary text-primary-foreground p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-white/70 font-medium">RENTAL ACCESS</p>
          <p className="font-display text-3xl mt-1">{formatted}</p>
        </div>
        <Button
          onClick={handleRent}
          disabled={busy}
          className="rounded-md bg-white text-primary hover:bg-white/90 px-5"
        >
          Rent now
        </Button>
      </div>
      <span className="inline-block rounded-full bg-secondary/40 border border-white/10 px-3 py-1 text-[11px] text-white/80">
        {rentalWindowHours}-hour rental access
      </span>
    </div>
  );
}
