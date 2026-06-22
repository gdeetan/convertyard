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

const { getPageCount, renderPagePng } = await import('../mupdf-client')
const { pdfToPng } = await import('../pdf')

function fixture(name: string): File {
  const buf = readFileSync(resolve(process.cwd(), 'test-fixtures/pdf', name))
  return new File([buf], name, { type: 'application/pdf' })
}

const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4E, 0x47])

describe('pdfToPng', () => {
  beforeEach(() => {
    vi.mocked(getPageCount).mockResolvedValue(3)
    vi.mocked(renderPagePng).mockResolvedValue(PNG_HEADER.buffer.slice(0) as ArrayBuffer)
  })

  it('produces one PNG per page', async () => {
    const results = await pdfToPng([fixture('normal-10-page.pdf')], {})
    expect(results).toHaveLength(3)
    results.forEach(r => {
      expect(r).toBeInstanceOf(File)
      expect((r as File).type).toBe('image/png')
    })
  })

  it('names single-page output without page suffix', async () => {
    vi.mocked(getPageCount).mockResolvedValue(1)
    const results = await pdfToPng([fixture('single-page.pdf')], {})
    expect((results[0] as File).name).toBe('single-page.png')
  })

  it('names multi-page output with page number suffix', async () => {
    const results = await pdfToPng([fixture('normal-10-page.pdf')], {})
    expect((results[0] as File).name).toBe('normal-10-page-page-1.png')
  })

  it('returns Error when getPageCount rejects', async () => {
    vi.mocked(getPageCount).mockRejectedValue(new Error('corrupt PDF'))
    const results = await pdfToPng([fixture('zero-byte.pdf')], {})
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('returns Error when pageFrom exceeds page count', async () => {
    vi.mocked(getPageCount).mockResolvedValue(2)
    const results = await pdfToPng([fixture('single-page.pdf')], { pageFrom: 5, pageTo: 10 })
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toMatch(/beyond|From page/i)
  })

  it('passes transparent option to renderPagePng', async () => {
    vi.mocked(getPageCount).mockResolvedValue(1)
    await pdfToPng([fixture('single-page.pdf')], { transparent: true })
    expect(vi.mocked(renderPagePng)).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      0,
      expect.any(Number),
      true
    )
  })
})
