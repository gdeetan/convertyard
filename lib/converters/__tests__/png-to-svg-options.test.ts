import { describe, expect, it } from 'vitest'
import {
  buildTracerOptions,
  edgeSmoothingProfile,
  normalizeSupersampledSvg,
  scaledSize,
} from '../png-to-svg-convert'

describe('buildTracerOptions', () => {
  it('uses defaults when options are empty', () => {
    expect(buildTracerOptions({})).toMatchObject({
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      numberofcolors: 16,
      blurradius: 0,
      colorsampling: 2,
      scale: 1,
      strokewidth: 1,
    })
  })

  it('maps blur radio values to ImageTracer radii', () => {
    expect(buildTracerOptions({ blurradius: 'off' }).blurradius).toBe(0)
    expect(buildTracerOptions({ blurradius: 'low' }).blurradius).toBe(2)
    expect(buildTracerOptions({ blurradius: 'medium' }).blurradius).toBe(5)
  })

  it('passes through numeric trace sliders', () => {
    expect(
      buildTracerOptions({ numberofcolors: 8, pathomit: 12, ltres: 0.5, qtres: 0.5 }),
    ).toMatchObject({
      numberofcolors: 8,
      pathomit: 12,
      ltres: 0.5,
      qtres: 0.5,
    })
  })
})

describe('edgeSmoothingProfile', () => {
  it('returns off defaults', () => {
    expect(edgeSmoothingProfile('off')).toEqual({ qtres: 1, linefilter: false, supersample: 1, minBlur: 0 })
  })

  it('escalates qtres, linefilter, and supersample as level rises', () => {
    expect(edgeSmoothingProfile('low').linefilter).toBe(true)
    expect(edgeSmoothingProfile('medium').supersample).toBe(2)
    expect(edgeSmoothingProfile('high').qtres).toBe(3)
    expect(edgeSmoothingProfile('high').minBlur).toBe(2)
  })
})

describe('edge smoothing in buildTracerOptions', () => {
  it('applies linefilter and higher qtres when edgesmoothing is high', () => {
    const out = buildTracerOptions({ edgesmoothing: 'high' })
    expect(out.linefilter).toBe(true)
    expect(out.qtres).toBe(3)
    expect(out.blurradius).toBe(2)
  })

  it('keeps user blur if it exceeds the smoothing floor', () => {
    const out = buildTracerOptions({ edgesmoothing: 'medium', blurradius: 'medium' })
    expect(out.blurradius).toBe(5)
  })
})

describe('normalizeSupersampledSvg', () => {
  it('rewrites width and height back to source size', () => {
    const svg = '<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><path/></svg>'
    const out = normalizeSupersampledSvg(svg, 100, 50, 200, 100)
    expect(out).toContain('width="100"')
    expect(out).toContain('height="50"')
    expect(out).toContain('viewBox="0 0 200 100"')
  })
})

describe('scaledSize', () => {
  it('leaves images within the max edge unchanged', () => {
    expect(scaledSize(800, 600, 1200)).toEqual({ width: 800, height: 600 })
  })

  it('scales the long edge down to maxEdge', () => {
    expect(scaledSize(2400, 1200, 1200)).toEqual({ width: 1200, height: 600 })
  })

  it('skips scaling when maxEdge is omitted', () => {
    expect(scaledSize(4000, 2000)).toEqual({ width: 4000, height: 2000 })
  })
})
