import { describe, expect, it } from 'vitest'
import { mixToMono, isCancelError, CaptionCancelledError, throwIfAborted } from '../audio-decode'

function fakeBuffer(channels: Float32Array[]): {
  numberOfChannels: number
  length: number
  getChannelData: (i: number) => Float32Array
} {
  return {
    numberOfChannels: channels.length,
    length: channels[0].length,
    getChannelData: (i) => channels[i],
  }
}

describe('mixToMono', () => {
  it('copies a single channel', () => {
    const src = new Float32Array([0.2, -0.4, 0.6])
    const out = mixToMono(fakeBuffer([src]))
    expect(out).toEqual(new Float32Array([0.2, -0.4, 0.6]))
    expect(out).not.toBe(src)
  })

  it('averages stereo channels', () => {
    const out = mixToMono(fakeBuffer([
      new Float32Array([1, 0.5, 0]),
      new Float32Array([-1, 0.5, 1]),
    ]))
    expect(Array.from(out)).toEqual([0, 0.5, 0.5])
  })
})

describe('cancel helpers', () => {
  it('detects CaptionCancelledError and abort-like messages', () => {
    expect(isCancelError(new CaptionCancelledError())).toBe(true)
    expect(isCancelError(Object.assign(new Error('ffmpeg terminated'), { name: 'Error' }))).toBe(true)
    expect(isCancelError(new Error('burn failed'))).toBe(false)
  })

  it('throwIfAborted only throws when the signal is aborted', () => {
    const c = new AbortController()
    expect(() => throwIfAborted(c.signal)).not.toThrow()
    c.abort()
    expect(() => throwIfAborted(c.signal)).toThrow(CaptionCancelledError)
  })
})
