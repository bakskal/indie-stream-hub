import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Hls from "hls.js";
import { Cast } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
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

// Resume only kicks in after this many seconds of saved progress.
// Below this, we treat the rental as "starting from the beginning".
const RESUME_THRESHOLD_SECONDS = 5;
const PROGRESS_SAVE_INTERVAL_MS = 5_000;

const SUPABASE_URL = "https://dhbyembenuuscgqwbpwq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYnllbWJlbnV1c2NncXdicHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjcyMDgsImV4cCI6MjA5MjAwMzIwOH0.mSMwZGiTfi__Pf53xD09Fa9Vsv-1G6FG81IZUP5kx4k";

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

// ---- Cast (Chromecast) ----
// Loads the Google Cast Sender SDK once and resolves when the framework is ready.
let castSdkPromise: Promise<boolean> | null = null;
function loadCastSdk(): Promise<boolean> {
  if (castSdkPromise) return castSdkPromise;
  castSdkPromise = new Promise((resolve) => {
    const w = window as unknown as {
      cast?: { framework?: unknown };
      __onGCastApiAvailable?: (available: boolean) => void;
    };
    if (w.cast?.framework) return resolve(true);
    w.__onGCastApiAvailable = (available: boolean) => resolve(available);
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
    script.async = true;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
    // Safety timeout
    setTimeout(() => resolve(Boolean(w.cast?.framework)), 6000);
  });
  return castSdkPromise;
}

export default function Watch() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<PlaybackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"intro" | "feature">("feature");
  const [castReady, setCastReady] = useState(false);
  const [airplayAvailable, setAirplayAvailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [, force] = useState(0);

  const lastSavedRef = useRef(0);
  const featureStartedRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);

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

  // Drive playback: check saved progress first → intro only on fresh starts.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playback || !user) return;

    let cancelled = false;
    let hls: Hls | null = null;
    let saveTimer: number | null = null;

    const saveProgress = async (force = false) => {
      if (!featureStartedRef.current) return;
      const pos = Math.floor(video.currentTime);
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

    const startFeature = (resumeAt: number) => {
      if (cancelled) return;
      setPhase("feature");

      // Detach any prior source (intro)
      if (hls) {
        hls.destroy();
        hls = null;
      }
      video.removeAttribute("src");
      video.load();

      lastSavedRef.current = resumeAt;
      hls = attachHls(video, playback.playback.hls);

      const seekAndPlay = () => {
        if (cancelled) return;
        if (resumeAt > 0 && Number.isFinite(video.duration)) {
          video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 5));
        }
        featureStartedRef.current = true;
        video.play().catch(() => {/* user can press play */});
      };

      if (video.readyState >= 1) {
        seekAndPlay();
      } else {
        video.addEventListener("loadedmetadata", seekAndPlay, { once: true });
      }

      saveTimer = window.setInterval(() => {
        if (!video.paused && !video.ended) saveProgress();
      }, PROGRESS_SAVE_INTERVAL_MS);
    };

    const onIntroEnded = () => { startFeature(0); };

    // Decide intro vs. resume BEFORE attaching any source
    (async () => {
      const { data: history } = await supabase
        .from("watch_history")
        .select("progress_seconds")
        .eq("user_id", user.id)
        .eq("film_id", playback.film_id)
        .maybeSingle();
      if (cancelled) return;

      const savedSeconds = history?.progress_seconds ?? 0;

      if (savedSeconds > RESUME_THRESHOLD_SECONDS) {
        // Resume — skip intro, jump straight into the feature
        startFeature(savedSeconds);
      } else {
        // Fresh start — play intro, then feature from 0
        setPhase("intro");
        featureStartedRef.current = false;
        hls = attachHls(video, INTRO_HLS_URL);
        video.addEventListener("ended", onIntroEnded);
        video.play().catch(() => {/* autoplay may be blocked */});
      }
    })();

    const onPause = () => { setIsPlaying(false); void saveProgress(true); };
    const onPlay = () => { setIsPlaying(true); };
    const onEnded = () => { setIsPlaying(false); };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);
    video.addEventListener("ended", onEnded);

    // Fire-and-forget save on tab close
    let cachedToken: string | null = null;
    void supabase.auth.getSession().then(({ data }) => {
      cachedToken = data.session?.access_token ?? null;
    });
    const onBeforeUnload = () => {
      if (!featureStartedRef.current) return;
      const pos = Math.floor(video.currentTime);
      try {
        fetch(`${SUPABASE_URL}/rest/v1/watch_history?on_conflict=user_id,film_id`, {
          method: "POST",
          keepalive: true,
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${cachedToken ?? SUPABASE_ANON_KEY}`,
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
      video.removeEventListener("play", onPlay);
      video.removeEventListener("ended", onEnded);
      if (saveTimer) clearInterval(saveTimer);
      void saveProgress(true);
      if (hls) hls.destroy();
    };
  }, [playback, user]);

  // ---- Cast init ----
  useEffect(() => {
    if (!playback) return;
    let cancelled = false;
    void loadCastSdk().then((ok) => {
      if (cancelled || !ok) return;
      const w = window as unknown as {
        cast: {
          framework: {
            CastContext: {
              getInstance: () => {
                setOptions: (o: Record<string, unknown>) => void;
              };
            };
            RemotePlayer: new () => unknown;
            RemotePlayerController: new (p: unknown) => unknown;
          };
        };
        chrome: { cast: { media: { DEFAULT_MEDIA_RECEIVER_APP_ID: string }; AutoJoinPolicy: { ORIGIN_SCOPED: string } } };
      };
      try {
        w.cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: w.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: w.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        setCastReady(true);
      } catch {
        // SDK not fully ready
      }
    });
    return () => { cancelled = true; };
  }, [playback]);

  // ---- AirPlay availability (Safari only) ----
  useEffect(() => {
    const video = videoRef.current as (HTMLVideoElement & {
      webkitShowPlaybackTargetPicker?: () => void;
    }) | null;
    if (!video) return;
    if (typeof video.webkitShowPlaybackTargetPicker !== "function") return;
    const onChange = (e: Event) => {
      const detail = (e as unknown as { availability?: string }).availability;
      setAirplayAvailable(detail === "available");
    };
    video.addEventListener(
      "webkitplaybacktargetavailabilitychanged" as keyof HTMLVideoElementEventMap,
      onChange as EventListener,
    );
    return () => {
      video.removeEventListener(
        "webkitplaybacktargetavailabilitychanged" as keyof HTMLVideoElementEventMap,
        onChange as EventListener,
      );
    };
  }, [playback]);

  const handleCastClick = async () => {
    if (!playback) return;
    const video = videoRef.current as (HTMLVideoElement & {
      webkitShowPlaybackTargetPicker?: () => void;
    }) | null;

    // Prefer AirPlay on Safari
    if (video && typeof video.webkitShowPlaybackTargetPicker === "function") {
      try {
        video.webkitShowPlaybackTargetPicker();
        return;
      } catch {/* fall through to Chromecast */}
    }

    // Chromecast
    const w = window as unknown as {
      cast?: {
        framework: {
          CastContext: {
            getInstance: () => {
              requestSession: () => Promise<unknown>;
              getCurrentSession: () => null | {
                loadMedia: (req: unknown) => Promise<unknown>;
              };
            };
          };
        };
      };
      chrome?: {
        cast: {
          media: {
            MediaInfo: new (url: string, contentType: string) => {
              metadata?: unknown;
            };
            GenericMediaMetadata: new () => { title?: string };
            LoadRequest: new (info: unknown) => { currentTime?: number };
          };
        };
      };
    };
    if (!w.cast || !w.chrome) return;

    try {
      const ctx = w.cast.framework.CastContext.getInstance();
      let session = ctx.getCurrentSession();
      if (!session) {
        await ctx.requestSession();
        session = ctx.getCurrentSession();
      }
      if (!session) return;

      const mediaInfo = new w.chrome.cast.media.MediaInfo(
        playback.playback.hls,
        "application/vnd.apple.mpegurl",
      );
      const meta = new w.chrome.cast.media.GenericMediaMetadata();
      meta.title = playback.title;
      mediaInfo.metadata = meta;

      const req = new w.chrome.cast.media.LoadRequest(mediaInfo);
      req.currentTime = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;

      // Pause local playback while casting
      videoRef.current?.pause();
      await session.loadMedia(req);
    } catch (err) {
      console.error("Cast failed", err);
    }
  };

  useEffect(() => {
    if (playback?.title) document.title = `Watching ${playback.title} — Indie Reel`;
  }, [playback]);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const showCastButton = castReady || airplayAvailable;

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
              <div className="flex items-center gap-2">
                {showCastButton ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCastClick}
                    title="Cast to a device on your network"
                  >
                    <Cast className="h-4 w-4 mr-2" />
                    Cast
                  </Button>
                ) : null}
                <Badge>{formatRemaining(playback.expires_at)}</Badge>
              </div>
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
                  {...({ "x-webkit-airplay": "allow" } as Record<string, string>)}
                />
                {phase === "intro" ? (
                  <div className="absolute top-3 left-3 text-xs uppercase tracking-wider text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded">
                    Intro
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Streaming via Cloudflare. Time-limited to your rental window.
                {showCastButton ? " Cast to your TV with the Cast button above." : ""}
              </p>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
