import { describe, it, expect } from 'vitest'
import { demuxMp4Video, avcCodecString } from '../mp4-video-demux'

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setUint16(0, n)
  return b
}
function u32(n: number): Uint8Array {
  const b = new Uint8Array(4)
  new DataView(b.buffer).setUint32(0, n)
  return b
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
function box(type: string, payload: Uint8Array): Uint8Array {
  const t = new TextEncoder().encode(type)
  return concat(u32(8 + payload.length), t, payload)
}

function buildAvcMp4(): Uint8Array {
  const sample1 = new Uint8Array([0, 0, 0, 4, 0x65, 1, 2, 3])
  const sample2 = new Uint8Array([0, 0, 0, 4, 0x41, 9, 8, 7])
  const mdatPayload = concat(sample1, sample2)
  const ftyp = box('ftyp', concat(
    new TextEncoder().encode('isom'),
    u32(0),
    new TextEncoder().encode('isom'),
    new TextEncoder().encode('avc1'),
  ))

  const avcC = box('avcC', new Uint8Array([
    1, 0x64, 0x00, 0x1f, 0xff,
    0xe1, 0x00, 0x08, 0x67, 0x64, 0x00, 0x1f, 0xaa, 0xbb, 0xcc, 0xdd,
    0x01, 0x00, 0x04, 0x68, 0xee, 0xee, 0xee,
  ]))

  const avc1Body = concat(
    new Uint8Array(6),
    u16(1),
    new Uint8Array(16),
    u16(320),
    u16(180),
    u32(0x00480000),
    u32(0x00480000),
    u32(0),
    u16(1),
    new Uint8Array(32),
    u16(0x0018),
    new Uint8Array([0xff, 0xff]),
    avcC,
  )
  const avc1 = box('avc1', avc1Body)
  const stsd = box('stsd', concat(u32(0), u32(1), avc1))
  const stts = box('stts', concat(u32(0), u32(1), u32(2), u32(512)))
  const stsc = box('stsc', concat(u32(0), u32(1), u32(1), u32(2), u32(1)))
  const stsz = box('stsz', concat(u32(0), u32(0), u32(2), u32(sample1.length), u32(sample2.length)))
  const stss = box('stss', concat(u32(0), u32(1), u32(1)))

  const mdat = box('mdat', mdatPayload)
  const stcoPlaceholder = box('stco', concat(u32(0), u32(1), u32(0)))
  const stbl = box('stbl', concat(stsd, stts, stsc, stsz, stss, stcoPlaceholder))
  const vmhd = box('vmhd', concat(u32(1), u16(0), u16(0), u16(0), u16(0)))
  const dref = box('dref', concat(u32(0), u32(1), box('url ', u32(1))))
  const dinf = box('dinf', dref)
  const minf = box('minf', concat(vmhd, dinf, stbl))
  const hdlr = box('hdlr', concat(
    u32(0),
    u32(0),
    new TextEncoder().encode('vide'),
    u32(0), u32(0), u32(0),
    new TextEncoder().encode('VideoHandler'),
    new Uint8Array([0]),
  ))
  const mdhd = box('mdhd', concat(u32(0), u32(0), u32(0), u32(1024), u32(1024), u32(0)))
  const mdia = box('mdia', concat(mdhd, hdlr, minf))
  const tkhd = box('tkhd', concat(
    u32(0x00000007), u32(0), u32(0), u32(1), u32(0), u32(1024),
    new Uint8Array(8), u16(0), u16(0), u16(0), u16(0),
    new Uint8Array(36),
    u32(320 << 16), u32(180 << 16),
  ))
  const trak = box('trak', concat(tkhd, mdia))
  const mvhd = box('mvhd', concat(
    u32(0), u32(0), u32(0), u32(1024), u32(1024), u32(0x00010000),
    u16(0x0100), u16(0), new Uint8Array(8),
    new Uint8Array(36),
    new Uint8Array(24),
    u32(2),
  ))
  const moov = box('moov', concat(mvhd, trak))

  const withoutStcoFix = concat(ftyp, mdat, moov)
  const mdatPayloadOffset = ftyp.length + 8
  const stcoValue = mdatPayloadOffset
  // Patch the last 4 bytes of the first (only) stco box payload
  const patched = withoutStcoFix.slice()
  const type = new TextDecoder().decode(patched.subarray(0, 4))
  void type
  for (let i = 0; i < patched.length - 8; i++) {
    if (
      patched[i + 4] === 0x73 && patched[i + 5] === 0x74 &&
      patched[i + 6] === 0x63 && patched[i + 7] === 0x6f
    ) {
      const view = new DataView(patched.buffer, patched.byteOffset + i)
      const size = view.getUint32(0)
      view.setUint32(size - 4, stcoValue)
      break
    }
  }
  return patched
}

describe('avcCodecString', () => {
  it('formats profile/compat/level as avc1.PPCCLL', () => {
    expect(avcCodecString(0x64, 0x00, 0x1f)).toBe('avc1.64001f')
  })
})

describe('demuxMp4Video', () => {
  it('returns null for empty input', () => {
    expect(demuxMp4Video(new Uint8Array(0))).toBeNull()
  })

  it('returns null when there is no moov', () => {
    expect(demuxMp4Video(box('ftyp', new TextEncoder().encode('isom')))).toBeNull()
  })

  it('reads AVC samples, timestamps, and the keyframe flag', () => {
    const bytes = buildAvcMp4()
    const demuxed = demuxMp4Video(bytes)
    expect(demuxed).not.toBeNull()
    expect(demuxed!.codec).toBe('avc')
    expect(demuxed!.codecString).toBe('avc1.64001f')
    expect(demuxed!.width).toBe(320)
    expect(demuxed!.height).toBe(180)
    expect(demuxed!.samples).toHaveLength(2)
    expect(demuxed!.samples[0].keyframe).toBe(true)
    expect(demuxed!.samples[1].keyframe).toBe(false)
    expect(demuxed!.samples[0].data).toEqual(new Uint8Array([0, 0, 0, 4, 0x65, 1, 2, 3]))
    expect(demuxed!.samples[1].data).toEqual(new Uint8Array([0, 0, 0, 4, 0x41, 9, 8, 7]))
    expect(demuxed!.samples[0].timestampUs).toBe(0)
    expect(demuxed!.samples[1].timestampUs).toBe(500_000)
    expect(demuxed!.samples[0].durationUs).toBe(500_000)
  })
})
