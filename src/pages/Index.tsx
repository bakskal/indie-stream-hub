import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NewsletterCard } from "@/components/NewsletterCard";
import { RentalAccessCard } from "@/components/RentalAccessCard";
import { useFeaturedFilm } from "@/hooks/useFeaturedFilm";
import { useActiveRental } from "@/hooks/useActiveRental";
import { Button } from "@/components/ui/button";
import poster from "@/assets/movie-poster.png";

const Index = () => {
  const { film, loading } = useFeaturedFilm();
  const { rental } = useActiveRental(film?.id);

  useEffect(() => {
    document.title = film?.title
      ? `${film.title} — Rock On Motion Pictures`
      : "Rock On Motion Pictures";
    const desc =
      film?.tagline ??
      "Mr. Paanwala — a Vijay Bhola film. Rent the feature with a 72-hour streaming window.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc.slice(0, 158));
  }, [film]);

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO — title + trailer side by side */}
        <section className="container py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center reveal">
            <div>
              <span className="inline-block rounded-full bg-white/10 border border-white/15 px-4 py-1 text-[11px] tracking-[0.25em] text-white/80">
                MR. PAANWALA
              </span>
              <h1 className="font-display text-5xl md:text-7xl mt-5 text-white text-balance">
                {loading ? "Loading…" : film?.title ?? "Mr. Paanwala"}
              </h1>
              <p className="mt-4 text-white/75 max-w-md">
                Preview the trailer. Exclusive Access. One Powerful Story. Watch It First.
              </p>
              {rental ? (
                <Button
                  asChild
                  className="mt-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-11"
                >
                  <Link to={`/watch/${rental.id}`}>Resume watching</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="mt-8 rounded-md bg-white/5 border-white/20 text-white hover:bg-white/10 px-6 h-11"
                >
                  <a href="#about-film">Learn more</a>
                </Button>
              )}
            </div>

            {/* Trailer */}
            <div className="rounded-xl overflow-hidden border border-white/15 shadow-card bg-black/30">
              <div className="aspect-video">
                {film?.trailer_stream_id?.startsWith("youtube:") ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${film.trailer_stream_id.slice("youtube:".length)}?rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                    title={`${film.title} trailer`}
                  />
                ) : film?.trailer_stream_id ? (
                  <iframe
                    src={`https://iframe.videodelivery.net/${film.trailer_stream_id}`}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    className="w-full h-full"
                    title={`${film.title} trailer`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
                    Trailer loading…
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SYNOPSIS CARD */}
        <section id="about-film" className="container max-w-5xl py-10">
          <div className="rounded-3xl bg-white text-card-foreground shadow-card p-8 md:p-10">
            <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
              <div>
                <h2 className="font-display text-4xl">{film?.title ?? "Mr. Paanwala"}</h2>
                <p className="mt-5 text-muted-foreground leading-relaxed text-[15px]">
                  {film?.synopsis ??
                    "Mr. Paanwala addresses the immigrant diaspora that struggles to define a new identity for themselves as they face the dilemma of progressing in the new environment and the one they grew up in. Mr. Paanwala is a story about love, family, career, marriage, and finding your true self. It explores the contrast between Lucknow's culture and the London lifestyle. Rooted and authentic, the film features outstanding theatre actors delivering powerful performances."}
                </p>

                <div className="mt-8">
                  {film && (
                    <RentalAccessCard
                      filmId={film.id}
                      priceCents={film.price_cents}
                      currency={film.currency}
                      rentalWindowHours={film.rental_window_hours}
                    />
                  )}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden bg-muted">
                <img
                  src={poster}
                  alt="Mr. Paanwala poster"
                  loading="lazy"
                  className="w-full h-full object-cover aspect-[3/4]"
                />
              </div>
            </div>
          </div>
        </section>

        <NewsletterCard />
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
