import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const from = params.get("from") || "/library";

  useEffect(() => {
    document.title = "Create account — Indie Reel";
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/library`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Couldn't create account", description: error.message, variant: "destructive" });
      return;
    }

    // If the project requires email confirmation, signUp returns a user but no session.
    // In that case, try to sign in directly — succeeds when confirmation is disabled.
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setLoading(false);
        toast({
          title: "Account created",
          description: "Confirm your email, then sign in.",
        });
        navigate(`/login?from=${encodeURIComponent(from)}`, { replace: true });
        return;
      }
    }

    setLoading(false);
    toast({ title: "Welcome", description: "Account created." });
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm reveal">
          <h1 className="font-display text-3xl font-semibold display-tracking mb-2 text-white">Create your account</h1>
          <p className="text-white/85 mb-8">Takes about 30 seconds.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Display name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" className="bg-surface text-card-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-surface text-card-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-surface text-card-foreground" />
              <p className="text-xs text-white/75">8+ characters.</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="text-sm text-white/85 mt-6 text-center">
            Already have one?{" "}
            <Link to={`/login${params.toString() ? `?${params.toString()}` : ""}`} className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
