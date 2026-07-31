# Video to WebP Converter — Design Spec

**Date:** 2026-07-31
**Status:** Approved

## Overview

Add a `video-to-webp` tool to the Video & Audio section. It targets the broader "video to webp" / "convert video to animated webp" search intent, sitting alongside the existing `mp4-to-webp` tool which targets the format-specific "mp4 to webp" query. Both coexist as sibling tools and link to each other.

## What Gets Built

Three additions, zero new converter logic:

1. `content/tools/video-to-webp.ts` — tool config using existing `mp4ToWebp` as `convertFn`
2. `app/(tools)/video-to-webp/page.tsx` — page component (identical structure to `video-to-gif/page.tsx`)
3. Entry in `content/tools.ts` tool registry

## Accepted Formats

- MP4 (video/mp4)
- WebM (video/webm)
- MOV (video/quicktime)
- AVI (video/x-msvideo)
- MKV (video/x-matroska)
- FLV (video/x-flv)

Extensions: `.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`, `.flv`

## Options

Mirrors `mp4-to-webp` exactly:

| Option | Type | Range | Default | Hint |
|---|---|---|---|---|
| Start time (s) | number | 0–600, step 0.1 | 0 | Trim beginning |
| End time (s) | number | 0–600, step 0.1 | 0 | 0 = rest of video |
| Frame rate | slider | 1–30, step 1 | 12 | Lower FPS = smaller file |
| Max dimension (px) | number | 0–1920, step 1 | 640 | Scales longer edge; 0 = original |
| Quality | slider | 1–100, step 1 | 80 | 70–80 is the sweet spot |
| Crop | dropdown | Original / Square 1:1 / Widescreen 16:9 / Classic 4:3 | Original | Center-crops before resize |
| Loop count | number | 0–100, step 1 | 0 | 0 = infinite |

## SEO & Copy

- **Slug:** `video-to-webp`
- **Title tag:** `Video to WebP Converter — ConvertYard`
- **Meta description:** `Convert MP4, MOV, AVI, MKV, FLV, and WebM to animated WebP in your browser. Trim, crop, resize, and set loop count. No uploads.` (~145 chars)
- **H1:** `Video to WebP Converter`
- **Subtitle:** `Convert MP4, MOV, AVI, MKV, FLV, and WebM to animated WebP. Trim, crop, and resize — no uploads.`
- **bestFor:** `Best for product teams and developers embedding short looping animations on websites or in documentation.`

### Limitation note

- **Summary:** `Best for short clips`
- **Body:** `Animated WebP is designed for short, silent loops. Long clips produce very large files that can exceed browser memory limits. Keep clips under 10 seconds for best results.`

### Warning function

Warn if any file exceeds 250 MB: `"Large videos are slow in the browser. For best results, clip short sections and keep files under 250 MB."`

## FAQ Entries (6)

1. **Why use WebP instead of GIF for video clips?** — WebP is typically 25–35% smaller than GIF at equivalent quality and supports full color (not just 256 colors). Use WebP for websites, product docs, and UI demos. Use GIF for platforms that don't yet support WebP (older Slack, GitHub READMEs, some email clients).

2. **When should I use animated WebP instead of MP4?** — Use animated WebP for short, silent loops that behave like images: product UI demos, feature callouts, inline documentation. Use MP4 for longer clips, clips with audio, or anything needing video controls and streaming.

3. **Why is my output file still large?** — Long durations, high frame rates, and large dimensions all inflate animated WebP size quickly. Trim to a shorter moment, lower FPS to 10–12, reduce max dimension, or drop quality slightly.

4. **Can I convert AVI or MKV files, not just MP4?** — Yes. This tool accepts MP4, WebM, MOV, AVI, MKV, and FLV. The output is always animated WebP.

5. **What can go wrong when converting video to animated WebP?** — Audio-only files will fail immediately (no video track). Long clips can exceed browser memory; keep clips under 10 seconds. If output looks washed out, lower quality and check max dimension.

6. **Do my video files leave my device?** — No. Conversion runs entirely in your browser using ffmpeg.wasm. Your files stay on your device — nothing is uploaded.

## Related Tools

- `mp4-to-webp`
- `video-to-gif`
- `gif-to-webp`
- `compress-video`

## Related Articles

- `avif-vs-webp-vs-jpeg-2026`
- `how-browser-based-file-conversion-works`
- `batch-convert-images`

## Implementation Notes

- `convertFn` reuses `mp4ToWebp` from `@/lib/converters/ffmpeg` — the function already uses `file.name.split('.').pop()` for extension detection and handles all 6 target formats
- Page component follows `video-to-gif/page.tsx` pattern: ffmpeg preload banner + `<ToolShell config={config} />`
- `enablePresets: true`
- No new converter function needed
