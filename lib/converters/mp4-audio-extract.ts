/**
 * Pull AAC frames out of an MP4/MOV and wrap them as ADTS.
 * Android camera clips are usually HEVC + AAC; decodeAudioData fails on the
 * video file, but Chrome can decode the remuxed AAC without ffmpeg.wasm.
 */

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

function walk(data: Uint8Array, start: number, end: number, type: string): Box | undefined {
  const boxes = readBoxes(data, start, end)
  const hit = boxes.find((b) => b.type === type)
  if (hit) return hit
  for (const box of boxes) {
    if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf'].includes(box.type)) {
      const nested = walk(data, box.payloadStart, box.payloadEnd, type)
      if (nested) return nested
    }
  }
  return undefined
}

function parseStsz(data: Uint8Array, box: Box): number[] {
  const view = viewOf(data)
  const defaultSize = view.getUint32(box.payloadStart + 4)
  const count = view.getUint32(box.payloadStart + 8)
  if (defaultSize !== 0) return Array.from({ length: count }, () => defaultSize)
  const out: number[] = []
  for (let i = 0; i < count; i++) out.push(view.getUint32(box.payloadStart + 12 + i * 4))
  return out
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

function readDescr(data: Uint8Array, offset: number, end: number): { tag: number; headerEnd: number; payloadEnd: number } | null {
  if (offset >= end) return null
  const tag = data[offset]
  let i = offset + 1
  let size = 0
  for (let n = 0; n < 4 && i < end; n++) {
    const b = data[i++]
    size = (size << 7) | (b & 0x7f)
    if ((b & 0x80) === 0) break
  }
  const payloadEnd = Math.min(end, i + size)
  return { tag, headerEnd: i, payloadEnd }
}

function findDesc(data: Uint8Array, start: number, end: number, tag: number): { headerEnd: number; payloadEnd: number } | null {
  let offset = start
  while (offset < end) {
    const d = readDescr(data, offset, end)
    if (!d) break
    if (d.tag === tag) return d
    const nested = findDesc(data, d.headerEnd, d.payloadEnd, tag)
    if (nested) return nested
    offset = d.payloadEnd
  }
  return null
}

export function parseAacConfig(esdsPayload: Uint8Array): { objectType: number; sampleRateIndex: number; channels: number } | null {
  const start = esdsPayload.length >= 5 && esdsPayload[0] === 0 && (esdsPayload[4] === 3 || esdsPayload[4] === 4)
    ? 4
    : 0
  const dec = findDesc(esdsPayload, start, esdsPayload.length, 0x04)
    ?? findDesc(esdsPayload, start, esdsPayload.length, 0x03)
  const searchFrom = dec ? dec.headerEnd : 0
  const searchTo = dec ? dec.payloadEnd : esdsPayload.length
  const spec = findDesc(esdsPayload, searchFrom, searchTo, 0x05)
    ?? findDesc(esdsPayload, 0, esdsPayload.length, 0x05)
  if (!spec || spec.payloadEnd - spec.headerEnd < 2) return null
  const b0 = esdsPayload[spec.headerEnd]
  const b1 = esdsPayload[spec.headerEnd + 1]
  const objectType = (b0 >> 3) & 0x1f
  const sampleRateIndex = ((b0 & 7) << 1) | (b1 >> 7)
  const channels = (b1 >> 3) & 0x0f
  if (objectType < 1 || objectType > 4 || sampleRateIndex > 12 || channels < 1) return null
  return { objectType, sampleRateIndex, channels }
}

export function adtsFrame(cfg: { objectType: number; sampleRateIndex: number; channels: number }, aac: Uint8Array): Uint8Array {
  const len = aac.length + 7
  const profile = Math.max(0, Math.min(3, cfg.objectType - 1))
  const h = new Uint8Array(7 + aac.length)
  h[0] = 0xff
  h[1] = 0xf1
  h[2] = (profile << 6) | (cfg.sampleRateIndex << 2) | ((cfg.channels >> 2) & 1)
  h[3] = ((cfg.channels & 3) << 6) | ((len >> 11) & 0x1f)
  h[4] = (len >> 3) & 0xff
  h[5] = ((len & 7) << 5) | 0x1f
  h[6] = 0xfc
  h.set(aac, 7)
  return h
}

const SAMPLE_RATE_INDEX: Record<number, number> = {
  96000: 0, 88200: 1, 64000: 2, 48000: 3, 44100: 4, 32000: 5,
  24000: 6, 22050: 7, 16000: 8, 12000: 9, 11025: 10, 8000: 11, 7350: 12,
}

function findEsdsBox(data: Uint8Array, start: number, end: number): Box | undefined {
  const boxes = readBoxes(data, start, end)
  for (const box of boxes) {
    if (box.type === 'esds') return box
    if (box.type === 'wave') {
      const nested = findEsdsBox(data, box.payloadStart, box.payloadEnd)
      if (nested) return nested
    }
  }
  return undefined
}

function aacConfigFromSampleEntry(data: Uint8Array, entry: Box): { objectType: number; sampleRateIndex: number; channels: number } | null {
  if (entry.payloadStart + 28 > entry.payloadEnd) return null
  const view = viewOf(data)
  const channels = view.getUint16(entry.payloadStart + 16)
  const sampleRate = view.getUint32(entry.payloadStart + 24) >>> 16
  const sampleRateIndex = SAMPLE_RATE_INDEX[sampleRate]
  if (sampleRateIndex == null || channels < 1 || channels > 8) return null
  return { objectType: 2, sampleRateIndex, channels }
}

function parseMp4aConfig(data: Uint8Array, entry: Box): { objectType: number; sampleRateIndex: number; channels: number } | null {
  if (entry.type !== 'mp4a' && entry.type !== 'enca') return null
  const esds =
    findEsdsBox(data, entry.start + 36, entry.payloadEnd)
    ?? findEsdsBox(data, entry.start + 52, entry.payloadEnd)
  if (esds) {
    const cfg = parseAacConfig(data.subarray(esds.payloadStart, esds.payloadEnd))
    if (cfg) return cfg
  }
  return aacConfigFromSampleEntry(data, entry)
}

export function looksLikeMp4(file: { name: string; type: string }): boolean {
  if (/\.(mp4|m4a|m4v|mov)$/i.test(file.name)) return true
  return /mp4|quicktime|m4a/i.test(file.type)
}

/** ADTS AAC, or null if the file has no usable AAC track. */
export function extractMp4AacAdts(data: Uint8Array): Uint8Array | null {
  if (data.byteLength < 16) return null
  const top = readBoxes(data, 0, data.byteLength)
  const moov = top.find((b) => b.type === 'moov')
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

    const stsd = walk(data, trak.payloadStart, trak.payloadEnd, 'stsd')
    const stsz = walk(data, trak.payloadStart, trak.payloadEnd, 'stsz')
    const stsc = walk(data, trak.payloadStart, trak.payloadEnd, 'stsc')
    const stco = walk(data, trak.payloadStart, trak.payloadEnd, 'stco')
      ?? walk(data, trak.payloadStart, trak.payloadEnd, 'co64')
    if (!stsd || !stsz || !stsc || !stco) continue

    const entries = readBoxes(data, stsd.payloadStart + 8, stsd.payloadEnd)
    const mp4a = entries.find((e) => e.type === 'mp4a' || e.type === 'enca')
    if (!mp4a) continue
    const cfg = parseMp4aConfig(data, mp4a)
    if (!cfg) continue

    const sizes = parseStsz(data, stsz)
    if (sizes.length === 0) continue
    const offsets = sampleOffsets(sizes, parseStco(data, stco, stco.type === 'co64'), parseStsc(data, stsc))
    if (offsets.length !== sizes.length) continue

    let total = 0
    for (const size of sizes) total += size + 7
    const out = new Uint8Array(total)
    let cursor = 0
    for (let i = 0; i < sizes.length; i++) {
      const start = offsets[i]
      const end = start + sizes[i]
      if (start < 0 || end > data.byteLength) return null
      const frame = adtsFrame(cfg, data.subarray(start, end))
      out.set(frame, cursor)
      cursor += frame.length
    }
    return cursor === out.length ? out : out.subarray(0, cursor)
  }
  return null
}
