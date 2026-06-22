import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { mergePDFs } from '../pdf'

function fixture(name: string): File {
  const buf = readFileSync(resolve(process.cwd(), 'test-fixtures/pdf', name))
  return new File([buf], name, { type: 'application/pdf' })
}

const opts = {}

describe('mergePDFs', () => {
  it('returns empty array for empty input', async () => {
    const results = await mergePDFs([], opts)
    expect(results).toHaveLength(0)
  })

  it('returns single file unchanged when passed one file', async () => {
    const results = await mergePDFs([fixture('single-page.pdf')], opts)
    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('single-page.pdf')
  })

  it('merges two valid PDFs into one file', async () => {
    const results = await mergePDFs([fixture('normal-10-page.pdf'), fixture('single-page.pdf')], opts)
    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('normal-10-page-merged.pdf')
  })

  it('output has application/pdf MIME type', async () => {
    const results = await mergePDFs([fixture('normal-10-page.pdf'), fixture('single-page.pdf')], opts)
    expect((results[0] as File).type).toBe('application/pdf')
  })

  it('rejects zero-byte input', async () => {
    await expect(
      mergePDFs([fixture('zero-byte.pdf')], opts)
    ).rejects.toThrow()
  })

  it('rejects non-PDF file with .pdf extension', async () => {
    await expect(
      mergePDFs([fixture('not-a-pdf.pdf')], opts)
    ).rejects.toThrow()
  })

  it('handles a 500-page PDF without timing out', async () => {
    const results = await mergePDFs([fixture('huge-500-page.pdf')], opts)
    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
  }, 30_000)

  it('calls onProgress callbacks', async () => {
    const calls: Array<[number, number]> = []
    await mergePDFs([fixture('normal-10-page.pdf')], opts, (idx, pct) => calls.push([idx, pct]))
    expect(calls.length).toBeGreaterThan(0)
    expect(calls.at(-1)![1]).toBe(100)
  })
})
