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

const { extractText } = await import('../mupdf-client')
const { pdfToText } = await import('../pdf')

function fixture(name: string): File {
  const buf = readFileSync(resolve(process.cwd(), 'test-fixtures/pdf', name))
  return new File([buf], name, { type: 'application/pdf' })
}

const ENOUGH_TEXT = 'This is enough sample text to pass the 30-character minimum check in pdf.ts.'

describe('pdfToText', () => {
  beforeEach(() => {
    vi.mocked(extractText).mockResolvedValue([ENOUGH_TEXT, ENOUGH_TEXT, ENOUGH_TEXT])
  })

  it('produces one .txt File per input PDF', async () => {
    const results = await pdfToText([fixture('normal-10-page.pdf')], {})
    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('normal-10-page.txt')
    expect((results[0] as File).type).toBe('text/plain')
  })

  it('includes page markers by default', async () => {
    const results = await pdfToText([fixture('single-page.pdf')], {})
    const text = await (results[0] as File).text()
    expect(text).toContain('--- Page 1 ---')
  })

  it('omits page markers when pageMarkers=false', async () => {
    const results = await pdfToText([fixture('single-page.pdf')], { pageMarkers: false })
    const text = await (results[0] as File).text()
    expect(text).not.toContain('--- Page')
  })

  it('returns Error when extracted text is empty (image-only PDF)', async () => {
    vi.mocked(extractText).mockResolvedValue(['   ', '  '])
    const results = await pdfToText([fixture('single-page.pdf')], {})
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toMatch(/scanned|OCR|no text/i)
  })

  it('returns Error when extractText rejects', async () => {
    vi.mocked(extractText).mockRejectedValue(new Error('WASM crash'))
    const results = await pdfToText([fixture('zero-byte.pdf')], {})
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('respects pageFrom and pageTo options', async () => {
    vi.mocked(extractText).mockResolvedValue([ENOUGH_TEXT, ENOUGH_TEXT, ENOUGH_TEXT, ENOUGH_TEXT, ENOUGH_TEXT])
    const results = await pdfToText([fixture('normal-10-page.pdf')], { pageFrom: 2, pageTo: 3 })
    const text = await (results[0] as File).text()
    expect(text).toContain('--- Page 2 ---')
    expect(text).toContain('--- Page 3 ---')
    expect(text).not.toContain('--- Page 1 ---')
  })
})
