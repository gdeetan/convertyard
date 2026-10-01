# MP3 to MP4 — Mediabunny speedup (follow-up spec)

**Date:** 2026-10-01
**Status:** Not scheduled. Follow-up to the captions/aspect/trim trio PR.

## Problem

In the trio PR, long MP3 files (30–40 min) take ~15–20 min to encode. Root cause:

- `-c:a copy` MP3→MP4 crashes `@ffmpeg/ffmpeg` 0.12.x on long inputs, even with `-f mp4 -movflags +faststart -fflags +genpts`. The worker dies and all subsequent `exec` calls report "ffmpeg is not loaded." Verified empirically twice.
- `-c:a aac` is single-threaded inside libavcodec, so MT ffmpeg (which already loads correctly) does not speed up audio. Encode runs at roughly real-time.
- Fast path for simple case (black bg / no waveform / no captions) is already on MT ffmpeg; the bottleneck is audio, not video.

## Fix

Bypass ffmpeg.wasm's MP4 muxer. Use the Mediabunny modules already in this repo (`lib/converters/compress-video-mediabunny.ts`) to mux MP3 packets directly into MP4:

1. Demux source MP3 to packets via Mediabunny's MP3 parser (no decode, no re-encode).
2. Encode the trivial video stream (1-fps black lavfi, or a single frame looped) via WebCodecs `VideoEncoder` — hardware accelerated.
3. Mux video + MP3 audio tracks into MP4 via Mediabunny's MP4 writer.
4. Skip ffmpeg entirely on the simple path.

Expected result: 35-min MP3 → MP4 in a few seconds end-to-end (bounded by file I/O, not encode).

Non-MP3 inputs (WAV/OGG/FLAC/AAC) continue to use the current ffmpeg path.

## Captions + Mediabunny interaction

Captions path still runs Whisper transcription locally (unchanged, model-bound). The ASS burn-in currently happens inside ffmpeg's `-filter_complex`. For the Mediabunny path:

- Draw captions per frame via Canvas + `caption-draw.ts` (already in repo).
- Feed those frames into the WebCodecs encoder.
- No `ass=` filter needed.

This also removes the need for ST ffmpeg on the captions path, cutting that cost too.

## Scope

- Modify `lib/converters/ffmpeg.ts` `mp3ToMp4` to delegate to a new `lib/converters/mp3-to-mp4-mediabunny.ts` when input is MP3.
- New module reuses existing WebCodecs + Mediabunny helpers.
- Fall back to the current ffmpeg path if Mediabunny or WebCodecs is unavailable (older Safari).

## Risks

- WebCodecs availability varies (Safari 16.4+, Chrome 94+, Firefox 130+). Need capability detection + fallback.
- Mediabunny MP4 writer must correctly set track timing from MP3 packet boundaries. Edge cases: VBR MP3, ID3 tags at head, non-standard sample rates.
- Keeping two code paths (Mediabunny for MP3, ffmpeg for others) doubles the test matrix.

## Estimate

Half-day of focused work for someone familiar with the existing Mediabunny modules.
