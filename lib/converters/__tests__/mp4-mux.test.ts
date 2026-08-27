import { describe, it, expect } from 'vitest'

// jsdom lacks WebCodecs; stub EncodedVideoChunk so mp4-muxer's instanceof check passes.
if (typeof (globalThis as { EncodedVideoChunk?: unknown }).EncodedVideoChunk === 'undefined') {
  class EncodedVideoChunkStub {
    type: 'key' | 'delta'
    timestamp: number
    duration: number
    byteLength: number
    private _data: Uint8Array
    constructor(init: { type: 'key' | 'delta'; timestamp: number; duration: number; data: Uint8Array }) {
      this.type = init.type
      this.timestamp = init.timestamp
      this.duration = init.duration
      this._data = init.data
      this.byteLength = init.data.byteLength
    }
    copyTo(dst: Uint8Array) {
      dst.set(this._data)
    }
  }
  ;(globalThis as { EncodedVideoChunk?: unknown }).EncodedVideoChunk = EncodedVideoChunkStub
}

import { createAvcMuxer, createHevcMuxer } from '../mp4-mux'

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
    expect(types.indexOf('moov')).toBeLessThan(types.indexOf('mdat'))
  })
})
