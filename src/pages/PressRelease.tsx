import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const videoItems = [
  {
    type: "Video",
    outlet: "Geo News",
    title: "Mr. Paanwala video feature",
    embedUrl: "https://www.youtube-nocookie.com/embed/aD4Ovk6bYmg",
    href: "https://www.youtube.com/watch?si=4nvzo7NRBCHRjYAW&v=aD4Ovk6bYmg&feature=youtu.be",
    summary:
      "A full YouTube video feature for Mr. Paanwala that can sit alongside the written press coverage.",
  },
  {
    type: "Short",
    outlet: "",
    title: "Mr. Paanwala YouTube Short",
    embedUrl: "https://www.youtube-nocookie.com/embed/t8uymoUNlRw",
    href: "https://www.youtube.com/shorts/t8uymoUNlRw?si=FLWmQac0trqzph_j",
    summary: "A vertical YouTube Short that adds quick social-style video coverage for the film.",
  },
];

const pressItems = [
  {
    type: "Article",
    outlet: "Bollywood Hungama",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://www.bollywoodhungama.com/news/features/shreya-ghoshal-vishal-dadlani-shaan-come-together-vijay-bholas-directorial-debut-mr-paanwala/",
    summary: "Coverage highlighting the film's music-led launch and the collaboration of Shreya Ghoshal, Vishal Dadlani, and Shaan on Vijay Bhola's directorial debut.",
  },
  {
    type: "Article",
    outlet: "Lokmat Times",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://www.lokmattimes.com/business/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bholas-directorial-debut-mr-paanwala/",
    summary: "A press piece covering the film's music talent, Vijay Bhola's move into filmmaking, and the worldwide YouTube release for Mr. Paanwala.",
  },
  {
    type: "Article",
    outlet: "The Tribune",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://www.tribuneindia.com/news/business/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bholas-directorial-debut-mr-paanwala/",
    summary: "Syndicated coverage of the film's music-led debut, its family-centered story, and its global YouTube release strategy.",
  },
  {
    type: "Article",
    outlet: "ANI",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://www.aninews.in/news/business/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bholas-directorial-debut-mr-paanwala20260402110744/",
    summary: "ANI's business coverage outlines the cast, musical collaborators, emotional themes, and the film's worldwide release on YouTube.",
  },
  {
    type: "Article",
    outlet: "Filmibeat",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://www.filmibeat.com/bollywood/news/2026/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bhola-s-directorial-debut-mr-paanwala-509553.html",
    summary: "Filmibeat coverage focused on the launch buzz around Vijay Bhola's debut film and its singer-led soundtrack lineup.",
  },
  {
    type: "Article",
    outlet: "Bollywood Spy",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://bollywoodspy.in/2026/04/01/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bholas-directorial-debut-mr-paanwala",
    summary: "A feature highlighting the film's music collaborators, Vijay Bhola's transition into directing, and the emotional core of Mr. Paanwala.",
  },
  {
    type: "Article",
    outlet: "Bollywood ki Baten",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://www.bollywoodkibaten.in/music-video-news/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bholas-directorial-debut-mr-paanwala/62372",
    summary: "Bollywood ki Baten covers the film's singer lineup, Vijay Bhola's first film as director, and the global YouTube release for Mr. Paanwala.",
  },
  {
    type: "Article",
    outlet: "FifaFooz India",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://fifafoozindia.wixsite.com/my-site/post/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bhola-s-directorial-debut-mr-paanwala",
    summary: "A press-post version of the launch story covering the featured singers, the directorial debut, and the film's cross-generational themes.",
  },
  {
    type: "Article",
    outlet: "Report India",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://reportindia.in/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bholas-directorial-debut-mr-paanwala/",
    summary: "Report India carries the film announcement with emphasis on the emotional story, music-forward structure, and international release plan.",
  },
  {
    type: "Article",
    outlet: "ThePrint",
    title: "Shreya Ghoshal, Vishal Dadlani, Shaan Come Together for Vijay Bhola's Directorial Debut Mr. Paanwala",
    href: "https://theprint.in/ani-press-releases/shreya-ghoshal-vishal-dadlani-shaan-come-together-for-vijay-bholas-directorial-debut-mr-paanwala/2894743/",
    summary: "ThePrint's ANI press-release listing adds another major publication reference for the film's launch and music-driven positioning.",
  },
  {
    type: "Interview",
    outlet: "Eastern Eye",
    title: "Vijay Bhola: \u201cI've spent years filling arenas, now I want to fill hearts\u201d",
    href: "https://www.easterneye.biz/vijay-bhola-interview-mr-paanwala/",
    summary: "An interview with Vijay Bhola about moving from live entertainment to filmmaking, centering older audiences, and the emotional purpose behind Mr. Paanwala.",
  },
  {
    type: "Review",
    outlet: "Eastern Eye",
    title: "'Mr Paanwala' offers a calm, assured rebellion against Bollywood excess",
    href: "https://www.easterneye.biz/mr-paanwala-bollywood-excess-film-review/",
    summary: "Eastern Eye's first review praises the film's restraint, emotional depth, older lead characters, and its quiet pushback against overblown Bollywood spectacle.",
  },
];

function TypeBadge({ type }: { type: string }) {
  const upper = type.toUpperCase();
  return (
    <span className="inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-0.5 text-[10px] tracking-[0.2em] text-primary font-medium">
      {upper}
    </span>
  );
}

export default function PressRelease() {
  useEffect(() => {
    document.title = "Press Release — Rock On Motion Pictures";
  }, []);

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />
      <main className="flex-1 container py-10">
        <p className="text-[11px] tracking-[0.3em] text-white/70 font-medium">PRESS RELEASE</p>
        <h1 className="font-display text-4xl md:text-5xl text-white mt-2 mb-10">
          SEE WHAT EVERYONE IS SAYING!
        </h1>

        {/* Videos row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {videoItems.map((v) => (
            <div key={v.title} className="rounded-3xl bg-white text-card-foreground shadow-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <TypeBadge type={v.type} />
                {v.outlet && (
                  <span className="text-sm text-card-foreground/65">{v.outlet}</span>
                )}
              </div>
              <h3 className="font-display text-xl">{v.title}</h3>
              <p className="text-sm text-card-foreground/75 mt-2">{v.summary}</p>
              <div className="mt-4 rounded-xl overflow-hidden bg-muted aspect-video">
                <iframe
                  src={v.embedUrl}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Articles grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pressItems.map((p) => (
            <div
              key={p.href}
              className="rounded-2xl bg-white text-card-foreground shadow-card p-6 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <TypeBadge type={p.type} />
                <span className="text-xs text-card-foreground/65">{p.outlet}</span>
              </div>
              <h3 className="font-display text-lg leading-snug">{p.title}</h3>
              <p className="text-sm text-card-foreground/75 mt-3 flex-1">{p.summary}</p>
              <Button
                asChild
                size="sm"
                className="mt-5 w-fit bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              >
                <a href={p.href} target="_blank" rel="noopener noreferrer">Open coverage</a>
              </Button>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
