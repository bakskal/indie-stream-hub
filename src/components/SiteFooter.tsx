import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase(), source: "footer" });
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
    <footer className="border-t border-border/60 mt-24">
      <div className="container py-16 grid gap-12 md:grid-cols-2">
        <div className="max-w-md">
          <h3 className="font-display text-2xl font-semibold tracking-tight">Stay in the loop.</h3>
          <p className="mt-3 text-muted-foreground">
            Occasional updates from the filmmakers — release news, festival dates, behind-the-scenes. No spam.
          </p>
          <form onSubmit={handleSubscribe} className="mt-6 flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="bg-surface border-border"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Subscribe"}
            </Button>
          </form>
        </div>
        <div className="md:text-right text-sm text-muted-foreground space-y-2">
          <p className="font-display text-foreground">Indie Reel</p>
          <p>Independent cinema, direct to you.</p>
          <p className="pt-4">© {new Date().getFullYear()} — All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
