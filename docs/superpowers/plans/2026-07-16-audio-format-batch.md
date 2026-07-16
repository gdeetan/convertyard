# Audio Format Batch (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 6 audio-to-MP3 converter tools (M4A, WAV, AMR, OGG, FLAC, OPUS → MP3), each with a distinct landing page and FAQ, all reusing the existing `mp4ToMp3` converter.

**Architecture:** No new converter function — `mp4ToMp3` in `/lib/converters/ffmpeg.ts` handles all 6 input formats via ffmpeg's auto-detection from file extension. Each tool gets a config file in `/content/tools/`, a thin page component in `/app/(tools)/`, and a new entry in `/content/tool-catalog.ts`. All 6 page components follow the identical pattern to `/app/(tools)/mp4-to-mp3/page.tsx`.

**Tech Stack:** ffmpeg.wasm (`@ffmpeg/ffmpeg`), Next.js App Router, TypeScript, Tailwind CSS, ToolShell component.

---

### Reference: Existing Converter

`mp4ToMp3` in `/lib/converters/ffmpeg.ts` (lines 28–83) already handles all 6 audio input formats — ffmpeg auto-detects input from the file extension. The `-vn` flag is a no-op on audio-only files. Options consumed: `bitrate` (string, default `'128'`) and `sampleRate` (string, default `'44100'`).

### Reference: Catalog Location

Append all 6 new entries after line 93 in `/content/tool-catalog.ts` (after the `extract-audio` entry).

---

### Task 1: M4A to MP3

**Files:**
- Create: `/content/tools/m4a-to-mp3.ts`
- Create: `/app/(tools)/m4a-to-mp3/page.tsx`

No unit test feasible — ffmpeg.wasm requires a real browser/WASM runtime. Verification is TypeScript compile only; end-to-end is in the final task.

- [ ] **Step 1: Create `/content/tools/m4a-to-mp3.ts`**

```typescript
import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'm4a-to-mp3',
  title: 'M4A to MP3 Converter',
  subtitle: 'Convert M4A voice memos and audio files to MP3. No uploads, no software.',
  category: 'video-audio',
  accepts: ['audio/mp4', 'audio/x-m4a'],
  acceptsExt: ['.m4a'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'bitrate',
      label: 'Bitrate',
      choices: [
        { value: '128', label: '128 kbps (standard)' },
        { value: '192', label: '192 kbps (good)' },
        { value: '256', label: '256 kbps (high)' },
        { value: '320', label: '320 kbps (maximum)' },
      ],
      default: '128',
      hint: '128 kbps is transparent for voice. Use 192+ kbps for music.',
    },
    {
      type: 'radio',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
      ],
      default: '44100',
      hint: '44,100 Hz is standard for music and voice memos.',
    },
  ],
  faq: [
    {
      q: 'What is M4A and why won\'t it play everywhere?',
      a: 'M4A is Apple\'s audio format — it\'s an AAC audio track inside an MPEG-4 container. It plays natively on Apple devices (iPhone, Mac, iPad) and in most modern media players, but older Android apps, car stereos, and some podcast platforms expect MP3. Converting to MP3 makes the file universally compatible.',
    },
    {
      q: 'Does converting M4A to MP3 lose quality?',
      a: 'Yes, slightly — both M4A (AAC) and MP3 are lossy formats, and converting between them is a lossy-to-lossy transcode. At 192 kbps or higher, the quality difference is inaudible for most listeners. For voice memos, 128 kbps is transparent. Keep your original M4A files if you ever need to re-edit.',
    },
    {
      q: 'Can I convert iPhone voice memos?',
      a: 'Yes. iPhone voice memos are saved as M4A files. Export them to your Mac or PC (via AirDrop, iCloud, or a USB cable), drop them into this tool, and download the MP3s. The conversion runs entirely in your browser — nothing is uploaded.',
    },
    {
      q: 'What bitrate should I use for voice memos vs music?',
      a: 'For voice memos, recordings, and podcasts: 128 kbps is transparent — you won\'t hear a difference from the original. For music: use 192–256 kbps. Use 320 kbps only if you plan to re-edit the MP3 later, since re-encoding a lossy file degrades quality further.',
    },
    {
      q: 'Can I batch convert M4A files?',
      a: 'Yes. Drop as many M4A files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['mp4-to-mp3', 'extract-audio', 'audio-trimmer', 'mp3-to-mp4'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'M4A to MP3 Converter — ConvertYard',
    description:
      'Convert M4A to MP3 in your browser. Batch convert iPhone voice memos and M4A audio files — choose bitrate up to 320 kbps, no uploads, no account.',
  },
}
```

- [ ] **Step 2: Create `/app/(tools)/m4a-to-mp3/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/m4a-to-mp3'

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
            Preparing audio converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add content/tools/m4a-to-mp3.ts "app/(tools)/m4a-to-mp3/page.tsx"
git commit -m "feat: add m4a-to-mp3 tool"
```

---

### Task 2: WAV to MP3

**Files:**
- Create: `/content/tools/wav-to-mp3.ts`
- Create: `/app/(tools)/wav-to-mp3/page.tsx`

- [ ] **Step 1: Create `/content/tools/wav-to-mp3.ts`**

```typescript
import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'wav-to-mp3',
  title: 'WAV to MP3 Converter',
  subtitle: 'Shrink WAV recordings to MP3 in your browser. No uploads, batch ready.',
  category: 'video-audio',
  accepts: ['audio/wav', 'audio/x-wav'],
  acceptsExt: ['.wav'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'bitrate',
      label: 'Bitrate',
      choices: [
        { value: '128', label: '128 kbps (standard)' },
        { value: '192', label: '192 kbps (good)' },
        { value: '256', label: '256 kbps (high)' },
        { value: '320', label: '320 kbps (maximum)' },
      ],
      default: '128',
      hint: '128 kbps is transparent for most listening. Use 320 kbps for archiving.',
    },
    {
      type: 'radio',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
      ],
      default: '44100',
      hint: 'Match your WAV sample rate if you know it; 44,100 Hz covers most recordings.',
    },
  ],
  faq: [
    {
      q: 'Why convert WAV to MP3?',
      a: 'WAV is an uncompressed audio format — every sample is stored exactly as recorded. That makes WAV files huge: a 3-minute song at CD quality is about 30 MB as WAV. MP3 compresses the same audio to roughly 3–4 MB by removing frequencies the ear typically cannot hear. Convert to MP3 when you need to share files, upload to a platform, or fit audio on a device with limited storage.',
    },
    {
      q: 'How much smaller will the MP3 be?',
      a: 'Approximately 10× smaller at 128 kbps. A 30 MB WAV file becomes roughly 3 MB as a 128 kbps MP3. At 320 kbps the MP3 is about 4× smaller than WAV. The exact ratio depends on the length and the bitrate you choose.',
    },
    {
      q: 'Will I lose audio quality?',
      a: 'WAV is lossless — converting to MP3 introduces compression artifacts. At 128 kbps, the difference is inaudible for most listeners on most speakers and headphones. At 192–256 kbps, even careful listeners rarely hear a difference. Use 320 kbps if you plan to edit the MP3 after converting. Keep the original WAV if you need lossless quality long-term.',
    },
    {
      q: 'What bitrate should I choose for podcasts, music, or archiving?',
      a: 'For podcasts and speech: 128 kbps is transparent and keeps file sizes small. For music: 192 kbps is a good default; 256 kbps is preferred by audiophiles. For archiving: keep your WAV file — MP3 is lossy. If you must archive as MP3, use 320 kbps.',
    },
    {
      q: 'Can I batch convert WAV files?',
      a: 'Yes. Drop as many WAV files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['mp4-to-mp3', 'audio-trimmer', 'extract-audio', 'flac-to-mp3'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'WAV to MP3 Converter — ConvertYard',
    description:
      'Convert WAV to MP3 in your browser. Shrink raw recordings and WAV files — choose bitrate up to 320 kbps, batch convert up to 1,000 files, no uploads.',
  },
}
```

- [ ] **Step 2: Create `/app/(tools)/wav-to-mp3/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/wav-to-mp3'

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
            Preparing audio converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add content/tools/wav-to-mp3.ts "app/(tools)/wav-to-mp3/page.tsx"
git commit -m "feat: add wav-to-mp3 tool"
```

---

### Task 3: AMR to MP3

**Files:**
- Create: `/content/tools/amr-to-mp3.ts`
- Create: `/app/(tools)/amr-to-mp3/page.tsx`

- [ ] **Step 1: Create `/content/tools/amr-to-mp3.ts`**

```typescript
import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'amr-to-mp3',
  title: 'AMR to MP3 Converter',
  subtitle: 'Convert AMR voice recordings to MP3. Runs in your browser, no uploads.',
  category: 'video-audio',
  accepts: ['audio/amr', 'audio/3gpp'],
  acceptsExt: ['.amr', '.3gp'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'bitrate',
      label: 'Bitrate',
      choices: [
        { value: '128', label: '128 kbps (standard)' },
        { value: '192', label: '192 kbps (good)' },
        { value: '256', label: '256 kbps (high)' },
        { value: '320', label: '320 kbps (maximum)' },
      ],
      default: '128',
      hint: 'AMR recordings are already low quality — 128 kbps MP3 captures everything the source has.',
    },
    {
      type: 'radio',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
      ],
      default: '44100',
      hint: '44,100 Hz is standard for voice recordings.',
    },
  ],
  faq: [
    {
      q: 'What is AMR?',
      a: 'AMR stands for Adaptive Multi-Rate — a compressed audio format designed for phone calls and voice recordings. It was the default voice note format on Nokia and older Android phones, and is still used by some feature phones. AMR files are tiny (a few KB per second) but the audio quality is noticeably lower than MP3 — designed for speech clarity over phones, not music.',
    },
    {
      q: 'Why can\'t I open AMR files on my computer?',
      a: 'AMR is a telecom format — most desktop media players and web browsers don\'t support it by default. VLC and ffmpeg can play AMR, but converting to MP3 is the easier path. Once converted, the file plays everywhere: Windows Media Player, QuickTime, your phone, your car stereo.',
    },
    {
      q: 'Do AMR files come from WhatsApp?',
      a: 'Older versions of WhatsApp (pre-2017) saved voice messages as AMR files on Android. Modern WhatsApp uses Opus (.opus) instead. If your voice notes end in .amr, use this tool. If they end in .opus or .ogg, use the OPUS to MP3 tool instead.',
    },
    {
      q: 'Will the quality be good after converting?',
      a: 'The MP3 quality is limited by the source AMR file. AMR is a low-bitrate voice codec — it captures speech clearly but has a narrow frequency range and audible compression. Converting to MP3 will not recover lost quality. What you\'ll get is an MP3 that sounds exactly like the AMR, but plays everywhere.',
    },
    {
      q: 'Can I batch convert AMR files?',
      a: 'Yes. Drop as many AMR or 3GP files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['ogg-to-mp3', 'opus-to-mp3', 'm4a-to-mp3', 'audio-trimmer'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'AMR to MP3 Converter — ConvertYard',
    description:
      'Convert AMR voice recordings to MP3 in your browser. Open AMR files from Android phones and older voice messages — batch convert, no uploads, no account.',
  },
}
```

- [ ] **Step 2: Create `/app/(tools)/amr-to-mp3/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/amr-to-mp3'

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
            Preparing audio converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add content/tools/amr-to-mp3.ts "app/(tools)/amr-to-mp3/page.tsx"
git commit -m "feat: add amr-to-mp3 tool"
```

---

### Task 4: OGG to MP3

**Files:**
- Create: `/content/tools/ogg-to-mp3.ts`
- Create: `/app/(tools)/ogg-to-mp3/page.tsx`

- [ ] **Step 1: Create `/content/tools/ogg-to-mp3.ts`**

```typescript
import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'ogg-to-mp3',
  title: 'OGG to MP3 Converter',
  subtitle: 'Convert OGG audio files to MP3. Runs in your browser, no uploads.',
  category: 'video-audio',
  accepts: ['audio/ogg'],
  acceptsExt: ['.ogg'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'bitrate',
      label: 'Bitrate',
      choices: [
        { value: '128', label: '128 kbps (standard)' },
        { value: '192', label: '192 kbps (good)' },
        { value: '256', label: '256 kbps (high)' },
        { value: '320', label: '320 kbps (maximum)' },
      ],
      default: '128',
      hint: '128 kbps is transparent for most listening. Use 192+ kbps for music.',
    },
    {
      type: 'radio',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
      ],
      default: '44100',
      hint: '44,100 Hz is standard for music and voice recordings.',
    },
  ],
  faq: [
    {
      q: 'What is OGG?',
      a: 'OGG is an open-source container format developed by the Xiph.Org Foundation. It most commonly contains Vorbis-encoded audio (OGG Vorbis), though it can also hold Opus, FLAC, or Speex audio. OGG files are popular in open-source software, Linux audio, and some games. The format is royalty-free, which makes it a common default in software that avoids MP3 licensing.',
    },
    {
      q: 'Where do OGG files come from?',
      a: 'Common sources: Discord (audio messages on some platforms), Telegram (voice notes on certain versions), games built with open-source audio engines, Linux desktop applications, and media players like VLC that default to OGG when recording. Some older versions of Audacity also export OGG by default.',
    },
    {
      q: 'Does converting OGG to MP3 lose quality?',
      a: 'Yes — both OGG Vorbis and MP3 are lossy formats, so transcoding between them causes a small additional quality loss. At 192 kbps or higher, the difference is inaudible for most listeners. If you have the original source (WAV, FLAC), convert from that instead of from OGG to avoid generation loss.',
    },
    {
      q: 'What about .ogg files from WhatsApp?',
      a: 'Modern WhatsApp voice notes use the Opus codec inside an OGG container. This tool handles OGG Vorbis well, but Opus-in-OGG may not always work as expected here. If your WhatsApp OGG files don\'t convert correctly, try the OPUS to MP3 tool instead — it\'s specifically designed for that format.',
    },
    {
      q: 'Can I batch convert OGG files?',
      a: 'Yes. Drop as many OGG files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['opus-to-mp3', 'amr-to-mp3', 'audio-trimmer', 'extract-audio'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'OGG to MP3 Converter — ConvertYard',
    description:
      'Convert OGG to MP3 in your browser. Convert Discord and Telegram voice notes, OGG Vorbis audio files — batch convert up to 1,000 files, no uploads.',
  },
}
```

- [ ] **Step 2: Create `/app/(tools)/ogg-to-mp3/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/ogg-to-mp3'

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
            Preparing audio converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add content/tools/ogg-to-mp3.ts "app/(tools)/ogg-to-mp3/page.tsx"
git commit -m "feat: add ogg-to-mp3 tool"
```

---

### Task 5: FLAC to MP3

**Files:**
- Create: `/content/tools/flac-to-mp3.ts`
- Create: `/app/(tools)/flac-to-mp3/page.tsx`

- [ ] **Step 1: Create `/content/tools/flac-to-mp3.ts`**

```typescript
import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'flac-to-mp3',
  title: 'FLAC to MP3 Converter',
  subtitle: 'Convert FLAC to MP3 in your browser. No uploads, batch ready.',
  category: 'video-audio',
  accepts: ['audio/flac'],
  acceptsExt: ['.flac'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'bitrate',
      label: 'Bitrate',
      choices: [
        { value: '128', label: '128 kbps (standard)' },
        { value: '192', label: '192 kbps (good)' },
        { value: '256', label: '256 kbps (high)' },
        { value: '320', label: '320 kbps (maximum)' },
      ],
      default: '128',
      hint: 'For FLAC source material, 192–256 kbps captures everything most listeners can hear.',
    },
    {
      type: 'radio',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
      ],
      default: '44100',
      hint: '44,100 Hz is standard for music. Use 48,000 Hz if your FLAC was recorded at that rate.',
    },
  ],
  faq: [
    {
      q: 'Why convert FLAC to MP3?',
      a: 'FLAC is a lossless format — it preserves every audio sample exactly. That\'s great for archiving, but FLAC files are large (typically 20–40 MB for a 4-minute song) and many devices and streaming platforms don\'t support them. Converting to MP3 makes the files playable on any device, much smaller, and compatible with every music platform and media player.',
    },
    {
      q: 'Do I lose quality converting FLAC to MP3?',
      a: 'Yes. FLAC is lossless; MP3 is lossy. Converting introduces compression artifacts. At 256 kbps or higher, the difference is inaudible to most listeners on typical headphones and speakers — including in blind tests. At 128 kbps, differences may be audible on good equipment with certain music (cymbals, complex orchestral passages). Use 192–256 kbps for a safe balance of quality and size.',
    },
    {
      q: 'Should I keep the original FLAC?',
      a: 'Yes, always. FLAC is your archive — the file you re-encode from in the future. The MP3 is for listening, sharing, and uploading to platforms. Once you convert FLAC to MP3, you can\'t recover the lost quality. Keep the original FLAC on a hard drive or cloud backup.',
    },
    {
      q: 'What bitrate should I use for FLAC source material?',
      a: '192 kbps is a good default — transparent on most equipment. Use 256 kbps if you want to be certain there\'s no audible difference. Use 320 kbps only if you plan to edit the MP3 later, since re-encoding a lossy file degrades quality further.',
    },
    {
      q: 'Can I batch convert FLAC files?',
      a: 'Yes. Drop as many FLAC files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['wav-to-mp3', 'audio-trimmer', 'extract-audio', 'mp4-to-mp3'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'FLAC to MP3 Converter — ConvertYard',
    description:
      'Convert FLAC to MP3 in your browser. Shrink lossless audio files for phones and streaming — choose bitrate up to 320 kbps, batch convert, no uploads.',
  },
}
```

- [ ] **Step 2: Create `/app/(tools)/flac-to-mp3/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/flac-to-mp3'

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
            Preparing audio converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add content/tools/flac-to-mp3.ts "app/(tools)/flac-to-mp3/page.tsx"
git commit -m "feat: add flac-to-mp3 tool"
```

---

### Task 6: OPUS to MP3

**Files:**
- Create: `/content/tools/opus-to-mp3.ts`
- Create: `/app/(tools)/opus-to-mp3/page.tsx`

- [ ] **Step 1: Create `/content/tools/opus-to-mp3.ts`**

```typescript
import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'opus-to-mp3',
  title: 'OPUS to MP3 Converter',
  subtitle: 'Convert Opus voice notes to MP3. Works on WhatsApp voice messages. No uploads.',
  category: 'video-audio',
  accepts: ['audio/opus', 'audio/ogg'],
  acceptsExt: ['.opus', '.ogg'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'bitrate',
      label: 'Bitrate',
      choices: [
        { value: '128', label: '128 kbps (standard)' },
        { value: '192', label: '192 kbps (good)' },
        { value: '256', label: '256 kbps (high)' },
        { value: '320', label: '320 kbps (maximum)' },
      ],
      default: '128',
      hint: 'Voice notes: 128 kbps is transparent. Music: use 192+ kbps.',
    },
    {
      type: 'radio',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
      ],
      default: '44100',
      hint: '44,100 Hz is standard. Opus files from WhatsApp are typically 48,000 Hz internally.',
    },
  ],
  faq: [
    {
      q: 'What is Opus?',
      a: 'Opus is a modern, open-source audio codec developed by the IETF. It\'s designed for internet audio — voice calls, video conferencing, and streaming. It\'s used by WhatsApp for voice messages, Discord for voice channels, and WebRTC-based apps like Google Meet and Zoom. Opus files typically use the .opus extension or are stored inside an OGG container (.ogg).',
    },
    {
      q: 'Do WhatsApp voice notes use Opus?',
      a: 'Yes. Modern WhatsApp (Android and iOS) saves voice messages as Opus audio inside an OGG container — the files often have a .opus or .ogg extension depending on the platform and WhatsApp version. This tool handles both. If you exported voice notes from WhatsApp and they won\'t play on your computer, drop them here to convert to MP3.',
    },
    {
      q: 'What\'s the difference between OGG and Opus?',
      a: 'OGG is a container format — like a ZIP file that holds audio data. Opus is a codec — the algorithm that compresses and encodes the audio. An OGG file can contain Vorbis audio, Opus audio, FLAC audio, or others. When someone says "OGG file," they usually mean OGG Vorbis. WhatsApp voice notes are OGG Opus — the OGG container with Opus audio inside. This tool handles both.',
    },
    {
      q: 'Why can\'t I play .opus files on Windows or iPhone?',
      a: 'The Opus codec is not natively supported by Windows Media Player, older versions of QuickTime, or the iPhone\'s built-in Files app. Modern browsers (Chrome, Firefox, Edge) can play .opus files, but standalone media players often cannot. Converting to MP3 makes the file play on every device and player without any additional software.',
    },
    {
      q: 'Can I batch convert WhatsApp voice notes?',
      a: 'Yes. Export your voice notes from WhatsApp (via WhatsApp Web or the "Export Chat" feature), then drop all the files into this tool at once. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['ogg-to-mp3', 'amr-to-mp3', 'm4a-to-mp3', 'audio-trimmer'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'OPUS to MP3 Converter — ConvertYard',
    description:
      'Convert Opus voice notes to MP3 in your browser. Open WhatsApp voice messages and .opus files on any device — batch convert up to 1,000 files, no uploads.',
  },
}
```

- [ ] **Step 2: Create `/app/(tools)/opus-to-mp3/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/opus-to-mp3'

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
            Preparing audio converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add content/tools/opus-to-mp3.ts "app/(tools)/opus-to-mp3/page.tsx"
git commit -m "feat: add opus-to-mp3 tool"
```

---

### Task 7: Update tool catalog and final verification

**Files:**
- Modify: `/content/tool-catalog.ts` (append 6 entries after line 93)

- [ ] **Step 1: Append 6 entries to `/content/tool-catalog.ts`**

Find the `extract-audio` line (currently the last video-audio entry, line 93):
```typescript
  { slug: 'extract-audio',     title: 'Extract Audio',     description: 'Pull audio tracks from any video. Output MP3, AAC, WAV, OGG, or FLAC.', category: 'video-audio', status: 'live' },
```

Add these 6 lines immediately after it:
```typescript
  { slug: 'm4a-to-mp3',   title: 'M4A to MP3',   description: 'Convert M4A and iPhone voice memos to MP3. No uploads.', category: 'video-audio', status: 'live' },
  { slug: 'wav-to-mp3',   title: 'WAV to MP3',   description: 'Shrink WAV recordings to MP3. Batch convert, no uploads.', category: 'video-audio', status: 'live' },
  { slug: 'amr-to-mp3',   title: 'AMR to MP3',   description: 'Convert AMR voice recordings from Android phones to MP3.', category: 'video-audio', status: 'live' },
  { slug: 'ogg-to-mp3',   title: 'OGG to MP3',   description: 'Convert OGG Vorbis audio to MP3. Works on Discord and Telegram voice notes.', category: 'video-audio', status: 'live' },
  { slug: 'flac-to-mp3',  title: 'FLAC to MP3',  description: 'Convert lossless FLAC audio to MP3. Batch convert, no uploads.', category: 'video-audio', status: 'live' },
  { slug: 'opus-to-mp3',  title: 'OPUS to MP3',  description: 'Convert Opus voice notes and WhatsApp audio to MP3.', category: 'video-audio', status: 'live' },
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: build completes with no errors. The following routes appear in the output:
- `/m4a-to-mp3`
- `/wav-to-mp3`
- `/amr-to-mp3`
- `/ogg-to-mp3`
- `/flac-to-mp3`
- `/opus-to-mp3`

- [ ] **Step 3: Commit**

```bash
git add content/tool-catalog.ts
git commit -m "feat: add 6 audio-to-mp3 tools to catalog (m4a, wav, amr, ogg, flac, opus)"
```

---

### Task 8: Manual verification

```bash
npm run dev
```

Open each URL and verify:

- [ ] `http://localhost:3000/m4a-to-mp3` — ffmpeg preload banner appears, drop a .m4a file → downloads .mp3, plays correctly
- [ ] `http://localhost:3000/wav-to-mp3` — drop a .wav file → downloads .mp3, plays correctly
- [ ] `http://localhost:3000/amr-to-mp3` — drop a .amr or .3gp file → downloads .mp3, plays correctly
- [ ] `http://localhost:3000/ogg-to-mp3` — drop a .ogg file → downloads .mp3, plays correctly
- [ ] `http://localhost:3000/flac-to-mp3` — drop a .flac file → downloads .mp3, plays correctly
- [ ] `http://localhost:3000/opus-to-mp3` — drop a .opus file → downloads .mp3, plays correctly
- [ ] Batch: drop 3 files into any tool → ZIP downloads with 3 correctly named .mp3 files
- [ ] Navigate to the video-audio cluster page — all 6 new slugs appear as live
- [ ] Each tool shows the correct title, subtitle, FAQ, and related tools in the sidebar
