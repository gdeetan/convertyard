// Worker client for image upscaling.
// Delegates all TF.js/UpscalerJS work to upscaler-worker.ts so the main
// thread stays responsive during inference on large images.

const USE_ONNX_BACKEND = true

export type UpscaleScale = '2x' | '3x' | '4x' | '8x'
export type ImageMode = 'auto' | 'photo' | 'photo-compressed' | 'graphic' | 'illustration'
type OnnxDevice = 'webgpu' | 'wasm' | 'cpu'

const deviceReadyCallbacks: Array<(device: OnnxDevice) => void> = []

export function onDeviceReady(cb: (device: OnnxDevice) => void) {
  deviceReadyCallbacks.push(cb)
}

// ── Singleton worker ───────────────────────────────────────────────────────────

let workerInstance: Worker | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    // new URL(...) must be inline — webpack requires it directly inside new Worker()
    // to detect the pattern and bundle the file; an intermediate variable causes
    // webpack to copy the raw .ts source as a static asset instead (browser can't execute it).
    workerInstance = new Worker(
      new URL('./upscaler-onnx-worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerInstance.addEventListener('message', (e: MessageEvent) => {
      if (e.data?.type === 'log') console.log('[upscaler-worker]', e.data.message)
      if (e.data?.type === 'device-ready') {
        deviceReadyCallbacks.forEach(cb => cb(e.data.device as OnnxDevice))
        deviceReadyCallbacks.length = 0
      }
    })
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

    const cleanup = () => {
      worker.removeEventListener('message', handler)
      worker.removeEventListener('error', crashHandler)
    }

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.type === 'model-progress' && d.scale === scale) {
        onProgress?.(d.progress as number)
      } else if (d.type === 'model-ready' && d.scale === scale) {
        cleanup()
        readyMap[scale] = true
        delete loadingMap[scale]
        onProgress?.(100)
        resolve()
      } else if (d.type === 'error' && !d.id) {
        cleanup()
        delete loadingMap[scale]
        reject(new Error(d.message as string))
      }
    }

    const crashHandler = (e: ErrorEvent) => {
      cleanup()
      delete loadingMap[scale]
      reject(new Error(`Upscaler worker crashed: ${e.message}`))
    }

    worker.addEventListener('message', handler)
    worker.addEventListener('error', crashHandler, { once: true })
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
