# MP3 to MP4 — Captions, Aspect Ratios, Trim (Design)

**Date:** 2026-10-01
**Tool:** `/mp3-to-mp4`
**Goal:** Close feature gaps vs FreeConvert, OnlineConverter, Happyscribe and establish a local-first captions moat.

## 1. Scope

Three features, one PR:

1. **Auto captions** — English only (whisper-tiny.en, ~40MB), off by default, fixed styling, burned into video.
2. **Aspect-ratio presets** — 16:9, 9:16, 1:1, 4:5.
3. **Trim** — start/end time inputs, applied to every file in a batch.

Explicitly out of scope: SRT upload, caption editor, multilingual Whisper, waveform scrubber, per-file trim, user-controlled caption styling, user-controlled image-fit mode.

## 2. UI (`content/tools/mp3-to-mp4.ts`)

New entries appended to `options`:

| name | type | choices / default | notes |
|---|---|---|---|
| `aspect` | radio | `16:9` (default), `9:16`, `1:1`, `4:5` | New |
| `resolution` | radio | `720p`, `1080p` (existing) | Dimensions resolved against `aspect` |
| `trimStart` | time | `hh:mm:ss`, default `00:00:00` | New input type; validate monotonic |
| `trimEnd` | time | `hh:mm:ss`, default `00:00:00` | `00:00:00` = until end of file |
| `captions` | toggle | off (default) | Toggling on shows the one-time-download notice |

Rules:

- When `bgType=image` AND the image's intrinsic aspect ratio ≠ selected `aspect`: blur-fill backdrop is used automatically (no user control).
- When `captions=on` AND `waveform ≠ none`: waveform rendered at top of frame, captions at bottom. Otherwise waveform centers as today.
- When `captions=on` for the first time: inline notice under the toggle — *"Captions download a one-time ~40 MB English speech model to your browser. Nothing is uploaded."*

Copy updates:

- `subtitle` → *"Wrap audio in an MP4 with captions, album art, or waveform. Ready for YouTube, Shorts, Reels, TikTok. Stays in your browser."*
- `bestFor` → add short-form video (Shorts/Reels/TikTok) alongside existing use cases.
- `meta.description` → *"Turn MP3 into MP4 with auto captions, trim, and aspect ratios for YouTube, Shorts, Reels, TikTok. Batch convert in your browser — files never leave your device."*

FAQ additions (append):

- *Can I add captions to my MP3?* — Yes, English, local Whisper, ~40 MB one-time download, nothing uploaded.
- *How accurate are the captions?* — Strong for clear speech; weaker with heavy accents, music, overlapping speakers. Review before publishing.
- *Which aspect ratios does this support?* — 16:9 (YouTube), 9:16 (Shorts/Reels/TikTok), 1:1 and 4:5 (Instagram).
- *Can I trim the audio before converting?* — Yes, set start/end in hh:mm:ss. Applies to every file in the batch.

## 3. Converter (`lib/converters/ffmpeg.ts` — `mp3ToMp4`)

### 3.1 Dimension resolver

Pure function `resolveDimensions(aspect, resolution) → { w, h }`. All outputs even integers.

| aspect | 720p | 1080p |
|---|---|---|
| 16:9 | 1280×720 | 1920×1080 |
| 9:16 | 720×1280 | 1080×1920 |
| 1:1  | 720×720  | 1080×1080 |
| 4:5  | 864×1080 | 1296×1620 |

### 3.2 Trim

Prepend `-ss <trimStart> -to <trimEnd>` to the audio input args. If `trimEnd === "00:00:00"`, omit `-to`. If `trimStart === "00:00:00"`, omit `-ss`. Validation (`trimEnd > trimStart` when both set) happens in the UI schema layer; converter trusts validated input.

### 3.3 Background with aspect fit

- `bgType=black` → `color=black:s=WxH`.
- `bgType=color` → `color=<hex>:s=WxH`.
- `bgType=image`: build two streams from the image —
  - **Blur backdrop:** `scale=W:H:force_original_aspect_ratio=increase,crop=W:H,boxblur=20:5`
  - **Foreground:** `scale=W:H:force_original_aspect_ratio=decrease`
  - Overlay foreground centered on backdrop.

### 3.4 Captions

Reuse existing pipeline — no new modules:

1. `audio-decode.ts` → `decodeAudioViaWebAudio()` on the input blob.
2. `caption-transcribe.ts` → `loadTranscriptionModel('tiny.en')` + `transcribeAudio()`.
3. `caption-ass-builder.ts` → ASS file. Fixed style: white fill, black outline (3px at 1080p, scaled), bottom-center alignment, auto font size (~5% of frame height), 90% max line width.
4. `caption-file.ts` → `materializeCaptionFile()` writes `.ass` into the ffmpeg FS.
5. ffmpeg video filter chain adds `ass=<path>` as the final step before encode.

For batch: model loaded once per session, reused across files.

### 3.5 Waveform position

When captions on, pass top-anchored y offset to the existing `showwaves` filter. When captions off, behavior unchanged.

### 3.6 Progress

Reuse `CaptionTranscribeProgress`. Three phases surfaced to ToolShell when captions on: `model` → `transcribe` → `encode`. When captions off: single `encode` phase (today's behavior).

## 4. First-use flow for Whisper

- Page's existing `useEffect` continues to preload ffmpeg only.
- When user toggles captions on and clicks Convert: converter calls `loadTranscriptionModel('tiny.en')` before transcribing the first file. Progress surfaced via existing engine-ready banner, extended with a captions sub-step line.
- Caching handled by `@huggingface/transformers` defaults (IndexedDB/Cache API).

## 5. Files touched

- `content/tools/mp3-to-mp4.ts` — options, FAQ, copy, meta.
- `lib/converters/ffmpeg.ts` — `mp3ToMp4` rewrite with dimension resolver, trim, aspect fit, caption integration, waveform positioning.
- `app/(tools)/mp3-to-mp4/page.tsx` — captions-aware preload banner wording.
- `components/tool-shell/*` — add `time` input type if not already present (confirm during impl). Add `toggle` if missing.
- `app/(tools)/mp3-to-mp4/opengraph-image.tsx` — refresh OG text if subtitle change affects it.

No new npm dependencies.

## 6. Testing

**Unit:**
- `resolveDimensions` for all 8 aspect×resolution combos, all even.
- Trim arg builder: both zero, start only, end only, both set.

**Manual integration (CLAUDE.md 1/10/100/1000 rule):**
- 1 MP3, defaults → output identical to current baseline.
- 1 MP3, 9:16, image background → blur-fill backdrop with centered contained image.
- 1 MP3, captions + bar waveform → waveform top, captions bottom, no overlap at 720p and 1080p.
- 1 MP3, trim `00:00:10` → `00:01:00` → output duration 50s.
- 10 MP3s, captions on → model loads once, reused; progress phases visible.
- 100 short MP3s, 1:1 → batch completes, ZIP intact.
- 1000 very short MP3s, defaults → batch completes.

**Browser:** `npm run dev`, visually confirm each aspect, confirm captions render for a sample podcast clip, confirm no layout shift on tool page.

## 7. SEO / content follow-ups (not part of this PR)

- Comparison table article: ConvertYard vs FreeConvert vs Happyscribe (privacy, caption cost, batch, upload limit).
- Platform-specific H2s on the tool page in a later copy pass: "MP3 to MP4 for YouTube Shorts", "...for Instagram Reels", "...for Spotify video podcast".

## 8. Risks

- **Whisper perf on long audio.** tiny.en on 1-hour podcast: ~2–5 min on mid-range laptop. Add a soft warning when captions on and any file >30 min (reuse existing `warningFn` pattern).
- **ASS filter + overlay chain complexity.** The combined filter graph (background → waveform overlay → caption burn) is the riskiest construction. Mitigate: build the filter string with a small helper + log it during dev.
- **Blur backdrop quality at low resolution.** 720p blur-fill may look muddy. Acceptable at 1080p; document the recommendation to use 1080p for 9:16/1:1/4:5.
