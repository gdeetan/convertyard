import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PDFDocument } from 'pdf-lib'
import { rotatePdf, reorderPdf } from '../pdf'

function fixture(name: string): File {
  const buf = readFileSync(resolve(process.cwd(), 'test-fixtures/pdf', name))
  return new File([buf], name, { type: 'application/pdf' })
}

describe('rotatePdf', () => {
  it('returns a File with -rotated.pdf suffix', async () => {
    const result = await rotatePdf(fixture('single-page.pdf'), { 0: 90 })
    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('single-page-rotated.pdf')
    expect(result.type).toBe('application/pdf')
  })

  it('applies 90-degree rotation to page 0', async () => {
    const result = await rotatePdf(fixture('normal-10-page.pdf'), { 0: 90 })
    const doc = await PDFDocument.load(await result.arrayBuffer())
    expect(doc.getPage(0).getRotation().angle).toBe(90)
  })

  it('applies different rotations to multiple pages', async () => {
    const result = await rotatePdf(fixture('normal-10-page.pdf'), { 0: 90, 1: 180, 2: 270 })
    const doc = await PDFDocument.load(await result.arrayBuffer())
    expect(doc.getPage(0).getRotation().angle).toBe(90)
    expect(doc.getPage(1).getRotation().angle).toBe(180)
    expect(doc.getPage(2).getRotation().angle).toBe(270)
  })

  it('ignores out-of-range page index silently', async () => {
    const result = await rotatePdf(fixture('single-page.pdf'), { 99: 90 })
    expect(result).toBeInstanceOf(File)
    const doc = await PDFDocument.load(await result.arrayBuffer())
    expect(doc.getPageCount()).toBe(1)
  })

  it('applies 0-degree (reset) rotation', async () => {
    const result = await rotatePdf(fixture('normal-10-page.pdf'), { 0: 0 })
    const doc = await PDFDocument.load(await result.arrayBuffer())
    expect(doc.getPage(0).getRotation().angle).toBe(0)
  })
})

describe('reorderPdf', () => {
  it('returns a File with -reordered.pdf suffix', async () => {
    const result = await reorderPdf(fixture('normal-10-page.pdf'), [0, 1, 2])
    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('normal-10-page-reordered.pdf')
  })

  it('reverses page order', async () => {
    const result = await reorderPdf(fixture('normal-10-page.pdf'), [9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
    const doc = await PDFDocument.load(await result.arrayBuffer())
    expect(doc.getPageCount()).toBe(10)
  })

  it('duplicates a page by repeating its index', async () => {
    const result = await reorderPdf(fixture('single-page.pdf'), [0, 0, 0])
    const doc = await PDFDocument.load(await result.arrayBuffer())
    expect(doc.getPageCount()).toBe(3)
  })

  it('produces a subset of pages', async () => {
    const result = await reorderPdf(fixture('normal-10-page.pdf'), [0, 4, 9])
    const doc = await PDFDocument.load(await result.arrayBuffer())
    expect(doc.getPageCount()).toBe(3)
  })
})
