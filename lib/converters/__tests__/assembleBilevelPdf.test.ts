import { describe, it, expect } from 'vitest'
import { assembleBilevelPdf } from '../assembleBilevelPdf'

describe('assembleBilevelPdf', () => {
  it('emits a valid PDF header and %%EOF', () => {
    const bytes = assembleBilevelPdf([
      { ccittBytes: new Uint8Array([0x00]), width: 100, height: 100 },
    ])
    const text = new TextDecoder('latin1').decode(bytes)
    expect(text.startsWith('%PDF-1.5')).toBe(true)
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
  })

  it('embeds CCITTFaxDecode filter with correct DecodeParms', () => {
    const bytes = assembleBilevelPdf([
      { ccittBytes: new Uint8Array([0x00]), width: 200, height: 300 },
    ])
    const text = new TextDecoder('latin1').decode(bytes)
    expect(text).toContain('/Filter /CCITTFaxDecode')
    expect(text).toContain('/K -1')
    expect(text).toContain('/Columns 200')
    expect(text).toContain('/Rows 300')
    expect(text).toContain('/BitsPerComponent 1')
    expect(text).toContain('/ColorSpace /DeviceGray')
  })

  it('produces an xref with an entry per object', () => {
    const bytes = assembleBilevelPdf([
      { ccittBytes: new Uint8Array([0x00]), width: 100, height: 100 },
      { ccittBytes: new Uint8Array([0x01]), width: 100, height: 100 },
    ])
    const text = new TextDecoder('latin1').decode(bytes)
    expect(text).toMatch(/xref\n0 9/)
  })
})
