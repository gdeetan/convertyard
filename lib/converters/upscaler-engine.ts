// Worker client for image upscaling.
// Delegates all TF.js/UpscalerJS work to upscaler-worker.ts so the main
// thread stays responsive during inference on large images.

const USE_ONNX_BACKEND = true

export type UpscaleScale = '2x' | '3x' | '4x' | '8x'
export type ImageMode = 'auto' | 'photo' | 'photo-compressed' | 'graphic'

// ── Singleton worker ───────────────────────────────────────────────────────────

let workerInstance: Worker | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    const workerUrl = USE_ONNX_BACKEND
      ? new URL('./upscaler-onnx-worker.ts', import.meta.url)
      : new URL('./upscaler-worker.ts', import.meta.url)
    workerInstance = new Worker(workerUrl, { type: 'module' })
  }
  return workerInstance
}

// ── Model loading ──────────────────────────────────────────────────────────────

const readyMap:   Partial<Record<UpscaleScale, boolean>>       = {}
const loadingMap: Partial<Record<UpscaleScale, Promise<void>>> = {}

export function loadUpscalerModel(
  scale: UpscaleScale,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (readyMap[scale]) return Promise.resolve()
  if (loadingMap[scale]) return loadingMap[scale]!

  const p = new Promise<void>((resolve, reject) => {
    const worker = getWorker()

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.type === 'model-progress' && d.scale === scale) {
        onProgress?.(d.progress as number)
      } else if (d.type === 'model-ready' && d.scale === scale) {
        worker.removeEventListener('message', handler)
        readyMap[scale] = true
        delete loadingMap[scale]
        onProgress?.(100)
        resolve()
      } else if (d.type === 'error' && !d.id) {
        worker.removeEventListener('message', handler)
        delete loadingMap[scale]
        reject(new Error(d.message as string))
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage({ type: 'load', scale })
  })

  loadingMap[scale] = p
  return p
}

// ── Image upscaling ────────────────────────────────────────────────────────────

export function upscaleImageFile(
  file: File,
  scale: UpscaleScale,
  outputFormat: string | null,
  onProgress?: (pct: number) => void,
  imageMode: ImageMode = 'auto'
): Promise<File> {
  return new Promise((resolve, reject) => {
    const worker   = getWorker()
    const id       = crypto.randomUUID()
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const mimeType = file.type || 'image/jpeg'

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.id !== id) return

      if (d.type === 'infer-progress') {
        onProgress?.(d.progress as number)
      } else if (d.type === 'infer-result') {
        worker.removeEventListener('message', handler)
        worker.removeEventListener('error', errorHandler)
        const outMime = (d.outputMime as string) || mimeType
        const outExt  = outMime.split('/')[1] ?? 'jpg'
        resolve(new File([d.result as ArrayBuffer], `${baseName}-${scale}.${outExt}`, { type: outMime }))
      } else if (d.type === 'error') {
        worker.removeEventListener('message', handler)
        worker.removeEventListener('error', errorHandler)
        reject(new Error(d.message as string))
      }
    }

    const errorHandler = (e: ErrorEvent) => {
      worker.removeEventListener('message', handler)
      worker.removeEventListener('error', errorHandler)
      reject(new Error(e.message ?? 'Upscaler worker crash'))
    }

    worker.addEventListener('message', handler)
    worker.addEventListener('error', errorHandler, { once: true })

    file.arrayBuffer().then((buffer) => {
      worker.postMessage(
        { type: 'infer', id, scale, buffer, mimeType, outputFormat: outputFormat ?? undefined, imageMode },
        [buffer]
      )
    }).catch(reject)
  })
}
