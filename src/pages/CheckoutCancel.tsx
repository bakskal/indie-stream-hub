import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  useEffect(() => { document.title = "Checkout cancelled — Indie Reel"; }, []);
  return (
    <div className="min-h-screen flex flex-col bg-background hero-bg">
      <SiteHeader />
      <main className="flex-1 container max-w-lg py-24 text-center reveal">
        <h1 className="font-display text-4xl font-semibold display-tracking mb-4">Checkout cancelled</h1>
        <p className="text-muted-foreground mb-8">No charge was made. You can try again anytime.</p>
        <Button asChild size="lg"><Link to="/">Back to film</Link></Button>
      </main>
    </div>
  );
}
