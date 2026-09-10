import { describe, expect, it } from 'vitest'
import { extractSvgPalette, knockoutSvg, recolorSvg } from '../svg-palette'

const sample = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
<path fill="rgb(255,0,0)" stroke="none" d="M 0 0 L 10 0 L 10 5 Z " />
<path fill="rgb(0, 0, 255)" stroke="none" d="M 0 5 L 10 5 L 10 10 Z " />
<path fill="none" stroke="none" d="M 0 0 Z " />
</svg>`

describe('extractSvgPalette', () => {
  it('returns unique fills in first-seen order, skipping none', () => {
    expect(extractSvgPalette(sample)).toEqual(['#ff0000', '#0000ff'])
  })

  it('normalizes #ABC and #AABBCC to the same hex', () => {
    const svg = `<svg><path fill="#AbC" /><path fill="#aabbcc" /><path fill="#ABC" /></svg>`
    expect(extractSvgPalette(svg)).toEqual(['#aabbcc'])
  })

  it('skips fully transparent fills', () => {
    const svg = `<svg><path fill="rgba(0,0,0,0)" /><path fill="#111111" /></svg>`
    expect(extractSvgPalette(svg)).toEqual(['#111111'])
  })
})

describe('recolorSvg', () => {
  it('rewrites matching fills to the new hex', () => {
    const out = recolorSvg(sample, '#ff0000', '#00ff00')
    expect(extractSvgPalette(out)).toEqual(['#00ff00', '#0000ff'])
    expect(out).toContain('fill="#00ff00"')
    expect(out).not.toContain('rgb(255,0,0)')
  })

  it('rewrites matching stroke colors too', () => {
    const svg = `<svg><path fill="rgb(255,0,0)" stroke="rgb(255,0,0)" d="M 0 0 Z " /></svg>`
    const out = recolorSvg(svg, '#ff0000', '#00aa00')
    expect(out).toContain('fill="#00aa00"')
    expect(out).toContain('stroke="#00aa00"')
  })

  it('leaves other fills unchanged', () => {
    const out = recolorSvg(sample, '#ff0000', '#111111')
    expect(out).toContain('rgb(0, 0, 255)')
  })
})

describe('knockoutSvg', () => {
  it('removes path elements with the matching fill', () => {
    const out = knockoutSvg(sample, '#0000ff')
    expect(extractSvgPalette(out)).toEqual(['#ff0000'])
    expect(out).not.toContain('rgb(0, 0, 255)')
    expect(out).toContain('rgb(255,0,0)')
  })

  it('can knock out every color and still keep the svg wrapper', () => {
    let out = knockoutSvg(sample, '#ff0000')
    out = knockoutSvg(out, '#0000ff')
    expect(extractSvgPalette(out)).toEqual([])
    expect(out).toContain('<svg')
    expect(out).toContain('</svg>')
  })
})
