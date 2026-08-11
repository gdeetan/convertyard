import type { ToolOptions, ConversionResult } from '@/lib/types'

const ICO_SIZES = [16, 32, 48, 64, 128] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read PNG width/height from IHDR chunk (bytes 16–23). */
function pngDimensions(buf: Uint8Array): { width: number; height: number } {
  const v = new DataView(buf.buffer, buf.byteOffset)
  return { width: v.getUint32(16), height: v.getUint32(20) }
}

/** Resize source image to `size × size` via an OffscreenCanvas. */
async function resizeToCanvas(
  src: ImageBitmap,
  size: number,
): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(src, 0, 0, size, size)
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  return new Uint8Array(await blob.arrayBuffer())
}

/** Pack an array of PNG Uint8Arrays into a single ICO ArrayBuffer. */
function encodePngsAsIco(pngs: Uint8Array[]): ArrayBuffer {
  const HEADER = 6
  const ENTRY = 16
  const dirSize = HEADER + ENTRY * pngs.length

  let total = dirSize
  for (const p of pngs) total += p.length

  const buf = new ArrayBuffer(total)
  const v = new DataView(buf)
  const u8 = new Uint8Array(buf)

  // ICONDIR
  v.setUint16(0, 0, true)            // reserved
  v.setUint16(2, 1, true)            // type = 1 (ICO)
  v.setUint16(4, pngs.length, true)  // count

  let offset = dirSize
  for (let i = 0; i < pngs.length; i++) {
    const png = pngs[i]
    const { width, height } = pngDimensions(png)
    const e = HEADER + i * ENTRY

    v.setUint8(e,      width  >= 256 ? 0 : width)
    v.setUint8(e + 1,  height >= 256 ? 0 : height)
    v.setUint8(e + 2,  0)   // colorCount
    v.setUint8(e + 3,  0)   // reserved
    v.setUint16(e + 4, 1,  true)  // planes
    v.setUint16(e + 6, 32, true)  // bitCount
    v.setUint32(e + 8, png.length, true)  // size
    v.setUint32(e + 12, offset,    true)  // offset

    u8.set(png, offset)
    offset += png.length
  }

  return buf
}

// ── PNG → ICO ─────────────────────────────────────────────────────────────────

export async function pngToIco(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void,
): Promise<ConversionResult[]> {
  const sizesParam = (opts.sizes as string | undefined) ?? '16,32,48,64,128'
  const sizes = sizesParam.split(',').map(Number).filter(n => ICO_SIZES.includes(n as typeof ICO_SIZES[number]))
  const activeSizes = sizes.length > 0 ? sizes : [...ICO_SIZES]

  return Promise.all(
    files.map(async (file, i) => {
      try {
        onProgress?.(i, 10)
        const bitmap = await createImageBitmap(file)
        onProgress?.(i, 20)

        const step = 60 / activeSizes.length
        const pngs: Uint8Array[] = []
        for (let s = 0; s < activeSizes.length; s++) {
          pngs.push(await resizeToCanvas(bitmap, activeSizes[s]))
          onProgress?.(i, 20 + Math.round((s + 1) * step))
        }

        bitmap.close()
        onProgress?.(i, 90)

        const icoBuffer = encodePngsAsIco(pngs)
        const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' })
        const outName = file.name.replace(/\.[^.]+$/, '.ico')
        onProgress?.(i, 100)
        const result = new File([icoBlob], outName, { type: 'image/x-icon' })
        onResult?.(i, result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onResult?.(i, error)
        return error
      }
    }),
  )
}

// ── ICO → PNG ─────────────────────────────────────────────────────────────────

/** Parse ICONDIR + ICONDIRENTRY headers to get image entries. */
function parseIcoEntries(
  u8: Uint8Array,
): Array<{ width: number; height: number; offset: number; size: number }> {
  if (u8.length < 6) throw new Error('Truncated ICO: header too short')
  const v = new DataView(u8.buffer, u8.byteOffset)
  const count = v.getUint16(4, true)
  if (6 + count * 16 > u8.length) throw new Error('Truncated ICO: directory overruns buffer')
  const entries = []
  for (let i = 0; i < count; i++) {
    const e = 6 + i * 16
    const w = v.getUint8(e) || 256       // 0 encodes 256
    const h = v.getUint8(e + 1) || 256
    const size   = v.getUint32(e + 8, true)
    const offset = v.getUint32(e + 12, true)
    entries.push({ width: w, height: h, offset, size })
  }
  return entries
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function isPng(u8: Uint8Array, offset: number): boolean {
  return PNG_SIG.every((b, j) => u8[offset + j] === b)
}

/** Convert a BMP DIB stored in ICO (no file header) to PNG via Canvas. */
async function dibToPngBytes(dib: Uint8Array): Promise<Uint8Array> {
  // Prepend a 14-byte BMP file header so the browser can decode it
  const fileSize = 14 + dib.length
  const header = new Uint8Array(14)
  const hv = new DataView(header.buffer)
  hv.setUint8(0, 0x42)  // 'B'
  hv.setUint8(1, 0x4d)  // 'M'
  hv.setUint32(2, fileSize, true)
  hv.setUint32(6, 0, true)   // reserved
  const dibHeaderSize = new DataView(dib.buffer, dib.byteOffset).getUint32(0, true)
  hv.setUint32(10, 14 + dibHeaderSize, true)  // pixel data offset

  const bmp = new Uint8Array(fileSize)
  bmp.set(header)
  bmp.set(dib, 14)

  const blob = new Blob([bmp], { type: 'image/bmp' })
  const bitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()
  const out = await canvas.convertToBlob({ type: 'image/png' })
  return new Uint8Array(await out.arrayBuffer())
}

export async function icoToPng(
  files: File[],
  _opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void,
): Promise<ConversionResult[]> {
  return Promise.all(
    files.map(async (file, i) => {
      try {
        onProgress?.(i, 10)
        const u8 = new Uint8Array(await file.arrayBuffer())
        const entries = parseIcoEntries(u8)
        if (entries.length === 0) throw new Error('No images found in ICO file')

        // Pick the largest image by area
        entries.sort((a, b) => b.width * b.height - a.width * a.height)
        const best = entries[0]
        onProgress?.(i, 50)

        const slice = u8.slice(best.offset, best.offset + best.size)
        let pngBytes: Uint8Array

        if (isPng(u8, best.offset)) {
          pngBytes = slice
        } else {
          // Legacy BMP DIB — convert via Canvas
          pngBytes = await dibToPngBytes(slice)
        }

        onProgress?.(i, 90)
        const outName = file.name.replace(/\.[^.]+$/, '.png')
        onProgress?.(i, 100)
        const result = new File([pngBytes.buffer as ArrayBuffer], outName, { type: 'image/png' })
        onResult?.(i, result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onResult?.(i, error)
        return error
      }
    }),
  )
}
