# Compress Video Speed Optimizations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Speed up video compression for target-size sub-pages (10MB, 25MB, 50MB, etc.) without perceptible quality loss, by replacing 2-pass VBR with 1-pass ABR, adding smart auto-scaling for hi-res inputs, and reducing audio overhead at small targets.

**Architecture:** All changes are confined to `lib/converters/ffmpeg.ts` (encode logic) and `lib/converters/media-probe.ts` (new probe helpers). No UI changes. A new `probeVideoDimensions()` helper reads source dimensions via the browser's HTMLVideoElement API. A new `probeAudioInfo()` helper reads audio codec/bitrate via ffmpeg's log event. Both are called inside the target-size re-encode path before constructing ffmpeg args.

**Tech Stack:** TypeScript, ffmpeg.wasm (`@ffmpeg/ffmpeg`), Vitest for tests.

---

## File Map

| File | Change |
|---|---|
| `lib/converters/media-probe.ts` | Add `probeVideoDimensions()`, `probeAudioInfo()` |
| `lib/converters/ffmpeg.ts` | Update `compressVideo()`: 1-pass ABR, auto-scale, adaptive audio, audio copy |
| `lib/converters/__tests__/media-probe.test.ts` | **Create** — tests for new probe functions |
| `lib/converters/__tests__/compress-video.test.ts` | Update mock + update 2-pass tests + add new tests |

---

## Task 1: Add `probeVideoDimensions` to `media-probe.ts`

**Files:**
- Modify: `lib/converters/media-probe.ts`
- Create: `lib/converters/__tests__/media-probe.test.ts`

- [ ] **Step 1: Create the test file with a failing test**

Create `lib/converters/__tests__/media-probe.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { probeVideoDimensions } from '../media-probe'

describe('probeVideoDimensions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns width and height when metadata loads', async () => {
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      preload: '' as string,
      muted: false,
      playsInline: false,
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(_: string) { Promise.resolve().then(() => this.onloadedmetadata?.()) },
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementationOnce(() => {})
    const file = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' })
    expect(await probeVideoDimensions(file)).toEqual({ width: 1920, height: 1080 })
  })

  it('returns null when video has no dimensions', async () => {
    const mockVideo = {
      videoWidth: 0,
      videoHeight: 0,
      preload: '' as string,
      muted: false,
      playsInline: false,
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(_: string) { Promise.resolve().then(() => this.onloadedmetadata?.()) },
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementationOnce(() => {})
    const file = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' })
    expect(await probeVideoDimensions(file)).toBeNull()
  })

  it('returns null on error', async () => {
    const mockVideo = {
      videoWidth: 0,
      videoHeight: 0,
      preload: '' as string,
      muted: false,
      playsInline: false,
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(_: string) { Promise.resolve().then(() => this.onerror?.()) },
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementationOnce(() => {})
    const file = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' })
    expect(await probeVideoDimensions(file)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL (function not exported)**

```bash
npx vitest run lib/converters/__tests__/media-probe.test.ts
```

Expected: error like `probeVideoDimensions is not a function`

- [ ] **Step 3: Add `probeVideoDimensions` to `media-probe.ts`**

Append to the end of `lib/converters/media-probe.ts`:

```typescript
export async function probeVideoDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    return null
  }
  try {
    return await new Promise<{ width: number; height: number } | null>((resolve) => {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)
      let settled = false

      const finish = (result: { width: number; height: number } | null) => {
        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        video.removeAttribute('src')
        video.load()
        URL.revokeObjectURL(objectUrl)
        resolve(result)
      }

      const timeoutId = window.setTimeout(() => finish(null), PROBE_TIMEOUT_MS)

      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.onloadedmetadata = () => {
        const w = video.videoWidth
        const h = video.videoHeight
        finish(w > 0 && h > 0 ? { width: w, height: h } : null)
      }
      video.onerror = () => finish(null)
      video.src = objectUrl
    })
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run lib/converters/__tests__/media-probe.test.ts
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/converters/media-probe.ts lib/converters/__tests__/media-probe.test.ts
git commit -m "feat: add probeVideoDimensions to media-probe"
```

---

## Task 2: Replace 2-pass VBR with 1-pass ABR

**Files:**
- Modify: `lib/converters/ffmpeg.ts` (lines 560–611 — the 2-pass VBR block)
- Modify: `lib/converters/__tests__/compress-video.test.ts`

- [ ] **Step 1: Update failing tests for the 2-pass → 1-pass change**

In `lib/converters/__tests__/compress-video.test.ts`:

Replace the two existing 2-pass tests (lines 127–145):
```typescript
  it('target size mode: 2-pass VBR when duration is available', ...
  it('target size mode: 2-pass VBR uses -b:v not -crf', ...
```

With these two new tests:
```typescript
  it('target size mode: 1-pass ABR when duration is available', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 10 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 5120, resolution: 'original', h265: false, stripAudio: false })
    expect(mockExec).toHaveBeenCalledOnce()
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-b:v')
    expect(args).toContain('-maxrate')
    expect(args).toContain('-bufsize')
    expect(args).not.toContain('-crf')
    expect(args).not.toContain('-pass')
  })

  it('target size mode: 1-pass ABR calculates bitrate from duration and target', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 10 * 1024 * 1024)
    // targetKB=5120, duration=60s, audio=128kbps
    // videoBps = (5120*1024*8 - 128000*60) / 60 = (41943040 - 7680000) / 60 = 570720
    await compressVideo([file], { targetSizeMode: true, targetKB: 5120, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    const bvIndex = args.indexOf('-b:v')
    expect(parseInt(args[bvIndex + 1])).toBeGreaterThan(0)
    const maxrateIndex = args.indexOf('-maxrate')
    expect(parseInt(args[maxrateIndex + 1])).toBeGreaterThan(parseInt(args[bvIndex + 1]))
  })
```

- [ ] **Step 2: Run tests — expect FAIL on the new tests**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: the two new 1-pass tests fail (exec still called twice, no -maxrate/-bufsize)

- [ ] **Step 3: Replace the 2-pass VBR block in `ffmpeg.ts`**

In `lib/converters/ffmpeg.ts`, find the block starting at `if (durationSeconds > 0) {` (around line 561). Replace the entire `if (durationSeconds > 0) { ... }` block (the 2-pass section only, NOT the else/CRF fallback) with:

```typescript
          if (durationSeconds > 0) {
            // 1-pass ABR: calculate target bitrate, constrain with maxrate/bufsize
            const audioBitsPerSec = stripAudio ? 0 : 128_000
            const videoBitsPerSec = Math.max(
              100_000,
              Math.floor((targetBytes * 8 - audioBitsPerSec * durationSeconds) / durationSeconds)
            )
            const progressHandler = ({ progress }: { progress: number }) => {
              onProgress?.(i, Math.round(10 + progress * 85))
            }
            ffmpeg.on('progress', progressHandler)
            try {
              await ffmpeg.exec([
                '-i', inputName,
                ...vfArgs,
                '-c:v', codec,
                '-b:v', String(videoBitsPerSec),
                '-maxrate', String(Math.floor(videoBitsPerSec * 1.5)),
                '-bufsize', String(videoBitsPerSec * 2),
                ...audioArgs,
                outputName,
              ])
              data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
            } finally {
              ffmpeg.off('progress', progressHandler)
              await ffmpeg.deleteFile(inputName).catch(() => {})
              await ffmpeg.deleteFile(outputName).catch(() => {})
            }
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/converters/ffmpeg.ts lib/converters/__tests__/compress-video.test.ts
git commit -m "perf: replace 2-pass VBR with 1-pass ABR in target-size mode"
```

---

## Task 3: Adaptive audio bitrate for small targets

**Files:**
- Modify: `lib/converters/ffmpeg.ts` (inside the `if (durationSeconds > 0)` block from Task 2)
- Modify: `lib/converters/__tests__/compress-video.test.ts`

- [ ] **Step 1: Write failing tests**

Add these tests to `lib/converters/__tests__/compress-video.test.ts` (inside the `describe('compressVideo'` block):

```typescript
  it('target size mode: uses 64kbps audio for targets at or below 10MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 20 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 5 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('64k')
    expect(args).not.toContain('128k')
  })

  it('target size mode: uses 96kbps audio for targets between 10MB and 50MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 60 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 25 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('96k')
    expect(args).not.toContain('128k')
  })

  it('target size mode: uses 128kbps audio for targets above 50MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 100 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('128k')
  })

  it('preset mode: always uses 128kbps audio regardless of target', async () => {
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('128k')
  })
```

- [ ] **Step 2: Run tests — expect FAIL on the adaptive audio tests**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: the 3 adaptive audio tests fail (all currently use 128k)

- [ ] **Step 3: Update `compressVideo` to use adaptive audio in target-size re-encode path**

In `lib/converters/ffmpeg.ts`, inside the `if (durationSeconds > 0) {` block (from Task 2), replace the section that builds `audioBitsPerSec` and uses `audioArgs` with:

```typescript
          if (durationSeconds > 0) {
            // Adaptive audio: smaller targets get lower bitrate, freeing bits for video
            const adaptiveAudioKbps = targetKB <= 10 * 1024 ? 64 : targetKB <= 50 * 1024 ? 96 : 128
            const targetAudioArgs: string[] = stripAudio
              ? ['-an']
              : ['-c:a', 'aac', '-b:a', `${adaptiveAudioKbps}k`]
            const audioBitsPerSec = stripAudio ? 0 : adaptiveAudioKbps * 1000
            const videoBitsPerSec = Math.max(
              100_000,
              Math.floor((targetBytes * 8 - audioBitsPerSec * durationSeconds) / durationSeconds)
            )
            const progressHandler = ({ progress }: { progress: number }) => {
              onProgress?.(i, Math.round(10 + progress * 85))
            }
            ffmpeg.on('progress', progressHandler)
            try {
              await ffmpeg.exec([
                '-i', inputName,
                ...vfArgs,
                '-c:v', codec,
                '-b:v', String(videoBitsPerSec),
                '-maxrate', String(Math.floor(videoBitsPerSec * 1.5)),
                '-bufsize', String(videoBitsPerSec * 2),
                ...targetAudioArgs,
                outputName,
              ])
              data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
            } finally {
              ffmpeg.off('progress', progressHandler)
              await ffmpeg.deleteFile(inputName).catch(() => {})
              await ffmpeg.deleteFile(outputName).catch(() => {})
            }
```

Note: `targetAudioArgs` replaces `audioArgs` in this block only. The outer `audioArgs` (128kbps) is still used in preset/CRF mode and the CRF fallback.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: all tests pass including the 3 new adaptive audio tests

- [ ] **Step 5: Commit**

```bash
git add lib/converters/ffmpeg.ts lib/converters/__tests__/compress-video.test.ts
git commit -m "perf: adaptive audio bitrate for small targets in target-size mode"
```

---

## Task 4: Auto-scale hi-res inputs for small targets

**Files:**
- Modify: `lib/converters/ffmpeg.ts`
- Modify: `lib/converters/__tests__/compress-video.test.ts`

- [ ] **Step 1: Update the test file mock and imports to include `probeVideoDimensions`**

In `lib/converters/__tests__/compress-video.test.ts`:

1. Update the `vi.mock('@/lib/converters/media-probe', ...)` block to add `probeVideoDimensions`:

```typescript
vi.mock('@/lib/converters/media-probe', () => ({
  probeVideoTrack: vi.fn(async () => true),
  probeVideoDuration: vi.fn(async () => 0),
  probeVideoDimensions: vi.fn(async () => null),
}))
```

2. Update the import line (line 29–30) to add `probeVideoDimensions`:

```typescript
import { compressVideo } from '../ffmpeg'
import { probeVideoDuration, probeVideoDimensions } from '@/lib/converters/media-probe'
```

- [ ] **Step 2: Write failing auto-scale tests**

Add to `lib/converters/__tests__/compress-video.test.ts`:

```typescript
  it('target size mode: auto-scales 4K source to 1080p for targets at or below 50MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    vi.mocked(probeVideoDimensions).mockResolvedValueOnce({ width: 3840, height: 2160 })
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-vf')
    expect(args[args.indexOf('-vf') + 1]).toContain('1080')
  })

  it('target size mode: auto-scales 1080p source to 720p for targets at or below 10MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    vi.mocked(probeVideoDimensions).mockResolvedValueOnce({ width: 1920, height: 1080 })
    const file = makeFile('video.mp4', 50 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 10 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-vf')
    expect(args[args.indexOf('-vf') + 1]).toContain('720')
  })

  it('target size mode: does not auto-scale when source is already within threshold', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    vi.mocked(probeVideoDimensions).mockResolvedValueOnce({ width: 1280, height: 720 })
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    // source is 720p, target is 50MB — auto-scale threshold is 1080p, source already fits
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).not.toContain('-vf')
  })

  it('target size mode: user-set resolution is not overridden by auto-scale', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    // probeVideoDimensions should NOT be called when user has set a resolution
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: '720p', h265: false, stripAudio: false })
    expect(probeVideoDimensions).not.toHaveBeenCalled()
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-vf')
    expect(args[args.indexOf('-vf') + 1]).toContain('720')
  })
```

- [ ] **Step 3: Run tests — expect FAIL on the auto-scale tests**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: the 4 auto-scale tests fail

- [ ] **Step 4: Update `ffmpeg.ts` to import `probeVideoDimensions` and add auto-scale logic**

In `lib/converters/ffmpeg.ts`, update line 3 (the media-probe import):

```typescript
import { probeVideoTrack, probeVideoDuration, probeVideoDimensions } from './media-probe'
```

Then, inside the `} else { // needs re-encode }` block (after `const durationSeconds = await probeVideoDuration(file)` is moved), add the auto-scale computation BEFORE the `if (durationSeconds > 0)` check.

The full updated structure of the re-encode `else` block (replacing from `const durationSeconds = await probeVideoDuration(file)` through the end of the `if (durationSeconds > 0)` block):

```typescript
          } else {
            // Needs re-encode: compute effective vf args, then probe duration and encode
            let effectiveVfArgs = vfArgs
            if (resolution === 'original') {
              const dims = await probeVideoDimensions(file)
              if (dims) {
                const autoHeight = targetKB <= 10 * 1024 ? 720 : targetKB <= 50 * 1024 ? 1080 : null
                if (autoHeight !== null && dims.height > autoHeight) {
                  effectiveVfArgs = ['-vf', `scale=-2:${autoHeight}`]
                }
              }
            }

            const durationSeconds = await probeVideoDuration(file)

            if (durationSeconds > 0) {
              const adaptiveAudioKbps = targetKB <= 10 * 1024 ? 64 : targetKB <= 50 * 1024 ? 96 : 128
              const targetAudioArgs: string[] = stripAudio
                ? ['-an']
                : ['-c:a', 'aac', '-b:a', `${adaptiveAudioKbps}k`]
              const audioBitsPerSec = stripAudio ? 0 : adaptiveAudioKbps * 1000
              const videoBitsPerSec = Math.max(
                100_000,
                Math.floor((targetBytes * 8 - audioBitsPerSec * durationSeconds) / durationSeconds)
              )
              const progressHandler = ({ progress }: { progress: number }) => {
                onProgress?.(i, Math.round(10 + progress * 85))
              }
              ffmpeg.on('progress', progressHandler)
              try {
                await ffmpeg.exec([
                  '-i', inputName,
                  ...effectiveVfArgs,
                  '-c:v', codec,
                  '-b:v', String(videoBitsPerSec),
                  '-maxrate', String(Math.floor(videoBitsPerSec * 1.5)),
                  '-bufsize', String(videoBitsPerSec * 2),
                  ...targetAudioArgs,
                  outputName,
                ])
                data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
              } finally {
                ffmpeg.off('progress', progressHandler)
                await ffmpeg.deleteFile(inputName).catch(() => {})
                await ffmpeg.deleteFile(outputName).catch(() => {})
              }
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/converters/ffmpeg.ts lib/converters/__tests__/compress-video.test.ts
git commit -m "perf: auto-scale hi-res inputs for small targets in target-size mode"
```

---

## Task 5: Copy audio when source is already AAC

**Files:**
- Modify: `lib/converters/media-probe.ts`
- Modify: `lib/converters/ffmpeg.ts`
- Modify: `lib/converters/__tests__/media-probe.test.ts`
- Modify: `lib/converters/__tests__/compress-video.test.ts`

- [ ] **Step 1: Write failing test for `probeAudioInfo`**

In `lib/converters/__tests__/media-probe.test.ts`, add a new `describe` block at the end of the file:

```typescript
import { probeVideoDimensions, probeAudioInfo } from '../media-probe'
// (update the existing import line to also include probeAudioInfo)
```

Then add:

```typescript
describe('probeAudioInfo', () => {
  it('returns codec and bitrate when ffmpeg log contains audio stream info', async () => {
    const mockFfmpeg = {
      on: vi.fn((event: string, handler: (data: { message: string }) => void) => {
        if (event === 'log') {
          // Simulate ffmpeg log output containing audio stream info
          Promise.resolve().then(() =>
            handler({ message: 'Stream #0:1: Audio: aac (LC), 44100 Hz, stereo, fltp, 128 kb/s' })
          )
        }
      }),
      off: vi.fn(),
      exec: vi.fn(async () => {}),
    }
    const result = await probeAudioInfo(mockFfmpeg as any, 'input.mp4')
    expect(result).toEqual({ codec: 'aac', bitrateKbps: 128 })
  })

  it('returns null when log contains no audio stream info', async () => {
    const mockFfmpeg = {
      on: vi.fn(),
      off: vi.fn(),
      exec: vi.fn(async () => {}),
    }
    const result = await probeAudioInfo(mockFfmpeg as any, 'input.mp4')
    expect(result).toBeNull()
  })

  it('calls exec with null output to trigger log', async () => {
    const mockFfmpeg = {
      on: vi.fn(),
      off: vi.fn(),
      exec: vi.fn(async () => {}),
    }
    await probeAudioInfo(mockFfmpeg as any, 'cv_in_0.mp4')
    expect(mockFfmpeg.exec).toHaveBeenCalledWith(['-i', 'cv_in_0.mp4', '-f', 'null', '/dev/null'])
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run lib/converters/__tests__/media-probe.test.ts
```

Expected: `probeAudioInfo is not a function`

- [ ] **Step 3: Add `probeAudioInfo` to `media-probe.ts`**

Append to `lib/converters/media-probe.ts`:

```typescript
export async function probeAudioInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ffmpeg: { on: (event: string, handler: (data: { message: string }) => void) => void; off: (event: string, handler: unknown) => void; exec: (args: string[]) => Promise<void> },
  inputName: string
): Promise<{ codec: string; bitrateKbps: number } | null> {
  const lines: string[] = []
  const handler = ({ message }: { message: string }) => { lines.push(message) }
  ffmpeg.on('log', handler)
  try {
    await ffmpeg.exec(['-i', inputName, '-f', 'null', '/dev/null']).catch(() => {})
  } finally {
    ffmpeg.off('log', handler)
  }
  const output = lines.join('\n')
  const m = output.match(/Audio: (\w+).*?(\d+) kb\/s/)
  if (!m) return null
  return { codec: m[1], bitrateKbps: parseInt(m[2], 10) }
}
```

- [ ] **Step 4: Run media-probe tests — expect PASS**

```bash
npx vitest run lib/converters/__tests__/media-probe.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Write failing compress-video tests for audio copy**

In `lib/converters/__tests__/compress-video.test.ts`:

1. Update the `vi.mock('@/lib/converters/media-probe', ...)` block to add `probeAudioInfo`:

```typescript
vi.mock('@/lib/converters/media-probe', () => ({
  probeVideoTrack: vi.fn(async () => true),
  probeVideoDuration: vi.fn(async () => 0),
  probeVideoDimensions: vi.fn(async () => null),
  probeAudioInfo: vi.fn(async () => null),
}))
```

2. Update the import line to add `probeAudioInfo`:

```typescript
import { probeVideoDuration, probeVideoDimensions, probeAudioInfo } from '@/lib/converters/media-probe'
```

3. Add these tests:

```typescript
  it('target size mode: uses -c:a copy when source is AAC within adaptive bitrate tolerance', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    // targetKB = 50*1024 → adaptiveAudioKbps = 96; source 96 kb/s <= 96+16 ✓
    vi.mocked(probeAudioInfo).mockResolvedValueOnce({ codec: 'aac', bitrateKbps: 96 })
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    const caIndex = args.indexOf('-c:a')
    expect(caIndex).toBeGreaterThan(-1)
    expect(args[caIndex + 1]).toBe('copy')
  })

  it('target size mode: re-encodes audio when source AAC bitrate is too high', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    // targetKB = 50*1024 → adaptiveAudioKbps = 96; source 320 kb/s > 96+16 → re-encode
    vi.mocked(probeAudioInfo).mockResolvedValueOnce({ codec: 'aac', bitrateKbps: 320 })
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('96k')
    const caIndex = args.indexOf('-c:a')
    expect(args[caIndex + 1]).toBe('aac')
  })

  it('target size mode: re-encodes audio when source is not AAC', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    vi.mocked(probeAudioInfo).mockResolvedValueOnce({ codec: 'mp3', bitrateKbps: 96 })
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    const caIndex = args.indexOf('-c:a')
    expect(args[caIndex + 1]).toBe('aac')
  })

  it('target size mode: does not probe audio when stripAudio is true', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: true })
    expect(probeAudioInfo).not.toHaveBeenCalled()
  })
```

- [ ] **Step 6: Run tests — expect FAIL on the new audio-copy tests**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: the 4 audio-copy tests fail

- [ ] **Step 7: Update `ffmpeg.ts` to import and use `probeAudioInfo`**

In `lib/converters/ffmpeg.ts`, update the import on line 3:

```typescript
import { probeVideoTrack, probeVideoDuration, probeVideoDimensions, probeAudioInfo } from './media-probe'
```

Then, inside the `if (durationSeconds > 0)` block (after `const durationSeconds = await probeVideoDuration(file)`), update the audio logic to add the copy check. Replace the `adaptiveAudioKbps` / `targetAudioArgs` / `audioBitsPerSec` section with:

```typescript
              const adaptiveAudioKbps = targetKB <= 10 * 1024 ? 64 : targetKB <= 50 * 1024 ? 96 : 128
              const audioInfo = !stripAudio ? await probeAudioInfo(ffmpeg, inputName) : null
              const shouldCopyAudio =
                audioInfo !== null &&
                audioInfo.codec === 'aac' &&
                audioInfo.bitrateKbps <= adaptiveAudioKbps + 16
              const targetAudioArgs: string[] = stripAudio
                ? ['-an']
                : shouldCopyAudio
                  ? ['-c:a', 'copy']
                  : ['-c:a', 'aac', '-b:a', `${adaptiveAudioKbps}k`]
              const audioBitsPerSec = stripAudio
                ? 0
                : shouldCopyAudio
                  ? audioInfo!.bitrateKbps * 1000
                  : adaptiveAudioKbps * 1000
```

- [ ] **Step 8: Run tests — expect PASS**

```bash
npx vitest run lib/converters/__tests__/compress-video.test.ts
```

Expected: all tests pass

- [ ] **Step 9: Run full test suite to verify no regressions**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 10: Commit**

```bash
git add lib/converters/media-probe.ts lib/converters/ffmpeg.ts lib/converters/__tests__/media-probe.test.ts lib/converters/__tests__/compress-video.test.ts
git commit -m "perf: copy audio stream when source is already AAC at target bitrate"
```
