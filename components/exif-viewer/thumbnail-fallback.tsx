// Lazy thumbnail generator used when exifr's embedded thumbnail extraction
// fails (e.g. HEIC/HEIF, RAW without JPEG preview, or exports without EXIF
// thumbnail block).
const MAX_DIM = 480

export async function buildThumbnailDataUrl(file: File): Promise<string | null> {
  const isHeic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
  try {
    if (isHeic) {
      const heic2any = (await import('heic2any')).default
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 })
      const blob = Array.isArray(converted) ? converted[0] : converted
      return await downscaleBlob(blob as Blob)
    }
    return await downscaleBlob(file)
  } catch {
    return null
  }
}

async function downscaleBlob(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.8)
  } finally {
    bitmap.close?.()
  }
}
