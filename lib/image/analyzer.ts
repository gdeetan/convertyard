export interface ImageAnalysis {
  format: string
  width: number
  height: number
  megapixels: number
  fileSizeBytes: number
  bitDepth: number
  hasAlpha: boolean
  colorSpace: string
  iccProfileBytes: number
  exifBytes: number
  hasGpsData: boolean
  estimatedExistingQuality: number | null
  isAnimated: boolean
  uniqueColorEstimate: number | null
}

// ── JPEG ─────────────────────────────────────────────────────────────────────

// Luminance DC quantization value at quality 50 (standard Annex K table, element [0])
const JPEG_Q50_DC = 16

function estimateJpegQuality(dcValue: number): number {
  if (dcValue <= 1) return 100
  const scaleFactor = dcValue / JPEG_Q50_DC
  if (scaleFactor <= 1) return Math.round(100 - scaleFactor * 50)
  return Math.max(1, Math.round(50 / scaleFactor))
}

function detectGpsInTiff(view: DataView, tiffOffset: number): boolean {
  if (tiffOffset + 8 > view.byteLength) return false
  const orderBytes = view.getUint16(tiffOffset)
  const le = orderBytes === 0x4949 // 'II' = little-endian
  const ifd0Rel = view.getUint32(tiffOffset + 4, le)
  const ifd0 = tiffOffset + ifd0Rel
  if (ifd0 + 2 > view.byteLength) return false
  const numEntries = view.getUint16(ifd0, le)
  for (let i = 0; i < numEntries && i < 200; i++) {
    const entry = ifd0 + 2 + i * 12
    if (entry + 2 > view.byteLength) break
    if (view.getUint16(entry, le) === 0x8825) return true // GPSInfo tag
  }
  return false
}

interface JpegMeta {
  exifBytes: number
  iccBytes: number
  hasGpsData: boolean
  estimatedQuality: number | null
  isProgressive: boolean
}

function parseJpegMarkers(buffer: ArrayBuffer): JpegMeta {
  const view = new DataView(buffer)
  let offset = 2 // skip SOI (FFD8)
  let exifBytes = 0
  let iccBytes = 0
  let hasGpsData = false
  let estimatedQuality: number | null = null
  let isProgressive = false

  while (offset + 3 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break
    const marker = view.getUint8(offset + 1)
    if (marker === 0xd9) break // EOI
    if (marker === 0xda) break // SOS — image data follows

    const segLen = view.getUint16(offset + 2) // includes the 2-byte length itself but not FF+marker
    const dataOffset = offset + 4
    const dataLen = segLen - 2

    if (marker === 0xe1 && dataLen >= 6) {
      // APP1: check for Exif header "Exif\0\0"
      const header = new Uint8Array(buffer, dataOffset, Math.min(6, dataLen))
      if (header[0] === 0x45 && header[1] === 0x78 && header[2] === 0x69 &&
          header[3] === 0x66 && header[4] === 0x00) {
        exifBytes += segLen + 2
        // TIFF data starts at dataOffset + 6
        hasGpsData = detectGpsInTiff(view, dataOffset + 6)
      }
    } else if (marker === 0xe2 && dataLen >= 12) {
      // APP2: ICC_PROFILE\0
      const sig = new Uint8Array(buffer, dataOffset, 12)
      const sigStr = String.fromCharCode(...sig)
      if (sigStr === 'ICC_PROFILE\0') {
        iccBytes += segLen + 2
      }
    } else if (marker === 0xdb && estimatedQuality === null) {
      // DQT: quantization table — read first luminance table DC value
      let pos = dataOffset
      while (pos < dataOffset + dataLen) {
        const qt = view.getUint8(pos)
        const precision = (qt >> 4) & 0xf // 0=8bit, 1=16bit
        const tableId = qt & 0xf
        const tableBytes = precision === 0 ? 64 : 128
        if (tableId === 0 && pos + 1 < view.byteLength) {
          estimatedQuality = estimateJpegQuality(view.getUint8(pos + 1))
          break
        }
        pos += tableBytes + 1
      }
    } else if (marker === 0xc2) {
      isProgressive = true
    }

    offset += 2 + segLen
  }

  return { exifBytes, iccBytes, hasGpsData, estimatedQuality, isProgressive }
}

// ── PNG ──────────────────────────────────────────────────────────────────────

interface PngMeta {
  width: number
  height: number
  bitDepth: number
  hasAlpha: boolean
  iccBytes: number
  exifBytes: number
  isAnimated: boolean
}

function parsePngChunks(buffer: ArrayBuffer): PngMeta {
  const view = new DataView(buffer)
  let offset = 8 // skip PNG signature

  let width = 0
  let height = 0
  let bitDepth = 8
  let hasAlpha = false
  let iccBytes = 0
  let exifBytes = 0
  let isAnimated = false

  while (offset + 12 <= view.byteLength) {
    const chunkLen = view.getUint32(offset)
    const chunkType = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    )
    const dataOffset = offset + 8

    if (chunkType === 'IHDR' && chunkLen >= 13) {
      width = view.getUint32(dataOffset)
      height = view.getUint32(dataOffset + 4)
      bitDepth = view.getUint8(dataOffset + 8)
      const colorType = view.getUint8(dataOffset + 9)
      hasAlpha = colorType === 4 || colorType === 6
    } else if (chunkType === 'iCCP') {
      iccBytes = chunkLen + 12 // data + 4 len + 4 type + 4 crc
    } else if (chunkType === 'eXIf') {
      exifBytes = chunkLen + 12
    } else if (chunkType === 'tEXt' || chunkType === 'zTXt' || chunkType === 'iTXt') {
      // Check if keyword starts with "Raw profile type exif" or "XML:com.adobe.xmp"
      if (chunkLen > 5) {
        const kw = new Uint8Array(buffer, dataOffset, Math.min(20, chunkLen))
        const kwStr = String.fromCharCode(...kw)
        if (kwStr.startsWith('Raw profile type exif') || kwStr.startsWith('XML:com.adobe.xmp')) {
          exifBytes += chunkLen + 12
        }
      }
    } else if (chunkType === 'acTL') {
      isAnimated = true
    } else if (chunkType === 'IEND') {
      break
    }

    offset += 12 + chunkLen
  }

  return { width, height, bitDepth, hasAlpha, iccBytes, exifBytes, isAnimated }
}

// ── WebP ─────────────────────────────────────────────────────────────────────

function detectWebpAnimation(buffer: ArrayBuffer): boolean {
  const view = new DataView(buffer)
  if (view.byteLength < 12) return false
  // RIFF header: "RIFF" + size + "WEBP"
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
  const webp = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
  if (riff !== 'RIFF' || webp !== 'WEBP') return false

  let offset = 12
  while (offset + 8 <= view.byteLength) {
    const fourcc = String.fromCharCode(
      view.getUint8(offset), view.getUint8(offset + 1),
      view.getUint8(offset + 2), view.getUint8(offset + 3),
    )
    if (fourcc === 'ANIM') return true
    const chunkSize = view.getUint32(offset + 4, true) // little-endian
    offset += 8 + chunkSize + (chunkSize & 1) // pad to even
  }
  return false
}

// ── Unique color estimation (PNG only) ───────────────────────────────────────

async function estimateUniqueColors(file: File): Promise<number | null> {
  if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) return null
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close(); return null }
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    const totalPixels = pixels.length / 4
    // Sample up to 100k pixels
    const sampleStep = Math.max(1, Math.ceil(totalPixels / 100_000))

    const colors = new Set<number>()
    for (let i = 0; i < pixels.length; i += sampleStep * 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      colors.add((r << 16) | (g << 8) | b)
      if (colors.size > 256) return null
    }
    return colors.size
  } catch {
    return null
  }
}

// ── Color space detection ─────────────────────────────────────────────────────

function detectColorSpace(iccBytes: number, buffer: ArrayBuffer, format: string): string {
  if (iccBytes === 0) return format === 'jpeg' ? 'sRGB' : 'unknown'
  // Basic heuristic: check ICC profile description if we have it
  // For now, return best-guess based on presence of ICC
  // A full ICC parser would read the profile description tag
  return 'unknown (ICC embedded)'
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function analyzeImage(file: File): Promise<ImageAnalysis> {
  const buffer = await file.arrayBuffer()
  const fileSizeBytes = file.size

  let format = 'unknown'
  const mime = file.type.toLowerCase()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (mime.includes('jpeg') || mime.includes('jpg') || ext === 'jpg' || ext === 'jpeg') format = 'jpeg'
  else if (mime.includes('png') || ext === 'png') format = 'png'
  else if (mime.includes('webp') || ext === 'webp') format = 'webp'
  else if (mime.includes('gif') || ext === 'gif') format = 'gif'
  else if (mime.includes('avif') || ext === 'avif') format = 'avif'
  else if (mime.includes('heic') || mime.includes('heif') || ext === 'heic' || ext === 'heif') format = 'heic'

  let width = 0
  let height = 0
  let bitDepth = 8
  let hasAlpha = false
  let iccProfileBytes = 0
  let exifBytes = 0
  let hasGpsData = false
  let estimatedExistingQuality: number | null = null
  let isAnimated = false
  let uniqueColorEstimate: number | null = null
  let colorSpace = 'unknown'

  if (format === 'jpeg') {
    const meta = parseJpegMarkers(buffer)
    iccProfileBytes = meta.iccBytes
    exifBytes = meta.exifBytes
    hasGpsData = meta.hasGpsData
    estimatedExistingQuality = meta.estimatedQuality
    isAnimated = false
    hasAlpha = false
    colorSpace = iccProfileBytes > 0 ? 'unknown (ICC embedded)' : 'sRGB'
  } else if (format === 'png') {
    const meta = parsePngChunks(buffer)
    width = meta.width
    height = meta.height
    bitDepth = meta.bitDepth
    hasAlpha = meta.hasAlpha
    iccProfileBytes = meta.iccBytes
    exifBytes = meta.exifBytes
    isAnimated = meta.isAnimated
    colorSpace = iccProfileBytes > 0 ? 'unknown (ICC embedded)' : 'sRGB'
    uniqueColorEstimate = await estimateUniqueColors(file)
  } else if (format === 'webp') {
    isAnimated = detectWebpAnimation(buffer)
    hasAlpha = true // WebP can have alpha; assume possible
    colorSpace = 'sRGB'
  } else if (format === 'gif') {
    isAnimated = true // GIFs are often animated
    colorSpace = 'sRGB'
    hasAlpha = true
  }

  // Get dimensions via createImageBitmap if not already parsed
  if (width === 0 || height === 0) {
    try {
      const bitmap = await createImageBitmap(file)
      width = bitmap.width
      height = bitmap.height
      bitmap.close()
    } catch {
      // Unable to decode; leave 0
    }
  }

  const megapixels = Math.round((width * height) / 1_000_000 * 10) / 10

  return {
    format,
    width,
    height,
    megapixels,
    fileSizeBytes,
    bitDepth,
    hasAlpha,
    colorSpace,
    iccProfileBytes,
    exifBytes,
    hasGpsData,
    estimatedExistingQuality,
    isAnimated,
    uniqueColorEstimate,
  }
}
