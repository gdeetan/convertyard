# Audio Trimmer Tool — Design Spec

**Date:** 2026-07-16
**Status:** Approved

## Context

Audio Trimmer is the last remaining "coming soon" Phase 1 tool. The tool-catalog entry exists with `status: 'coming-soon'`. It closes the final footer credibility gap in the video-audio cluster.

## Architecture

Standard ConvertYard tool pattern — 4 files:

| File | Role |
|------|------|
| `/lib/converters/ffmpeg.ts` | Add `trimAudio()` converter function |
| `/content/tools/audio-trimmer.ts` | Tool config: accepts, options, FAQ, meta |
| `/app/(tools)/audio-trimmer/page.tsx` | Page component: ffmpeg preload banner + ToolShell |
| `/content/tool-catalog.ts` | Change `status: 'coming-soon'` → `'live'` |

## Inputs

**Audio:** MP3, M4A, WAV, OGG, FLAC, AAC
**Video:** MP4, MOV, WebM, AVI, MKV, WMV, TS (audio track extracted and trimmed)

MIME types:
```
audio/mpeg, audio/mp4, audio/wav, audio/ogg, audio/flac, audio/aac,
audio/x-m4a, audio/x-wav,
video/mp4, video/quicktime, video/webm, video/x-msvideo,
video/x-matroska, video/x-ms-wmv, video/mp2t
```

Extensions: `.mp3 .m4a .wav .ogg .flac .aac .mp4 .mov .webm .avi .mkv .wmv .ts`

## Options Panel

Three options in this order:

1. **Start time** (`number`, name: `startTime`, default: `0`, min: `0`)
   - Label: "Start time (seconds)"
   - Hint: "0 = beginning of file."

2. **End time** (`number`, name: `endTime`, default: `0`, min: `0`)
   - Label: "End time (seconds)"
   - Hint: "0 = end of file. Set to trim from start only."

3. **Output format** (`dropdown`, name: `format`, default: `'keep'`)
   - Choices: keep (Keep original format) · mp3 · aac · wav · ogg · flac
   - Hint: "Keep original re-encodes for video inputs (outputs MP3). Choose a format to convert while trimming."

## Converter Function

`trimAudio(files, options, onProgress)` in `/lib/converters/ffmpeg.ts`.

### Two execution paths

**Path A — stream copy** (audio input + format === 'keep'):
- `file.type.startsWith('audio/')` AND `format === 'keep'`
- Args: `['-ss', startTime, '-to', endTime, '-i', input, '-c', 'copy', output]`
- Omit `-ss` if startTime === 0; omit `-to` if endTime === 0
- Output extension: same as input
- Fast, lossless. May have ±0.5s imprecision on MP3 (frame-boundary limitation).

**Path B — re-encode** (everything else):
- Video inputs (always), or audio input with specific format selected, or audio + 'keep' → defaults to MP3
- Format map (reuse same values as `extractAudio`):

| format | codec | ext | mime | lossless |
|---|---|---|---|---|
| `keep` (video input) | `libmp3lame` | `.mp3` | `audio/mpeg` | false |
| `mp3` | `libmp3lame` | `.mp3` | `audio/mpeg` | false |
| `aac` | `aac` | `.m4a` | `audio/mp4` | false |
| `wav` | `pcm_s16le` | `.wav` | `audio/wav` | true |
| `ogg` | `libvorbis` | `.ogg` | `audio/ogg` | false |
| `flac` | `flac` | `.flac` | `audio/flac` | true |

- Args (lossy): `['-ss', startTime, '-to', endTime, '-i', input, '-map', 'a', '-vn', '-codec:a', codec, '-b:a', '192k', '-ar', '44100', output]`
- Args (lossless): `['-ss', startTime, '-to', endTime, '-i', input, '-map', 'a', '-vn', '-codec:a', codec, '-ar', '44100', output]`
- Omit `-ss` if startTime === 0; omit `-to` if endTime === 0

### Output filename
`{basename}-trimmed.{ext}`

### Error handling
Catch ffmpeg errors with an `explainTrimAudioError` helper (same pattern as `explainExtractAudioError`):
- `'Output file #0 does not contain any stream'` → `'This file has no audio track.'`
- `'ErrnoError: FS error'` → same message

Use `toError()` wrapper in the catch block: `results.push(explainTrimAudioError(toError(err)))`

### Progress
Same `ffmpeg.on('progress', handler)` / `ffmpeg.off` pattern with 5% → 10% → 10–95% → 100%.

## Page Component

Identical structure to `extract-audio/page.tsx`:
- `useEffect` preloads ffmpeg on mount
- Loading banner: "Preparing audio trimmer… (downloading ~25 MB, one-time)"
- Renders `<ToolShell config={config} />`

## SEO / Meta

- **Title:** `Audio Trimmer — ConvertYard`
- **H1 (tool title):** `Audio Trimmer`
- **Subtitle:** `Local-first audio trimming. No uploads, no re-encoding for lossless cuts.`
- **Meta description:** `Trim MP3, WAV, M4A, OGG, and FLAC in your browser. Set start and end times, batch trim up to 1,000 files — no uploads, no quality loss on lossless cuts.`
- **FAQ:** 6 entries covering: no-upload, batch, stream copy precision, video input support, output format choices, "0 = end of file" clarification
- **Related tools:** `extract-audio`, `mp4-to-mp3`, `compress-video`, `mp3-to-mp4`

## Verification

1. Drop an MP3, set start=10 end=30 → output is `filename-trimmed.mp3`, ~20s long
2. Drop same MP3, format=WAV → output is `filename-trimmed.wav`
3. Drop an MP4 video, format=keep → output is `filename-trimmed.mp3` (video re-encodes to MP3)
4. Drop a WAV, start=0 end=0 → full file copied (no trim applied)
5. Batch of 3 audio files, same start/end → ZIP with 3 trimmed files
6. Drop a video-only MP4 (no audio) → clear error message per file
7. Check tool-catalog entry is `'live'` and tool appears in cluster listing
