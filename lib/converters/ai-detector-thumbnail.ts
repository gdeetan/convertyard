// Scale shortest edge to 440 and send that PNG (worker center-crops, or
// five-crops on desktop). JPEG preview is the 384 center crop.
import {
  CLASSIFIER_CROP,
  CLASSIFIER_RESIZE,
  centerCropOrigin,
  looksLikeHeicHeader,
  shortestEdgeSize,
} from './ai-detector-logic'
import { detectCaptionClientProfile } from './caption-workload'

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
  const profile = detectCaptionClientProfile(
    navigator.userAgent ?? '',
    navigator.maxTouchPoints ?? 0,
    navigator.platform ?? '',
  )
  // iOS decodes HEIC natively. heic2any's libheif WASM often OOMs or fails there.
  let blob: Blob = file
  if (await sniffHeic(file) && profile !== 'ios') {
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
    const scaled = shortestEdgeSize(bitmap.width, bitmap.height, CLASSIFIER_RESIZE)
    const crop = centerCropOrigin(scaled.w, scaled.h, CLASSIFIER_CROP)
    const tmp = document.createElement('canvas')
    tmp.width = scaled.w
    tmp.height = scaled.h
    const tctx = tmp.getContext('2d')
    if (!tctx) throw new Error('Could not decode image')
    tctx.drawImage(bitmap, 0, 0, scaled.w, scaled.h)
    const canvas = document.createElement('canvas')
    canvas.width = crop.side
    canvas.height = crop.side
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not decode image')
    ctx.drawImage(tmp, crop.sx, crop.sy, crop.side, crop.side, 0, 0, crop.side, crop.side)
    const png = await canvasToPng(tmp)
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
