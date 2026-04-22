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
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => { document.title = "Account — Rock On Motion Pictures"; }, []);

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
          <h1 className="font-display text-4xl font-semibold display-tracking mb-2 text-white">Account</h1>
          <p className="text-white/85">Signed in as {user?.email}</p>
        </div>

        <Card className="bg-white text-card-foreground border-border">
          <CardHeader><CardTitle className="font-display text-xl">Email</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground">Email address</Label>
              <Input id="email" value={user?.email ?? ""} readOnly className="bg-input text-card-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white text-card-foreground border-border">
          <CardHeader><CardTitle className="font-display text-xl">Change password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newpw" className="text-card-foreground">New password</Label>
                <Input id="newpw" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-input text-card-foreground" />
              </div>
              <Button type="submit" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update password"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white text-card-foreground border-border">
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
