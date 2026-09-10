import { describe, expect, it } from 'vitest'
import { buildTracerOptions, scaledSize } from '../png-to-svg-convert'

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
