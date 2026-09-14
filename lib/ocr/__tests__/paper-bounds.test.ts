import { describe, it, expect } from 'vitest'
import { paperBoundsFromProjection } from '@/lib/ocr/preprocessing'

function makeCounts(values: number[]) {
  return Uint16Array.from(values)
}

describe('paperBoundsFromProjection', () => {
  it('returns null when the bright region already fills the frame', () => {
    const w = 100
    const h = 80
    const cols = makeCounts(Array.from({ length: w }, () => h))
    const rows = makeCounts(Array.from({ length: h }, () => w))
    expect(paperBoundsFromProjection(cols, rows, w, h)).toBeNull()
  })

  it('returns null when there is no paper-sized bright run', () => {
    const w = 100
    const h = 80
    const cols = makeCounts(Array.from({ length: w }, () => 0))
    const rows = makeCounts(Array.from({ length: h }, () => 0))
    expect(paperBoundsFromProjection(cols, rows, w, h)).toBeNull()
  })

  it('crops to the largest inset paper rectangle', () => {
    const w = 100
    const h = 80
    const cols = makeCounts(Array.from({ length: w }, (_, x) => (x >= 20 && x <= 79 ? h : 0)))
    const rows = makeCounts(Array.from({ length: h }, (_, y) => (y >= 10 && y <= 69 ? w : 0)))
    const bounds = paperBoundsFromProjection(cols, rows, w, h)
    expect(bounds).not.toBeNull()
    expect(bounds!.x0).toBeLessThanOrEqual(22)
    expect(bounds!.x1).toBeGreaterThanOrEqual(77)
    expect(bounds!.y0).toBeLessThanOrEqual(12)
    expect(bounds!.y1).toBeGreaterThanOrEqual(67)
    const area = (bounds!.x1 - bounds!.x0 + 1) * (bounds!.y1 - bounds!.y0 + 1)
    expect(area).toBeLessThan(w * h * 0.88)
  })
})
