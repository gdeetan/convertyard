export type DemuxSample = {
  data: Uint8Array
  timestampUs: number
  durationUs: number
  keyframe: boolean
}

export type DemuxedVideo = {
  codec: 'avc' | 'hevc'
  codecString: string
  description: Uint8Array
  width: number
  height: number
  /** Clockwise display rotation from the tkhd matrix. 0 if identity/unknown. */
  rotation: 0 | 90 | 180 | 270
  samples: DemuxSample[]
}

type Box = { type: string; start: number; payloadStart: number; payloadEnd: number }

export function avcCodecString(profile: number, compat: number, level: number): string {
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `avc1.${hex(profile)}${hex(compat)}${hex(level)}`
}

export function hevcCodecStringFromHvcC(hvcC: Uint8Array): string {
  if (hvcC.length < 13) return 'hvc1.1.6.L93.B0'
  const profileSpace = (hvcC[1] >> 6) & 0x03
  const profileIdc = hvcC[1] & 0x1f
  const tierFlag = (hvcC[1] >> 5) & 0x01
  const levelIdc = hvcC[12]
  const space = profileSpace === 0 ? '' : ['A', 'B', 'C'][profileSpace - 1] ?? ''
  return `hvc1.${space}${profileIdc}.6.L${levelIdc}.${tierFlag ? 'H' : 'B'}0`
}

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
      const big = view.getUint32(offset + 8) * 2 ** 32 + view.getUint32(offset + 12)
      size = big
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

// tkhd holds the 3x3 display transform matrix. iOS records portrait video with
// sensor-orientation (landscape) pixels + a 90° rotation matrix, so preserving
// this into the output is what keeps mobile playback right-side-up.
function parseTkhdRotation(data: Uint8Array, tkhd: Box): 0 | 90 | 180 | 270 {
  const view = viewOf(data)
  const version = data[tkhd.payloadStart]
  // full-box header (4) + version-specific dates/id/duration + reserved(8) +
  // layer(2) + alt_group(2) + volume(2) + reserved(2) = 16
  const headerSkip = version === 1 ? 4 + 32 + 16 : 4 + 20 + 16
  const matrixStart = tkhd.payloadStart + headerSkip
  if (matrixStart + 24 > tkhd.payloadEnd) return 0
  // Matrix entries a, b, c, d are 16.16 signed fixed-point. One = 0x00010000.
  const a = view.getInt32(matrixStart + 0) / 65536
  const b = view.getInt32(matrixStart + 4) / 65536
  const c = view.getInt32(matrixStart + 12) / 65536
  const d = view.getInt32(matrixStart + 16) / 65536
  const near = (x: number, target: number) => Math.abs(x - target) < 0.01
  if (near(a, 0) && near(b, 1) && near(c, -1) && near(d, 0)) return 90
  if (near(a, -1) && near(b, 0) && near(c, 0) && near(d, -1)) return 180
  if (near(a, 0) && near(b, -1) && near(c, 1) && near(d, 0)) return 270
  return 0
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

// ctts (composition-time-to-sample) box gives per-sample PTS-vs-DTS offset.
// Only present for streams with B-frames. Version 1 uses signed int32 offsets
// (needed for HEVC where offsets can be negative); version 0 uses unsigned.
// Without ctts, PTS === DTS and every offset is 0.
function parseCtts(data: Uint8Array, box: Box | undefined, sampleCount: number): number[] {
  if (!box) return new Array(sampleCount).fill(0)
  const view = viewOf(data)
  const version = view.getUint8(box.payloadStart)
  const entryCount = view.getUint32(box.payloadStart + 4)
  const offsets: number[] = []
  let p = box.payloadStart + 8
  for (let i = 0; i < entryCount && p + 8 <= box.payloadEnd; i++) {
    const n = view.getUint32(p)
    const o = version === 1 ? view.getInt32(p + 4) : view.getUint32(p + 4)
    p += 8
    for (let k = 0; k < n && offsets.length < sampleCount; k++) offsets.push(o)
  }
  while (offsets.length < sampleCount) offsets.push(0)
  return offsets
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

function parseStss(data: Uint8Array, box: Box | undefined, sampleCount: number): boolean[] {
  const flags = Array.from({ length: sampleCount }, () => false)
  if (!box) {
    if (sampleCount > 0) flags[0] = true
    return flags
  }
  const view = viewOf(data)
  const count = view.getUint32(box.payloadStart + 4)
  for (let i = 0; i < count; i++) {
    const idx = view.getUint32(box.payloadStart + 8 + i * 4) - 1
    if (idx >= 0 && idx < sampleCount) flags[idx] = true
  }
  return flags
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

function parseVideoSampleEntry(data: Uint8Array, entry: Box): {
  codec: 'avc' | 'hevc'
  width: number
  height: number
  description: Uint8Array
  codecString: string
} | null {
  if (entry.payloadEnd - entry.start < 86) return null
  const view = viewOf(data)
  const width = view.getUint16(entry.start + 32)
  const height = view.getUint16(entry.start + 34)
  const kids = readBoxes(data, entry.start + 86, entry.payloadEnd)
  if (entry.type === 'avc1' || entry.type === 'avc3') {
    const avcC = findBox(kids, 'avcC')
    if (!avcC) return null
    const description = data.subarray(avcC.payloadStart, avcC.payloadEnd)
    if (description.length < 4) return null
    return {
      codec: 'avc',
      width,
      height,
      description,
      codecString: avcCodecString(description[1], description[2], description[3]),
    }
  }
  if (entry.type === 'hvc1' || entry.type === 'hev1') {
    const hvcC = findBox(kids, 'hvcC')
    if (!hvcC) return null
    const description = data.subarray(hvcC.payloadStart, hvcC.payloadEnd)
    return {
      codec: 'hevc',
      width,
      height,
      description,
      codecString: hevcCodecStringFromHvcC(description),
    }
  }
  return null
}

export function demuxMp4Video(data: Uint8Array): DemuxedVideo | null {
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
    if (handler !== 'vide') continue

    const tkhd = walk(data, trak.payloadStart, trak.payloadEnd, 'tkhd')
    const rotation = tkhd ? parseTkhdRotation(data, tkhd) : 0
    const mdhd = walk(data, trak.payloadStart, trak.payloadEnd, 'mdhd')
    const stsd = walk(data, trak.payloadStart, trak.payloadEnd, 'stsd')
    const stts = walk(data, trak.payloadStart, trak.payloadEnd, 'stts')
    const stsz = walk(data, trak.payloadStart, trak.payloadEnd, 'stsz')
    const stsc = walk(data, trak.payloadStart, trak.payloadEnd, 'stsc')
    const stco = walk(data, trak.payloadStart, trak.payloadEnd, 'stco')
      ?? walk(data, trak.payloadStart, trak.payloadEnd, 'co64')
    const stss = walk(data, trak.payloadStart, trak.payloadEnd, 'stss')
    const ctts = walk(data, trak.payloadStart, trak.payloadEnd, 'ctts')
    if (!mdhd || !stsd || !stts || !stsz || !stsc || !stco) continue

    const mdhdView = viewOf(data)
    const mdhdVersion = data[mdhd.payloadStart]
    const timescale = mdhdVersion === 1
      ? mdhdView.getUint32(mdhd.payloadStart + 20)
      : mdhdView.getUint32(mdhd.payloadStart + 12)
    if (!(timescale > 0)) continue

    const entries = readBoxes(data, stsd.payloadStart + 8, stsd.payloadEnd)
    const videoEntry = entries.find((e) => ['avc1', 'avc3', 'hvc1', 'hev1'].includes(e.type))
    if (!videoEntry) continue
    const parsed = parseVideoSampleEntry(data, videoEntry)
    if (!parsed) continue

    const sizes = parseStsz(data, stsz)
    if (sizes.length === 0) continue
    const durations = parseStts(data, stts, sizes.length)
    // ctts offsets are in the same timescale units as durations (mdhd
    // timescale). Zero for every sample when no B-frames.
    const cttsOffsets = parseCtts(data, ctts, sizes.length)
    const chunkOffsets = parseStco(data, stco, stco.type === 'co64')
    const offsets = sampleOffsets(sizes, chunkOffsets, parseStsc(data, stsc))
    const keyframes = parseStss(data, stss, sizes.length)
    if (offsets.length !== sizes.length) continue

    const samples: DemuxSample[] = []
    let dts = 0
    for (let i = 0; i < sizes.length; i++) {
      const start = offsets[i]
      const end = start + sizes[i]
      if (start < 0 || end > data.byteLength) return null
      const durationUs = Math.round((durations[i] / timescale) * 1_000_000)
      // timestampUs is the PRESENTATION timestamp (PTS = DTS + ctts offset),
      // not DTS. WebCodecs' VideoDecoder uses EncodedVideoChunk.timestamp as
      // the presentation timestamp of the decoded frame, so passing DTS to
      // B-frame sources (iOS HEVC especially) produced non-monotonic output
      // → visible "backwards and forwards" playback in the muxed file.
      const ptsRawUnits = dts + cttsOffsets[i]
      samples.push({
        data: data.subarray(start, end),
        timestampUs: Math.round((ptsRawUnits / timescale) * 1_000_000),
        durationUs,
        keyframe: keyframes[i],
      })
      dts += durations[i]
    }

    return {
      codec: parsed.codec,
      codecString: parsed.codecString,
      description: parsed.description,
      width: parsed.width,
      height: parsed.height,
      rotation,
      samples,
    }
  }
  return null
}

export async function demuxMp4VideoFile(file: File): Promise<DemuxedVideo | null> {
  if (file.size < 16 || file.size > 4 * 1024 * 1024 * 1024) return null
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    return demuxMp4Video(bytes)
  } catch {
    return null
  }
}
