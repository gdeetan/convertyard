import { describe, expect, it } from 'vitest'
import {
  MIN_WINDOW_S,
  SHORT_FILE_WARNING,
  clampSelectedIndex,
  endHandleWrite,
  loopPlayhead,
  resolveWindow,
  shortFileWarning,
  wouldInvert,
} from '../video-to-gif-preview-utils'

describe('resolveWindow', () => {
  it('treats endTime 0 as start through duration', () => {
    expect(resolveWindow(1.5, 0, 10)).toEqual({ start: 1.5, end: 10 })
  })

  it('uses a positive endTime, display-clamped to duration', () => {
    expect(resolveWindow(1, 8, 10)).toEqual({ start: 1, end: 8 })
    expect(resolveWindow(1, 12, 10)).toEqual({ start: 1, end: 10 })
  })

  it('returns a non-inverted display window when start is past duration', () => {
    const w = resolveWindow(10, 0, 5)
    expect(w.end).toBe(5)
    expect(w.start).toBeCloseTo(5 - MIN_WINDOW_S, 5)
    expect(w.start).toBeGreaterThanOrEqual(0)
    expect(w.start).toBeLessThan(w.end)
  })
})

describe('endHandleWrite', () => {
  it('writes duration, not 0, when the out handle is at EOF', () => {
    expect(endHandleWrite(10, 10)).toBe(10)
    expect(endHandleWrite(10.4, 10)).toBe(10)
  })

  it('writes the handle time when it is before EOF', () => {
    expect(endHandleWrite(7.2, 10)).toBe(7.2)
  })
})

describe('shortFileWarning', () => {
  it('is true when start is at or past duration', () => {
    expect(shortFileWarning(10, 0, 5)).toBe(true)
    expect(shortFileWarning(5, 8, 5)).toBe(true)
  })

  it('is true when a stored end is past this file duration', () => {
    expect(shortFileWarning(2, 10, 8)).toBe(true)
  })

  it('is false when endTime 0 means rest of this file', () => {
    expect(shortFileWarning(2, 0, 8)).toBe(false)
  })

  it('is false when the window fits this file', () => {
    expect(shortFileWarning(2, 7, 8)).toBe(false)
  })

  it('exposes the user-facing copy', () => {
    expect(SHORT_FILE_WARNING).toBe(
      'This clip is shorter than the trim window. Conversion will use what this file has.',
    )
  })
})

describe('loopPlayhead', () => {
  it('snaps to start when currentTime reaches or passes end', () => {
    expect(loopPlayhead(7, 2, 7)).toBe(2)
    expect(loopPlayhead(7.2, 2, 7)).toBe(2)
  })

  it('leaves the playhead unchanged inside the window', () => {
    expect(loopPlayhead(4.1, 2, 7)).toBe(4.1)
  })
})

describe('wouldInvert', () => {
  it('is true for a span under the 0.1s minimum window', () => {
    expect(wouldInvert(1, 1.05)).toBe(true)
  })

  it('is false for a 0.1s or wider span', () => {
    expect(wouldInvert(1, 1.1)).toBe(false)
    expect(wouldInvert(1, 4)).toBe(false)
  })
})

describe('clampSelectedIndex', () => {
  it('clamps when the list shrinks', () => {
    expect(clampSelectedIndex(4, 2)).toBe(1)
  })

  it('returns 0 when length is 0', () => {
    expect(clampSelectedIndex(3, 0)).toBe(0)
  })

  it('keeps a still-valid index', () => {
    expect(clampSelectedIndex(1, 3)).toBe(1)
  })
})
