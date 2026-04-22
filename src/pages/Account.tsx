import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Account() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => { document.title = "Account — Indie Reel"; }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      setDisplayName(data?.display_name ?? "");
    })();
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    else toast({ title: "Profile saved" });
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Password updated" });
      setNewPassword("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background hero-bg">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-16 space-y-8">
        <div>
          <h1 className="font-display text-4xl font-semibold display-tracking mb-2">Account</h1>
          <p className="text-muted-foreground">Signed in as {user?.email}</p>
        </div>

        <Card className="bg-surface border-border">
          <CardHeader><CardTitle className="font-display text-xl">Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background" />
              </div>
              <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader><CardTitle className="font-display text-xl">Change password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newpw">New password</Label>
                <Input id="newpw" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background" />
              </div>
              <Button type="submit" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update password"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader><CardTitle className="font-display text-xl">Session</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
