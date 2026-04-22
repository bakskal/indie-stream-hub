import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Status = "verifying" | "paid" | "pending" | "error";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<Status>("verifying");
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Payment received — Rock On Motion Pictures";
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Missing checkout session.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
        });
        if (cancelled) return;
        if (error) throw error;
        if (data?.status === "paid" && data?.rentalId) {
          setRentalId(data.rentalId);
          setStatus("paid");
        } else {
          setStatus("pending");
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Verification failed");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />
      <main className="flex-1 container max-w-lg py-24 text-center reveal">
        {status === "verifying" && (
          <>
            <h1 className="font-display text-4xl mb-4">Confirming your payment…</h1>
            <p className="text-white/70">Hang tight, this only takes a second.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <h1 className="font-display text-4xl mb-4">You're in.</h1>
            <p className="text-white/70 mb-8">
              Your 72-hour rental has started. Enjoy the film.
            </p>
            <Button asChild size="lg">
              <Link to={rentalId ? `/watch/${rentalId}` : "/library"}>Watch movie</Link>
            </Button>
          </>
        )}
        {status === "pending" && (
          <>
            <h1 className="font-display text-4xl mb-4">Payment pending</h1>
            <p className="text-white/70 mb-8">
              We haven't received confirmation yet. Refresh this page in a moment.
            </p>
            <Button asChild size="lg" variant="outline">
              <Link to="/library">Go to library</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-display text-4xl mb-4">Something went wrong</h1>
            <p className="text-white/70 mb-8">{errorMsg ?? "Please try again."}</p>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Back to film</Link>
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
