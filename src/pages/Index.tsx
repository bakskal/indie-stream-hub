import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RentButton } from "@/components/RentButton";
import { useFeaturedFilm } from "@/hooks/useFeaturedFilm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  const { film, loading } = useFeaturedFilm();

  useEffect(() => {
    document.title = film?.title
      ? `${film.title} — Rent the film`
      : "Indie Reel — Independent cinema, direct to you";
    const desc = film?.tagline ?? "Rent the independent feature direct from the filmmakers. 72-hour streaming window.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc.slice(0, 158));
  }, [film]);

  return (
    <div className="min-h-screen flex flex-col bg-background hero-bg">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative grain overflow-hidden">
          <div className="container max-w-3xl py-24 md:py-36 text-center reveal">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
              An independent feature · Streaming now
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-semibold display-tracking text-balance">
              {loading ? "Loading…" : film?.title ?? "Untitled Feature"}
            </h1>
            {film?.tagline && (
              <p className="mt-6 text-lg md:text-xl text-muted-foreground text-balance max-w-xl mx-auto">
                {film.tagline}
              </p>
            )}
            <div className="mt-12">
              {film && (
                <RentButton
                  filmId={film.id}
                  priceCents={film.price_cents}
                  currency={film.currency}
                  rentalWindowHours={film.rental_window_hours}
                />
              )}
            </div>
          </div>
        </section>

        {/* Trailer */}
        <section className="container max-w-4xl pb-24">
          <div className="aspect-video rounded-lg overflow-hidden border border-border bg-surface relative">
            {film?.trailer_stream_id ? (
              <iframe
                src={`https://iframe.videodelivery.net/${film.trailer_stream_id}`}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                className="w-full h-full"
                title={`${film.title} trailer`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Trailer will appear here once the Cloudflare Stream video ID is added.
              </div>
            )}
          </div>
        </section>

        {/* Synopsis */}
        {film?.synopsis && (
          <section className="container max-w-2xl pb-24">
            <p className="text-lg leading-relaxed text-foreground/90 text-balance">
              {film.synopsis}
            </p>
          </section>
        )}

        {/* FAQ */}
        <section className="container max-w-2xl pb-24">
          <h2 className="font-display text-3xl font-semibold mb-8 display-tracking">
            How rentals work
          </h2>
          <Accordion type="single" collapsible className="border-t border-border">
            <AccordionItem value="window">
              <AccordionTrigger>How long do I have to watch?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your rental window opens the moment you complete payment and stays open for{" "}
                {film?.rental_window_hours ?? 72} hours. Watch as many times as you want during
                that period.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="devices">
              <AccordionTrigger>What devices can I watch on?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Any modern browser on desktop, tablet, or phone. Adaptive streaming adjusts
                quality automatically based on your connection.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="account">
              <AccordionTrigger>Do I need an account?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. We attach the rental to your account so you can come back and watch from
                any device during your window.{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Create one in 30 seconds.
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support">
              <AccordionTrigger>Something's not working — who do I contact?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Email the team at hello@indiereel.example and we'll sort it out. Your rental
                window will be extended if there's a playback issue.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
