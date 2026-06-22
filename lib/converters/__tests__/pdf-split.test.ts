import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { splitPdf } from '../pdf'

function fixture(name: string): File {
  const buf = readFileSync(resolve(process.cwd(), 'test-fixtures/pdf', name))
  return new File([buf], name, { type: 'application/pdf' })
}

describe('splitPdf — each-page mode', () => {
  it('splits a 10-page PDF into 10 files', async () => {
    const results = await splitPdf([fixture('normal-10-page.pdf')], { splitMode: 'each-page' })
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(10)
  })

  it('each output file has application/pdf MIME type', async () => {
    const results = await splitPdf([fixture('single-page.pdf')], { splitMode: 'each-page' })
    results.forEach(r => {
      if (r instanceof File) expect(r.type).toBe('application/pdf')
    })
  })

  it('single-page PDF produces one output file', async () => {
    const results = await splitPdf([fixture('single-page.pdf')], { splitMode: 'each-page' })
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(1)
  })

  it('returns Error (not throw) for zero-byte input', async () => {
    const results = await splitPdf([fixture('zero-byte.pdf')], { splitMode: 'each-page' })
    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('returns Error for non-PDF file', async () => {
    const results = await splitPdf([fixture('not-a-pdf.pdf')], { splitMode: 'each-page' })
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('handles batch: success and error results coexist', async () => {
    const results = await splitPdf(
      [fixture('single-page.pdf'), fixture('zero-byte.pdf')],
      { splitMode: 'each-page' }
    )
    const files = results.filter((r): r is File => r instanceof File)
    const errors = results.filter((r): r is Error => r instanceof Error)
    expect(files.length).toBeGreaterThanOrEqual(1)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })
})

describe('splitPdf — every-n mode', () => {
  it('splits 10-page PDF into chunks of 3 (gives 4 chunks)', async () => {
    const results = await splitPdf([fixture('normal-10-page.pdf')], { splitMode: 'every-n', everyN: 3 })
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(4)
  })

  it('everyN=1 is equivalent to each-page', async () => {
    const results = await splitPdf([fixture('normal-10-page.pdf')], { splitMode: 'every-n', everyN: 1 })
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(10)
  })
})

describe('splitPdf — page-range mode', () => {
  it('extracts pages 2-5 as a single file', async () => {
    const results = await splitPdf([fixture('normal-10-page.pdf')], { splitMode: 'page-range', pageFrom: 2, pageTo: 5 })
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(1)
  })

  it('out-of-bounds range is clamped to available pages', async () => {
    const results = await splitPdf([fixture('single-page.pdf')], { splitMode: 'page-range', pageFrom: 1, pageTo: 999 })
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(1)
  })
})

describe('splitPdf — large files', () => {
  it('splits a 500-page PDF without timing out', async () => {
    const results = await splitPdf([fixture('huge-500-page.pdf')], { splitMode: 'each-page' })
    const files = results.filter((r): r is File => r instanceof File)
    expect(files).toHaveLength(500)
  }, 60_000)
})
