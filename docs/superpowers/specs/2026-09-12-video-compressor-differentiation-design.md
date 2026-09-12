# Video Compressor Differentiation — Design

**Date:** 2026-09-12
**Branch:** `feature/video-compressor-differentiation`
**Source prompt:** `specs/PROMPT-39-video-compressor-differentiation.md`

## Goal

Close the gap vs. OpenReplay and FreeConvert while keeping ConvertYard's
100% local processing. Focus this round: mobile stability at the current
500 MB cap, drop mobile H.265 completely, replace the static bitrate
lookup with a real calibration pass, make progress reporting frame-based
so the percentage stops jumping, and add a before/after preview frame.

Desktop compression quality is already good and is not being touched.

## Audit findings (Phase 0)

- Tool: `app/(tools)/compress-video/page.tsx` → config `content/tools/compress-video.ts`.
- Dispatcher: `lib/converters/ffmpeg.ts:1201–1352`.
  - iOS: HEVC WebCodecs falls back to H.264 (correct).
  - Android mobile: still attempts HEVC WebCodecs before AVC.
  - libx265 fallback via ffmpeg.wasm is not explicitly blocked on mobile.
- Estimate: static bits-per-pixel lookup in
  `lib/converters/compress-video-webcodecs.ts:271–284`, capped at 70% of
  source bitrate. No real measurement.
- Target-size mode: already implemented as 2-pass VBR with presets
  (10 MB → 500 MB) — extend, do not rebuild.
- Caps:
  - Mobile hard reject at 500 MB (`ffmpeg.ts:1264`).
  - Desktop mediabunny streaming above 2 GB.
  - Worker OPFS streaming threshold: 400 MB iOS / 500 MB Android
    (`compress-video-worker.ts:29`).
- Progress: time-interpolated with 400ms ticks that move 25% of the
  remaining distance per tick. Cause of the 20→90 jumps users see.
- Preview: no pre-compression frame preview. Only post-compression size
  readout in `result-list.tsx`.

## Scope

### In scope
1. Mobile codec hardening — H.264 WebCodecs only on mobile.
2. Mobile stability at the existing 500 MB cap.
3. Calibration-based estimate + frame-based progress.
4. Before/after preview frame (single frame, static).
5. Bitrate floor + unachievable-target warning.

### Out of scope
- Raising the mobile cap above 500 MB.
- iOS native HEVC bridge.
- Audio re-encode fallback for unsupported audio tracks.
- Any changes to the desktop-only paths beyond what's needed for the
  shared calibration + progress refactor.

## Design

### 1. Mobile codec hardening (Phase 1)

**Files:** `lib/converters/ffmpeg.ts`, `lib/converters/compress-video-webcodecs.ts`, `content/tools/compress-video.ts`

- In the dispatcher (`ffmpeg.ts:1201–1352`), add an early branch: when
  `isMobileBrowser()` is true, do not call `tryHardwareHevcCompress()`
  and do not fall through to any libx265 code path. Only
  `tryHardwareAvcCompress()` is allowed; if it fails, surface the error
  rather than falling back to a software HEVC encode.
- In the UI options table (`content/tools/compress-video.ts`), hide the
  HEVC/H.265 selector on mobile builds entirely (do not render as
  disabled — remove).
- Add a short line of copy under the quality/codec control:
  "H.265 on desktop for maximum compression. H.264 on mobile for speed
  and battery life." Present it as an intentional choice.

**Verification:** on a real iPhone and mid-range Android, load a
2–3 minute 1080p clip and confirm the encode uses AVC WebCodecs
end-to-end. Check that thermals stay reasonable and the tab doesn't
reload.

### 2. Mobile stability at 500 MB (extends Phase 1)

**Files:** `lib/converters/ffmpeg.ts`, `lib/converters/compress-video-worker.ts`, `lib/converters/mp4-video-demux.ts`

- Keep the 500 MB hard cap. The goal is to make files up to that cap
  actually succeed, not to raise the ceiling.
- Lower the iOS OPFS streaming threshold from 400 MB to 250 MB so large
  files stream to disk earlier and never sit in MEMFS.
- Add a pre-flight check after demux: if the source container/codec
  combination is unsupported by the mobile AVC path, reject with a
  specific message (e.g. "This file uses an audio codec the mobile
  encoder can't handle — try again on desktop") instead of the generic
  "too large" error.
- On any WebCodecs `error` event during a mobile encode, capture the
  error and re-surface it verbatim in the UI. No silent fallback to a
  software path.

**Verification:** batch of 5 mobile test clips at 300–500 MB, mixed
resolutions and audio codecs, must all either succeed or fail with a
specific, actionable error.

### 3. Calibration pass + frame-based progress (Phase 2)

**Files:** `lib/converters/compress-video-webcodecs.ts`, `lib/converters/compress-video-worker.ts`

- After demux completes and settings are chosen, run a 2-second real
  encode of the first 2 seconds of the source at the selected
  resolution/bitrate/codec inside the worker. This is not thrown away —
  the encoded chunks are kept and reused as the first segment of the
  final output.
- Measure `bytesOut / 2s` → measured bps. Measure `framesEncoded / wallMs`
  → measured fps.
- Replace the static BPP estimate with `(measuredBps × durationSeconds) / 8`
  for the size readout. ETA becomes
  `(totalFrames − calibFrames) / measuredFps`.
- Re-run calibration if the user changes resolution, quality level, or
  codec. Cache by `(resolution, quality, codec)` key so repeated toggles
  don't repeat work.
- Progress reporting switches from 400ms tick interpolation to
  `framesEncoded / totalFrames`. `totalFrames` comes from the demuxer
  (already available). Emit progress on every encoded frame, throttled
  to at most one update every 100ms in the worker → main-thread post.
- The 12–82% band collapses: encode maps linearly across 5–95%. The
  first 5% covers demux + calibration. Final 5% covers mux + writeout.

**Verification:** 5+ clips (talking head, screen recording, high-motion
gaming, mixed) with the calibration estimate landing within 10% of the
final output size. Percentage bar advances smoothly without jumps.

### 4. Before/after preview frame (Phase 4)

**Files:** `components/tool-shell/` (or wherever the compress-video panel
lives), `lib/converters/compress-video-webcodecs.ts`

- On file load, seek the source `<video>` element to `min(0.5s, duration/2)`
  and draw the current frame to a canvas → PNG data URL. This is the
  "before" frame.
- The calibration pass from #3 already produces encoded frames — decode
  the first keyframe of the calibration output and draw it to a canvas.
  This is the "after" frame.
- Render both frames side-by-side at 320px wide max under the quality
  selector, with a small label "Preview at this quality." Static image,
  no autoplay. Re-render on setting change (piggybacks on the
  calibration cache invalidation from #3).

**Verification:** frames render within 1.5s of file load on desktop and
3s on a mid-range Android. No layout shift when they appear (reserve
space).

### 5. Bitrate floor + unachievable-target warning (Phase 5)

**Files:** `lib/converters/compress-video-webcodecs.ts`, target-size
input component

- Bitrate floor formula: `max(computed, 200_000 × (pixels / (854×480)))`.
  This is the minimum bps below which visible blocking is likely.
- Target-size mode: after calibration, compute the bitrate needed to hit
  the requested target size. If it's below the floor, show a warning
  above the compress button: "The smallest we can make this clip
  without visible quality loss is ~XX MB. Compress anyway?" Compute XX
  from the floor bitrate × duration.
- Quality-preset mode: if the preset's computed bitrate falls below the
  floor for the source resolution, silently raise it to the floor. No
  warning needed since the user didn't ask for a specific size.

**Verification:** 3 target-size runs landing within 5% of requested
size. One deliberately unachievable target (e.g. 5 MB on a 10 min 4K
clip) shows the warning with a sensible minimum estimate.

## Order of work

1. Phase 1 (mobile codec hardening) — small, high impact on stability.
   Ship and validate before layering the rest.
2. Phase 2 (mobile stability polish — OPFS threshold, pre-flight,
   specific errors).
3. Phase 3 (calibration + frame-based progress) — largest change,
   affects the shared worker path.
4. Phase 5 (bitrate floor + warning) — depends on calibration output.
5. Phase 4 (preview frame) — cosmetic, cheapest to add last.

Commit per phase, message format
`feat(video-compressor): <summary> (Phase N)`.

## Anti-goals

- No H.265 toggle on mobile — not even hidden behind an "advanced" flag.
- No removing the existing quality-preset mode. Target-size and preset
  modes coexist.
- No inaccurate calibration shipped. If Phase 3 verification fails the
  10% accuracy bar on real clips, do not merge — revert to the static
  table and iterate.
- No raising the mobile cap above 500 MB in this round.
