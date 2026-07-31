# Video to WebP Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `video-to-webp` tool page that converts MP4, WebM, MOV, AVI, MKV, and FLV to animated WebP, reusing the existing `mp4ToWebp` converter.

**Architecture:** Three additions — a tool config at `content/tools/video-to-webp.ts`, a page component at `app/(tools)/video-to-webp/page.tsx`, and a registry entry in `content/tool-registry.ts`. No new converter logic — `mp4ToWebp` already handles all six target formats via dynamic extension detection.

**Tech Stack:** Next.js App Router, TypeScript, ffmpeg.wasm (via `@/lib/converters/ffmpeg`), ToolShell component, Vitest

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `content/tools/video-to-webp.ts` | Tool config (slug, options, FAQ, meta) |
| Create | `app/(tools)/video-to-webp/page.tsx` | Page component with ffmpeg preload banner |
| Create | `lib/converters/__tests__/video-to-webp.test.ts` | Converter tests for multi-format input |
| Modify | `content/tool-registry.ts` | Import + register the new config |

---

### Task 1: Write the test file

**Files:**
- Create: `lib/converters/__tests__/video-to-webp.test.ts`

The `video-to-webp` tool reuses `mp4ToWebp` as its `convertFn`. The key behavior to test is that the converter handles non-MP4 extensions correctly (AVI, MKV, FLV, MOV, WebM) — the ffmpeg input filename must use the correct extension so ffmpeg can detect the container format.

- [ ] **Step 1: Create the test file**

```typescript
// lib/converters/__tests__/video-to-webp.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const execCalls: string[][] = []
const writeFileCalls: string[] = []
const deletedFiles: string[] = []
const listeners = new Map<string, Set<(payload: any) => void>>()

const ffmpegMock = {
  writeFile: vi.fn(async (name: string) => {
    writeFileCalls.push(name)
  }),
  readFile: vi.fn(async () => new Uint8Array([82, 73, 70, 70])),
  deleteFile: vi.fn(async (name: string) => {
    deletedFiles.push(name)
  }),
  exec: vi.fn(async (args: string[]) => {
    execCalls.push(args)
  }),
  on: vi.fn((event: string, handler: (payload: any) => void) => {
    const set = listeners.get(event) ?? new Set()
    set.add(handler)
    listeners.set(event, set)
  }),
  off: vi.fn((event: string, handler: (payload: any) => void) => {
    listeners.get(event)?.delete(handler)
  }),
}

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
}))

vi.mock('@/lib/converters/ffmpeg-client', () => ({
  getFFmpeg: vi.fn(async () => ffmpegMock),
}))

vi.mock('@/lib/converters/media-probe', () => ({
  probeVideoTrack: vi.fn(async () => true),
}))

describe('video-to-webp (mp4ToWebp with broader format support)', () => {
  beforeEach(() => {
    execCalls.length = 0
    writeFileCalls.length = 0
    deletedFiles.length = 0
    listeners.clear()
    vi.clearAllMocks()
    ffmpegMock.readFile.mockImplementation(async () => new Uint8Array([82, 73, 70, 70]))
    ffmpegMock.exec.mockImplementation(async (args: string[]) => {
      execCalls.push(args)
    })
  })

  it('uses the correct extension for an AVI input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.avi', { type: 'video/x-msvideo' })

    const results = await mp4ToWebp([input], { fps: 12, quality: 80 })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.avi'])
  })

  it('uses the correct extension for an MKV input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.mkv', { type: 'video/x-matroska' })

    const results = await mp4ToWebp([input], { fps: 10, quality: 75 })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.mkv'])
  })

  it('uses the correct extension for an FLV input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.flv', { type: 'video/x-flv' })

    const results = await mp4ToWebp([input], { fps: 10 })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.flv'])
  })

  it('uses the correct extension for a MOV input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.mov', { type: 'video/quicktime' })

    const results = await mp4ToWebp([input], {})

    expect(results).toHaveLength(1)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.mov'])
  })

  it('rejects audio-only files before ffmpeg work starts', async () => {
    const probeModule = await import('@/lib/converters/media-probe')
    vi.mocked(probeModule.probeVideoTrack).mockResolvedValueOnce(false)

    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'audio.avi', { type: 'video/x-msvideo' })

    const results = await mp4ToWebp([input], {})

    expect(results[0]).toBeInstanceOf(Error)
    expect(writeFileCalls).toHaveLength(0)
    expect(execCalls).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/converters/__tests__/video-to-webp.test.ts
```

Expected: Tests pass immediately (they test `mp4ToWebp` which already exists). If any fail, the converter has a bug with extension handling — investigate before continuing.

---

### Task 2: Create the tool config

**Files:**
- Create: `content/tools/video-to-webp.ts`

This is the single source of truth for the tool's metadata, options, FAQ, and SEO. It imports `mp4ToWebp` as the converter function.

- [ ] **Step 3: Create the config file**

```typescript
// content/tools/video-to-webp.ts
import { mp4ToWebp } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 250 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'video-to-webp',
  title: 'Video to WebP Converter',
  subtitle:
    'Convert MP4, MOV, AVI, MKV, FLV, and WebM to animated WebP. Trim, crop, and resize — no uploads.',
  bestFor:
    'Best for product teams and developers embedding short looping animations on websites or in documentation.',
  category: 'video-audio',
  accepts: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-flv',
  ],
  acceptsExt: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'],
  outputExt: '.webp',
  convertFn: mp4ToWebp,
  enablePresets: true,
  limitationNote: {
    summary: 'Best for short clips',
    body: 'Animated WebP is designed for short, silent loops. Long clips produce very large files that can exceed browser memory limits. Keep clips under 10 seconds for best results.',
  },
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large videos are slow in the browser. For best results, clip short sections and keep files under 250 MB.'
      : null
  },
  options: [
    {
      type: 'number',
      name: 'startTime',
      label: 'Start time (s)',
      min: 0,
      max: 600,
      step: 0.1,
      default: 0,
      hint: 'Trim off the beginning before converting. Use short clips for the smallest WebP files.',
    },
    {
      type: 'number',
      name: 'endTime',
      label: 'End time (s)',
      min: 0,
      max: 600,
      step: 0.1,
      default: 0,
      hint: '0 = use the rest of the video. Set an end time for short looping moments.',
    },
    {
      type: 'slider',
      name: 'fps',
      label: 'Frame rate',
      min: 1,
      max: 30,
      step: 1,
      default: 12,
      hint: 'Lower FPS makes smaller files. 10–15 FPS is usually enough for UI demos and product loops.',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 1920,
      step: 1,
      default: 640,
      hint: 'Scales the longer edge down. 0 = keep original size. Never upscales.',
    },
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: 'Higher quality looks cleaner but grows fast. 70–80 is the usual sweet spot.',
    },
    {
      type: 'dropdown',
      name: 'cropPreset',
      label: 'Crop',
      choices: [
        { value: 'original', label: 'Original frame' },
        { value: 'square', label: 'Square 1:1' },
        { value: '16:9', label: 'Widescreen 16:9' },
        { value: '4:3', label: 'Classic 4:3' },
      ],
      default: 'original',
      hint: 'Center-crops the frame before resizing — useful for thumbnails, docs, and product callouts.',
    },
    {
      type: 'number',
      name: 'loopCount',
      label: 'Loop count',
      min: 0,
      max: 100,
      step: 1,
      default: 0,
      hint: '0 = loop forever. Use 1–3 loops for changelogs or product walkthroughs.',
    },
  ],
  faq: [
    {
      q: 'Why use WebP instead of GIF for video clips?',
      a: 'Animated WebP is typically 25–35% smaller than GIF at equivalent quality and supports full color (not just 256 colors). Use WebP for websites, product docs, and UI demos. Use GIF only for platforms that do not yet support WebP — older Slack clients, GitHub READMEs, some email clients.',
    },
    {
      q: 'When should I use animated WebP instead of MP4?',
      a: 'Use animated WebP for short, silent loops that behave like images: product UI demos, feature callouts, inline documentation. Use MP4 for longer clips, clips with audio, or anything needing video controls and streaming behavior.',
    },
    {
      q: 'Why is my output file still large?',
      a: 'Long durations, high frame rates, and large dimensions all inflate animated WebP size quickly. Trim to a shorter moment, lower FPS to 10–12, reduce max dimension, or drop quality slightly.',
    },
    {
      q: 'Can I convert AVI or MKV files, not just MP4?',
      a: 'Yes. This tool accepts MP4, WebM, MOV, AVI, MKV, and FLV. The output is always animated WebP regardless of the input format.',
    },
    {
      q: 'What can go wrong when converting video to animated WebP?',
      a: 'Audio-only files will fail immediately — this tool requires a video track. Long clips can exceed browser memory; keep clips under 10 seconds. If output looks washed out or blurry, lower the quality setting and check the max dimension.',
    },
    {
      q: 'Do my video files leave my device?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm. Your files stay on your device the whole time — nothing is uploaded.',
    },
  ],
  relatedTools: ['mp4-to-webp', 'video-to-gif', 'gif-to-webp', 'compress-video'],
  relatedArticles: [
    'avif-vs-webp-vs-jpeg-2026',
    'how-browser-based-file-conversion-works',
    'batch-convert-images',
  ],
  meta: {
    title: 'Video to WebP Converter — ConvertYard',
    description:
      'Convert MP4, MOV, AVI, MKV, FLV, and WebM to animated WebP in your browser. Trim, crop, resize, and set loop count. No uploads.',
  },
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. If there are type errors in the new file, check the `ToolConfig` type in `lib/types.ts` — specifically the `accepts`, `acceptsExt`, and `choices` field shapes.

---

### Task 3: Register the tool

**Files:**
- Modify: `content/tool-registry.ts`

- [ ] **Step 5: Add import to tool-registry.ts**

Open `content/tool-registry.ts`. Add this import line near the existing video tool imports (around line 25, after `import { config as videoToGif }`):

```typescript
import { config as videoToWebp } from './tools/video-to-webp'
```

- [ ] **Step 6: Add config to the registry array**

In the same file, find where `videoToGif` and `mp4ToWebp` are listed in the exported array. Add `videoToWebp` next to them:

```typescript
  videoToWebp,
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 4: Create the page component

**Files:**
- Create: `app/(tools)/video-to-webp/page.tsx`

The page follows the exact same pattern as `app/(tools)/video-to-gif/page.tsx` and `app/(tools)/mp4-to-webp/page.tsx` — preload ffmpeg on mount, show a loading banner until ready, then render `<ToolShell>`.

- [ ] **Step 8: Create the page file**

```typescript
// app/(tools)/video-to-webp/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/video-to-webp'

export default function Page() {
  const [engineReady, setEngineReady] = useState(false)

  useEffect(() => {
    import('@/lib/converters/ffmpeg-client').then(({ preloadFFmpeg, getFFmpeg }) => {
      preloadFFmpeg()
      getFFmpeg()
        .then(() => setEngineReady(true))
        .catch(() => setEngineReady(true))
    })
  }, [])

  return (
    <>
      {!engineReady && (
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
            Preparing video converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 5: Run full test suite and build

- [ ] **Step 10: Run all tests**

```bash
npm test
```

Expected: All tests pass. The new `video-to-webp.test.ts` tests should already pass since they test the existing `mp4ToWebp` function.

- [ ] **Step 11: Run the build**

```bash
npm run build
```

Expected: Build succeeds with no errors. The new route `video-to-webp` should appear in the output page list.

---

### Task 6: Commit

- [ ] **Step 12: Commit all changes**

```bash
git add \
  content/tools/video-to-webp.ts \
  app/\(tools\)/video-to-webp/page.tsx \
  lib/converters/__tests__/video-to-webp.test.ts \
  content/tool-registry.ts

git commit -m "feat: add video-to-webp converter tool (MP4, MOV, AVI, MKV, FLV, WebM)"
```
