/**
 * Strips metadata from an image File without re-encoding when possible.
 * JPG/PNG: lossless — parse container, drop metadata segments/chunks.
 * WebP: lossless — drop EXIF/XMP RIFF chunks.
 * Others: unsupported (HEIC/RAW would require a full decoder).
 */
export async function stripImageMetadata(file: File): Promise<{ blob: Blob; filename: string } | { unsupported: true }> {
  const name = file.name
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  const buf = new Uint8Array(await file.arrayBuffer())

  if (ext === '.jpg' || ext === '.jpeg' || file.type === 'image/jpeg') {
    const cleaned = stripJpeg(buf)
    return { blob: new Blob([cleaned as BlobPart], { type: 'image/jpeg' }), filename: withSuffix(name, '-no-exif') }
  }
  if (ext === '.png' || file.type === 'image/png') {
    const cleaned = stripPng(buf)
    return { blob: new Blob([cleaned as BlobPart], { type: 'image/png' }), filename: withSuffix(name, '-no-exif') }
  }
  if (ext === '.webp' || file.type === 'image/webp') {
    const cleaned = stripWebp(buf)
    return { blob: new Blob([cleaned as BlobPart], { type: 'image/webp' }), filename: withSuffix(name, '-no-exif') }
  }
  return { unsupported: true }
}

function withSuffix(name: string, suffix: string): string {
  const i = name.lastIndexOf('.')
  if (i < 0) return name + suffix
  return name.slice(0, i) + suffix + name.slice(i)
}

/** JPEG: keep SOI/EOI + non-APP1/APP13 marker segments. */
function stripJpeg(src: Uint8Array): Uint8Array {
  if (src[0] !== 0xff || src[1] !== 0xd8) throw new Error('Not a JPEG.')
  const out: number[] = [0xff, 0xd8]
  let i = 2
  while (i < src.length) {
    if (src[i] !== 0xff) break
    while (i < src.length && src[i] === 0xff) i++
    const marker = src[i]; i++
    if (marker === 0xd9) { out.push(0xff, 0xd9); break }
    if (marker === 0xda) {
      out.push(0xff, marker)
      while (i < src.length) {
        out.push(src[i])
        if (src[i] === 0xff && i + 1 < src.length && src[i + 1] !== 0x00 && (src[i + 1] < 0xd0 || src[i + 1] > 0xd7)) {
          i++
          break
        }
        i++
      }
      continue
    }
    const len = (src[i] << 8) | src[i + 1]
    const segStart = i
    const segEnd = i + len
    const drop =
      marker === 0xe1 || // APP1 (EXIF/XMP)
      marker === 0xed || // APP13 (IPTC/Photoshop)
      marker === 0xee    // APP14 (Adobe — usually fine to drop)
    if (!drop) {
      out.push(0xff, marker)
      for (let k = segStart; k < segEnd; k++) out.push(src[k])
    }
    i = segEnd
  }
  return Uint8Array.from(out)
}

/** PNG: keep IHDR/PLTE/IDAT/IEND/tRNS/gAMA/cHRM/sRGB/iCCP; drop tEXt/zTXt/iTXt/eXIf. */
function stripPng(src: Uint8Array): Uint8Array {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let k = 0; k < 8; k++) if (src[k] !== sig[k]) throw new Error('Not a PNG.')
  const KEEP = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT', 'bKGD', 'pHYs', 'sPLT', 'hIST'])
  const out: number[] = [...sig]
  let i = 8
  while (i < src.length) {
    const len = (src[i] << 24) | (src[i + 1] << 16) | (src[i + 2] << 8) | src[i + 3]
    const type = String.fromCharCode(src[i + 4], src[i + 5], src[i + 6], src[i + 7])
    const total = 4 + 4 + len + 4
    if (KEEP.has(type)) for (let k = 0; k < total; k++) out.push(src[i + k])
    i += total
    if (type === 'IEND') break
  }
  return Uint8Array.from(out)
}

/** WebP: RIFF container. Drop EXIF/XMP chunks. */
function stripWebp(src: Uint8Array): Uint8Array {
  const magic = String.fromCharCode(src[0], src[1], src[2], src[3])
  const type = String.fromCharCode(src[8], src[9], src[10], src[11])
  if (magic !== 'RIFF' || type !== 'WEBP') throw new Error('Not a WebP.')
  const out: number[] = []
  for (let k = 0; k < 12; k++) out.push(src[k])
  let i = 12
  while (i < src.length) {
    const chunk = String.fromCharCode(src[i], src[i + 1], src[i + 2], src[i + 3])
    const len = src[i + 4] | (src[i + 5] << 8) | (src[i + 6] << 16) | (src[i + 7] << 24)
    const padded = len + (len % 2)
    const total = 8 + padded
    const drop = chunk === 'EXIF' || chunk === 'XMP '
    if (!drop) for (let k = 0; k < total; k++) out.push(src[i + k] ?? 0)
    i += total
  }
  const newSize = out.length - 8
  out[4] = newSize & 0xff
  out[5] = (newSize >> 8) & 0xff
  out[6] = (newSize >> 16) & 0xff
  out[7] = (newSize >> 24) & 0xff
  return Uint8Array.from(out)
}
