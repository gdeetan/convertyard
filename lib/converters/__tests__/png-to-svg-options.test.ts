import { describe, expect, it } from 'vitest'
import {
  buildTracerOptions,
  edgeSmoothingProfile,
  medianFilter3x3,
  normalizeSupersampledSvg,
  optimizeSvg,
  scaledSize,
  snapAlphaEdges,
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
  it('returns off defaults with no alpha snap', () => {
    expect(edgeSmoothingProfile('off')).toEqual({
      qtres: 1,
      linefilter: false,
      supersample: 1,
      minBlur: 0,
      snapAlpha: 0,
      median: false,
      optimize: false,
    })
  })

  it('escalates qtres, linefilter, supersample, snapAlpha, median, and optimize as level rises', () => {
    expect(edgeSmoothingProfile('low').linefilter).toBe(true)
    expect(edgeSmoothingProfile('low').snapAlpha).toBe(128)
    expect(edgeSmoothingProfile('low').median).toBe(false)
    expect(edgeSmoothingProfile('low').optimize).toBe(true)
    expect(edgeSmoothingProfile('medium').supersample).toBe(2)
    expect(edgeSmoothingProfile('medium').median).toBe(true)
    expect(edgeSmoothingProfile('high').qtres).toBe(3)
    expect(edgeSmoothingProfile('high').minBlur).toBe(2)
    expect(edgeSmoothingProfile('high').snapAlpha).toBe(160)
    expect(edgeSmoothingProfile('high').optimize).toBe(true)
  })

  it('leaves median and optimize disabled when off', () => {
    expect(edgeSmoothingProfile('off').median).toBe(false)
    expect(edgeSmoothingProfile('off').optimize).toBe(false)
  })
})

describe('medianFilter3x3', () => {
  const makeGrid = (rgb: number[][]): ImageData => {
    const side = Math.sqrt(rgb.length)
    const data = new Uint8ClampedArray(rgb.length * 4)
    rgb.forEach(([r, g, b], i) => {
      data[i * 4] = r
      data[i * 4 + 1] = g
      data[i * 4 + 2] = b
      data[i * 4 + 3] = 255
    })
    return { data, width: side, height: side, colorSpace: 'srgb' } as unknown as ImageData
  }

  it('replaces a single noisy center pixel with the surrounding median', () => {
    const grid = makeGrid([
      [10, 10, 10], [10, 10, 10], [10, 10, 10],
      [10, 10, 10], [200, 200, 200], [10, 10, 10],
      [10, 10, 10], [10, 10, 10], [10, 10, 10],
    ])
    medianFilter3x3(grid)
    expect(grid.data[4 * 4]).toBe(10)
    expect(grid.data[4 * 4 + 1]).toBe(10)
    expect(grid.data[4 * 4 + 2]).toBe(10)
  })
})

describe('optimizeSvg', () => {
  it('returns a valid svg string and typically shrinks it', async () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
      '<path d="M 10.0000 10.0000 L 20.0000 20.0000 L 30.0000 30.0000 Z" fill="#ff0000"/>' +
      '<path d="M 40.0000 40.0000 L 50.0000 50.0000 Z" fill="#ff0000"/>' +
      '</svg>'
    const out = await optimizeSvg(input)
    expect(out).toContain('<svg')
    expect(out).toContain('viewBox="0 0 100 100"')
    expect(out.length).toBeLessThan(input.length)
  })

  it('returns the original string when svgo fails', async () => {
    const bad = '<not-svg>'
    const out = await optimizeSvg(bad)
    expect(typeof out).toBe('string')
  })
})

describe('snapAlphaEdges', () => {
  const makePixels = (alphas: number[]): ImageData => {
    const data = new Uint8ClampedArray(alphas.length * 4)
    alphas.forEach((a, i) => {
      data[i * 4 + 0] = 100
      data[i * 4 + 1] = 100
      data[i * 4 + 2] = 100
      data[i * 4 + 3] = a
    })
    return { data, width: alphas.length, height: 1, colorSpace: 'srgb' } as unknown as ImageData
  }

  it('snaps partial alpha to 0 or 255 based on threshold', () => {
    const img = makePixels([0, 40, 128, 200, 255])
    snapAlphaEdges(img, 128)
    expect(Array.from(img.data.filter((_, i) => i % 4 === 3))).toEqual([0, 0, 255, 255, 255])
  })

  it('is a no-op when threshold is 0', () => {
    const img = makePixels([50, 100, 200])
    snapAlphaEdges(img, 0)
    expect(Array.from(img.data.filter((_, i) => i % 4 === 3))).toEqual([50, 100, 200])
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
