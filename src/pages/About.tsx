import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function About() {
  useEffect(() => {
    document.title = "About — Rock On Motion Pictures";
  }, []);

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-10">
        <article className="rounded-3xl bg-white text-card-foreground shadow-card p-8 md:p-12">
          <h1 className="font-display text-4xl">Rock On Production</h1>
          <p className="mt-6 text-muted-foreground leading-relaxed text-[15px]">
            Rock On Music is now moving to new heights under the visionary directorship of Mr. Vijay Bhola
            who has been the Producer of high end music concerts for 4 decades. British indian Director
            Vijay Bhola's vision now extends to a new genre of films embracing the intricacies of facing
            real dilemmas and just being human in a highly entertaining way. Director Vijay Bhola's debut
            film MR. PAANWALA premiered at The Courthouse Hotel in Central London on Mar 23rd and released
            on April 3rd. Mr. Paanwala addresses the immigrant diaspora that struggles to define a new
            identity for themselves as they face the dilemma of progressing in the new environment and
            the one they grew up in. Mr. Paanwala is a story about love, family, career, marriage and
            finding your true Self. Mr. Paanwala is a heartfelt and humorous story centered on a middle
            class family from Lucknow who run a traditional paan shop and make a life changing decision
            to send their child to London for higher studies. Blending sentiment, culture and comedy, the
            film explores family values, aspiration and the emotional ties that connect home to the
            diaspora. A contrast between the Lucknow culture and the London lifestyle. It is a rooted and
            real story with outstanding theatre actors performing. A film to enjoy with your family. A
            son trying to build a life in London without losing the values he was raised with in Lucknow.
            A story every immigrant family will see themselves in. A beautifully made film with excellent
            cinematography, a heart warming family story, great music and outstanding theatre actors
            create an entertaining film that you will always remember. It will stay in your heart long
            after the credits roll.
          </p>

          <h2 className="font-display text-2xl mt-12">Meet the Director</h2>
          <div className="mt-5 rounded-2xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
            <div className="text-center text-muted-foreground text-sm px-6">
              Director video coming soon
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
