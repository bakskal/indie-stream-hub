

## Watch page → cinema mode

Goal: strip the watch page down so the player feels like a theater, not a webpage. Add an optional "lights down" red ambient background that kicks in once the movie is actually playing.

### Changes to `src/pages/Watch.tsx`

1. **Remove `<SiteHeader />`** from the page entirely. The site nav adds visual noise and competes with the player.
2. **Replace it with a minimal floating top bar** that auto-hides:
   - Left: small "← Library" link + film title
   - Right: Cast button + rental countdown badge
   - Lives in an absolutely-positioned bar over the page, fades out 3 seconds after the movie starts playing, and fades back in on mouse move or pause. Same UX pattern as Netflix / Apple TV.
3. **Center the player** in the viewport (full viewport height, black background behind it) instead of the current container layout. The video gets the stage.
4. **Track a `isPlaying` state** wired to the video's `play` / `pause` / `ended` events so the rest of the UI can react to it.

### Cinema ambient background (the red theater idea)

Yes — this is a great touch and a known pattern (Apple TV does a subtle version). Recommendation: do it, but keep it tasteful so it doesn't fight the film's own colors.

Approach:
- Page background becomes deep black (`#05020a`) by default on this route only — overrides the global blue spotlight gradient.
- When `isPlaying === true` AND `phase === "feature"` (so it doesn't trigger during the intro), fade in a **deep theater-red radial glow** behind the player:
  - Two soft radial gradients, one from each side of the player, in a deep burgundy (`hsl(0 60% 18%)` fading to transparent).
  - Very low intensity — think "exit sign glow at the edge of a dark theater," not "red alert."
  - 1.2s ease-in fade when playback starts, fade out on pause.
- Add a subtle vignette around the player edges so the screen feels framed by darkness.

The intro clip stays on plain black so the red reveal coincides with the feature starting — adds a small "lights dimming, movie's starting" beat.

### Layout sketch

```text
┌─────────────────────────────────────────────┐
│  ← Library   Film Title    [Cast] [2h 14m]  │  ← floating, auto-hides
│                                             │
│                                             │
│         ┌───────────────────────┐           │
│         │                       │           │
│   red   │       VIDEO PLAYER    │   red     │  ← red ambient glow
│   glow  │                       │   glow      only while playing
│         └───────────────────────┘           │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
        deep black page background
```

### Files touched

- `src/pages/Watch.tsx` — remove header, add floating auto-hide bar, add `isPlaying` state, add cinema background wrapper
- No CSS file changes needed; all styling done with Tailwind + inline gradients scoped to this page so the rest of the site keeps the blue brand look

### What I'm not changing

- Playback logic, resume behavior, intro flow, casting — all stay exactly as they are
- No edge function or DB changes — pure frontend
- No global theme changes — the red/black is scoped to `/watch/*` only

