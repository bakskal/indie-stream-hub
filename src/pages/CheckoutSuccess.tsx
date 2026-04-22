import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  useEffect(() => { document.title = "Payment received — Indie Reel"; }, []);
  return (
    <div className="min-h-screen flex flex-col bg-background hero-bg">
      <SiteHeader />
      <main className="flex-1 container max-w-lg py-24 text-center reveal">
        <h1 className="font-display text-4xl font-semibold display-tracking mb-4">You're in.</h1>
        <p className="text-muted-foreground mb-8">
          Your 72-hour rental window has started. Head to your library to watch.
        </p>
        <Button asChild size="lg"><Link to="/library">Go to library</Link></Button>
      </main>
    </div>
  );
}
