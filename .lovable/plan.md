

## Mobile cast/AirPlay support

Make casting work as well as the web platform allows on phones and tablets, without going native.

### What changes for the user

- **iPhone / iPad Safari**: A reliable AirPlay button in the top bar that opens the iOS AirPlay picker (Apple TV, AirPlay 2 speakers, etc.).
- **Android Chrome (phone/tablet)**: A "Cast" button that opens a short tooltip explaining how to cast via Chrome's ⋮ menu → Cast (since Google blocks programmatic cast on mobile web — this is what every major streaming site does).
- **Desktop**: Unchanged. Chromecast on Chrome/Edge and AirPlay on macOS Safari work exactly as today.

### Implementation (Watch.tsx only)

1. **Detect platform once on mount**
   - `isIOS` = iOS/iPadOS Safari (check user agent + `webkitShowPlaybackTargetPicker` on the video element)
   - `isAndroid` = Android user agent
   - `isDesktopCastCapable` = existing `cast_sender.js` SDK loads successfully

2. **iOS AirPlay path (fix reliability)**
   - On iOS, show the AirPlay button **unconditionally** once the video element is mounted (don't wait for the `webkitplaybacktargetavailabilitychanged` event — it's unreliable on iOS and often fires only after the picker opens).
   - Clicking calls `video.webkitShowPlaybackTargetPicker()`. iOS handles "no devices" gracefully with its own UI.
   - Label the button "AirPlay" on iOS instead of "Cast" for clarity.

3. **Android Chrome helper path**
   - Show a "Cast" button that opens a small popover with: "To cast this video, tap Chrome's ⋮ menu and choose **Cast…**". Include a one-line note that mobile browsers don't allow in-page casting.
   - This avoids the current behavior where the button just doesn't appear and users think it's broken.

4. **Keep existing desktop logic**
   - The current `loadCastSdk` + `CastContext` flow stays for desktop Chrome/Edge.
   - The current "Stop casting" toggle stays.

5. **Top bar visibility**
   - Make sure the auto-hide chrome reveals on tap (already does via `onTouchStart`) so the AirPlay/Cast button is reachable on mobile.

### Files changed

- `src/pages/Watch.tsx` — platform detection, iOS AirPlay always-on, Android helper popover, button labeling.

No backend, schema, or other page changes.

### Out of scope (and why)

- **True in-page Chromecast on Android Chrome**: not possible from a website. Would require shipping a native app (Capacitor + native Cast SDK) — you already declined that path.
- **Cast from iOS Chrome / Firefox mobile**: Apple blocks all non-Safari cast/AirPlay APIs on iOS. Nothing a web app can do.

