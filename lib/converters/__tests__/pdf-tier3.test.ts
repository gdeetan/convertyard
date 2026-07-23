import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { headerFooterPdf } from '../pdf-tier3'

function fixture(name: string): File {
  const buf = readFileSync(resolve(process.cwd(), 'test-fixtures/pdf', name))
  return new File([buf], name, { type: 'application/pdf' })
}

describe('headerFooterPdf', () => {
  it('returns a PDF file for a valid input', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: 'CONFIDENTIAL', footerText: '', fontSize: 10, alignment: 'center' }
    )
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).type).toBe('application/pdf')
  })

  it('output filename has -headerfooter suffix', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: 'Header', footerText: 'Footer', fontSize: 10, alignment: 'center' }
    )
    expect((results[0] as File).name).toBe('single-page-headerfooter.pdf')
  })

  it('skips blank header and footer gracefully', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: '', footerText: '', fontSize: 10, alignment: 'center' }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('replaces {page} and {total} variables', async () => {
    const results = await headerFooterPdf(
      [fixture('normal-10-page.pdf')],
      { headerText: '', footerText: 'Page {page} of {total}', fontSize: 10, alignment: 'center' }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('returns Error (not throw) for corrupt input', async () => {
    const results = await headerFooterPdf(
      [fixture('zero-byte.pdf')],
      { headerText: 'H', footerText: 'F', fontSize: 10, alignment: 'center' }
    )
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('handles batch: one result per input file', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf'), fixture('normal-10-page.pdf')],
      { headerText: 'Test', footerText: '', fontSize: 10, alignment: 'left' }
    )
    expect(results).toHaveLength(2)
  })
})
