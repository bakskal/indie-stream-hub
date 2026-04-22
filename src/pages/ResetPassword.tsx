import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Set new password — Indie Reel"; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated" });
    navigate("/library", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm reveal">
          <h1 className="font-display text-3xl font-semibold display-tracking mb-2 text-white">Set a new password</h1>
          <p className="text-white/85 mb-8">Pick something only you would know.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">New password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-surface text-card-foreground" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Update password"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
