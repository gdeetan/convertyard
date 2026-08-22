// Produces a 224×224 RGB buffer for the classifier (no JPEG) plus a small
// preview data URL for the verdict card. HEIC is decoded via heic2any first.
import { CLASSIFIER_SIZE, rgbaToRgb } from './ai-detector-logic'

const HEIC_MIME = /image\/hei[cf]/i

export function isHeicFile(file: File): boolean {
  return HEIC_MIME.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

export async function buildClassifierInput(
  file: File,
  isHeic: boolean,
): Promise<{
  rgb: Uint8Array
  previewDataUrl: string
  width: number
  height: number
}> {
  let blob: Blob = file
  if (isHeic) {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    blob = (Array.isArray(converted) ? converted[0] : converted) as Blob
  }
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = CLASSIFIER_SIZE
    canvas.height = CLASSIFIER_SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(bitmap, 0, 0, CLASSIFIER_SIZE, CLASSIFIER_SIZE)
    const rgba = ctx.getImageData(0, 0, CLASSIFIER_SIZE, CLASSIFIER_SIZE).data
    return {
      rgb: rgbaToRgb(rgba, CLASSIFIER_SIZE, CLASSIFIER_SIZE),
      previewDataUrl: canvas.toDataURL('image/jpeg', 0.8),
      width: bitmap.width,
      height: bitmap.height,
    }
  } finally {
    bitmap.close?.()
  }
}
