import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Hls from "hls.js";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlaybackResponse {
  title: string;
  expires_at: string;
  playback: {
    hls: string;
    iframe: string;
    poster: string;
    expires_in_seconds: number;
  };
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours >= 1 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export default function Watch() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<PlaybackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, force] = useState(0);

  // Fetch playback URL (server verifies active rental)
  useEffect(() => {
    if (!rentalId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke<PlaybackResponse>(
        "get-stream-playback",
        { body: { rental_id: rentalId } },
      );
      if (cancelled) return;
      if (error || !data) {
        setError(error?.message || "Could not load playback");
        setLoading(false);
        return;
      }
      setPlayback(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [rentalId]);

  // Set up HLS playback once we have the URL
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playback) return;

    const src = playback.playback.hls;

    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
    // Safari supports HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  }, [playback]);

  useEffect(() => {
    if (playback?.title) document.title = `Watching ${playback.title} — Indie Reel`;
  }, [playback]);

  // Tick countdown
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {loading ? (
          <div className="container py-24 text-center text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="container max-w-xl py-24 text-center">
            <h1 className="font-display text-2xl mb-2">
              {error.toLowerCase().includes("not active") ? "Rental ended" : "Couldn't open rental"}
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline"><Link to="/library">Library</Link></Button>
              <Button asChild><Link to="/">Rent again</Link></Button>
            </div>
          </div>
        ) : playback ? (
          <>
            <div className="container max-w-6xl pt-6 flex items-center justify-between">
              <div>
                <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">
                  ← Library
                </Link>
                <h1 className="font-display text-2xl mt-1">{playback.title}</h1>
              </div>
              <Badge>{formatRemaining(playback.expires_at)}</Badge>
            </div>
            <div className="container max-w-6xl py-6">
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  playsInline
                  poster={playback.playback.poster}
                  controlsList="nodownload"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Streaming via Cloudflare. Time-limited to your rental window.
              </p>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
