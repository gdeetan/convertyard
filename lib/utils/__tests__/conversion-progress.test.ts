import { describe, expect, it } from 'vitest'

import {
  createConversionProgressGate,
  nextProcessingProgress,
} from '../conversion-progress'

describe('createConversionProgressGate', () => {
  it('drops queued 100% ticks from a finished conversion so a retry does not start at 99%', () => {
    const gate = createConversionProgressGate()
    const first = gate.begin()
    gate.push(first, 0, 100)

    const second = gate.begin()
    expect(gate.drain()).toEqual([])

    gate.push(second, 0, 5)
    expect(gate.drain()).toEqual([[0, 5]])
  })

  it('ignores progress from a conversion that was reset', () => {
    const gate = createConversionProgressGate()
    const gen = gate.begin()
    gate.invalidate()
    gate.push(gen, 0, 100)
    expect(gate.drain()).toEqual([])
  })
})

describe('nextProcessingProgress', () => {
  it('does not rewind a completed file to 99% when a late 100% tick arrives', () => {
    expect(nextProcessingProgress('done', 100, 100)).toBeNull()
  })

  it('caps in-flight progress at 99 so SET_RESULT owns 100', () => {
    expect(nextProcessingProgress('processing', 0, 100)).toBe(99)
  })

  it('never moves backward while a file is still processing', () => {
    expect(nextProcessingProgress('processing', 99, 5)).toBeNull()
  })
})
