import { describe, it, expect } from 'vitest'
import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib'
import { compressStructural } from '../pdf'

async function buildFixture(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([100, 100])
  page.node.set(PDFName.of('Thumb'), doc.context.obj({ Length: 10 }))
  page.node.set(PDFName.of('PieceInfo'), doc.context.obj({}))
  doc.catalog.set(PDFName.of('PieceInfo'), doc.context.obj({}))
  doc.catalog.set(PDFName.of('Metadata'), doc.context.obj({}))
  doc.catalog.set(PDFName.of('OutputIntents'), doc.context.obj([]))
  const bytes = await doc.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

describe('compressStructural default strip', () => {
  it('removes /Thumb, /PieceInfo, /Metadata, /OutputIntents by default', async () => {
    const buffer = await buildFixture()
    const out = await compressStructural(buffer, 'medium', 'test.pdf')
    const outBuf = await out.arrayBuffer()
    const parsed = await PDFDocument.load(outBuf)

    expect(parsed.catalog.lookup(PDFName.of('PieceInfo'))).toBeUndefined()
    expect(parsed.catalog.lookup(PDFName.of('Metadata'))).toBeUndefined()
    expect(parsed.catalog.lookup(PDFName.of('OutputIntents'))).toBeUndefined()
    for (const page of parsed.getPages()) {
      expect(page.node.lookup(PDFName.of('Thumb'))).toBeUndefined()
      expect(page.node.lookup(PDFName.of('PieceInfo'))).toBeUndefined()
    }
  })

  it('preserves those keys when stripMetadata: false', async () => {
    const buffer = await buildFixture()
    const out = await compressStructural(buffer, 'medium', 'test.pdf', { stripMetadata: false })
    const outBuf = await out.arrayBuffer()
    const parsed = await PDFDocument.load(outBuf)

    expect(parsed.catalog.lookup(PDFName.of('PieceInfo'))).toBeInstanceOf(PDFDict)
    expect(parsed.catalog.lookup(PDFName.of('Metadata'))).toBeInstanceOf(PDFDict)
    expect(parsed.catalog.lookup(PDFName.of('OutputIntents'))).toBeInstanceOf(PDFArray)
  })
})
