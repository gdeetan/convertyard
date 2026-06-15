import { describe, it, expect } from 'vitest'
import { clusterValues } from '../pdf-to-word'

describe('clusterValues', () => {
  it('groups values within tolerance', () => {
    const result = clusterValues([10, 12, 50, 53, 100], 5)
    expect(result).toEqual([[10, 12], [50, 53], [100]])
  })

  it('returns empty array for empty input', () => {
    expect(clusterValues([], 10)).toEqual([])
  })

  it('single value makes one cluster', () => {
    expect(clusterValues([42], 10)).toEqual([[42]])
  })

  it('all values in one cluster when within tolerance', () => {
    expect(clusterValues([1, 3, 5], 5)).toEqual([[1, 3, 5]])
  })

  it('exact tolerance boundary: values exactly tolerance apart are in same cluster', () => {
    expect(clusterValues([0, 10], 10)).toEqual([[0, 10]])
  })

  it('values tolerance+1 apart are in different clusters', () => {
    expect(clusterValues([0, 11], 10)).toEqual([[0], [11]])
  })

  it('sorts input before clustering', () => {
    const result = clusterValues([100, 10, 50], 5)
    expect(result).toEqual([[10], [50], [100]])
  })
})
