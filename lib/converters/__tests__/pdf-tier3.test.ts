import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { headerFooterPdf, editPdfMetadata, flattenPdf, resolveText } from '../pdf-tier3'
import { PDFDocument } from 'pdf-lib'

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

  it('resolveText is exported and replaces tokens correctly', () => {
    expect(resolveText('Page {page} of {total}', 3, 10)).toBe('Page 3 of 10')
    expect(resolveText('{page}', 1, 5)).toBe('1')
    expect(resolveText('CONFIDENTIAL', 1, 1)).toBe('CONFIDENTIAL')
    expect(resolveText('{date}', 1, 1)).not.toContain('{date}')
  })

  it('uses custom headerMargin when provided', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: 'TOP', footerText: '', fontSize: 10, alignment: 'center', headerMargin: 72 }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('uses custom footerMargin when provided', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: '', footerText: 'BOTTOM', fontSize: 10, alignment: 'center', footerMargin: 50 }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('clamps headerMargin below 10 to 10', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: 'H', footerText: '', fontSize: 10, alignment: 'center', headerMargin: 2 }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('clamps footerMargin above 200 to 200', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: '', footerText: 'F', fontSize: 10, alignment: 'center', footerMargin: 999 }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('uses headerCustomText when headerText is "custom"', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: 'custom', headerCustomText: 'My Company', footerText: '', fontSize: 10, alignment: 'center', headerMargin: 30, footerMargin: 30 }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('uses footerCustomText when footerText is "custom"', async () => {
    const results = await headerFooterPdf(
      [fixture('single-page.pdf')],
      { headerText: '', footerText: 'custom', footerCustomText: 'Page {page}', fontSize: 10, alignment: 'center', headerMargin: 30, footerMargin: 30 }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('resolves {page} token in custom footer text', async () => {
    const results = await headerFooterPdf(
      [fixture('normal-10-page.pdf')],
      { headerText: '', footerText: 'custom', footerCustomText: '{page} of {total}', fontSize: 10, alignment: 'center', headerMargin: 30, footerMargin: 30 }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('expandPage grows page height by headerMargin when only header is set', async () => {
    const file = fixture('single-page.pdf')
    const buf = await file.arrayBuffer()
    const original = await PDFDocument.load(buf)
    const originalHeight = original.getPages()[0].getSize().height

    const results = await headerFooterPdf(
      [file],
      { headerText: 'TOP', footerText: '', fontSize: 10, alignment: 'center', headerMargin: 50, footerMargin: 30, expandPage: true }
    )
    const outFile = results[0] as File
    const outBuf = await outFile.arrayBuffer()
    const outDoc = await PDFDocument.load(outBuf)
    const outHeight = outDoc.getPages()[0].getSize().height
    expect(outHeight).toBeCloseTo(originalHeight + 50, 0)
  })

  it('expandPage grows page height by footerMargin when only footer is set', async () => {
    const file = fixture('single-page.pdf')
    const buf = await file.arrayBuffer()
    const original = await PDFDocument.load(buf)
    const originalHeight = original.getPages()[0].getSize().height

    const results = await headerFooterPdf(
      [file],
      { headerText: '', footerText: 'BOTTOM', fontSize: 10, alignment: 'center', headerMargin: 30, footerMargin: 40, expandPage: true }
    )
    const outFile = results[0] as File
    const outBuf = await outFile.arrayBuffer()
    const outDoc = await PDFDocument.load(outBuf)
    const outHeight = outDoc.getPages()[0].getSize().height
    expect(outHeight).toBeCloseTo(originalHeight + 40, 0)
  })

  it('expandPage grows page height by both margins when header and footer both set', async () => {
    const file = fixture('single-page.pdf')
    const buf = await file.arrayBuffer()
    const original = await PDFDocument.load(buf)
    const originalHeight = original.getPages()[0].getSize().height

    const results = await headerFooterPdf(
      [file],
      { headerText: 'TOP', footerText: 'BOT', fontSize: 10, alignment: 'center', headerMargin: 50, footerMargin: 40, expandPage: true }
    )
    const outFile = results[0] as File
    const outBuf = await outFile.arrayBuffer()
    const outDoc = await PDFDocument.load(outBuf)
    const outHeight = outDoc.getPages()[0].getSize().height
    expect(outHeight).toBeCloseTo(originalHeight + 50 + 40, 0)
  })

  it('expandPage=false leaves page size unchanged', async () => {
    const file = fixture('single-page.pdf')
    const buf = await file.arrayBuffer()
    const original = await PDFDocument.load(buf)
    const originalHeight = original.getPages()[0].getSize().height

    const results = await headerFooterPdf(
      [file],
      { headerText: 'TOP', footerText: 'BOT', fontSize: 10, alignment: 'center', headerMargin: 50, footerMargin: 40, expandPage: false }
    )
    const outFile = results[0] as File
    const outBuf = await outFile.arrayBuffer()
    const outDoc = await PDFDocument.load(outBuf)
    const outHeight = outDoc.getPages()[0].getSize().height
    expect(outHeight).toBeCloseTo(originalHeight, 0)
  })
})

describe('editPdfMetadata', () => {
  it('returns a PDF file', async () => {
    const results = await editPdfMetadata(
      [fixture('single-page.pdf')],
      { title: 'My Doc', author: 'Alice', subject: '', keywords: '', creator: '' }
    )
    expect(results[0]).toBeInstanceOf(File)
  })

  it('output filename has -metadata suffix', async () => {
    const results = await editPdfMetadata(
      [fixture('single-page.pdf')],
      { title: 'Test', author: '', subject: '', keywords: '', creator: '' }
    )
    expect((results[0] as File).name).toBe('single-page-metadata.pdf')
  })

  it('written metadata is readable from output PDF', async () => {
    const results = await editPdfMetadata(
      [fixture('single-page.pdf')],
      { title: 'Hello World', author: 'Bob', subject: 'Testing', keywords: 'a; b; c', creator: 'ConvertYard' }
    )
    const file = results[0] as File
    const buf = await file.arrayBuffer()
    const doc = await PDFDocument.load(buf)
    expect(doc.getTitle()).toBe('Hello World')
    expect(doc.getAuthor()).toBe('Bob')
    expect(doc.getSubject()).toBe('Testing')
    expect(doc.getCreator()).toBe('ConvertYard')
    expect(doc.getKeywords()).toContain('a')
  })

  it('empty string clears title', async () => {
    const results = await editPdfMetadata(
      [fixture('single-page.pdf')],
      { title: '', author: '', subject: '', keywords: '', creator: '' }
    )
    const file = results[0] as File
    const buf = await file.arrayBuffer()
    const doc = await PDFDocument.load(buf)
    expect(doc.getTitle() ?? '').toBe('')
  })

  it('returns Error for corrupt input', async () => {
    const results = await editPdfMetadata(
      [fixture('zero-byte.pdf')],
      { title: 'X', author: '', subject: '', keywords: '', creator: '' }
    )
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('handles batch', async () => {
    const results = await editPdfMetadata(
      [fixture('single-page.pdf'), fixture('normal-10-page.pdf')],
      { title: 'Batch', author: '', subject: '', keywords: '', creator: '' }
    )
    expect(results).toHaveLength(2)
    expect(results[0]).toBeInstanceOf(File)
    expect(results[1]).toBeInstanceOf(File)
  })
})

describe('flattenPdf', () => {
  it('returns a PDF file', async () => {
    const results = await flattenPdf(
      [fixture('single-page.pdf')],
      {}
    )
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).type).toBe('application/pdf')
  })

  it('output filename has -flattened suffix', async () => {
    const results = await flattenPdf([fixture('single-page.pdf')], {})
    expect((results[0] as File).name).toBe('single-page-flattened.pdf')
  })

  it('works on PDF with no form fields', async () => {
    const results = await flattenPdf([fixture('normal-10-page.pdf')], {})
    expect(results[0]).toBeInstanceOf(File)
  })

  it('returns Error for corrupt input', async () => {
    const results = await flattenPdf([fixture('zero-byte.pdf')], {})
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('handles batch', async () => {
    const results = await flattenPdf(
      [fixture('single-page.pdf'), fixture('normal-10-page.pdf')],
      {}
    )
    expect(results).toHaveLength(2)
    results.forEach(r => expect(r).toBeInstanceOf(File))
  })
})
