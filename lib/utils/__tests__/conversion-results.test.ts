import { describe, expect, it } from 'vitest'

import { resultRowPresentation, returnedResultsToDispatch } from '../conversion-results'

describe('returnedResultsToDispatch', () => {
  it('applies every returned result, even when the tool also has a streaming onResult', () => {
    const ok = new File([new Uint8Array([1, 2, 3])], 'out.jpg', { type: 'image/jpeg' })
    const fail = new Error('tile failed')

    expect(returnedResultsToDispatch([ok, fail])).toEqual([
      { fileIndex: 0, result: ok },
      { fileIndex: 1, result: fail },
    ])
  })

  it('skips holes so a convertFn that only streamed some files can still return a sparse array', () => {
    const ok = new File([new Uint8Array([1])], 'out.png', { type: 'image/png' })
    expect(returnedResultsToDispatch([undefined, ok, null])).toEqual([
      { fileIndex: 1, result: ok },
    ])
  })
})

describe('resultRowPresentation', () => {
  it('does not treat an in-progress file as a conversion error', () => {
    expect(resultRowPresentation({ status: 'processing', progress: 100 })).toBe('pending')
    expect(resultRowPresentation({ status: 'pending', progress: 0 })).toBe('pending')
  })

  it('marks done files with a result as success and explicit failures as errors', () => {
    const result = new File([new Uint8Array([1])], 'out.jpg', { type: 'image/jpeg' })
    expect(resultRowPresentation({ status: 'done', progress: 100, result })).toBe('success')
    expect(resultRowPresentation({ status: 'error', progress: 100, error: 'boom' })).toBe('error')
  })
})
