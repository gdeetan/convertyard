// Rasterize to a 224×224 lossless PNG for the classifier (pipeline-native Blob
// input) plus a small JPEG preview. HEIC is decoded via heic2any first.
import { CLASSIFIER_SIZE, looksLikeHeicHeader } from './ai-detector-logic'

const HEIC_MIME = /image\/hei[cf]/i

export function isHeicFile(file: File): boolean {
  return HEIC_MIME.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

async function sniffHeic(file: File): Promise<boolean> {
  if (isHeicFile(file)) return true
  try {
    return looksLikeHeicHeader(await file.slice(0, 16).arrayBuffer())
  } catch {
    return false
  }
}

async function decodeViaElement(blob: Blob): Promise<ImageBitmap> {
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('The source image could not be decoded.'))
      img.src = url
    })
    await img.decode?.().catch(() => undefined)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, img.naturalWidth || img.width)
    canvas.height = Math.max(1, img.naturalHeight || img.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not decode image')
    ctx.drawImage(img, 0, 0)
    return await createImageBitmap(canvas)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function decodeBlob(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob)
  } catch {
    return await decodeViaElement(blob)
  }
}

async function heicToJpegBlob(file: Blob): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  return (Array.isArray(converted) ? converted[0] : converted) as Blob
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not encode image'))
        return
      }
      void blob.arrayBuffer().then(resolve, reject)
    }, 'image/png')
  })
}

export async function buildClassifierInput(file: File): Promise<{
  png: ArrayBuffer
  previewDataUrl: string
  width: number
  height: number
}> {
  let blob: Blob = file
  if (await sniffHeic(file)) {
    blob = await heicToJpegBlob(file)
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await decodeBlob(blob)
  } catch (err) {
    if (!(await sniffHeic(file))) {
      try {
        bitmap = await decodeBlob(await heicToJpegBlob(file))
      } catch {
        throw err
      }
    } else {
      throw err
    }
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = CLASSIFIER_SIZE
    canvas.height = CLASSIFIER_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not decode image')
    ctx.drawImage(bitmap, 0, 0, CLASSIFIER_SIZE, CLASSIFIER_SIZE)
    const png = await canvasToPng(canvas)
    return {
      png,
      previewDataUrl: canvas.toDataURL('image/jpeg', 0.8),
      width: bitmap.width,
      height: bitmap.height,
    }
  } finally {
    bitmap.close?.()
  }
}
