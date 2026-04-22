import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Hls from "hls.js";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * DEV-ONLY test playback page.
 * Loads the active film's feature_stream_id directly and plays it,
 * bypassing the rental paywall. Use to verify the stream works.
 * Route: /dev/watch
 */
export default function DevWatch() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [title, setTitle] = useState<string>("");
  const [streamId, setStreamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Dev playback test — Indie Reel";
    (async () => {
      const { data, error } = await supabase
        .from("films")
        .select("title, feature_stream_id")
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      if (error || !data) {
        setError(error?.message || "No active film found");
        return;
      }
      if (!data.feature_stream_id) {
        setError("Film has no feature_stream_id set");
        return;
      }
      setTitle(data.title);
      setStreamId(data.feature_stream_id);
    })();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamId) return;
    const subdomain = "customer-mkfuixutdaumge7k.cloudflarestream.com";
    const src = `https://${subdomain}/${streamId}/manifest/video.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  }, [streamId]);

  const subdomain = "customer-mkfuixutdaumge7k.cloudflarestream.com";
  const poster = streamId
    ? `https://${subdomain}/${streamId}/thumbnails/thumbnail.jpg`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="container max-w-6xl pt-6 flex items-center justify-between">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Home
            </Link>
            <h1 className="font-display text-2xl mt-1">{title || "Loading…"}</h1>
          </div>
          <Badge variant="outline">Dev preview · paywall bypassed</Badge>
        </div>
        <div className="container max-w-6xl py-6">
          {error ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild><Link to="/">Back home</Link></Button>
            </div>
          ) : (
            <>
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  playsInline
                  poster={poster}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Test route — plays the unsigned HLS stream directly. Real users
                must rent and go through <code>/watch/:rentalId</code>.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
