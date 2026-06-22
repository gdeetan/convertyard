import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

vi.mock('../mupdf-client', () => ({
  getPageCount: vi.fn(),
  renderPage: vi.fn(),
  renderPagePng: vi.fn(),
  extractText: vi.fn(),
  extractStructuredText: vi.fn(),
  getPageSizes: vi.fn(),
  unlockPdf: vi.fn(),
  protectPdf: vi.fn(),
}))

const { getPageCount, renderPage } = await import('../mupdf-client')
const { pdfToJpg } = await import('../pdf')

function fixture(name: string): File {
  const buf = readFileSync(resolve(process.cwd(), 'test-fixtures/pdf', name))
  return new File([buf], name, { type: 'application/pdf' })
}

describe('pdfToJpg', () => {
  beforeEach(() => {
    vi.mocked(getPageCount).mockResolvedValue(3)
    vi.mocked(renderPage).mockResolvedValue(new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]).buffer as ArrayBuffer)
  })

  it('produces one JPEG per page', async () => {
    const results = await pdfToJpg([fixture('normal-10-page.pdf')], {})
    expect(results).toHaveLength(3)
    results.forEach(r => {
      expect(r).toBeInstanceOf(File)
      expect((r as File).type).toBe('image/jpeg')
    })
  })

  it('names single-page output without page suffix', async () => {
    vi.mocked(getPageCount).mockResolvedValue(1)
    const results = await pdfToJpg([fixture('single-page.pdf')], {})
    expect((results[0] as File).name).toBe('single-page.jpg')
  })

  it('names multi-page output with page number suffix', async () => {
    const results = await pdfToJpg([fixture('normal-10-page.pdf')], {})
    expect((results[0] as File).name).toBe('normal-10-page-page-1.jpg')
    expect((results[2] as File).name).toBe('normal-10-page-page-3.jpg')
  })

  it('returns Error (not throw) when getPageCount rejects', async () => {
    vi.mocked(getPageCount).mockRejectedValue(new Error('not a valid PDF'))
    const results = await pdfToJpg([fixture('zero-byte.pdf')], {})
    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('processes multiple files and calls onProgress', async () => {
    vi.mocked(getPageCount).mockResolvedValue(1)
    const progress: Array<[number, number]> = []
    const results = await pdfToJpg(
      [fixture('single-page.pdf'), fixture('normal-10-page.pdf')],
      {},
      (idx, pct) => progress.push([idx, pct])
    )
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(2)
    expect(progress.length).toBeGreaterThan(0)
  })

  it('uses dpi and quality options', async () => {
    vi.mocked(getPageCount).mockResolvedValue(1)
    await pdfToJpg([fixture('single-page.pdf')], { dpi: 300, quality: 95 })
    expect(vi.mocked(renderPage)).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      0,
      300,
      95
    )
  })
})
