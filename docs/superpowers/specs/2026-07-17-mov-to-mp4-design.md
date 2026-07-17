# MOV to MP4 Converter — Design Spec
**Date:** 2026-07-17

## Overview

Add a `mov-to-mp4` tool that converts QuickTime MOV files to H.264 MP4 entirely in the browser via ffmpeg.wasm. Follows the existing ToolConfig pattern exactly.

## Files

| File | Action |
|---|---|
| `lib/converters/ffmpeg.ts` | Add `movToMp4()` function |
| `content/tools/mov-to-mp4.ts` | New tool config |
| `app/(tools)/mov-to-mp4/page.tsx` | New page (one-liner) |

## ffmpeg Command

```
ffmpeg -i input.mov -c:v libx264 -c:a aac -movflags faststart -crf <N> output.mp4
```

- `-c:v libx264` — H.264 video, widest compatibility
- `-c:a aac` — AAC audio, works everywhere
- `-movflags faststart` — moves moov atom to front for streaming
- `-crf` — quality: 18 (Best), 23 (Better, default), 28 (Good)

iPhone MOV files shot in HEVC (H.265) mode will re-encode to H.264. Output may be slightly larger than the input — this is expected.

## Tool Options

| Option | Type | Choices | Default |
|---|---|---|---|
| quality | dropdown | Good (CRF 28) / Better (CRF 23) / Best (CRF 18) | Better |

## Tool Config

- **slug:** `mov-to-mp4`
- **title:** MOV to MP4 Converter
- **subtitle:** Convert MOV to MP4. Batch-ready, stays in your browser.
- **accepts:** `video/quicktime`, `.mov`
- **outputExt:** `.mp4`
- **category:** `video-audio`
- **relatedTools:** compress-video, mp4-to-mp3, video-to-gif, extract-audio

## FAQ Entries (6)

1. Why convert MOV to MP4? — compatibility: MOV is Apple-native, MP4 plays everywhere
2. Will it work with iPhone videos? — yes; HEVC MOV re-encodes to H.264 (file may be slightly larger)
3. What does the quality setting do? — CRF tradeoff: lower = better quality, larger file
4. Can I convert multiple files at once? — yes, batch via ffmpeg.wasm, one MP4 per MOV, ZIP download
5. Are my files uploaded? — never; runs entirely in browser
6. Is there a file size limit? — no hard limit; large files (500MB+) need available RAM

## Non-Goals

- No audio-only stripping (that's `extract-audio`)
- No resolution scaling (that's `compress-video`)
- No subtitle embedding
