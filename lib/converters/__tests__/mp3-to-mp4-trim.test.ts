import { describe, it, expect } from 'vitest'
import { buildTrimArgs } from '../mp3-to-mp4-trim'

describe('buildTrimArgs', () => {
  it('returns [] when both zero', () => {
    expect(buildTrimArgs('00:00:00', '00:00:00')).toEqual([])
  })
  it('start only', () => {
    expect(buildTrimArgs('00:00:10', '00:00:00')).toEqual(['-ss', '00:00:10'])
  })
  it('end only', () => {
    expect(buildTrimArgs('00:00:00', '00:01:00')).toEqual(['-to', '00:01:00'])
  })
  it('both set', () => {
    expect(buildTrimArgs('00:00:10', '00:01:00')).toEqual(['-ss', '00:00:10', '-to', '00:01:00'])
  })
  it('treats empty/undefined as zero', () => {
    expect(buildTrimArgs('', '')).toEqual([])
    expect(buildTrimArgs(undefined as unknown as string, undefined as unknown as string)).toEqual([])
  })
})
