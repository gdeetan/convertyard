import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import {
  applyRotationSize,
  buildPdfMetadata,
  captionText,
  downsampleSize,
  fitImageOnPage,
  heicToPdf,
  nextSizeAttempt,
  pageSizePoints,
  resolveHeicPdfOptions,
  selectHeicFrames,
  sortFilesByExifDate,
  type DecodedHeicFrame,
  type RasterizedFrame,
} from '../heic-to-pdf'

const PNG_1x1 = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
  0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x03, 0x00, 0x01, 0x18, 0xd8, 0x17, 0x19, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
])

function heicFile(name: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/heic' })
}

function frame(width = 100, height = 80): DecodedHeicFrame {
  return { blob: new Blob([PNG_1x1], { type: 'image/png' }), width, height }
}

async function rasterize(src: DecodedHeicFrame): Promise<RasterizedFrame> {
  return { bytes: PNG_1x1, width: src.width, height: src.height, kind: 'png' }
}

describe('resolveHeicPdfOptions', () => {
  it('defaults to combined output, share quality, and GPS stripped', () => {
    const opts = resolveHeicPdfOptions({})
    expect(opts.outputMode).toBe('all-in-one')
    expect(opts.pageSize).toBe('a4')
    expect(opts.orientation).toBe('auto')
    expect(opts.margin).toBe('small')
    expect(opts.jpegQuality).toBe(0.8)
    expect(opts.maxEdge).toBe(2048)
    expect(opts.captions).toBe('none')
    expect(opts.stripGps).toBe(true)
    expect(opts.livePhoto).toBe('still')
    expect(opts.targetBytes).toBe(0)
  })

  it('maps print / share / portal presets', () => {
    expect(resolveHeicPdfOptions({ qualityPreset: 'print' })).toMatchObject({
      jpegQuality: 0.92,
      maxEdge: 0,
    })
    expect(resolveHeicPdfOptions({ qualityPreset: 'portal' })).toMatchObject({
      jpegQuality: 0.72,
      maxEdge: 1600,
    })
  })

  it('accepts legacy combined / per-image output values', () => {
    expect(resolveHeicPdfOptions({ outputMode: 'combined' }).outputMode).toBe('all-in-one')
    expect(resolveHeicPdfOptions({ outputMode: 'per-image' }).outputMode).toBe('one-per-image')
  })

  it('accepts legacy A4 / Letter page sizes', () => {
    expect(resolveHeicPdfOptions({ pageSize: 'A4' }).pageSize).toBe('a4')
    expect(resolveHeicPdfOptions({ pageSize: 'Letter' }).pageSize).toBe('letter')
  })

  it('turns maxSizeKb into a byte target', () => {
    expect(resolveHeicPdfOptions({ maxSizeKb: 2048 }).targetBytes).toBe(2048 * 1024)
    expect(resolveHeicPdfOptions({ maxSizeKb: 0 }).targetBytes).toBe(0)
  })
})

describe('pageSizePoints', () => {
  it('returns A4, Letter, and Legal in PDF points', () => {
    expect(pageSizePoints('a4', 100, 200, 'portrait')).toEqual([595.28, 841.89])
    expect(pageSizePoints('letter', 100, 200, 'portrait')).toEqual([612, 792])
    expect(pageSizePoints('legal', 100, 200, 'portrait')).toEqual([612, 1008])
  })

  it('sizes the page to the image for fit-to-image', () => {
    expect(pageSizePoints('fit-to-image', 1920, 1080, 'auto')).toEqual([1920, 1080])
  })

  it('auto-orients standard paper to match a landscape image', () => {
    const [w, h] = pageSizePoints('a4', 4000, 3000, 'auto')
    expect(w).toBeGreaterThan(h)
  })

  it('forces landscape even for a tall image', () => {
    const [w, h] = pageSizePoints('letter', 100, 400, 'landscape')
    expect(w).toBeGreaterThan(h)
  })
})

describe('fitImageOnPage', () => {
  it('centers the image inside the margin box', () => {
    const placed = fitImageOnPage(200, 100, 400, 400, 20)
    expect(placed.width).toBe(360)
    expect(placed.height).toBe(180)
    expect(placed.x).toBe(20)
    expect(placed.y).toBe(110)
  })

  it('uses the full page when margin is 0', () => {
    const placed = fitImageOnPage(100, 50, 200, 100, 0)
    expect(placed).toEqual({ width: 200, height: 100, x: 0, y: 0 })
  })
})

describe('downsampleSize', () => {
  it('leaves dimensions unchanged when maxEdge is 0', () => {
    expect(downsampleSize(4000, 3000, 0)).toEqual({ width: 4000, height: 3000 })
  })

  it('scales the long edge down and keeps aspect ratio', () => {
    expect(downsampleSize(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 })
    expect(downsampleSize(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 })
  })

  it('does not upscale', () => {
    expect(downsampleSize(800, 600, 2000)).toEqual({ width: 800, height: 600 })
  })
})

describe('applyRotationSize', () => {
  it('swaps sides for 90 and 270 degrees', () => {
    expect(applyRotationSize(4000, 3000, 90)).toEqual({ width: 3000, height: 4000 })
    expect(applyRotationSize(4000, 3000, 270)).toEqual({ width: 3000, height: 4000 })
    expect(applyRotationSize(4000, 3000, 180)).toEqual({ width: 4000, height: 3000 })
    expect(applyRotationSize(4000, 3000, 0)).toEqual({ width: 4000, height: 3000 })
  })
})

describe('captionText', () => {
  it('returns nothing when captions are off', () => {
    expect(captionText('none', 'IMG_1.HEIC', new Date('2024-06-01'))).toBeNull()
  })

  it('uses the basename for filename captions', () => {
    expect(captionText('filename', 'Holiday/IMG_4032.HEIC', undefined)).toBe('IMG_4032')
  })

  it('formats EXIF dates as YYYY-MM-DD', () => {
    expect(captionText('date', 'IMG_1.HEIC', new Date('2026-03-15T12:00:00Z'))).toBe('2026-03-15')
  })
})

describe('selectHeicFrames', () => {
  it('keeps only the first still by default', () => {
    expect(selectHeicFrames([1, 2, 3], 'still')).toEqual([1])
  })

  it('keeps every still for Live Photo / burst files', () => {
    expect(selectHeicFrames(['a', 'b'], 'all-stills')).toEqual(['a', 'b'])
  })
})

describe('sortFilesByExifDate', () => {
  it('orders by EXIF date, then lastModified, then original index', () => {
    const jan1 = Date.parse('2024-01-01T00:00:00Z')
    const jan2 = Date.parse('2024-01-02T00:00:00Z')
    const jan3 = Date.parse('2024-01-03T00:00:00Z')
    const a = new File(['a'], 'a.heic', { lastModified: jan2 })
    const b = new File(['b'], 'b.heic', { lastModified: jan2 })
    const c = new File(['c'], 'c.heic', { lastModified: jan2 })
    const sorted = sortFilesByExifDate(
      [a, b, c],
      [new Date(jan3), undefined, new Date(jan1)],
    )
    expect(sorted.map((f) => f.name)).toEqual(['c.heic', 'b.heic', 'a.heic'])
  })
})

describe('buildPdfMetadata', () => {
  it('omits GPS when stripGps is on', () => {
    expect(
      buildPdfMetadata({
        stripGps: true,
        title: 'album',
        latitude: 1.3,
        longitude: 103.8,
      }),
    ).toEqual({ title: 'album' })
  })

  it('records GPS in keywords when stripGps is off', () => {
    const meta = buildPdfMetadata({
      stripGps: false,
      title: 'album',
      latitude: 1.3,
      longitude: 103.8,
    })
    expect(meta.keywords).toContain('1.3')
    expect(meta.keywords).toContain('103.8')
  })
})

describe('nextSizeAttempt', () => {
  it('drops quality and long-edge until a floor', () => {
    expect(nextSizeAttempt(0.8, 2048)).toEqual({ jpegQuality: 0.72, maxEdge: 1741 })
    expect(nextSizeAttempt(0.4, 400).jpegQuality).toBe(0.4)
  })
})

describe('heicToPdf', () => {
  const deps = {
    decodeHeic: async () => [frame()],
    readExif: async () => ({}),
    rasterize,
  }

  it('combines images into one PDF by default', async () => {
    const results = await heicToPdf(
      [heicFile('a.heic'), heicFile('b.heic')],
      {},
      undefined,
      undefined,
      deps,
    )
    expect(results).toHaveLength(1)
    const file = results[0] as File
    expect(file.name).toBe('heic-combined.pdf')
    const doc = await PDFDocument.load(await file.arrayBuffer())
    expect(doc.getPageCount()).toBe(2)
  })

  it('creates one PDF per image', async () => {
    const results = await heicToPdf(
      [heicFile('one.heic'), heicFile('two.heic')],
      { outputMode: 'one-per-image' },
      undefined,
      undefined,
      deps,
    )
    expect(results).toHaveLength(2)
    expect((results[0] as File).name).toBe('one.pdf')
    expect((results[1] as File).name).toBe('two.pdf')
  })

  it('uses Legal page size', async () => {
    const results = await heicToPdf(
      [heicFile('a.heic')],
      { pageSize: 'legal', orientation: 'portrait' },
      undefined,
      undefined,
      deps,
    )
    const doc = await PDFDocument.load(await (results[0] as File).arrayBuffer())
    const { width, height } = doc.getPage(0).getSize()
    expect(width).toBe(612)
    expect(height).toBe(1008)
  })

  it('returns an Error per failed file in one-per-image mode', async () => {
    const results = await heicToPdf(
      [heicFile('bad.heic')],
      { outputMode: 'per-image' },
      undefined,
      undefined,
      {
        decodeHeic: async () => { throw new Error('decode failed') },
        readExif: async () => ({}),
        rasterize,
      },
    )
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toBe('decode failed')
  })

  it('keeps successful pages and notices skipped files in combined mode', async () => {
    const results = await heicToPdf(
      [heicFile('good.heic'), heicFile('bad.heic')],
      { outputMode: 'combined' },
      undefined,
      undefined,
      {
        decodeHeic: async (file) => {
          if (file.name.startsWith('bad')) throw new Error('nope')
          return [frame()]
        },
        readExif: async () => ({}),
        rasterize,
      },
    )
    expect(results).toHaveLength(1)
    const row = results[0] as { file: File; notice: string }
    expect(row.file).toBeInstanceOf(File)
    expect(row.notice).toContain('bad.heic')
    const doc = await PDFDocument.load(await row.file.arrayBuffer())
    expect(doc.getPageCount()).toBe(1)
  })

  it('expands Live Photo stills into extra pages', async () => {
    const results = await heicToPdf(
      [heicFile('live.heic')],
      { livePhoto: 'all-stills' },
      undefined,
      undefined,
      {
        decodeHeic: async () => [frame(10, 10), frame(12, 12)],
        readExif: async () => ({}),
        rasterize,
      },
    )
    const doc = await PDFDocument.load(await (results[0] as File).arrayBuffer())
    expect(doc.getPageCount()).toBe(2)
  })

  it('omits GPS keywords when stripGps is on', async () => {
    const results = await heicToPdf(
      [heicFile('geo.heic')],
      { stripGps: true },
      undefined,
      undefined,
      {
        decodeHeic: async () => [frame()],
        readExif: async () => ({ latitude: 1.3, longitude: 103.8 }),
        rasterize,
      },
    )
    const doc = await PDFDocument.load(await (results[0] as File).arrayBuffer())
    expect(doc.getKeywords()).toBeUndefined()
  })

  it('writes GPS keywords when stripGps is off', async () => {
    const results = await heicToPdf(
      [heicFile('geo.heic')],
      { stripGps: false },
      undefined,
      undefined,
      {
        decodeHeic: async () => [frame()],
        readExif: async () => ({ latitude: 1.3, longitude: 103.8 }),
        rasterize,
      },
    )
    const doc = await PDFDocument.load(await (results[0] as File).arrayBuffer())
    expect(String(doc.getKeywords())).toContain('1.3')
  })
})
