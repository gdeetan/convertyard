import type { ModelType } from './transformers-worker'
import { diagLog, diagError, diagMemory } from '@/lib/debug/mobile-diagnostics'

// ── Singleton worker ───────────────────────────────────────────────────────────

let workerInstance: Worker | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    diagLog('transformers-worker-spawn')
    workerInstance = new Worker(
      new URL('./transformers-worker.ts', import.meta.url),
      { type: 'module' }
    )
  }
  return workerInstance
}

// ── Model loading ─────────────────────────────────────────────────────────────

const modelReady: Partial<Record<ModelType, boolean>> = {}
// Deduplication: if model is already loading, return the same promise
const loadingPromise: Partial<Record<ModelType, Promise<void>>> = {}

let _lastModelProgressPct: Partial<Record<ModelType, number>> = {}

export function loadTransformersModel(
  modelType: ModelType,
  onProgress: (pct: number) => void
): Promise<void> {
  if (modelReady[modelType]) return Promise.resolve()
  if (loadingPromise[modelType]) return loadingPromise[modelType]!

  const p = new Promise<void>((resolve, reject) => {
    const worker = getWorker()

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.type === 'model-progress' && d.modelType === modelType) {
        onProgress(d.progress as number)
        const pct = d.progress as number
        const last = _lastModelProgressPct[modelType] ?? -10
        if (Math.floor(pct / 10) > Math.floor(last / 10)) {
          diagLog('model-download-progress', `${modelType} ${pct.toFixed(0)}%`)
          _lastModelProgressPct[modelType] = pct
        }
      } else if (d.type === 'model-ready' && d.modelType === modelType) {
        worker.removeEventListener('message', handler)
        modelReady[modelType] = true
        delete loadingPromise[modelType]
        delete _lastModelProgressPct[modelType]
        diagLog('model-ready', modelType)
        diagMemory(`after-model-ready:${modelType}`)
        onProgress(100)
        resolve()
      } else if (d.type === 'error' && !d.id) {
        worker.removeEventListener('message', handler)
        delete loadingPromise[modelType]
        const err = new Error(d.message as string)
        if (d.code) (err as Error & { code: string }).code = d.code as string
        diagError('model-load-fail', err)
        reject(err)
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage({ type: 'load', modelType })
  })

  loadingPromise[modelType] = p
  return p
}

// ── Image inference ───────────────────────────────────────────────────────────

export function removeBackground(
  file: File,
  outputFormat: string,
  onProgress?: (pct: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const id = crypto.randomUUID()
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const ext = outputFormat === 'webp' ? 'webp' : 'png'

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.id !== id) return

      if (d.type === 'infer-progress') {
        onProgress?.(d.progress as number)
      } else if (d.type === 'infer-result') {
        worker.removeEventListener('message', handler)
        const mime = d.outputMime as string
        const resultFile = new File([d.result as ArrayBuffer], `${baseName}.${ext}`, { type: mime })
        resolve(resultFile)
      } else if (d.type === 'error') {
        worker.removeEventListener('message', handler)
        const err = new Error(d.message as string)
        if (d.code) (err as Error & { code: string }).code = d.code as string
        if (d.phase) (err as Error & { phase: string }).phase = d.phase as string
        reject(err)
      }
    }

    worker.addEventListener('message', handler)

    file.arrayBuffer().then((buffer) => {
      worker.postMessage(
        { type: 'infer', id, modelType: 'bg-removal', buffer, mimeType: file.type, opts: { outputFormat } },
        [buffer]
      )
    }).catch(reject)
  })
}

export function generateAltText(
  file: File,
  maxTokens: number,
  contextHint?: string,
  filename?: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const id = crypto.randomUUID()

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.id !== id) return

      if (d.type === 'infer-progress') {
        onProgress?.(d.progress as number)
      } else if (d.type === 'infer-result') {
        worker.removeEventListener('message', handler)
        resolve(d.result as string)
      } else if (d.type === 'error') {
        worker.removeEventListener('message', handler)
        reject(new Error(d.message as string))
      }
    }

    worker.addEventListener('message', handler)

    file.arrayBuffer().then((buffer) => {
      worker.postMessage(
        { type: 'infer', id, modelType: 'alt-text', buffer, mimeType: file.type, opts: { maxTokens, contextHint, filename } },
        [buffer]
      )
    }).catch(reject)
  })
}

// ── Handwriting OCR (Florence-2) ──────────────────────────────────────────────

export function recognizeHandwritingOcr(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const id = crypto.randomUUID()

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.id !== id) return

      if (d.type === 'infer-progress') {
        onProgress?.(d.progress as number)
      } else if (d.type === 'infer-result') {
        worker.removeEventListener('message', handler)
        resolve((d.result as string) ?? '')
      } else if (d.type === 'error') {
        worker.removeEventListener('message', handler)
        reject(new Error(d.message as string))
      }
    }

    worker.addEventListener('message', handler)

    file.arrayBuffer().then((buffer) => {
      worker.postMessage(
        { type: 'infer', id, modelType: 'ocr', buffer, mimeType: file.type, opts: {} },
        [buffer]
      )
    }).catch(reject)
  })
}

