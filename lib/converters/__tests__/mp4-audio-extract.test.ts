import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { adtsFrame, extractMp4AacAdts, looksLikeMp4, parseAacConfig } from '../mp4-audio-extract'

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
  return concat(u32(8 + payload.length), new TextEncoder().encode(type), payload)
}

describe('parseAacConfig', () => {
  it('reads AAC-LC 48 kHz stereo from an esds payload', () => {
    const esds = new Uint8Array([
      0, 0, 0, 0,
      3, 0x80, 0x80, 0x80, 0x25, 0, 2, 0,
      4, 0x80, 0x80, 0x80, 0x17, 0x40, 0x15, 0, 0, 0, 0, 2, 0xee, 0, 0, 2, 0xd0, 0x60,
      5, 0x80, 0x80, 0x80, 5, 0x11, 0x90, 0x56, 0xe5, 0,
      6, 0x80, 0x80, 0x80, 1, 2,
    ])
    expect(parseAacConfig(esds)).toEqual({ objectType: 2, sampleRateIndex: 3, channels: 2 })
  })
})

describe('adtsFrame', () => {
  it('prefixes an AAC access unit with a 7-byte ADTS header', () => {
    const frame = adtsFrame({ objectType: 2, sampleRateIndex: 3, channels: 2 }, new Uint8Array([1, 2, 3, 4]))
    expect(frame[0]).toBe(0xff)
    expect(frame[1]).toBe(0xf1)
    expect(frame.length).toBe(11)
  })
})

describe('looksLikeMp4', () => {
  it('accepts camera MP4/MOV names and MIME types', () => {
    expect(looksLikeMp4({ name: 'VID_001.mp4', type: '' })).toBe(true)
    expect(looksLikeMp4({ name: 'video', type: 'video/quicktime' })).toBe(true)
    expect(looksLikeMp4({ name: 'clip.webm', type: 'video/webm' })).toBe(false)
  })
})

function ascii(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function buildMovWithWaveEsds(): Uint8Array {
  const sample = new Uint8Array([0x21, 0x10, 0x04, 0x60, 0x8c])
  const ftyp = box('ftyp', concat(ascii('qt  '), u32(0), ascii('qt  ')))
  const mdat = box('mdat', sample)
  const sampleOffset = ftyp.length + 8
  const esds = box('esds', concat(
    u32(0),
    new Uint8Array([
      3, 0x80, 0x80, 0x80, 0x16,
      0, 2, 0,
      4, 0x80, 0x80, 0x80, 0x0e,
      0x40, 0x15, 0, 0, 0, 0, 0, 0, 0, 0,
      5, 0x80, 0x80, 0x80, 2,
      0x11, 0x90,
    ]),
  ))
  const wave = box('wave', concat(box('frma', ascii('mp4a')), esds))
  const mp4a = box('mp4a', concat(
    new Uint8Array(6),
    u16(1),
    new Uint8Array(8),
    u16(2),
    u16(16),
    u16(0),
    u16(0),
    u32(0xbb800000),
    wave,
  ))
  const stsd = box('stsd', concat(u32(0), u32(1), mp4a))
  const stbl = box('stbl', concat(
    stsd,
    box('stts', concat(u32(0), u32(1), u32(1), u32(1024))),
    box('stsc', concat(u32(0), u32(1), u32(1), u32(1), u32(1))),
    box('stsz', concat(u32(0), u32(0), u32(1), u32(sample.length))),
    box('stco', concat(u32(0), u32(1), u32(sampleOffset))),
  ))
  const minf = box('minf', concat(
    box('smhd', concat(u32(0), u16(0), u16(0))),
    box('dinf', box('dref', concat(u32(0), u32(1), box('url ', u32(1))))),
    stbl,
  ))
  const mdia = box('mdia', concat(
    box('mdhd', concat(u32(0), u32(0), u32(0), u32(48000), u32(1024), u32(0x55c40000))),
    box('hdlr', concat(u32(0), u32(0), ascii('soun'), u32(0), u32(0), u32(0), ascii('SoundHandler'), new Uint8Array([0]))),
    minf,
  ))
  const trak = box('trak', concat(
    box('tkhd', concat(u32(0), u32(0), u32(0), u32(1), u32(0), u32(1024), new Uint8Array(44))),
    mdia,
  ))
  const moov = box('moov', concat(
    box('mvhd', concat(u32(0), u32(0), u32(0), u32(1000), u32(21), new Uint8Array(76))),
    trak,
  ))
  return concat(ftyp, mdat, moov)
}

describe('extractMp4AacAdts', () => {
  it('returns null when there is no audio track', () => {
    const ftyp = box('ftyp', concat(new TextEncoder().encode('isom'), u32(0)))
    expect(extractMp4AacAdts(concat(ftyp, box('moov', new Uint8Array(8))))).toBeNull()
  })

  it('finds AAC inside a QuickTime wave atom (iPhone MOV)', () => {
    const adts = extractMp4AacAdts(buildMovWithWaveEsds())
    expect(adts).not.toBeNull()
    expect(adts![0]).toBe(0xff)
    expect(adts![1] & 0xf0).toBe(0xf0)
    expect(adts!.length).toBeGreaterThan(7)
  })

  it('extracts ADTS from a real MP4 with an AAC track when the fixture exists', () => {
    const path = 'FLV Sampls/flv-to-mp4-converted/sample_960x400_ocean_with_audio.mp4'
    if (!existsSync(path)) return
    const adts = extractMp4AacAdts(new Uint8Array(readFileSync(path)))
    expect(adts).not.toBeNull()
    expect(adts![0]).toBe(0xff)
    expect(adts![1] & 0xf0).toBe(0xf0)
    expect(adts!.length).toBeGreaterThan(10_000)
  })
})
