# Compress Video — replace ffmpeg mux tail with mp4-muxer

**Date:** 2026-08-27
**Tool:** `/compress-video`
**Goal:** Remove the ffmpeg.wasm mux step at the end of every hardware WebCodecs encode. Cuts 15–40 s off large-file compression and unblocks removing the 120 MB fast-path size cap in a follow-up PR.

## Problem

The current hardware path in `lib/converters/compress-video-webcodecs.ts` decodes and encodes via WebCodecs (fast, GPU-backed) but ends with `muxAvcAnnexB` / `muxHevcAnnexB`, which:

1. Load the ~25 MB ffmpeg.wasm core (network on cold cache, memory instantiation always).
2. `writeFile` the entire source file into ffmpeg's virtual FS.
3. Run `ffmpeg.exec` to mux the annex-B video stream with the source audio into MP4.

On a 200 MB 4K → 1080p HEVC compress, this tail alone is 15–40 s and dominates wall time. It exists mainly to copy the source audio track and add `+faststart`.

## Scope

**In scope**
- Hardware WebCodecs paths for AVC and HEVC (`tryEncodeAvcViaVideoDecoder`, `tryEncodeHevcViaVideoDecoder`).
- MP4 and MOV source containers with AAC audio (or no audio / stripped audio).

**Out of scope**
- Wasm fallback (`libx264` / `libx265`) — unchanged.
- Playback path fallback (`<video>` + `requestVideoFrameCallback`) — unchanged; still uses ffmpeg mux.
- Non-MP4/MOV containers (WebM, MKV, AVI) — fast path already returns `null` for these; unchanged.
- Non-AAC audio codecs (Opus, MP3, AC-3) — fast path will return `null` when keep-audio is requested; caller falls back.
- fps detection (tracked separately as improvement #5).
- Worker/OffscreenCanvas migration (improvement #4, separate PR).

## Architecture

Two new modules, one modification, one new npm dep (`mp4-muxer`).

### New: `lib/converters/mp4-audio-demux.ts`

Extend the pattern in `mp4-video-demux.ts` to extract the audio track. Reuses the same custom MP4 box parser (no mp4box.js added).

```ts
export type DemuxedAudio = {
  codecString: string          // e.g. 'mp4a.40.2'
  sampleRate: number
  numberOfChannels: number
  description: Uint8Array      // AudioSpecificConfig / esds payload
  samples: Array<{
    data: Uint8Array
    timestampUs: number
    durationUs: number
  }>
}

export function demuxMp4Audio(data: Uint8Array): DemuxedAudio | null
export async function demuxMp4AudioFile(file: File): Promise<DemuxedAudio | null>
```

Returns `null` when:
- Container has no audio track.
- Audio codec is not AAC.
- Parse fails (malformed / truncated).

### New: `lib/converters/mp4-mux.ts`

Thin wrapper over `mp4-muxer` (target `~15 KB min+gz`). Streaming API — the encode loop pushes chunks as they arrive.

```ts
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export type MuxerHandle = {
  addVideoChunk(chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata): void
  addAudioChunk(chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata): void
  finalize(): Uint8Array
}

export function createAvcMuxer(opts: {
  width: number
  height: number
  hasAudio: boolean
  audio?: { codec: 'aac'; sampleRate: number; numberOfChannels: number; description: Uint8Array }
}): MuxerHandle

export function createHevcMuxer(opts: {
  width: number
  height: number
  hasAudio: boolean
  audio?: { codec: 'aac'; sampleRate: number; numberOfChannels: number; description: Uint8Array }
}): MuxerHandle
```

Both configure:
- `fastStart: 'in-memory'` (moov at front — same effect as `-movflags +faststart`).
- Video codec: `'avc'` or `'hevc'`.
- For HEVC: emit `hvc1` box tag (mp4-muxer default). QuickTime/Safari require this.

### Modified: `lib/converters/compress-video-webcodecs.ts`

**Keep** `muxAvcAnnexB` and `muxHevcAnnexB` — the playback path still calls them for non-MP4 sources. **Only the VideoDecoder fast path bypasses them.** Inside the fast path, delete the Annex-B chunk accumulation (`const chunks: Uint8Array[] = []` + `concatBytes`) — chunks now stream to the muxer inline.

**Change `tryEncodeAvcViaVideoDecoder` and `tryEncodeHevcViaVideoDecoder`:**

1. After picking encoder config, before the encode loop:
   - If `opts.stripAudio !== true`, call `demuxMp4AudioFile(file)`.
   - If it returns `null`, return `null` from the whole function (caller falls back to playback path).
   - If it returns audio, keep it in scope.
2. Create muxer via `createAvcMuxer` / `createHevcMuxer`.
3. Encoder `output` callback → `muxer.addVideoChunk(chunk, meta)` directly.
4. After `encoder.flush()`, iterate the demuxed audio samples and `addAudioChunk`.
   - Wrap each as `new EncodedAudioChunk({ type: 'key', timestamp, duration, data })` (AAC frames are all keyframes).
5. `finalize()` → `Uint8Array` → wrap in `File` and return.
6. Remove the `muxAvcAnnexB(file, ...)` / `muxHevcAnnexB(file, ...)` calls from the fast path (the functions themselves stay, still used by the playback path).

The encoder `output` callback needs access to `EncodedVideoChunkMetadata` (contains the `decoderConfig` with `description` — SPS/PPS bytes) so mp4-muxer can build the `avcC` / `hvcC` sample entry. Change the callback signature from `(chunk) => {...}` to `(chunk, meta) => {...}`.

**Playback path (`tryCompressVideoAvcHardware` / `tryCompressVideoHevcHardware`) — unchanged.** It continues to call `muxAvcAnnexB` / `muxHevcAnnexB` for non-MP4 sources and audio-codec-mismatch cases.

### Modified: `lib/converters/ffmpeg.ts` — `compressVideo`

In the "hardware output larger than source" branch (currently calls `remuxToMp4`), change to **return the source file unchanged** for MP4 inputs. Rationale: the source is already MP4 and the browser already parses it (we just decoded it). Skipping the ffmpeg remux is the whole point.

```ts
if (hwFile.size < file.size) return hwFile
// Hardware ran but did not shrink — return source unchanged rather than
// spinning up ffmpeg-wasm just to remux.
return file
```

Apply to both AVC and HEVC branches.

## Data flow (new, MP4-in / MP4-out, keep audio)

```
File
 ├─ demuxMp4VideoFile ─→ video samples ─→ VideoDecoder ─→ VideoFrame ─→ scale ─→ VideoEncoder ─→ EncodedVideoChunk ─┐
 └─ demuxMp4AudioFile ─→ audio samples ────────────────────────────────────────→ EncodedAudioChunk ─────────────────┤
                                                                                                                     ↓
                                                                                              mp4-muxer.addVideoChunk / addAudioChunk
                                                                                                                     ↓
                                                                                                        muxer.finalize() → Uint8Array
                                                                                                                     ↓
                                                                                                          new File([...], 'name.mp4')
```

## Fallback matrix

| Input container | Keep audio | Audio codec | Path |
|---|---|---|---|
| MP4 / MOV | strip | — | **new mp4-muxer path** |
| MP4 / MOV | keep | AAC | **new mp4-muxer path** |
| MP4 / MOV | keep | non-AAC | fast path returns `null` → playback path + ffmpeg mux (unchanged) |
| MP4 / MOV | keep | audio demux fails | fast path returns `null` → playback path + ffmpeg mux (unchanged) |
| WebM / MKV / AVI | any | any | fast path already returns `null` (custom demuxer is MP4-only) → playback path + ffmpeg mux (unchanged) |
| Hardware output ≥ source size | any | any | **return source file unchanged** (was: ffmpeg remux) |

## Error handling

- `mp4-muxer` throw during `addVideoChunk` / `addAudioChunk` / `finalize` → catch, return `null` from the fast path. Caller falls back to the playback path.
- `demuxMp4AudioFile` returns `null` when keep-audio requested → return `null` from the fast path (do not silently strip audio).
- Video decode error / encode error → existing behavior (throw → outer `try` in caller returns `null` → playback fallback fires). No change.
- Encoder metadata missing `decoderConfig.description` on first keyframe → mp4-muxer will throw. Wrap the first `addVideoChunk` in a try/catch and return `null` if it fires.

## Testing

Extend `lib/converters/__tests__/compress-video-webcodecs.test.ts`:

1. **AVC + strip audio, MP4 input.** Output is a valid MP4 (parse with the existing demuxer round-trip). Assert `getCompressVideoFFmpeg` is not called.
2. **AVC + keep audio, MP4 + AAC.** Output has one video track and one audio track. Duration within ±100 ms of source. `getCompressVideoFFmpeg` not called.
3. **HEVC + keep audio, MP4 + AAC.** Output tagged `hvc1` (inspect first 512 bytes for `hvc1` sample entry).
4. **MP4 + non-AAC audio (Opus), keep audio.** `tryEncodeAvcViaVideoDecoder` returns `null` without calling the muxer.
5. **Hardware output ≥ source size.** `compressVideo` returns the source `File` unchanged, no ffmpeg loaded.
6. **Existing playback-path tests.** Unchanged — still exercise `muxAvcAnnexB` / `muxHevcAnnexB` for non-MP4 inputs.

Spy strategy for ffmpeg-not-called assertions: `vi.mock('../ffmpeg-client')` and assert `getCompressVideoFFmpeg` mock was never invoked.

Test fixtures needed: small MP4 with AAC audio, small MP4 with Opus audio. Both under 100 KB — use ffmpeg to generate once and commit under `lib/converters/__tests__/fixtures/`.

## Expected impact

Measured on `test/fixtures/sample-1080p-30s.mp4` (200 MB, H.264 + AAC, target: HEVC 1080p, keep audio):

- Before: WebCodecs encode ≈8 s + ffmpeg mux tail ≈22 s (with core already cached; ≈35 s cold) = 30 s warm / 43 s cold.
- After: WebCodecs encode ≈8 s + mp4-muxer finalize ≈0.4 s = 8.4 s.

~4× warm, ~5× cold. Cold-cache users (first visit) get the largest win because the 25 MB core download disappears from the critical path.

Follow-up PRs unblocked:
- Remove the 120 MB `if (file.size > 120 * 1024 * 1024) return null` fast-path cap.
- Move fast path into a Worker (no main-thread ffmpeg dependency).

## Dependency

Add to `package.json`:

```json
"dependencies": {
  "mp4-muxer": "^5.2.0"
}
```

Bundle impact: ~15 KB min+gz, loaded only on `/compress-video` via the existing dynamic-import boundary in `compress-video-webcodecs.ts` (imports are already deferred). Verify with `npm run build` bundle report.

## Rollout

- Feature is transparent to users: no UI change, no option change.
- If muxer bugs surface, the fast-path `return null` triggers the existing playback fallback — worst case is regression to pre-PR speed for the affected input. No broken outputs shipped to users.
- No feature flag needed.
