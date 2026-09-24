/// <reference lib="webworker" />

// MozJPEG encoder via @jsquash/jpeg. Same visible quality at ~15–25% smaller
// files than the browser's canvas JPEG encoder (libjpeg-turbo, un-tuned).
// This is the same encoder Ghostscript/iLovePDF use for their distiller
// presets. Lazy-imported so bundle-time cost lives on the compress-pdf tool
// alone. Falls back to canvas.convertToBlob on any load failure.
import mozEncode, { init as initMozEncode } from '@jsquash/jpeg/encode'

// Point @jsquash/jpeg at the WASM we copy into /public via postinstall.
// Without this the emscripten module tries to resolve mozjpeg_enc.wasm
// relative to the bundled worker's blob URL, which fails on static export.
let mozInitPromise: Promise<void> | null = null
function ensureMozInit(): Promise<void> {
  if (!mozInitPromise) {
    mozInitPromise = initMozEncode({
      locateFile: (path: string) => `/${path}`,
    }).catch((err) => {
      mozInitPromise = null
      throw err
    })
  }
  return mozInitPromise
}

// Per-worker decode cache. Same fingerprint → skip decode on subsequent rungs.
// Cap is set by the pool at worker init so mobile can halve it.
let cachePixelCap = 25_000_000
type Entry = { imageData: ImageData }
const cache = new Map<string, Entry>()

type InitReq = { type: 'init'; cachePixelCap: number }
type EncodeReq = {
  type: 'encode'
  reqId: number
  fingerprint: string
  jpegBytes: Uint8Array
  quality: number
  targetWidth?: number
  targetHeight?: number
}
type Req = InitReq | EncodeReq

type EncodeRes =
  | { type: 'encoded'; reqId: number; bytes: Uint8Array }
  | { type: 'error'; reqId: number; message: string }

async function decodeToImageData(jpegBytes: Uint8Array): Promise<ImageData> {
  const blob = new Blob([jpegBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
  const bmp = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bmp.width, bmp.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

async function encodeMoz(imageData: ImageData, quality: number): Promise<Uint8Array> {
  await ensureMozInit()
  // Only override quality — defaults are already the tightest MozJPEG can go
  // without visual regression: progressive JPEG, optimize_coding, 4:2:0
  // chroma, and the "web" quant table. Skipping trellis multipass: it buys
  // another ~5% but adds 2–3× encode time per image, which on a 100-image
  // PDF is a bad trade for the batch UX.
  const buf = await mozEncode(imageData, { quality: Math.max(1, Math.min(100, quality)) })
  return new Uint8Array(buf)
}

// Canvas fallback — used if MozJPEG's WASM fails to load (e.g., very old
// browser). Keeps the tool functional; loses the ~20% size win.
async function encodeCanvasFallback(imageData: ImageData, quality: number): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
  return new Uint8Array(await outBlob.arrayBuffer())
}

function maybeResize(src: ImageData, targetWidth?: number, targetHeight?: number): ImageData {
  if (!targetWidth || !targetHeight) return src
  if (targetWidth >= src.width || targetHeight >= src.height) return src
  if (targetWidth < 1 || targetHeight < 1) return src
  const srcCanvas = new OffscreenCanvas(src.width, src.height)
  srcCanvas.getContext('2d')!.putImageData(src, 0, 0)
  const dst = new OffscreenCanvas(targetWidth, targetHeight)
  const dctx = dst.getContext('2d')!
  dctx.imageSmoothingEnabled = true
  dctx.imageSmoothingQuality = 'high'
  dctx.drawImage(srcCanvas, 0, 0, targetWidth, targetHeight)
  return dctx.getImageData(0, 0, targetWidth, targetHeight)
}

async function encode(imageData: ImageData, quality: number): Promise<Uint8Array> {
  try {
    return await encodeMoz(imageData, quality)
  } catch {
    return encodeCanvasFallback(imageData, quality)
  }
}

self.addEventListener('message', async (ev: MessageEvent<Req>) => {
  const msg = ev.data
  if (msg.type === 'init') {
    cachePixelCap = msg.cachePixelCap
    return
  }
  if (msg.type !== 'encode') return
  const { reqId, fingerprint, jpegBytes, quality, targetWidth, targetHeight } = msg
  try {
    let entry = cache.get(fingerprint)
    if (!entry) {
      const imageData = await decodeToImageData(jpegBytes)
      const pixels = imageData.width * imageData.height
      if (pixels <= cachePixelCap) {
        entry = { imageData }
        cache.set(fingerprint, entry)
      } else {
        const resized = maybeResize(imageData, targetWidth, targetHeight)
        const out = await encode(resized, quality)
        const res: EncodeRes = { type: 'encoded', reqId, bytes: out }
        ;(self as unknown as Worker).postMessage(res, [out.buffer])
        return
      }
    }
    const resized = maybeResize(entry.imageData, targetWidth, targetHeight)
    const out = await encode(resized, quality)
    const res: EncodeRes = { type: 'encoded', reqId, bytes: out }
    ;(self as unknown as Worker).postMessage(res, [out.buffer])
  } catch (err) {
    const res: EncodeRes = {
      type: 'error',
      reqId,
      message: err instanceof Error ? err.message : String(err),
    }
    ;(self as unknown as Worker).postMessage(res)
  }
})
