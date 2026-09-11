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

  it('keeps the latest tick per file so a leftover 100% cannot win over a new 5%', () => {
    const gate = createConversionProgressGate()
    const gen = gate.begin()
    gate.push(gen, 0, 100)
    gate.push(gen, 0, 5)
    expect(gate.drain()).toEqual([[0, 5]])
  })
})

describe('nextProcessingProgress', () => {
  it('does not rewind a completed file to 99% when a late 100% tick arrives', () => {
    expect(nextProcessingProgress('done', 100, 100)).toBeNull()
  })

  it('ignores a leftover 100% tick at the start of a new run so the bar does not jump to 99%', () => {
    expect(nextProcessingProgress('processing', 0, 100)).toBeNull()
  })

  it('caps in-flight progress at 99 so SET_RESULT owns 100', () => {
    expect(nextProcessingProgress('processing', 80, 100)).toBe(99)
  })

  it('never moves backward while a file is still processing', () => {
    expect(nextProcessingProgress('processing', 99, 5)).toBeNull()
  })

  it('keeps tenth-percent updates so a long encode can move the bar', () => {
    expect(nextProcessingProgress('processing', 5, 5.14)).toBe(5.1)
  })
})
