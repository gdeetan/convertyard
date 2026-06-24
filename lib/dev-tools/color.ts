// Color conversions — HEX ↔ RGB ↔ HSL ↔ OKLCH, no external deps

export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }
export interface OKLCH { l: number; c: number; h: number }

export function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    }
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    }
  }
  return null
}

export function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b]
    .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('')
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function linearize(v: number): number {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function rgbToOklch({ r, g, b }: RGB): OKLCH {
  const lr = linearize(r), lg = linearize(g), lb = linearize(b)
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750
  const z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041
  const lc = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const mc = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const sc = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)
  const L = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc
  const a = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc
  const bk = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc
  const C = Math.sqrt(a * a + bk * bk)
  const H = ((Math.atan2(bk, a) * 180) / Math.PI + 360) % 360
  return {
    l: Math.round(L * 1000) / 1000,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(H * 10) / 10,
  }
}

export function isValidHex(hex: string): boolean {
  return /^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(hex.trim())
}
