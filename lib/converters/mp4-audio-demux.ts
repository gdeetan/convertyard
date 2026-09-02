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
    if (tag === 0x03) {
      p += 3
    } else if (tag === 0x04) {
      p += 13
    } else {
      p += length
    }
  }
  return null
}

function parseAudioSampleEntry(data: Uint8Array, entry: Box): {
  numberOfChannels: number
  sampleRate: number
  description: Uint8Array
  codecString: string
} | null {
  if (entry.type !== 'mp4a') return null
  const view = viewOf(data)
  const base = entry.start + 8 + 8
  const numberOfChannels = view.getUint16(base + 8)
  const sampleRateFixed = view.getUint32(base + 16)
  const sampleRate = sampleRateFixed >>> 16
  const kids = readBoxes(data, entry.start + 8 + 8 + 20, entry.payloadEnd)
  const esds = findBox(kids, 'esds')
  if (!esds) return null
  const esdsPayload = data.subarray(esds.payloadStart, esds.payloadEnd)
  const audioSpecificConfig = extractAudioSpecificConfig(esdsPayload)
  if (!audioSpecificConfig || audioSpecificConfig.length < 2) return null
  const aot = (audioSpecificConfig[0] >> 3) & 0x1f
  return {
    numberOfChannels,
    sampleRate,
    description: audioSpecificConfig,
    codecString: `mp4a.40.${aot}`,
  }
}

// Cheap scan: does the file have any audio ('soun') track? Used to distinguish
// "source has no audio" (safe to encode video-only) from "source has audio but
// we can't parse it" (should preserve via ffmpeg fallback).
export function hasAudioTrack(data: Uint8Array): boolean {
  if (data.byteLength < 16) return false
  const top = readBoxes(data, 0, data.byteLength)
  const moov = findBox(top, 'moov')
  if (!moov) return false
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
    if (handler === 'soun') return true
  }
  return false
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
  if (file.size < 16 || file.size > 4 * 1024 * 1024 * 1024) return null
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    return demuxMp4Audio(bytes)
  } catch {
    return null
  }
}
