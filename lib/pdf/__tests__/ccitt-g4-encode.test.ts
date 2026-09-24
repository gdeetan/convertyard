import { describe, it, expect } from 'vitest'
import { encodeG4 } from '../ccitt-g4-encode'

describe('encodeG4', () => {
  it('compresses a solid-white bitmap dramatically', () => {
    const w = 1000, h = 1000
    const rowBytes = Math.ceil(w / 8)
    const packed = new Uint8Array(rowBytes * h).fill(0xFF)
    const encoded = encodeG4(packed, w, h)
    expect(encoded.byteLength).toBeLessThan(packed.byteLength / 10)
  })

  it('produces non-empty small output for solid-black bitmap', () => {
    const w = 32, h = 32
    const rowBytes = Math.ceil(w / 8)
    const packed = new Uint8Array(rowBytes * h)
    const encoded = encodeG4(packed, w, h)
    expect(encoded.byteLength).toBeGreaterThan(0)
    expect(encoded.byteLength).toBeLessThan(64)
  })

  it('is deterministic for identical input', () => {
    const w = 100, h = 100
    const rowBytes = Math.ceil(w / 8)
    const packed = new Uint8Array(rowBytes * h)
    for (let i = 0; i < packed.length; i += 3) packed[i] = 0xFF
    const a = encodeG4(packed, w, h)
    const b = encodeG4(packed, w, h)
    expect(a).toEqual(b)
  })
})
