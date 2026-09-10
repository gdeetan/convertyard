const FILL_ATTR = /fill\s*=\s*["']([^"']+)["']/gi
const FILL_OR_STROKE_ATTR = /(fill|stroke)\s*=\s*["']([^"']+)["']/gi
const SELF_CLOSING_SHAPE =
  /<(path|polygon|polyline|rect|circle|ellipse)\b[^>]*\/>/gi

function hexByte(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
}

/** Canonical #rrggbb, or null for none/transparent/unparseable. */
export function normalizeColor(raw: string): string | null {
  const s = raw.trim().toLowerCase()
  if (!s || s === 'none' || s === 'transparent') return null

  const hex3 = /^#([0-9a-f]{3})$/.exec(s)
  if (hex3) {
    const [r, g, b] = hex3[1]
    return `#${r}${r}${g}${g}${b}${b}`
  }

  const hex6 = /^#([0-9a-f]{6})$/.exec(s)
  if (hex6) return `#${hex6[1]}`

  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(s)
  if (rgb) {
    if (rgb[4] !== undefined && Number(rgb[4]) === 0) return null
    return `#${hexByte(Number(rgb[1]))}${hexByte(Number(rgb[2]))}${hexByte(Number(rgb[3]))}`
  }

  return null
}

export function extractSvgPalette(svg: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  FILL_ATTR.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FILL_ATTR.exec(svg))) {
    const hex = normalizeColor(match[1])
    if (hex && !seen.has(hex)) {
      seen.add(hex)
      out.push(hex)
    }
  }
  return out
}

export function recolorSvg(svg: string, from: string, to: string): string {
  const fromHex = normalizeColor(from)
  const toHex = normalizeColor(to)
  if (!fromHex || !toHex) return svg
  FILL_OR_STROKE_ATTR.lastIndex = 0
  return svg.replace(FILL_OR_STROKE_ATTR, (full, attr: string, val: string) => {
    if (normalizeColor(val) === fromHex) return `${attr}="${toHex}"`
    return full
  })
}

export function knockoutSvg(svg: string, color: string): string {
  const target = normalizeColor(color)
  if (!target) return svg
  return svg.replace(SELF_CLOSING_SHAPE, (tag) => {
    const fill = /fill\s*=\s*["']([^"']+)["']/i.exec(tag)
    if (fill && normalizeColor(fill[1]) === target) return ''
    return tag
  })
}
