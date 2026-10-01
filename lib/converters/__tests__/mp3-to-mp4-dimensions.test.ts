import { describe, it, expect } from 'vitest'
import { resolveDimensions } from '../mp3-to-mp4-dimensions'

describe('resolveDimensions', () => {
  const cases: Array<[string, string, number, number]> = [
    ['16:9', '720p',  1280, 720],
    ['16:9', '1080p', 1920, 1080],
    ['9:16', '720p',  720,  1280],
    ['9:16', '1080p', 1080, 1920],
    ['1:1',  '720p',  720,  720],
    ['1:1',  '1080p', 1080, 1080],
    ['4:5',  '720p',  864,  1080],
    ['4:5',  '1080p', 1296, 1620],
  ]
  for (const [aspect, res, w, h] of cases) {
    it(`${aspect} @ ${res} → ${w}x${h}`, () => {
      expect(resolveDimensions(aspect, res)).toEqual({ w, h })
    })
  }
  it('all outputs are even', () => {
    for (const [a, r] of cases.map(c => [c[0], c[1]] as const)) {
      const { w, h } = resolveDimensions(a, r)
      expect(w % 2).toBe(0)
      expect(h % 2).toBe(0)
    }
  })
  it('falls back to 16:9 720p on unknown', () => {
    expect(resolveDimensions('weird', 'odd')).toEqual({ w: 1280, h: 720 })
  })
})
