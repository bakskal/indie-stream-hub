import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = params.get("from") || "/";
  const intent = params.get("intent");
  const filmId = params.get("film");

  const handlePostAuth = async () => {
    // If user came in to rent a film, kick off Stripe checkout right away.
    if (intent === "rent" && filmId) {
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { filmId },
        });
        if (error) throw error;
        if (!data?.url) throw new Error("No checkout URL returned");
        window.location.href = data.url;
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not start checkout";
        toast({ title: "Checkout error", description: message, variant: "destructive" });
      }
    }
    navigate(from, { replace: true });
  };

  useEffect(() => {
    document.title = "Sign in — Rock On Motion Pictures";
    if (user) handlePostAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    await handlePostAuth();
  };

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm reveal">
          <h1 className="font-display text-3xl font-semibold display-tracking mb-2 text-white">Welcome back</h1>
          <p className="text-white/85 mb-8">Sign in to access your rentals.</p>
          <GoogleAuthButton label="Sign in with Google" />
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-surface text-card-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Link to="/forgot-password" className="text-xs text-white/85 hover:text-white">
                  Forgot?
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-surface text-card-foreground" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-sm text-white/85 mt-6 text-center">
            Don't have an account?{" "}
            <Link to={`/signup${params.toString() ? `?${params.toString()}` : ""}`} className="text-accent hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
