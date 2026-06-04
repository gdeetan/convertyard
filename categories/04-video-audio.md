# Cluster 04 — Video & Audio

## Seed keyword

**Primary seed:** `video converter`

Hub page targets this. Specific tools target individual format
conversions and operations.

**Why this seed:** Largest category-level term. Audio is a smaller
sub-cluster that can be served from the same hub.

**Alternate seed:** `online video converter` — slightly different
intent, often higher commercial competition. Stick with `video
converter` and let the long-tail capture the rest.

## Secondary anchor keywords

- `mp4 to mp3` (~250K vol, KD ~55)
- `video to gif` (~80K vol, KD ~50)
- `video compressor` (~60K vol, KD ~50)
- `mp3 converter` (~100K vol, KD ~55)
- `wav to mp3` (~30K vol, KD ~45)

## Cluster priority

**#4** — Build after PDF. Smaller volume than images/PDF but high
commercial intent. ffmpeg.wasm is large (~30MB) which affects page
weight — design loading states carefully.

## Cluster traffic estimate at maturity

**8,000–12,000 monthly visits**

Smaller than image/PDF clusters because:
- ffmpeg.wasm is heavier (slower first load)
- Browser-based video processing is realistically limited to small
  files (<500MB) due to memory constraints
- YouTube/social downloaders (which we won't build — legal risk) own
  much of the video keyword volume

## Tools to build (8)

| Tool | Slug | Target keyword | Est. volume | KD |
|---|---|---|---|---|
| MP4 to MP3 | mp4-to-mp3 | mp4 to mp3 | 250K | 55 |
| Video compressor | video-compressor | video compressor | 60K | 50 |
| Video to GIF | video-to-gif | video to gif | 80K | 50 |
| Video trimmer | trim-video | trim video online | 30K | 45 |
| Audio trimmer | trim-audio | trim audio | 10K | 35 |
| Extract audio from video | extract-audio | extract audio from video | 40K | 45 |
| MP3 to WAV | mp3-to-wav | mp3 to wav | 30K | 45 |
| WAV to MP3 | wav-to-mp3 | wav to mp3 | 30K | 45 |

## Build order

1. MP4 to MP3 (highest single keyword in cluster)
2. Video compressor (clearest batch use case)
3. Extract audio from video
4. Video to GIF
5. Video trimmer
6. WAV to MP3
7. MP3 to WAV
8. Audio trimmer

## Supporting articles (6)

| Article | Target long-tail | Est. vol | KD |
|---|---|---|---|
| Compress video for email without losing quality | "compress video for email" | 5K | 35 |
| Best video formats for web in 2026 | "best video format for web" | 2K | 30 |
| How to make a GIF from a video clip | "make gif from video" | 8K | 40 |
| Audio bitrate explained | "audio bitrate" | 3K | 30 |
| How to extract audio from any video | "extract audio from mp4" | 6K | 35 |
| Browser-based video editing in 2026 | "browser video editor" | 2K | 25 |

## Internal linking strategy

- MP4-to-MP3 and Extract Audio link to each other (overlapping intent)
- Video Compressor links to Video Trimmer (often used together)
- All audio tools link to each other
- Cluster hub `/video-converter` aggregates all 8

## Wedge-specific notes

- **Heavy WASM load.** ffmpeg.wasm is ~30MB. Lazy-load on first
  interaction. Show clear "preparing converter" state. Cache aggressively.
- **File size limits matter.** Browsers limit memory to roughly
  2–4GB. Realistically limit uploads to 500MB–1GB and surface this
  early in the UI so users don't waste 20 minutes uploading a 5GB
  file that fails.
- **Batch matters less here than in images.** People convert one or
  a few videos at a time, not 100. Still build batch UX for consistency
  but don't overweight it in messaging.
- **Avoid YouTube/social downloaders.** Massive legal liability, would
  get the domain banned from ad networks and search. Not worth it.

## SERP context

- MP4 to MP3 dominated by Convertio, Online-Convert, FreeConvert
- Many SERPs polluted by sketchy ad-laden tools — clean UI alone
  differentiates significantly
- Video compressor SERPs are softer than image compressor SERPs

## Watch list

- WebCodecs API stability — when widely supported, opens up
  hardware-accelerated video processing in-browser (currently
  Chrome/Edge only, Safari partial)
- ffmpeg.wasm new releases — newer builds shrink the binary size
