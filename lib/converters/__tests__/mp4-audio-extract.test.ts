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

describe('extractMp4AacAdts', () => {
  it('returns null when there is no audio track', () => {
    const ftyp = box('ftyp', concat(new TextEncoder().encode('isom'), u32(0)))
    expect(extractMp4AacAdts(concat(ftyp, box('moov', new Uint8Array(8))))).toBeNull()
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
