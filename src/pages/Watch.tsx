import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Hls from "hls.js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlaybackResponse {
  title: string;
  film_id: string;
  expires_at: string;
  playback: {
    hls: string;
    iframe: string;
    poster: string;
    expires_in_seconds: number;
  };
}

const INTRO_HLS_URL =
  "https://customer-mkfuixutdaumge7k.cloudflarestream.com/1925d62638d9857ea616d7bf92e3261c/manifest/video.m3u8";

// If the saved progress is within this many seconds of the start or end,
// don't bother resuming — start fresh / treat as finished.
const RESUME_THRESHOLD_SECONDS = 5;
const PROGRESS_SAVE_INTERVAL_MS = 5_000;

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours >= 1 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

function attachHls(video: HTMLVideoElement, src: string): Hls | null {
  if (Hls.isSupported()) {
    const hls = new Hls({ maxBufferLength: 30 });
    hls.loadSource(src);
    hls.attachMedia(video);
    return hls;
  }
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
  }
  return null;
}

export default function Watch() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<PlaybackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"intro" | "feature">("intro");
  const [, force] = useState(0);

  // Latest progress for the feature, used by the throttled saver and unload handler.
  const lastSavedRef = useRef(0);
  const featureStartedRef = useRef(false);

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

  // Drive playback: intro first, then feature with resume seek + progress save.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playback || !user) return;

    let cancelled = false;
    let hls: Hls | null = null;
    let saveTimer: number | null = null;

    const saveProgress = async (force = false) => {
      if (!featureStartedRef.current) return;
      const pos = Math.floor(video.currentTime);
      // Only write if it actually moved (or a forced flush on unmount/pause)
      if (!force && pos === lastSavedRef.current) return;
      lastSavedRef.current = pos;
      await supabase
        .from("watch_history")
        .upsert(
          {
            user_id: user.id,
            film_id: playback.film_id,
            progress_seconds: pos,
            last_watched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,film_id" },
        );
    };

    const startFeature = async () => {
      if (cancelled) return;
      setPhase("feature");

      // Detach intro source first
      if (hls) {
        hls.destroy();
        hls = null;
      }
      video.removeAttribute("src");
      video.load();

      // Look up saved progress
      let resumeAt = 0;
      const { data: history } = await supabase
        .from("watch_history")
        .select("progress_seconds")
        .eq("user_id", user.id)
        .eq("film_id", playback.film_id)
        .maybeSingle();
      if (history?.progress_seconds && history.progress_seconds > RESUME_THRESHOLD_SECONDS) {
        resumeAt = history.progress_seconds;
      }
      lastSavedRef.current = resumeAt;

      hls = attachHls(video, playback.playback.hls);

      const seekAndPlay = () => {
        if (cancelled) return;
        if (resumeAt > 0 && Number.isFinite(video.duration)) {
          // Stay at least 5s from the end so we don't immediately fire 'ended'.
          video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 5));
        }
        featureStartedRef.current = true;
        video.play().catch(() => {/* user can press play */});
      };

      if (video.readyState >= 1 /* HAVE_METADATA */) {
        seekAndPlay();
      } else {
        video.addEventListener("loadedmetadata", seekAndPlay, { once: true });
      }

      // Periodic progress save while playing
      saveTimer = window.setInterval(() => {
        if (!video.paused && !video.ended) saveProgress();
      }, PROGRESS_SAVE_INTERVAL_MS);
    };

    // Phase 1: play intro
    setPhase("intro");
    featureStartedRef.current = false;
    hls = attachHls(video, INTRO_HLS_URL);
    const onIntroEnded = () => { void startFeature(); };
    video.addEventListener("ended", onIntroEnded);
    video.play().catch(() => {/* autoplay may be blocked; user clicks play */});

    // Save on pause + tab close
    const onPause = () => { void saveProgress(true); };
    video.addEventListener("pause", onPause);

    const onBeforeUnload = () => {
      // Best-effort sync flush via sendBeacon-style upsert
      if (!featureStartedRef.current) return;
      const pos = Math.floor(video.currentTime);
      const url = `${supabase["supabaseUrl" as keyof typeof supabase]}` ; // not used
      // Use fetch keepalive — supabase-js doesn't expose beacon, but keepalive works on unload
      const session = supabase.auth.getSession;
      void session; // silence lint
      // Fire and forget; upsert via REST
      const anonKey = (supabase as unknown as { supabaseKey: string }).supabaseKey;
      const baseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl;
      const token = (supabase as unknown as { auth: { currentSession?: { access_token?: string } } }).auth.currentSession?.access_token;
      try {
        fetch(`${baseUrl}/rest/v1/watch_history?on_conflict=user_id,film_id`, {
          method: "POST",
          keepalive: true,
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token ?? anonKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            user_id: user.id,
            film_id: playback.film_id,
            progress_seconds: pos,
            last_watched_at: new Date().toISOString(),
          }),
        });
      } catch {/* ignore */}
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", onBeforeUnload);
      video.removeEventListener("ended", onIntroEnded);
      video.removeEventListener("pause", onPause);
      if (saveTimer) clearInterval(saveTimer);
      // Final save on unmount
      void saveProgress(true);
      if (hls) hls.destroy();
    };
  }, [playback, user]);

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
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black relative">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls={phase === "feature"}
                  playsInline
                  poster={phase === "feature" ? playback.playback.poster : undefined}
                  controlsList="nodownload"
                />
                {phase === "intro" ? (
                  <div className="absolute top-3 left-3 text-xs uppercase tracking-wider text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded">
                    Intro
                  </div>
                ) : null}
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
