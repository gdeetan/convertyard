import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { preflightClassify } from '../pdf'

const FIXTURES = 'lib/converters/__tests__/fixtures/pdf'

async function loadBuffer(name: string) {
  const bytes = readFileSync(`${FIXTURES}/${name}`)
  return { buf: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), size: bytes.byteLength }
}

describe('preflightClassify', () => {
  it('flags pure JBIG2+JPX scan as exoticHeavy with no text layer', async () => {
    const { buf, size } = await loadBuffer('exotic-pure-scan.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(true)
    expect(res.hasTextLayer).toBe(false)
  })

  it('flags hybrid OCR scan as exoticHeavy AND hasTextLayer', async () => {
    const { buf, size } = await loadBuffer('exotic-hybrid.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(true)
    expect(res.hasTextLayer).toBe(true)
  })

  it('text PDF with JPEGs is not exoticHeavy', async () => {
    const { buf, size } = await loadBuffer('text-with-jpeg.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(false)
    expect(res.hasTextLayer).toBe(true)
  })

  it('text-only PDF is not exoticHeavy', async () => {
    const { buf, size } = await loadBuffer('text-only.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(false)
    expect(res.hasTextLayer).toBe(true)
  })

  it('returns defaults on corrupt input', async () => {
    const junk = new Uint8Array([1, 2, 3, 4]).buffer
    const res = await preflightClassify(junk, 4)
    expect(res.exoticHeavy).toBe(false)
    expect(res.hasTextLayer).toBe(false)
    expect(res.xobjectList).toEqual([])
  })
})
