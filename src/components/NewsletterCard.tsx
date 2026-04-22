import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase() });
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already subscribed", description: "You're already on the list." });
      } else {
        toast({ title: "Couldn't subscribe", description: error.message, variant: "destructive" });
      }
      return;
    }
    setEmail("");
    toast({ title: "You're in", description: "We'll be in touch when we have something to share." });
  };

  return (
    <section className="container max-w-3xl py-10">
      <div className="rounded-2xl bg-white text-card-foreground shadow-card px-8 py-10 text-center">
        <p className="text-[11px] tracking-[0.3em] text-muted-foreground font-medium">NEWSLETTER</p>
        <h2 className="font-display text-3xl md:text-4xl mt-3">Join to Our Mailing List</h2>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
          Enter your email to hear about new releases, premieres, and updates from Rock On Motion Pictures.
        </p>
        <form onSubmit={handleSubscribe} className="mt-6 flex max-w-md mx-auto gap-2">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="bg-input border-border text-card-foreground placeholder:text-muted-foreground/70"
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          >
            {loading ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
