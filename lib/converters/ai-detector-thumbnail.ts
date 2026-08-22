// Produces a downscaled data URL usable both as the classifier input and the
// verdict-card thumbnail. HEIC is decoded via heic2any before rasterizing.
const MAX_DIM = 512

export async function buildThumbnailDataUrl(
  file: File,
  isHeic: boolean,
): Promise<{ dataUrl: string; width: number; height: number }> {
  let blob: Blob = file
  if (isHeic) {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    blob = (Array.isArray(converted) ? converted[0] : converted) as Blob
  }
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
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      width: bitmap.width,
      height: bitmap.height,
    }
  } finally {
    bitmap.close?.()
  }
}
