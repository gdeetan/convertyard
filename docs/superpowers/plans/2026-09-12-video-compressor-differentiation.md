# Video Compressor Differentiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match FreeConvert/OpenReplay feature set while keeping 100% local processing — harden mobile stability at the existing 500 MB cap, drop mobile H.265, replace static bitrate estimate with real calibration, make progress frame-based, add a before/after preview frame.

**Architecture:** All work stays inside `lib/converters/` (worker + main thread) and `content/tools/compress-video.ts`. No new files for phases 1, 2, 5 — extend existing dispatcher. Phase 3 adds a `compress-video-calibration.ts` module shared by main + worker. Phase 4 adds a small `CompressVideoPreview` component under the tool shell area.

**Tech Stack:** Next.js App Router (static export), TypeScript, WebCodecs (VideoDecoder/VideoEncoder), ffmpeg.wasm (desktop-only after this change on mobile), mediabunny streaming (desktop > 2 GB path), Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-09-12-video-compressor-differentiation-design.md`

**Branch:** `feature/video-compressor-differentiation`

---

## File Map

**Modify:**
- `lib/converters/ffmpeg.ts` — dispatcher hard-gate for mobile HEVC (Phase 1); OPFS threshold + pre-flight error surface (Phase 2); wire calibration output into orchestrator (Phase 3).
- `lib/converters/compress-video-webcodecs.ts` — remove HEVC path when mobile (Phase 1); expose calibration hooks (Phase 3); bitrate floor consumer (Phase 5).
- `lib/converters/compress-video-worker.ts` — frame-based progress emitter, calibration segment reuse (Phase 3); throw specific errors instead of silent fallback (Phase 2).
- `lib/converters/mp4-video-demux.ts` — expose `totalFrames` if not already surfaced (Phase 3).
- `content/tools/compress-video.ts` — hide HEVC option on mobile, add codec-strategy copy (Phase 1); target-size warning copy (Phase 5).
- `components/tool-shell/*` (locate exact preview mount point during Phase 4) — before/after preview frame.

**Create:**
- `lib/converters/compress-video-calibration.ts` — pure helpers for bitrate extrapolation, ETA, target-size solve, floor calc. (Phase 3 + 5.)
- `lib/converters/__tests__/compress-video-calibration.test.ts` — unit tests for the pure helpers.
- `components/tool-shell/CompressVideoPreview.tsx` — before/after frame component (Phase 4).

**Do not touch:**
- Desktop-only mediabunny streaming path (`compress-video-mediabunny.ts`) — spec scope is mobile stability + shared calibration. Desktop quality is already good.
- MP4 muxer, ffmpeg.wasm build config, ToolShell core.

---

## Phase 1 — Mobile Codec Hardening

### Task 1.1: Add mobile-guard helper

**Files:**
- Modify: `lib/converters/compress-video-webcodecs.ts` (near `isMobileBrowser` at line 210)

- [ ] **Step 1: Write the failing test**

Create `lib/converters/__tests__/compress-video-mobile-codec.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('mobile codec gating', () => {
  const originalUA = globalThis.navigator?.userAgent
  const setUA = (ua: string) => {
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: ua, configurable: true })
  }
  afterEach(() => { if (originalUA) setUA(originalUA) })

  it('mobileAllowsHevc returns false on iOS', async () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    const { mobileAllowsHevc } = await import('../compress-video-webcodecs')
    expect(mobileAllowsHevc()).toBe(false)
  })

  it('mobileAllowsHevc returns false on Android', async () => {
    setUA('Mozilla/5.0 (Linux; Android 13; Pixel 7)')
    const { mobileAllowsHevc } = await import('../compress-video-webcodecs')
    expect(mobileAllowsHevc()).toBe(false)
  })

  it('mobileAllowsHevc returns true on desktop Chrome', async () => {
    setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120')
    const { mobileAllowsHevc } = await import('../compress-video-webcodecs')
    expect(mobileAllowsHevc()).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/converters/__tests__/compress-video-mobile-codec.test.ts`
Expected: FAIL — `mobileAllowsHevc is not a function`.

- [ ] **Step 3: Implement `mobileAllowsHevc`**

In `lib/converters/compress-video-webcodecs.ts`, immediately after the `isMobileBrowser` definition (around line 215):

```ts
export function mobileAllowsHevc(): boolean {
  return !isMobileBrowser()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/converters/__tests__/compress-video-mobile-codec.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/compress-video-webcodecs.ts lib/converters/__tests__/compress-video-mobile-codec.test.ts
git commit -m "feat(video-compressor): add mobileAllowsHevc guard (Phase 1)"
```

### Task 1.2: Gate HEVC dispatch in ffmpeg.ts

**Files:**
- Modify: `lib/converters/ffmpeg.ts:1201–1352`

- [ ] **Step 1: Read the current dispatcher block**

Read `lib/converters/ffmpeg.ts:1201–1352` to locate the HEVC call path. Note: `tryHardwareHevcCompress()` is invoked around line 1309–1330.

- [ ] **Step 2: Add early return before HEVC attempt**

Before the block that calls `tryHardwareHevcCompress()`, insert:

```ts
if (!mobileAllowsHevc()) {
  // Mobile: skip HEVC entirely. AVC WebCodecs only.
} else {
  const hevcResult = await tryHardwareHevcCompress(/* existing args */)
  if (hevcResult) return hevcResult
}
```

Also ensure the import at the top of `ffmpeg.ts` includes `mobileAllowsHevc`:

```ts
import {
  // existing imports...
  mobileAllowsHevc,
} from './compress-video-webcodecs'
```

- [ ] **Step 3: Block libx265 fallback on mobile**

Find the ffmpeg.wasm fallback around `withFfmpegLock()` at line 1356. Before it runs, guard any `libx265`/`hevc` argv construction:

```ts
if (isMobileBrowser() && codecChoice === 'hevc') {
  throw new Error('MOBILE_HEVC_DISABLED: HEVC is desktop-only. Try again with H.264 selected.')
}
```

Locate the exact conditional that selects the codec argv — insert this guard immediately before it. Use `grep -n "libx265" lib/converters/ffmpeg.ts` to confirm all libx265 code paths are behind this guard.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
- On desktop Chrome: load a 30 s clip, verify HEVC dispatch still runs (check console `logPhase` output).
- Fake mobile via DevTools device emulation (iPhone 14): load same clip, verify only AVC path executes and no `libx265` string appears in logs.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/ffmpeg.ts
git commit -m "feat(video-compressor): hard-gate mobile HEVC dispatch (Phase 1)"
```

### Task 1.3: Hide HEVC option on mobile + add strategy copy

**Files:**
- Modify: `content/tools/compress-video.ts`

- [ ] **Step 1: Read current options schema**

Read `content/tools/compress-video.ts:1–220`. Locate the codec option (likely a `select` field with values `h264`/`h265` or `avc`/`hevc`).

- [ ] **Step 2: Runtime-filter codec options for mobile**

In the options builder (likely a function that returns the schema), wrap the HEVC option:

```ts
import { mobileAllowsHevc } from '@/lib/converters/compress-video-webcodecs'

const codecOptions = [
  { value: 'h264', label: 'H.264 — fast, universal' },
  ...(mobileAllowsHevc()
    ? [{ value: 'h265', label: 'H.265 — max compression (desktop)' }]
    : []),
]
```

If the options are static, convert to a function that runs on the client. If server-render clashes (static export), add `'use client'` at the top of any file that reads `navigator`, or defer the filter to a component-level check.

- [ ] **Step 3: Add codec-strategy copy**

Under the codec/quality control (in whichever field's `description` string the shell renders), add:

```ts
description: 'H.265 on desktop for maximum compression. H.264 on mobile for speed and battery life.'
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
- Desktop: codec dropdown shows H.264 + H.265.
- Mobile emulation (iPhone 14, Pixel 7): dropdown shows H.264 only. Copy line visible.

- [ ] **Step 5: Commit**

```bash
git add content/tools/compress-video.ts
git commit -m "feat(video-compressor): hide HEVC on mobile + codec strategy copy (Phase 1)"
```

---

## Phase 2 — Mobile Stability at 500 MB

### Task 2.1: Lower iOS OPFS streaming threshold

**Files:**
- Modify: `lib/converters/compress-video-worker.ts:29`

- [ ] **Step 1: Locate the constant**

Read `lib/converters/compress-video-worker.ts:1–60`. Confirm `OPFS_MIN_BYTES = 400 * 1024 * 1024` at line ~29.

- [ ] **Step 2: Split by platform**

Replace the single constant with:

```ts
const OPFS_MIN_BYTES_IOS = 250 * 1024 * 1024      // 250 MB — iOS MEMFS ceiling is lower
const OPFS_MIN_BYTES_ANDROID = 500 * 1024 * 1024  // unchanged
const OPFS_MIN_BYTES_DESKTOP = 500 * 1024 * 1024  // unchanged
```

Find all usages of `OPFS_MIN_BYTES` (grep the file). Replace with a helper:

```ts
function opfsMinBytes(env: { ios: boolean; mobile: boolean }): number {
  if (env.ios) return OPFS_MIN_BYTES_IOS
  if (env.mobile) return OPFS_MIN_BYTES_ANDROID
  return OPFS_MIN_BYTES_DESKTOP
}
```

Pass the existing env-detect result (already computed on line 866 / 1086 of ffmpeg.ts and passed to worker via message) into `opfsMinBytes` at each call site.

- [ ] **Step 3: Manual verification**

On a real iPhone (Safari), load a 300 MB source. Confirm the worker log emits an OPFS-path message (grep worker for `logPhase('opfs'...)` or equivalent).

- [ ] **Step 4: Commit**

```bash
git add lib/converters/compress-video-worker.ts
git commit -m "feat(video-compressor): lower iOS OPFS threshold to 250 MB (Phase 2)"
```

### Task 2.2: Pre-flight codec/container check with specific error

**Files:**
- Modify: `lib/converters/ffmpeg.ts` (mobile branch around line 1264)
- Modify: `lib/converters/mp4-video-demux.ts` (expose audio codec if not already)

- [ ] **Step 1: Confirm demuxer surfaces audio codec**

Read `lib/converters/mp4-video-demux.ts`. Find the demux result type. If audio codec (e.g. `mp4a`, `Opus`, `ac-3`) is not on the returned object, add it. Example patch (adapt to actual type name):

```ts
export interface DemuxResult {
  // existing fields...
  audioCodec?: string    // e.g. "mp4a.40.2", "ac-3", "opus"
}
```

Populate it in the demux function where the audio track info box is read.

- [ ] **Step 2: Add pre-flight in mobile branch**

In `lib/converters/ffmpeg.ts`, right after the 500 MB mobile size check (line ~1264), add:

```ts
if (isMobileBrowser()) {
  const demux = await probeMp4(file)  // reuses existing probe helper if present
  const supportedAudio = ['mp4a', 'aac']
  const audio = demux?.audioCodec?.toLowerCase() ?? ''
  const audioOk = supportedAudio.some((c) => audio.startsWith(c)) || audio === ''
  if (!audioOk) {
    return new Error(
      `Mobile encoder can’t handle "${demux?.audioCodec}" audio. Try again on desktop, or convert to AAC first.`
    )
  }
}
```

If `probeMp4` doesn't exist, call the existing demux entrypoint used later in the pipeline and cache its result to avoid double-work.

- [ ] **Step 3: Manual verification**

Load an MKV or a file with AC-3 audio on mobile emulation. Confirm the specific error appears (not the generic "too large" one).

- [ ] **Step 4: Commit**

```bash
git add lib/converters/ffmpeg.ts lib/converters/mp4-video-demux.ts
git commit -m "feat(video-compressor): pre-flight audio codec check on mobile (Phase 2)"
```

### Task 2.3: Surface WebCodecs errors verbatim on mobile

**Files:**
- Modify: `lib/converters/compress-video-worker.ts` (inside `encodeAvcInWorker` at line 417–667)

- [ ] **Step 1: Find the error handler**

Read `lib/converters/compress-video-worker.ts:417–667`. Locate the `VideoEncoder` construction and its `error` callback.

- [ ] **Step 2: Re-throw with context on mobile**

Modify the encoder error callback to capture and re-post:

```ts
const encoder = new VideoEncoder({
  output: handleChunk,
  error: (err) => {
    postMessage({
      type: 'error',
      // Preserve original message; do not swallow.
      message: `VideoEncoder error: ${err?.message ?? String(err)}`,
      recoverable: false,
    })
  },
})
```

Ensure no `catch` block in the worker downgrades this into a silent fallback. If a fallback `catch` exists (grep for `catch` in the AVC path), on mobile builds re-throw instead:

```ts
} catch (err) {
  if (isMobileEnv) throw err
  // existing desktop fallback continues below
}
```

Where `isMobileEnv` is derived from the env struct passed into the worker (already present per line 866 / 1086 in `ffmpeg.ts`).

- [ ] **Step 3: Manual verification**

Force an encoder error on mobile emulation (e.g., set an absurd bitrate like `1`). Confirm the UI shows the raw encoder error rather than a generic message.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/compress-video-worker.ts
git commit -m "feat(video-compressor): surface WebCodecs errors verbatim on mobile (Phase 2)"
```

---

## Phase 3 — Calibration Pass + Frame-Based Progress

### Task 3.1: Create calibration math module with tests

**Files:**
- Create: `lib/converters/compress-video-calibration.ts`
- Create: `lib/converters/__tests__/compress-video-calibration.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/converters/__tests__/compress-video-calibration.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  estimateSizeFromCalibration,
  estimateEtaFromCalibration,
  bitrateForTargetSize,
  bitrateFloor,
  isTargetAchievable,
} from '../compress-video-calibration'

describe('estimateSizeFromCalibration', () => {
  it('scales linearly by duration', () => {
    // 2 s at 4 Mbps → 1 MB per second → 60 MB for 60 s
    const bytes = estimateSizeFromCalibration({ measuredBps: 4_000_000, durationSeconds: 60 })
    expect(bytes).toBeCloseTo((4_000_000 * 60) / 8, -2)
  })
})

describe('estimateEtaFromCalibration', () => {
  it('returns remaining seconds based on fps and remaining frames', () => {
    const eta = estimateEtaFromCalibration({
      framesRemaining: 300,
      measuredFps: 30,
    })
    expect(eta).toBe(10)
  })
})

describe('bitrateForTargetSize', () => {
  it('computes bps for a target file size', () => {
    // 10 MB target, 60 s → 10*1024*1024*8 / 60
    const bps = bitrateForTargetSize({ targetBytes: 10 * 1024 * 1024, durationSeconds: 60 })
    expect(bps).toBeCloseTo((10 * 1024 * 1024 * 8) / 60, -2)
  })
})

describe('bitrateFloor', () => {
  it('scales floor with pixel count', () => {
    const floor480 = bitrateFloor({ width: 854, height: 480 })
    const floor1080 = bitrateFloor({ width: 1920, height: 1080 })
    expect(floor480).toBe(200_000)
    expect(floor1080).toBeGreaterThan(floor480 * 4)
  })
})

describe('isTargetAchievable', () => {
  it('returns false when computed bps below floor', () => {
    const result = isTargetAchievable({
      targetBytes: 1 * 1024 * 1024,
      durationSeconds: 600,
      width: 1920, height: 1080,
    })
    expect(result.achievable).toBe(false)
    expect(result.minAchievableBytes).toBeGreaterThan(1 * 1024 * 1024)
  })
  it('returns true when comfortably above floor', () => {
    const result = isTargetAchievable({
      targetBytes: 200 * 1024 * 1024,
      durationSeconds: 60,
      width: 1920, height: 1080,
    })
    expect(result.achievable).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/converters/__tests__/compress-video-calibration.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `lib/converters/compress-video-calibration.ts`:

```ts
export interface CalibrationSample {
  measuredBps: number       // bits per second observed during calibration
  measuredFps: number       // encoder frames per wall-clock second
  calibFrames: number       // frames actually encoded during calibration
  calibBytes: number        // encoded bytes produced during calibration
  calibSeconds: number      // source seconds covered by calibration (~2)
}

export function estimateSizeFromCalibration(
  args: { measuredBps: number; durationSeconds: number },
): number {
  return Math.round((args.measuredBps * args.durationSeconds) / 8)
}

export function estimateEtaFromCalibration(
  args: { framesRemaining: number; measuredFps: number },
): number {
  if (args.measuredFps <= 0) return Infinity
  return args.framesRemaining / args.measuredFps
}

export function bitrateForTargetSize(
  args: { targetBytes: number; durationSeconds: number },
): number {
  if (args.durationSeconds <= 0) return 0
  return Math.floor((args.targetBytes * 8) / args.durationSeconds)
}

const FLOOR_BASELINE_BPS = 200_000
const FLOOR_BASELINE_PIXELS = 854 * 480

export function bitrateFloor(args: { width: number; height: number }): number {
  const pixels = Math.max(1, args.width * args.height)
  return Math.round(FLOOR_BASELINE_BPS * (pixels / FLOOR_BASELINE_PIXELS))
}

export function isTargetAchievable(args: {
  targetBytes: number
  durationSeconds: number
  width: number
  height: number
}): { achievable: boolean; minAchievableBytes: number; requiredBps: number } {
  const required = bitrateForTargetSize({
    targetBytes: args.targetBytes,
    durationSeconds: args.durationSeconds,
  })
  const floor = bitrateFloor({ width: args.width, height: args.height })
  const minAchievableBytes = Math.round((floor * args.durationSeconds) / 8)
  return {
    achievable: required >= floor,
    minAchievableBytes,
    requiredBps: required,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/converters/__tests__/compress-video-calibration.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/converters/compress-video-calibration.ts lib/converters/__tests__/compress-video-calibration.test.ts
git commit -m "feat(video-compressor): calibration math module (Phase 3)"
```

### Task 3.2: Ensure demuxer exposes total frame count

**Files:**
- Modify: `lib/converters/mp4-video-demux.ts`

- [ ] **Step 1: Check current output**

Read `lib/converters/mp4-video-demux.ts`. Confirm whether the returned result already has `totalFrames`, `sampleCount`, or equivalent.

- [ ] **Step 2: Add or expose `totalFrames`**

If missing, add:

```ts
export interface DemuxResult {
  // existing fields...
  totalFrames: number  // video sample count from stsz/stco
}
```

Populate from the sample table walk that already exists in the demuxer.

- [ ] **Step 3: Add a test**

In `lib/converters/__tests__/mp4-video-demux.test.ts`, add:

```ts
it('exposes totalFrames from the video track', async () => {
  const result = await demuxMp4(fixtureFile('short-1080p.mp4'))
  expect(result.totalFrames).toBeGreaterThan(0)
})
```

Run: `npx vitest run lib/converters/__tests__/mp4-video-demux.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/mp4-video-demux.ts lib/converters/__tests__/mp4-video-demux.test.ts
git commit -m "feat(video-compressor): expose totalFrames from demuxer (Phase 3)"
```

### Task 3.3: Add calibration pass in the worker

**Files:**
- Modify: `lib/converters/compress-video-worker.ts` (inside `encodeAvcInWorker`)

- [ ] **Step 1: Add calibration state**

Near the top of `encodeAvcInWorker`, add:

```ts
const CALIBRATION_SECONDS = 2
const calibChunks: EncodedVideoChunk[] = []
let calibBytes = 0
let calibFrames = 0
let calibStartMs = 0
let calibrationSent = false
```

- [ ] **Step 2: Capture calibration output**

Inside the existing `handleChunk` callback (the encoder `output` handler), before it appends to the mux stream, capture the first N seconds:

```ts
function handleChunk(chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) {
  if (!calibrationSent) {
    calibChunks.push(chunk)
    calibBytes += chunk.byteLength
    calibFrames += 1
    const sourceSeconds = chunk.timestamp / 1_000_000
    if (sourceSeconds >= CALIBRATION_SECONDS) {
      const wallMs = performance.now() - calibStartMs
      const sample = {
        measuredBps: (calibBytes * 8) / sourceSeconds,
        measuredFps: (calibFrames * 1000) / wallMs,
        calibFrames,
        calibBytes,
        calibSeconds: sourceSeconds,
      }
      postMessage({ type: 'calibration', sample })
      calibrationSent = true
    }
  }
  // existing mux append logic below (unchanged)
}
```

Set `calibStartMs = performance.now()` immediately before the first `encoder.encode(frame)` call.

- [ ] **Step 3: Do not re-encode calibration frames**

The calibration output IS the first segment of the final file — do not restart the encoder. The existing mux append continues consuming all chunks including the calibration ones.

- [ ] **Step 4: Manual verification**

Load a 30 s clip. In the browser console, filter worker messages for `type: 'calibration'`. Confirm it arrives ~2 s of source time in, with plausible `measuredBps` (compare against the source bitrate reported by the demuxer).

- [ ] **Step 5: Commit**

```bash
git add lib/converters/compress-video-worker.ts
git commit -m "feat(video-compressor): calibration pass emits measured bps/fps (Phase 3)"
```

### Task 3.4: Frame-based progress reporting

**Files:**
- Modify: `lib/converters/compress-video-worker.ts` (main encode loop)

- [ ] **Step 1: Remove tick-interpolation for the encode band**

Find `runWithTicks` usage that covers the encode phase (line ~102–127). For the encode-phase progress specifically, replace with frame-based emission:

```ts
let lastProgressPost = 0
function emitEncodeProgress(framesEncoded: number, totalFrames: number) {
  const pct = 5 + Math.round((framesEncoded / totalFrames) * 90)
  const now = performance.now()
  if (now - lastProgressPost < 100 && pct < 95) return
  lastProgressPost = now
  postMessage({ type: 'progress', pct })
}
```

Call `emitEncodeProgress(calibFrames + regularFrames, totalFrames)` from `handleChunk` after each chunk is muxed. Pass `totalFrames` into `encodeAvcInWorker` via the initial worker message (source: `mp4-video-demux` result from Task 3.2).

- [ ] **Step 2: Reserve 0–5% for demux/setup, 95–100% for flush/mux**

Update the phase boundaries in the worker so:
- Demux + calibration setup posts `pct` values in 0–5.
- Encode loop posts 5–95.
- `encoder.flush()` + final mux posts 95–100.

Remove any `runWithTicks(promise, 12, 82, ...)` wrappers around the encode phase. Keep `runWithTicks` only for the flush/finalize phase where there are no frame events.

- [ ] **Step 3: Manual verification**

Load a 60 s clip. Watch the progress bar. Expected: monotonic, no jumps from 20% to 90%, updates roughly every 100 ms once encoding starts.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/compress-video-worker.ts
git commit -m "feat(video-compressor): frame-based progress reporting (Phase 3)"
```

### Task 3.5: Wire calibration into main-thread estimate + cache

**Files:**
- Modify: `lib/converters/compress-video-webcodecs.ts` (main-thread orchestrator)
- Modify: `lib/converters/ffmpeg.ts` (surface estimate to UI)

- [ ] **Step 1: Handle the calibration message on main thread**

In whichever function spawns the worker and listens for messages (grep for `worker.onmessage` or `addEventListener('message'` in `compress-video-webcodecs.ts`), add:

```ts
import {
  estimateSizeFromCalibration,
  estimateEtaFromCalibration,
} from './compress-video-calibration'

worker.addEventListener('message', (e) => {
  if (e.data.type === 'calibration') {
    const sample = e.data.sample
    const estimatedBytes = estimateSizeFromCalibration({
      measuredBps: sample.measuredBps,
      durationSeconds: sourceDurationSeconds,
    })
    const framesRemaining = totalFrames - sample.calibFrames
    const etaSeconds = estimateEtaFromCalibration({
      framesRemaining,
      measuredFps: sample.measuredFps,
    })
    onEstimate?.({ estimatedBytes, etaSeconds })
  }
  // ... existing message handling
})
```

`onEstimate` is a new optional callback threaded through the compress function signature. Add it to the existing options type.

- [ ] **Step 2: Cache calibration result by settings key**

Add a module-scoped cache:

```ts
const calibrationCache = new Map<string, CalibrationSample>()

function calibKey(fileId: string, width: number, height: number, quality: string, codec: string) {
  return `${fileId}|${width}x${height}|${quality}|${codec}`
}
```

Before starting a fresh calibration, check the cache. If a cached sample exists for the same file + settings, skip the pass and reuse the sample (emit the estimate immediately). On setting change, evict entries with the old settings.

`fileId` can be derived from `file.name + file.size + file.lastModified`.

- [ ] **Step 3: Surface estimate in the tool UI**

In `ffmpeg.ts` (or wherever the tool shell subscribes to progress), pass `onEstimate` through. The tool shell already has a spot for the "estimated output size" readout — replace the static-table value with the calibration-driven value once it arrives. Until then, show the static estimate as a placeholder to avoid an empty state.

- [ ] **Step 4: Manual accuracy check**

Run 5 test clips (talking head, screen recording, gaming, 4K nature, phone selfie). For each: note the calibration estimate, run the full compression, compare to actual output size. Target: within 10%. Record results in a comment on the commit or in `docs/superpowers/notes/calibration-accuracy.md`.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/compress-video-webcodecs.ts lib/converters/ffmpeg.ts
git commit -m "feat(video-compressor): calibration-driven estimate + cache (Phase 3)"
```

---

## Phase 5 — Bitrate Floor + Unachievable-Target Warning

(Phase 5 is ordered before Phase 4 per spec — floor depends on calibration output; preview is cosmetic and shipped last.)

### Task 5.1: Apply floor in quality-preset mode silently

**Files:**
- Modify: `lib/converters/compress-video-webcodecs.ts:331–414` (`avcBitrateForLevel`, `hevcBitrateForLevel`)

- [ ] **Step 1: Write the failing test**

Add to `lib/converters/__tests__/compress-video-calibration.test.ts`:

```ts
import { applyBitrateFloor } from '../compress-video-calibration'

describe('applyBitrateFloor', () => {
  it('raises below-floor bitrate to floor', () => {
    const out = applyBitrateFloor({ bps: 50_000, width: 1920, height: 1080 })
    expect(out).toBeGreaterThan(50_000)
  })
  it('leaves above-floor bitrate untouched', () => {
    const out = applyBitrateFloor({ bps: 5_000_000, width: 1920, height: 1080 })
    expect(out).toBe(5_000_000)
  })
})
```

Run: `npx vitest run lib/converters/__tests__/compress-video-calibration.test.ts`
Expected: FAIL (`applyBitrateFloor is not exported`).

- [ ] **Step 2: Add the helper**

In `lib/converters/compress-video-calibration.ts`:

```ts
export function applyBitrateFloor(args: { bps: number; width: number; height: number }): number {
  const floor = bitrateFloor({ width: args.width, height: args.height })
  return Math.max(args.bps, floor)
}
```

Run tests: PASS.

- [ ] **Step 3: Use it in the bitrate calculators**

In `compress-video-webcodecs.ts`, `avcBitrateForLevel` (line 331) and `hevcBitrateForLevel` (line 402), wrap the final return:

```ts
import { applyBitrateFloor } from './compress-video-calibration'

// existing computation...
return applyBitrateFloor({ bps: computed, width, height })
```

- [ ] **Step 4: Commit**

```bash
git add lib/converters/compress-video-webcodecs.ts lib/converters/compress-video-calibration.ts lib/converters/__tests__/compress-video-calibration.test.ts
git commit -m "feat(video-compressor): bitrate floor in preset mode (Phase 5)"
```

### Task 5.2: Warn on unachievable target size

**Files:**
- Modify: `components/tool-shell/` target-size input area (locate during task)
- Modify: `lib/converters/ffmpeg.ts` (validate before dispatch)

- [ ] **Step 1: Locate the target-size input**

Grep: `grep -rn "targetKB\|targetSizeMode" components/ content/`. The input lives near the config toggle at `content/tools/compress-video.ts:89–131`.

- [ ] **Step 2: Compute achievability on setting change**

In the component that owns the target-size input, when the user changes the value or when calibration completes, call:

```ts
import { isTargetAchievable } from '@/lib/converters/compress-video-calibration'

const check = isTargetAchievable({
  targetBytes: targetKB * 1024,
  durationSeconds,
  width,
  height,
})
```

If `!check.achievable`, render a warning above the compress button:

```tsx
{!check.achievable && (
  <div className="text-amber-700 text-sm mt-2">
    The smallest we can make this clip without visible quality loss is
    about {formatBytes(check.minAchievableBytes)}. Compress anyway?
  </div>
)}
```

- [ ] **Step 3: Gate dispatch behind an "anyway" confirmation**

Track a `userAcknowledgedUnachievable` boolean in the tool state. Only when true (user re-clicks after seeing the warning) does the compress call proceed with the below-floor bitrate. Otherwise the compress call raises the target to `check.minAchievableBytes` silently.

- [ ] **Step 4: Manual verification**

Load a 10 min 4K clip. Set target 5 MB. Confirm warning appears with a sensible minimum. Click compress once → no action (or bumps target). Acknowledge → compress runs.

Then: 3 achievable target-size runs (e.g. 25 MB email, 10 MB Discord, 200 MB WhatsApp on a 60 s 1080p clip). Actual output must land within 5% of target.

- [ ] **Step 5: Commit**

```bash
git add components/tool-shell/ content/tools/compress-video.ts lib/converters/ffmpeg.ts
git commit -m "feat(video-compressor): unachievable-target warning (Phase 5)"
```

---

## Phase 4 — Before/After Preview Frame

### Task 4.1: Extract original frame on file load

**Files:**
- Create: `components/tool-shell/CompressVideoPreview.tsx`
- Modify: `content/tools/compress-video.ts` (mount the preview under the quality selector)

- [ ] **Step 1: Locate mount point**

Grep: `grep -rn "compress-video\|ToolShell" content/tools/compress-video.ts`. Confirm how the tool shell renders custom mid-column components. If it doesn't, add a `previewSlot?: React.ReactNode` prop to the ToolShell props type and render it below the options panel — mirror how other tools inject custom UI (grep `previewSlot\|customPreview` under `components/tool-shell/`).

- [ ] **Step 2: Implement the component**

Create `components/tool-shell/CompressVideoPreview.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export interface CompressVideoPreviewProps {
  file: File | null
  afterFrameDataUrl?: string   // populated from calibration output
}

export function CompressVideoPreview({ file, afterFrameDataUrl }: CompressVideoPreviewProps) {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!file) { setBeforeUrl(null); return }
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.src = url
    v.muted = true
    v.playsInline = true
    v.preload = 'metadata'
    v.addEventListener('loadedmetadata', () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2)
    })
    v.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas')
      const targetW = Math.min(320, v.videoWidth)
      const scale = targetW / v.videoWidth
      canvas.width = targetW
      canvas.height = Math.round(v.videoHeight * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
      setBeforeUrl(canvas.toDataURL('image/png'))
      URL.revokeObjectURL(url)
    })
  }, [file])

  if (!file) return null

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-600 mb-2">Preview at this quality</div>
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Original</div>
          {beforeUrl && <img src={beforeUrl} alt="Original frame" className="rounded border" />}
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Compressed</div>
          {afterFrameDataUrl
            ? <img src={afterFrameDataUrl} alt="Compressed preview" className="rounded border" />
            : <div className="rounded border bg-gray-50 h-full min-h-[120px] grid place-items-center text-xs text-gray-400">Calibrating…</div>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Mount it under the quality selector**

In `content/tools/compress-video.ts`, wherever the shell reads custom mid-column UI, pass `<CompressVideoPreview file={currentFile} afterFrameDataUrl={afterUrl} />`. `afterUrl` is state populated in Task 4.2.

- [ ] **Step 4: Manual verification**

Load a video. Confirm the "Original" thumbnail appears within 1.5s on desktop. "Compressed" shows "Calibrating…" placeholder. No layout shift when the after-frame arrives (both slots reserve equal space).

- [ ] **Step 5: Commit**

```bash
git add components/tool-shell/CompressVideoPreview.tsx content/tools/compress-video.ts
git commit -m "feat(video-compressor): original-frame preview (Phase 4)"
```

### Task 4.2: Render calibration-encoded frame as "after"

**Files:**
- Modify: `lib/converters/compress-video-worker.ts` (decode first calibration chunk to bitmap and post back)
- Modify: `lib/converters/compress-video-webcodecs.ts` (thread it to the component)

- [ ] **Step 1: Decode first calibration keyframe in the worker**

In the worker's calibration completion block (Task 3.3 Step 2), after posting the `calibration` sample, also decode the first calibration chunk:

```ts
const decoder = new VideoDecoder({
  output: async (frame) => {
    const bitmap = await createImageBitmap(frame, { resizeWidth: 320 })
    frame.close()
    postMessage({ type: 'preview-frame', bitmap }, [bitmap])
    decoder.close()
  },
  error: () => { /* preview is best-effort; ignore */ },
})
// Reuse the same VideoDecoderConfig used to build the encoder.
decoder.configure(decoderConfig)
decoder.decode(calibChunks[0])
```

Use `transfer` semantics (`[bitmap]`) to avoid a copy.

- [ ] **Step 2: Convert bitmap to data URL on main thread**

In the main-thread message handler:

```ts
if (e.data.type === 'preview-frame') {
  const canvas = document.createElement('canvas')
  canvas.width = e.data.bitmap.width
  canvas.height = e.data.bitmap.height
  canvas.getContext('2d')!.drawImage(e.data.bitmap, 0, 0)
  const url = canvas.toDataURL('image/png')
  onPreviewFrame?.(url)
}
```

Thread `onPreviewFrame` through the compress function signature. The tool page owns the state that feeds `afterFrameDataUrl` into `CompressVideoPreview`.

- [ ] **Step 3: Invalidate on setting change**

When the user changes quality/resolution/codec, clear `afterFrameDataUrl` so the placeholder returns while a new calibration runs.

- [ ] **Step 4: Manual verification**

Load a video with visible detail (text, faces). Switch between quality levels — the compressed preview should visibly degrade at lower quality settings.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/compress-video-worker.ts lib/converters/compress-video-webcodecs.ts
git commit -m "feat(video-compressor): compressed preview frame from calibration (Phase 4)"
```

---

## Final Verification

### Task Final.1: Full regression sweep

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass. Any new failures relate only to files this plan touched — fix them.

- [ ] **Step 2: Manual matrix**

| Env | File | Expected |
|-----|------|----------|
| Desktop Chrome | 60s 1080p | HEVC dispatch, calibration estimate within 10%, smooth progress |
| Desktop Chrome | 3GB 4K | Mediabunny streaming path, unchanged behavior |
| iPhone Safari (real device) | 300 MB 1080p | AVC only, no HEVC log entries, completes without tab reload |
| Android Chrome (real device) | 500 MB 1080p | AVC only, completes within reasonable time |
| Any | Target 25 MB on 60s 1080p | Output within 5% of 25 MB |
| Any | Target 5 MB on 10min 4K | Warning shown; acknowledged run produces min-achievable size |

- [ ] **Step 3: Commit any final fixes then open PR**

```bash
git push -u origin feature/video-compressor-differentiation
gh pr create --title "Video compressor differentiation: mobile stability, calibration, preview" \
  --body "Implements docs/superpowers/specs/2026-09-12-video-compressor-differentiation-design.md across 5 phases. See commits for phase-by-phase changes."
```

---

## Self-Review Notes

- Spec Phase 1 → Tasks 1.1–1.3. Covered.
- Spec Phase 2 (mobile stability) → Tasks 2.1–2.3. Covered.
- Spec Phase 3 (calibration + progress) → Tasks 3.1–3.5. Covered.
- Spec Phase 4 (preview) → Tasks 4.1–4.2. Covered, ordered last per spec's stated order-of-work.
- Spec Phase 5 (floor + warning) → Tasks 5.1–5.2. Covered.
- No H.265 mobile toggle introduced anywhere. Preset mode preserved alongside target-size mode. Calibration accuracy has a manual verification gate before merge (Task 3.5 Step 4).
