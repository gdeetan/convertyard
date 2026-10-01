import { describe, it, expect } from 'vitest'
import { buildFilterComplex } from '../mp3-to-mp4-filter'

const base = {
  w: 1280, h: 720,
  bgType: 'black' as const,
  bgColor: '#000000',
  waveform: 'none' as const,
  captions: false,
  captionAssName: null,
}

describe('buildFilterComplex', () => {
  it('black background, no waveform, no captions → aliases [0:v] to [v]', () => {
    const out = buildFilterComplex(base)
    expect(out.filter).toContain('[0:v]null[bg]')
    expect(out.vMap).toBe('[v]')
    expect(out.aMap).toBe('1:a')
  })
  it('bar waveform centers when captions off', () => {
    const out = buildFilterComplex({ ...base, waveform: 'bar' })
    expect(out.filter).toContain('showwaves')
    expect(out.filter).toContain('mode=p2p')
    expect(out.vMap).toBe('[v]')
  })
  it('image bg uses blur-fill (scale cover + boxblur + centered overlay)', () => {
    const out = buildFilterComplex({ ...base, bgType: 'image' })
    expect(out.filter).toContain('boxblur')
    expect(out.filter).toContain('force_original_aspect_ratio=increase')
    expect(out.filter).toContain('force_original_aspect_ratio=decrease')
  })
  it('captions on burns ass file last', () => {
    const out = buildFilterComplex({ ...base, captions: true, captionAssName: 'subs_0.ass' })
    expect(out.filter).toContain("ass='subs_0.ass'")
    expect(out.filter.trim().endsWith('[v]')).toBe(true)
  })
  it('captions + waveform → waveform anchored top', () => {
    const out = buildFilterComplex({
      ...base, waveform: 'line', captions: true, captionAssName: 'subs_0.ass',
    })
    expect(out.filter).toContain('overlay=0:0')
  })
})
