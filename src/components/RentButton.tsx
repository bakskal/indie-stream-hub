import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  filmId: string;
  priceCents: number;
  currency: string;
  rentalWindowHours: number;
}

export function RentButton({ filmId, priceCents, currency, rentalWindowHours }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(priceCents / 100);

  const handleClick = async () => {
    if (!user) {
      navigate(`/signup?from=${encodeURIComponent("/")}&intent=rent&film=${filmId}`);
      return;
    }
    setLoading(true);
    // Stripe checkout edge function will be wired in next step.
    toast({
      title: "Checkout coming online",
      description: "Payments will be activated once Stripe is connected. Your account is ready.",
    });
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        size="lg"
        onClick={handleClick}
        disabled={loading}
        className="h-14 px-10 text-base font-medium shadow-elegant hover:shadow-glow transition-shadow"
      >
        Rent — {formatted} · {rentalWindowHours}hr window
      </Button>
      <p className="text-xs text-muted-foreground">
        Watch anytime in the next {rentalWindowHours} hours after purchase.
      </p>
    </div>
  );
}
