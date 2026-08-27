# Compress Video — mp4-muxer replacement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the ffmpeg.wasm mux tail from the WebCodecs hardware fast path for MP4/MOV inputs. Fast path streams `EncodedVideoChunk` + `EncodedAudioChunk` (passthrough) directly into `mp4-muxer`, so a 200 MB compress no longer waits 15–40 s for ffmpeg to load and remux.

**Architecture:**
- Add `mp4-muxer` (~15 KB gz).
- New module `lib/converters/mp4-audio-demux.ts` — extract AAC audio track from MP4/MOV containers using the same custom box parser style as `mp4-video-demux.ts`.
- New module `lib/converters/mp4-mux.ts` — thin wrapper over `mp4-muxer` (AVC / HEVC + optional AAC audio, `fastStart: 'in-memory'`).
- Refactor `compress-video-webcodecs.ts` fast path (`tryEncodeAvcViaVideoDecoder`, `tryEncodeHevcViaVideoDecoder`) to stream chunks into the muxer inline, drop the `chunks[]` + `concatBytes` + `muxAvcAnnexB`/`muxHevcAnnexB` tail.
- Change encoder bitstream format for the fast path from `annexb` to native AVCC/HVCC (what mp4-muxer expects); playback path keeps `annexb`.
- Change `compressVideo` in `ffmpeg.ts`: when hardware output is not smaller than source, return the source `File` unchanged (was: `remuxToMp4`).
- Playback-path fallback (`tryCompressVideoAvcHardware` / `tryCompressVideoHevcHardware` playback loop) unchanged, still uses `muxAvcAnnexB` / `muxHevcAnnexB`.

**Tech Stack:** TypeScript, Next.js App Router, WebCodecs (`VideoDecoder`/`VideoEncoder`/`EncodedVideoChunk`/`EncodedAudioChunk`), `mp4-muxer`, custom MP4 box parser, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-27-compress-video-mp4-muxer-design.md`

---

## Task 1: Add `mp4-muxer` dependency and scaffold `mp4-mux.ts` (video-only, strip audio)

**Files:**
- Modify: `package.json` (dependencies)
- Create: `lib/converters/mp4-mux.ts`
- Create: `lib/converters/__tests__/mp4-mux.test.ts`

- [ ] **Step 1: Install dep**

```bash
npm install mp4-muxer@^5.2.0
```

Expected: `package.json` gains `"mp4-muxer": "^5.2.0"` under `dependencies`; `package-lock.json` updated.

- [ ] **Step 2: Write failing test for AVC video-only muxer**

Create `lib/converters/__tests__/mp4-mux.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createAvcMuxer, createHevcMuxer } from '../mp4-mux'

// Minimal 1-byte "chunk" — mp4-muxer accepts any bytes for the video sample
// in tests; we only assert box structure here.
function fakeChunk(bytes: Uint8Array, type: 'key' | 'delta', timestampUs: number): EncodedVideoChunk {
  return new EncodedVideoChunk({ type, timestamp: timestampUs, duration: 33_333, data: bytes })
}

function readBoxTypes(buf: Uint8Array): string[] {
  const out: string[] = []
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let p = 0
  while (p + 8 <= buf.byteLength) {
    const size = view.getUint32(p)
    const type = String.fromCharCode(buf[p + 4], buf[p + 5], buf[p + 6], buf[p + 7])
    out.push(type)
    if (size === 0) break
    p += size < 8 ? 8 : size
  }
  return out
}

describe('createAvcMuxer', () => {
  it('produces an MP4 with ftyp+moov (faststart) and no audio when hasAudio is false', () => {
    // NOTE: mp4-muxer needs a real avcC description; we pass a minimal SPS/PPS
    // placeholder. Full-round-trip encode/decode is covered by manual browser test.
    const description = new Uint8Array([0x01, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0x00, 0x00, 0x01, 0x00, 0x00])
    const muxer = createAvcMuxer({
      width: 320,
      height: 240,
      hasAudio: false,
      videoDecoderConfig: { codec: 'avc1.64001f', description },
    })
    muxer.addVideoChunk(fakeChunk(new Uint8Array([0, 0, 0, 1, 0x65, 0x88]), 'key', 0))
    const out = muxer.finalize()
    expect(out.byteLength).toBeGreaterThan(0)
    const types = readBoxTypes(out)
    expect(types[0]).toBe('ftyp')
    expect(types).toContain('moov')
    // faststart: moov must appear before mdat
    expect(types.indexOf('moov')).toBeLessThan(types.indexOf('mdat'))
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- lib/converters/__tests__/mp4-mux.test.ts
```

Expected: `Cannot find module '../mp4-mux'`.

- [ ] **Step 4: Implement `mp4-mux.ts` (video-only)**

Create `lib/converters/mp4-mux.ts`:

```ts
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export type AacAudioMeta = {
  numberOfChannels: number
  sampleRate: number
  description: Uint8Array // AudioSpecificConfig from esds
}

export type VideoDecoderConfigDesc = {
  codec: string
  description: Uint8Array // avcC (for AVC) or hvcC (for HEVC)
}

export type MuxerHandle = {
  addVideoChunk(chunk: EncodedVideoChunk): void
  addAudioChunk(chunk: EncodedAudioChunk): void
  finalize(): Uint8Array
}

type MuxOpts = {
  width: number
  height: number
  hasAudio: boolean
  videoDecoderConfig: VideoDecoderConfigDesc
  audio?: AacAudioMeta
}

function build(codec: 'avc' | 'hevc', opts: MuxOpts): MuxerHandle {
  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    fastStart: 'in-memory',
    video: {
      codec,
      width: opts.width,
      height: opts.height,
    },
    audio: opts.hasAudio && opts.audio
      ? {
          codec: 'aac',
          numberOfChannels: opts.audio.numberOfChannels,
          sampleRate: opts.audio.sampleRate,
        }
      : undefined,
  })

  const videoMeta: EncodedVideoChunkMetadata = {
    decoderConfig: {
      codec: opts.videoDecoderConfig.codec,
      description: opts.videoDecoderConfig.description,
      codedWidth: opts.width,
      codedHeight: opts.height,
    },
  }

  const audioMeta: EncodedAudioChunkMetadata | undefined = opts.hasAudio && opts.audio
    ? {
        decoderConfig: {
          codec: 'mp4a.40.2',
          numberOfChannels: opts.audio.numberOfChannels,
          sampleRate: opts.audio.sampleRate,
          description: opts.audio.description,
        },
      }
    : undefined

  return {
    addVideoChunk(chunk) {
      muxer.addVideoChunk(chunk, videoMeta)
    },
    addAudioChunk(chunk) {
      if (!audioMeta) throw new Error('addAudioChunk called on video-only muxer')
      muxer.addAudioChunk(chunk, audioMeta)
    },
    finalize() {
      muxer.finalize()
      return new Uint8Array(target.buffer)
    },
  }
}

export function createAvcMuxer(opts: MuxOpts): MuxerHandle {
  return build('avc', opts)
}

export function createHevcMuxer(opts: MuxOpts): MuxerHandle {
  return build('hevc', opts)
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- lib/converters/__tests__/mp4-mux.test.ts
```

Expected: 1 passed. If `EncodedVideoChunk` is undefined in the jsdom test env, add `import 'happy-dom'` or stub the class — see `vitest.config.ts`; use the same env compress-video-webcodecs.test.ts uses (jsdom). If jsdom lacks WebCodecs classes, replace `fakeChunk` with a duck-typed literal cast: `{ type, timestamp, duration, byteLength: bytes.byteLength, copyTo: (dst: Uint8Array) => dst.set(bytes) } as unknown as EncodedVideoChunk`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/converters/mp4-mux.ts lib/converters/__tests__/mp4-mux.test.ts
git commit -m "feat(compress-video): add mp4-muxer wrapper (video-only)"
```

---

## Task 2: Add audio support to `mp4-mux.ts`

**Files:**
- Modify: `lib/converters/mp4-mux.ts`
- Modify: `lib/converters/__tests__/mp4-mux.test.ts`

- [ ] **Step 1: Write failing test for AVC + AAC muxer**

Append to `lib/converters/__tests__/mp4-mux.test.ts`:

```ts
function fakeAudio(bytes: Uint8Array, timestampUs: number): EncodedAudioChunk {
  // Duck-typed if jsdom lacks EncodedAudioChunk — mirror Step 5 note in Task 1.
  return new EncodedAudioChunk({ type: 'key', timestamp: timestampUs, duration: 21_333, data: bytes })
}

describe('createAvcMuxer with audio', () => {
  it('adds an audio track when hasAudio and audio are set', () => {
    const videoDesc = new Uint8Array([0x01, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0x00, 0x00, 0x01, 0x00, 0x00])
    // AudioSpecificConfig for AAC-LC stereo 48kHz: 0x11 0x90
    const audioDesc = new Uint8Array([0x11, 0x90])
    const muxer = createAvcMuxer({
      width: 320,
      height: 240,
      hasAudio: true,
      videoDecoderConfig: { codec: 'avc1.64001f', description: videoDesc },
      audio: { numberOfChannels: 2, sampleRate: 48_000, description: audioDesc },
    })
    muxer.addVideoChunk(fakeChunk(new Uint8Array([0, 0, 0, 1, 0x65, 0x88]), 'key', 0))
    muxer.addAudioChunk(fakeAudio(new Uint8Array([0xde, 0xad, 0xbe, 0xef]), 0))
    const out = muxer.finalize()
    // moov contains two trak boxes when audio is present
    const moovStart = new TextDecoder('latin1').decode(out).indexOf('moov')
    expect(moovStart).toBeGreaterThan(0)
    const trakMatches = new TextDecoder('latin1').decode(out).split('trak').length - 1
    expect(trakMatches).toBe(2)
  })

  it('throws if addAudioChunk called on a video-only muxer', () => {
    const videoDesc = new Uint8Array([0x01, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0x00, 0x00, 0x01, 0x00, 0x00])
    const muxer = createAvcMuxer({
      width: 320,
      height: 240,
      hasAudio: false,
      videoDecoderConfig: { codec: 'avc1.64001f', description: videoDesc },
    })
    expect(() => muxer.addAudioChunk(fakeAudio(new Uint8Array([0]), 0))).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails/passes as expected**

```bash
npm test -- lib/converters/__tests__/mp4-mux.test.ts
```

Expected: If Task 1 implementation already covers audio (it does — the `build()` function already accepts `audio`), tests should pass. If not, extend `build()` per the code in Task 1 Step 4.

- [ ] **Step 3: Commit**

```bash
git add lib/converters/__tests__/mp4-mux.test.ts
git commit -m "test(compress-video): mp4-mux audio track and error path"
```

---

## Task 3: Create `mp4-audio-demux.ts` (extract AAC track)

**Files:**
- Create: `lib/converters/mp4-audio-demux.ts`
- Create: `lib/converters/__tests__/mp4-audio-demux.test.ts`
- Create: `lib/converters/__tests__/fixtures/tiny-aac.mp4` (test fixture)

- [ ] **Step 1: Generate test fixture**

Requires ffmpeg on the workstation (not in-repo; one-time generation).

```bash
mkdir -p lib/converters/__tests__/fixtures
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=1:sample_rate=48000" \
  -f lavfi -i "color=c=black:s=320x240:d=1:r=30" \
  -c:v libx264 -preset ultrafast -pix_fmt yuv420p \
  -c:a aac -b:a 96k -ac 2 \
  -movflags +faststart \
  -shortest \
  lib/converters/__tests__/fixtures/tiny-aac.mp4
```

Expected: file exists, ~10–30 KB. Commit binary along with test.

- [ ] **Step 2: Write failing test**

Create `lib/converters/__tests__/mp4-audio-demux.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { demuxMp4Audio } from '../mp4-audio-demux'

describe('demuxMp4Audio', () => {
  it('extracts AAC track from a real MP4', () => {
    const bytes = new Uint8Array(readFileSync(join(__dirname, 'fixtures', 'tiny-aac.mp4')))
    const audio = demuxMp4Audio(bytes)
    expect(audio).not.toBeNull()
    expect(audio!.codecString).toMatch(/^mp4a\.40\./)
    expect(audio!.sampleRate).toBe(48_000)
    expect(audio!.numberOfChannels).toBe(2)
    expect(audio!.description.length).toBeGreaterThanOrEqual(2)
    expect(audio!.samples.length).toBeGreaterThan(0)
    // First sample starts at t=0
    expect(audio!.samples[0].timestampUs).toBe(0)
    // Durations monotonically increase
    for (let i = 1; i < audio!.samples.length; i++) {
      expect(audio!.samples[i].timestampUs).toBeGreaterThan(audio!.samples[i - 1].timestampUs)
    }
  })

  it('returns null when there is no audio track', () => {
    // Build a fake MP4 header with only ftyp — parser should give up.
    const fake = new Uint8Array(16)
    const view = new DataView(fake.buffer)
    view.setUint32(0, 16)
    fake.set([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0], 4)
    expect(demuxMp4Audio(fake)).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- lib/converters/__tests__/mp4-audio-demux.test.ts
```

Expected: `Cannot find module '../mp4-audio-demux'`.

- [ ] **Step 4: Implement `mp4-audio-demux.ts`**

Create `lib/converters/mp4-audio-demux.ts`. Reuses the box-walking pattern from `mp4-video-demux.ts`; adds ESDS parsing to find the AAC AudioSpecificConfig.

```ts
export type DemuxedAudioSample = {
  data: Uint8Array
  timestampUs: number
  durationUs: number
}

export type DemuxedAudio = {
  codecString: string          // 'mp4a.40.2' (AAC-LC), 'mp4a.40.5' (HE-AAC), etc.
  sampleRate: number
  numberOfChannels: number
  description: Uint8Array      // AudioSpecificConfig
  samples: DemuxedAudioSample[]
}

type Box = { type: string; start: number; payloadStart: number; payloadEnd: number }

function viewOf(data: Uint8Array): DataView {
  return new DataView(data.buffer, data.byteOffset, data.byteLength)
}

function readBoxes(data: Uint8Array, start: number, end: number): Box[] {
  const view = viewOf(data)
  const boxes: Box[] = []
  let offset = start
  while (offset + 8 <= end) {
    let size = view.getUint32(offset)
    const type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7])
    let header = 8
    if (size === 1) {
      if (offset + 16 > end) break
      size = view.getUint32(offset + 8) * 2 ** 32 + view.getUint32(offset + 12)
      header = 16
    } else if (size === 0) {
      size = end - offset
    }
    if (size < header || offset + size > end) break
    boxes.push({ type, start: offset, payloadStart: offset + header, payloadEnd: offset + size })
    offset += size
  }
  return boxes
}

function findBox(boxes: Box[], type: string): Box | undefined {
  return boxes.find((b) => b.type === type)
}

function walk(data: Uint8Array, start: number, end: number, type: string): Box | undefined {
  const boxes = readBoxes(data, start, end)
  const hit = findBox(boxes, type)
  if (hit) return hit
  for (const box of boxes) {
    if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf'].includes(box.type)) {
      const nested = walk(data, box.payloadStart, box.payloadEnd, type)
      if (nested) return nested
    }
  }
  return undefined
}

function readU32Array(data: Uint8Array, offset: number, count: number): number[] {
  const view = viewOf(data)
  const out: number[] = []
  for (let i = 0; i < count; i++) out.push(view.getUint32(offset + i * 4))
  return out
}

function parseStts(data: Uint8Array, box: Box, sampleCount: number): number[] {
  const view = viewOf(data)
  const entryCount = view.getUint32(box.payloadStart + 4)
  const durations: number[] = []
  let p = box.payloadStart + 8
  for (let i = 0; i < entryCount && p + 8 <= box.payloadEnd; i++) {
    const n = view.getUint32(p)
    const d = view.getUint32(p + 4)
    p += 8
    for (let k = 0; k < n && durations.length < sampleCount; k++) durations.push(d)
  }
  while (durations.length < sampleCount) durations.push(durations[durations.length - 1] ?? 0)
  return durations
}

function parseStsz(data: Uint8Array, box: Box): number[] {
  const view = viewOf(data)
  const defaultSize = view.getUint32(box.payloadStart + 4)
  const count = view.getUint32(box.payloadStart + 8)
  if (defaultSize !== 0) return Array.from({ length: count }, () => defaultSize)
  return readU32Array(data, box.payloadStart + 12, count)
}

function parseStco(data: Uint8Array, box: Box, wide: boolean): number[] {
  const view = viewOf(data)
  const count = view.getUint32(box.payloadStart + 4)
  const out: number[] = []
  let p = box.payloadStart + 8
  for (let i = 0; i < count; i++) {
    if (wide) {
      out.push(view.getUint32(p) * 2 ** 32 + view.getUint32(p + 4))
      p += 8
    } else {
      out.push(view.getUint32(p))
      p += 4
    }
  }
  return out
}

function parseStsc(data: Uint8Array, box: Box): Array<{ firstChunk: number; samplesPerChunk: number }> {
  const view = viewOf(data)
  const count = view.getUint32(box.payloadStart + 4)
  const out: Array<{ firstChunk: number; samplesPerChunk: number }> = []
  let p = box.payloadStart + 8
  for (let i = 0; i < count && p + 12 <= box.payloadEnd; i++) {
    out.push({ firstChunk: view.getUint32(p), samplesPerChunk: view.getUint32(p + 4) })
    p += 12
  }
  return out
}

function samplesPerChunkAt(entries: Array<{ firstChunk: number; samplesPerChunk: number }>, chunkIndex1: number): number {
  let current = entries[0]?.samplesPerChunk ?? 1
  for (const e of entries) {
    if (chunkIndex1 >= e.firstChunk) current = e.samplesPerChunk
    else break
  }
  return current
}

function sampleOffsets(
  sizes: number[],
  chunkOffsets: number[],
  stsc: Array<{ firstChunk: number; samplesPerChunk: number }>,
): number[] {
  const offsets: number[] = []
  let sample = 0
  for (let chunk = 1; sample < sizes.length; chunk++) {
    const count = samplesPerChunkAt(stsc, chunk)
    const base = chunkOffsets[chunk - 1]
    if (base === undefined) break
    let cursor = base
    for (let i = 0; i < count && sample < sizes.length; i++) {
      offsets.push(cursor)
      cursor += sizes[sample]
      sample += 1
    }
  }
  return offsets
}

/** Read a BER-encoded length prefix used in MPEG-4 descriptors. */
function readDescriptorLength(data: Uint8Array, offset: number): { length: number; bytesRead: number } {
  let length = 0
  let bytesRead = 0
  for (let i = 0; i < 4; i++) {
    if (offset + i >= data.length) break
    const b = data[offset + i]
    length = (length << 7) | (b & 0x7f)
    bytesRead += 1
    if ((b & 0x80) === 0) break
  }
  return { length, bytesRead }
}

/** Scan an esds payload for the DecoderSpecificInfo (tag 0x05) → AudioSpecificConfig bytes. */
function extractAudioSpecificConfig(esds: Uint8Array): Uint8Array | null {
  // Skip esds version+flags (4 bytes) then walk descriptors looking for tag 0x05.
  let p = 4
  while (p < esds.length) {
    const tag = esds[p]
    p += 1
    const { length, bytesRead } = readDescriptorLength(esds, p)
    p += bytesRead
    if (tag === 0x05) {
      if (p + length > esds.length) return null
      return esds.subarray(p, p + length)
    }
    // Not the tag we want — descend into container tags (0x03 ES_Descriptor, 0x04 DecoderConfigDescriptor).
    if (tag === 0x03) {
      // ES_Descriptor: ES_ID(2) + flags(1), then possibly streamDependenceFlag/urlFlag/ocrStreamFlag payload
      // Simplest: skip the fixed 3 bytes and continue scanning; the DecoderConfigDescriptor follows.
      p += 3
    } else if (tag === 0x04) {
      // DecoderConfigDescriptor: objectTypeIndication(1) + streamType/flags(1) + bufferSizeDB(3) + maxBitrate(4) + avgBitrate(4) = 13
      p += 13
    } else {
      // Unknown descriptor — skip past it.
      p += length
    }
  }
  return null
}

/** Parse an mp4a sample entry: returns AAC config plus advertised channels/sampleRate. */
function parseAudioSampleEntry(data: Uint8Array, entry: Box): {
  numberOfChannels: number
  sampleRate: number
  description: Uint8Array
  codecString: string
} | null {
  if (entry.type !== 'mp4a') return null
  const view = viewOf(data)
  // Audio sample entry: 8 reserved + 8 reserved + channelcount(2) + samplesize(2)
  //                     + predefined(2) + reserved(2) + samplerate(4, fixed 16.16)
  // ISO/IEC 14496-12 §12.2 — entry.start+8 skips size+type, then SampleEntry has 6 reserved + 2 data_reference_index = 8 bytes.
  const base = entry.start + 8 + 8
  const numberOfChannels = view.getUint16(base + 8)
  const sampleRateFixed = view.getUint32(base + 16)
  const sampleRate = sampleRateFixed >>> 16 // 16.16 → integer part
  const kids = readBoxes(data, entry.start + 8 + 8 + 20, entry.payloadEnd)
  const esds = findBox(kids, 'esds')
  if (!esds) return null
  const esdsPayload = data.subarray(esds.payloadStart, esds.payloadEnd)
  const audioSpecificConfig = extractAudioSpecificConfig(esdsPayload)
  if (!audioSpecificConfig || audioSpecificConfig.length < 2) return null
  // AudioSpecificConfig first 5 bits = AudioObjectType. Codec string is mp4a.40.<AOT>.
  const aot = (audioSpecificConfig[0] >> 3) & 0x1f
  return {
    numberOfChannels,
    sampleRate,
    description: audioSpecificConfig,
    codecString: `mp4a.40.${aot}`,
  }
}

export function demuxMp4Audio(data: Uint8Array): DemuxedAudio | null {
  if (data.byteLength < 16) return null
  const top = readBoxes(data, 0, data.byteLength)
  const moov = findBox(top, 'moov')
  if (!moov) return null

  const traks = readBoxes(data, moov.payloadStart, moov.payloadEnd).filter((b) => b.type === 'trak')
  for (const trak of traks) {
    const hdlr = walk(data, trak.payloadStart, trak.payloadEnd, 'hdlr')
    if (!hdlr || hdlr.payloadStart + 12 > hdlr.payloadEnd) continue
    const handler = String.fromCharCode(
      data[hdlr.payloadStart + 8],
      data[hdlr.payloadStart + 9],
      data[hdlr.payloadStart + 10],
      data[hdlr.payloadStart + 11],
    )
    if (handler !== 'soun') continue

    const mdhd = walk(data, trak.payloadStart, trak.payloadEnd, 'mdhd')
    const stsd = walk(data, trak.payloadStart, trak.payloadEnd, 'stsd')
    const stts = walk(data, trak.payloadStart, trak.payloadEnd, 'stts')
    const stsz = walk(data, trak.payloadStart, trak.payloadEnd, 'stsz')
    const stsc = walk(data, trak.payloadStart, trak.payloadEnd, 'stsc')
    const stco = walk(data, trak.payloadStart, trak.payloadEnd, 'stco')
      ?? walk(data, trak.payloadStart, trak.payloadEnd, 'co64')
    if (!mdhd || !stsd || !stts || !stsz || !stsc || !stco) continue

    const view = viewOf(data)
    const mdhdVersion = data[mdhd.payloadStart]
    const timescale = mdhdVersion === 1
      ? view.getUint32(mdhd.payloadStart + 20)
      : view.getUint32(mdhd.payloadStart + 12)
    if (!(timescale > 0)) continue

    const entries = readBoxes(data, stsd.payloadStart + 8, stsd.payloadEnd)
    const audioEntry = entries.find((e) => e.type === 'mp4a')
    if (!audioEntry) continue
    const parsed = parseAudioSampleEntry(data, audioEntry)
    if (!parsed) continue

    const sizes = parseStsz(data, stsz)
    if (sizes.length === 0) continue
    const durations = parseStts(data, stts, sizes.length)
    const chunkOffsets = parseStco(data, stco, stco.type === 'co64')
    const offsets = sampleOffsets(sizes, chunkOffsets, parseStsc(data, stsc))
    if (offsets.length !== sizes.length) continue

    const samples: DemuxedAudioSample[] = []
    let dts = 0
    for (let i = 0; i < sizes.length; i++) {
      const start = offsets[i]
      const end = start + sizes[i]
      if (start < 0 || end > data.byteLength) return null
      samples.push({
        data: data.subarray(start, end),
        timestampUs: Math.round((dts / timescale) * 1_000_000),
        durationUs: Math.round((durations[i] / timescale) * 1_000_000),
      })
      dts += durations[i]
    }

    return {
      codecString: parsed.codecString,
      sampleRate: parsed.sampleRate,
      numberOfChannels: parsed.numberOfChannels,
      description: parsed.description,
      samples,
    }
  }
  return null
}

export async function demuxMp4AudioFile(file: File): Promise<DemuxedAudio | null> {
  if (file.size < 16 || file.size > 800 * 1024 * 1024) return null
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    return demuxMp4Audio(bytes)
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- lib/converters/__tests__/mp4-audio-demux.test.ts
```

Expected: 2 passed. If the ESDS descriptor walk fails on the fixture, add a `console.log(esdsPayload)` inside `extractAudioSpecificConfig` and inspect. The tag-0x05 descriptor commonly sits at offset 21 in the esds payload.

- [ ] **Step 6: Commit**

```bash
git add lib/converters/mp4-audio-demux.ts lib/converters/__tests__/mp4-audio-demux.test.ts lib/converters/__tests__/fixtures/tiny-aac.mp4
git commit -m "feat(compress-video): mp4 AAC audio-track demuxer"
```

---

## Task 4: Add AVCC/HVCC bitstream format option to encoder config pickers

**Files:**
- Modify: `lib/converters/compress-video-webcodecs.ts:59-90` (pickAvcEncoderConfig)
- Modify: `lib/converters/compress-video-webcodecs.ts:114-145` (pickHevcEncoderConfig)
- Modify: `lib/converters/__tests__/compress-video-webcodecs.test.ts`

- [ ] **Step 1: Add format parameter, defaulting to `annexb` (no caller change yet)**

Edit `pickAvcEncoderConfig` and `pickHevcEncoderConfig` to accept an optional `format`:

```ts
export async function pickAvcEncoderConfig(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
  format: 'annexb' | 'avc' = 'annexb',
): Promise<AvcEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null
  const extras: Array<Partial<AvcEncoderConfig>> = [
    { hardwareAcceleration: 'prefer-hardware', avc: { format } },
    { avc: { format } },
  ]
  // ... rest unchanged
}
```

Same shape for `pickHevcEncoderConfig` with `format: 'annexb' | 'hevc' = 'annexb'` and `hevc: { format }`.

- [ ] **Step 2: Add tests**

Append to `lib/converters/__tests__/compress-video-webcodecs.test.ts`:

```ts
import { pickAvcEncoderConfig } from '../compress-video-webcodecs'

describe('pickAvcEncoderConfig format', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('passes format=avc through to isConfigSupported', async () => {
    const isConfigSupported = vi.fn(async (cfg: VideoEncoderConfig) => ({ supported: true, config: cfg }))
    vi.stubGlobal('VideoEncoder', { isConfigSupported })
    const cfg = await pickAvcEncoderConfig(320, 240, 30, 500_000, 'avc')
    expect((cfg as { avc?: { format?: string } } | null)?.avc?.format).toBe('avc')
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm test -- lib/converters/__tests__/compress-video-webcodecs.test.ts
```

Expected: existing tests still pass; new test passes.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/compress-video-webcodecs.ts lib/converters/__tests__/compress-video-webcodecs.test.ts
git commit -m "feat(compress-video): allow avcc/hvcc bitstream format in encoder pick"
```

---

## Task 5: Wire `tryEncodeAvcViaVideoDecoder` fast path into `mp4-muxer`

**Files:**
- Modify: `lib/converters/compress-video-webcodecs.ts:495-605` (tryEncodeAvcViaVideoDecoder)

- [ ] **Step 1: Replace chunk accumulation with muxer streaming and audio demux**

Replace the body of `tryEncodeAvcViaVideoDecoder` with the following (keep the function signature and outer shape). Reference: existing file `lib/converters/compress-video-webcodecs.ts` lines 495–605.

```ts
async function tryEncodeAvcViaVideoDecoder(
  file: File,
  opts: AvcHardwareOpts,
): Promise<File | null> {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') return null
  if (file.size > 120 * 1024 * 1024) return null

  const demuxed = await demuxMp4VideoFile(file)
  if (!demuxed || demuxed.samples.length === 0) return null

  const srcW = even(demuxed.width)
  const srcH = even(demuxed.height)
  if (srcW < 2 || srcH < 2) return null
  const height = opts.maxHeight && srcH > opts.maxHeight ? even(opts.maxHeight) : srcH
  const width = height === srcH ? srcW : even(Math.round(srcW * (height / srcH)))
  if (width < 2 || height < 2) return null

  const durationSeconds = demuxed.samples.reduce((sum, s) => sum + s.durationUs, 0) / 1_000_000
  const fps = durationSeconds > 0
    ? Math.min(60, Math.max(1, Math.round(demuxed.samples.length / durationSeconds)))
    : 30
  const bitrate = opts.bitrate && opts.bitrate > 0
    ? opts.bitrate
    : avcBitrateForLevel(width, height, fps, opts.level ?? 'medium', {
        sourceBytes: file.size,
        durationSeconds: durationSeconds || 1,
      })

  // AVCC format so mp4-muxer can consume chunks directly (no annex-B stripping).
  const encoderConfig = await pickAvcEncoderConfig(width, height, fps, bitrate, 'avc')
  if (!encoderConfig) return null

  const decoderConfig: VideoDecoderConfig = {
    codec: demuxed.codecString,
    codedWidth: demuxed.width,
    codedHeight: demuxed.height,
    description: demuxed.description.slice(),
  }
  try {
    const support = await VideoDecoder.isConfigSupported(decoderConfig)
    if (!support.supported) return null
  } catch {
    return null
  }

  const stripAudio = opts.stripAudio === true
  const audio = stripAudio ? null : await demuxMp4AudioFile(file)
  // If the user wants audio but the source has non-AAC (or no) audio, bail so
  // the caller falls back to the playback + ffmpeg-mux path (which handles it).
  if (!stripAudio && !audio) return null

  let muxer: MuxerHandle | null = null
  let muxError: Error | null = null
  let encodeError: Error | null = null
  let decodeError: Error | null = null
  const pending: VideoFrame[] = []

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        if (!muxer) {
          const desc = meta?.decoderConfig?.description
          if (!desc) throw new Error('encoder metadata missing decoderConfig.description')
          muxer = createAvcMuxer({
            width,
            height,
            hasAudio: !!audio,
            videoDecoderConfig: {
              codec: meta.decoderConfig!.codec,
              description: desc instanceof Uint8Array ? desc : new Uint8Array(desc as ArrayBuffer),
            },
            audio: audio
              ? {
                  numberOfChannels: audio.numberOfChannels,
                  sampleRate: audio.sampleRate,
                  description: audio.description,
                }
              : undefined,
          })
        }
        muxer.addVideoChunk(chunk)
      } catch (err) {
        muxError = err instanceof Error ? err : new Error(String(err))
      }
    },
    error: (err) => { encodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  encoder.configure(encoderConfig)

  const decoder = new VideoDecoder({
    output: (frame) => { pending.push(frame) },
    error: (err) => { decodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  decoder.configure(decoderConfig)

  let frameIndex = 0
  const drain = async () => {
    while (pending.length > 0) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (encoder.encodeQueueSize > 8) await sleep(0)
      let frame = pending.shift()!
      frame = await scaleFrame(frame, width, height)
      encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 })
      frame.close()
      frameIndex += 1
      opts.onProgress?.(12 + Math.round(Math.min(1, frameIndex / demuxed.samples.length) * 70))
    }
  }

  try {
    opts.onProgress?.(12)
    for (const sample of demuxed.samples) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (decoder.decodeQueueSize > 8) {
        await drain()
        if (decoder.decodeQueueSize > 8) await sleep(0)
      }
      decoder.decode(new EncodedVideoChunk({
        type: sample.keyframe ? 'key' : 'delta',
        timestamp: sample.timestampUs,
        duration: sample.durationUs,
        data: sample.data,
      }))
      await drain()
    }
    await decoder.flush()
    await drain()
    await encoder.flush()
    if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
    if (!muxer) return null

    // Audio passthrough: AAC frames are all keyframes.
    if (audio) {
      for (const s of audio.samples) {
        muxer.addAudioChunk(new EncodedAudioChunk({
          type: 'key',
          timestamp: s.timestampUs,
          duration: s.durationUs,
          data: s.data,
        }))
      }
    }

    opts.onProgress?.(90)
    const mp4Bytes = muxer.finalize()
    opts.onProgress?.(98)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([mp4Bytes], `${baseName}.mp4`, { type: 'video/mp4' })
  } catch {
    return null
  } finally {
    for (const frame of pending) {
      try { frame.close() } catch { /* already closed */ }
    }
    pending.length = 0
    try { decoder.close() } catch { /* already closed */ }
    try { encoder.close() } catch { /* already closed */ }
  }
}
```

Add these imports at the top of `compress-video-webcodecs.ts` (adjust the existing import list):

```ts
import { demuxMp4AudioFile } from './mp4-audio-demux'
import { createAvcMuxer, createHevcMuxer, type MuxerHandle } from './mp4-mux'
```

- [ ] **Step 2: Compile check**

```bash
npx tsc --noEmit
```

Expected: no type errors introduced by this file. If `EncodedVideoChunkMetadata` complains about `description` being `BufferSource`, cast as shown.

- [ ] **Step 3: Run existing test suite**

```bash
npm test -- lib/converters/__tests__/compress-video-webcodecs.test.ts
```

Expected: existing tests still pass (they only cover pure helpers).

- [ ] **Step 4: Commit**

```bash
git add lib/converters/compress-video-webcodecs.ts
git commit -m "feat(compress-video): stream AVC fast-path chunks into mp4-muxer"
```

---

## Task 6: Wire the HEVC `tryEncodeViaVideoDecoder` fast path into `mp4-muxer`

**Files:**
- Modify: `lib/converters/compress-video-webcodecs.ts:212-322` (`tryEncodeViaVideoDecoder` — the HEVC-side function; note it is named without the "Hevc" prefix in the existing source, unlike the AVC-side `tryEncodeAvcViaVideoDecoder`)

- [ ] **Step 1: Mirror Task 5 changes for HEVC**

Same body as Task 5 but:
- Call `pickHevcEncoderConfig(..., 'hevc')` (HVCC format).
- Use `createHevcMuxer` instead of `createAvcMuxer`.
- Bitrate helper `hevcBitrateForLevel`.

Full replacement body (same shape as Task 5 Step 1 with the three substitutions):

```ts
async function tryEncodeViaVideoDecoder(
  file: File,
  opts: HevcHardwareOpts,
): Promise<File | null> {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') return null
  if (file.size > 120 * 1024 * 1024) return null

  const demuxed = await demuxMp4VideoFile(file)
  if (!demuxed || demuxed.samples.length === 0) return null

  const srcW = even(demuxed.width)
  const srcH = even(demuxed.height)
  if (srcW < 2 || srcH < 2) return null
  const height = opts.maxHeight && srcH > opts.maxHeight ? even(opts.maxHeight) : srcH
  const width = height === srcH ? srcW : even(Math.round(srcW * (height / srcH)))
  if (width < 2 || height < 2) return null

  const durationSeconds = demuxed.samples.reduce((sum, s) => sum + s.durationUs, 0) / 1_000_000
  const fps = durationSeconds > 0
    ? Math.min(60, Math.max(1, Math.round(demuxed.samples.length / durationSeconds)))
    : 30
  const bitrate = opts.bitrate && opts.bitrate > 0
    ? opts.bitrate
    : hevcBitrateForLevel(width, height, fps, opts.level ?? 'medium', {
        sourceBytes: file.size,
        durationSeconds: durationSeconds || 1,
      })

  const encoderConfig = await pickHevcEncoderConfig(width, height, fps, bitrate, 'hevc')
  if (!encoderConfig) return null

  const decoderConfig: VideoDecoderConfig = {
    codec: demuxed.codecString,
    codedWidth: demuxed.width,
    codedHeight: demuxed.height,
    description: demuxed.description.slice(),
  }
  try {
    const support = await VideoDecoder.isConfigSupported(decoderConfig)
    if (!support.supported) return null
  } catch {
    return null
  }

  const stripAudio = opts.stripAudio === true
  const audio = stripAudio ? null : await demuxMp4AudioFile(file)
  if (!stripAudio && !audio) return null

  let muxer: MuxerHandle | null = null
  let muxError: Error | null = null
  let encodeError: Error | null = null
  let decodeError: Error | null = null
  const pending: VideoFrame[] = []

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        if (!muxer) {
          const desc = meta?.decoderConfig?.description
          if (!desc) throw new Error('encoder metadata missing decoderConfig.description')
          muxer = createHevcMuxer({
            width,
            height,
            hasAudio: !!audio,
            videoDecoderConfig: {
              codec: meta.decoderConfig!.codec,
              description: desc instanceof Uint8Array ? desc : new Uint8Array(desc as ArrayBuffer),
            },
            audio: audio
              ? {
                  numberOfChannels: audio.numberOfChannels,
                  sampleRate: audio.sampleRate,
                  description: audio.description,
                }
              : undefined,
          })
        }
        muxer.addVideoChunk(chunk)
      } catch (err) {
        muxError = err instanceof Error ? err : new Error(String(err))
      }
    },
    error: (err) => { encodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  encoder.configure(encoderConfig)

  const decoder = new VideoDecoder({
    output: (frame) => { pending.push(frame) },
    error: (err) => { decodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  decoder.configure(decoderConfig)

  let frameIndex = 0
  const drain = async () => {
    while (pending.length > 0) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (encoder.encodeQueueSize > 8) await sleep(0)
      let frame = pending.shift()!
      frame = await scaleFrame(frame, width, height)
      encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 })
      frame.close()
      frameIndex += 1
      opts.onProgress?.(12 + Math.round(Math.min(1, frameIndex / demuxed.samples.length) * 70))
    }
  }

  try {
    opts.onProgress?.(12)
    for (const sample of demuxed.samples) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (decoder.decodeQueueSize > 8) {
        await drain()
        if (decoder.decodeQueueSize > 8) await sleep(0)
      }
      decoder.decode(new EncodedVideoChunk({
        type: sample.keyframe ? 'key' : 'delta',
        timestamp: sample.timestampUs,
        duration: sample.durationUs,
        data: sample.data,
      }))
      await drain()
    }
    await decoder.flush()
    await drain()
    await encoder.flush()
    if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
    if (!muxer) return null

    if (audio) {
      for (const s of audio.samples) {
        muxer.addAudioChunk(new EncodedAudioChunk({
          type: 'key',
          timestamp: s.timestampUs,
          duration: s.durationUs,
          data: s.data,
        }))
      }
    }

    opts.onProgress?.(90)
    const mp4Bytes = muxer.finalize()
    opts.onProgress?.(98)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([mp4Bytes], `${baseName}.mp4`, { type: 'video/mp4' })
  } catch {
    return null
  } finally {
    for (const frame of pending) {
      try { frame.close() } catch { /* already closed */ }
    }
    pending.length = 0
    try { decoder.close() } catch { /* already closed */ }
    try { encoder.close() } catch { /* already closed */ }
  }
}
```

- [ ] **Step 2: Compile + test**

```bash
npx tsc --noEmit && npm test -- lib/converters/__tests__/compress-video-webcodecs.test.ts
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add lib/converters/compress-video-webcodecs.ts
git commit -m "feat(compress-video): stream HEVC fast-path chunks into mp4-muxer"
```

---

## Task 7: Return source unchanged when hardware output is not smaller

**Files:**
- Modify: `lib/converters/ffmpeg.ts:1107-1116` (HEVC branch of compressVideo)
- Modify: `lib/converters/ffmpeg.ts:1119-1139` (AVC branch of compressVideo)

- [ ] **Step 1: Update HEVC branch**

Locate the block:

```ts
if (hwFile) {
  if (hwFile.size < file.size) {
    console.info('[compress-video] hardware HEVC encoder')
    return hwFile
  }
  // Hardware ran but did not shrink. Do not fall through to libx265
  // (orders of magnitude slower in WASM). Remux the source instead.
  const remuxed = await remuxToMp4(file, (pct) => onProgress?.(i, pct))
  return remuxed ?? file
}
```

Replace with:

```ts
if (hwFile) {
  if (hwFile.size < file.size) {
    console.info('[compress-video] hardware HEVC encoder')
    return hwFile
  }
  // Hardware ran but output was not smaller. Return the source unchanged
  // rather than spinning up ffmpeg-wasm just to remux.
  console.info('[compress-video] hardware HEVC output not smaller — returning source')
  return file
}
```

- [ ] **Step 2: Update AVC branch**

Locate the block:

```ts
if (hwFile) {
  if (hwFile.size < file.size) {
    console.info(`[compress-video] hardware AVC encoder — ${file.size} → ${hwFile.size} bytes`)
    return hwFile
  }
  console.info(`[compress-video] AVC hardware output larger than source (${hwFile.size} vs ${file.size}) — remuxing source instead`)
  const remuxed = await remuxToMp4(file, (pct) => onProgress?.(i, pct))
  return remuxed ?? file
}
```

Replace with:

```ts
if (hwFile) {
  if (hwFile.size < file.size) {
    console.info(`[compress-video] hardware AVC encoder — ${file.size} → ${hwFile.size} bytes`)
    return hwFile
  }
  console.info(`[compress-video] AVC hardware output not smaller (${hwFile.size} vs ${file.size}) — returning source`)
  return file
}
```

- [ ] **Step 3: Compile check**

```bash
npx tsc --noEmit
```

Expected: no errors. If `remuxToMp4` becomes unused after this change, keep it (still used elsewhere in `ffmpeg.ts`; verify with a grep). Do not delete unused imports gratuitously.

- [ ] **Step 4: Verify remuxToMp4 still has callers**

```bash
grep -n "remuxToMp4" lib/converters/ffmpeg.ts
```

Expected: at least one remaining call, or, if none, an unused-function warning. If it's truly unused everywhere, delete the function body — otherwise leave it.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/ffmpeg.ts
git commit -m "refactor(compress-video): return source when hardware encode is not smaller"
```

---

## Task 8: Manual browser verification

Automated tests cannot exercise real WebCodecs. Perform this checklist in Chrome, Edge, and Safari on desktop.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Navigate to `http://localhost:3000/compress-video`.

- [ ] **Step 2: MP4 + AAC, strip audio, AVC (H.264 preset off, H.265 unchecked)**

Drop `~/test-videos/sample-1080p-30s.mp4` (or any 100–200 MB H.264+AAC file). Check "Remove audio". Compress. Expect:
- Console shows `[compress-video] AVC via VideoDecoder fast path`.
- Console does NOT show any `[ffmpeg]` load messages.
- Output plays in Chrome and QuickTime.
- Wall time under 15 s for a 200 MB source (vs previous ~30 s).

- [ ] **Step 3: MP4 + AAC, keep audio, AVC**

Same file, uncheck "Remove audio". Expect:
- Same fast-path console message.
- Output has audio when played in QuickTime.
- Audio duration matches video duration within 100 ms (check with `ffprobe output.mp4`).

- [ ] **Step 4: MP4 + AAC, keep audio, HEVC**

Enable "H.265" toggle. Same file. Expect:
- Console shows HEVC fast-path message.
- Output is playable in Safari and QuickTime (validates `hvc1` tagging).
- File is smaller than AVC output at same quality preset.

- [ ] **Step 5: MP4 with Opus audio → fallback path**

Generate:
```bash
ffmpeg -i input.mp4 -c:v copy -c:a libopus opus.mp4
```
Drop `opus.mp4` with keep-audio. Expect:
- Console shows `AVC VideoDecoder path returned null — trying playback path`.
- Playback path still succeeds via ffmpeg mux (unchanged behavior).

- [ ] **Step 6: Small already-compressed MP4 (hardware output ≥ source)**

Drop a 5 MB already-optimized file. Expect:
- Console shows `hardware AVC output not smaller — returning source`.
- Downloaded file is byte-identical to the source (SHA-256 check).
- No ffmpeg load messages.

- [ ] **Step 7: WebM input → unchanged behavior**

Drop a `.webm`. Expect:
- Fast path returns null (custom demuxer is MP4-only).
- Playback path fires and ffmpeg mux runs (unchanged).
- Output MP4 plays correctly.

- [ ] **Step 8: Repeat Steps 2–4 in Safari and Edge on desktop**

Safari: HEVC hardware is strong; AVC hardware is good. Both should hit the fast path.
Edge: Chromium — identical to Chrome behavior.

- [ ] **Step 9: Bundle size check**

```bash
npm run build
```

Look at Next.js output for the `/compress-video` route. Confirm the added `mp4-muxer` chunk is ≤ 20 KB gz. If larger, check tree-shaking (import only `Muxer` + `ArrayBufferTarget`).

- [ ] **Step 10: Commit any incidental fixes**

If any verification step reveals an issue, fix it in a follow-up commit. Otherwise no commit for this task.

---

## Task 9: Update spec / add a short note in code

**Files:**
- Modify: `lib/converters/compress-video-webcodecs.ts` (top-of-file docblock only)

- [ ] **Step 1: Add a one-line comment above `tryEncodeAvcViaVideoDecoder`**

```ts
// Fast path: demux → HW decode → HW encode → mp4-muxer. No ffmpeg.wasm load.
// Non-MP4 sources or non-AAC audio (when kept) fall through to the playback path.
```

Same one-line comment above `tryEncodeViaVideoDecoder` (HEVC).

- [ ] **Step 2: Commit**

```bash
git add lib/converters/compress-video-webcodecs.ts
git commit -m "docs(compress-video): note fast-path muxer strategy"
```

---

## Rollback

Every task is a single commit. `git revert <sha>` on Task 5, 6, or 7 restores the ffmpeg mux tail. Tasks 1–4 (new files, opt-in encoder-config param) are safe to keep even if the fast path is reverted — they're inert without the caller changes in 5/6.
