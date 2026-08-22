/// <reference lib="webworker" />
//
// Runs the Organika/sdxl-detector SwinV2 classifier off the main thread.
// Loaded lazily by ai-detector.ts via new Worker(new URL(...)).

const MODEL_ID = 'Organika/sdxl-detector'

type Classifier = (input: string, opts?: { top_k?: number }) => Promise<Array<{ label: string; score: number }>>

let classifierPromise: Promise<Classifier> | null = null

interface LoadMsg { type: 'load' }
interface ClassifyMsg { type: 'classify'; id: string; dataUrl: string }
interface WarmupMsg { type: 'warmup' }
type IncomingMsg = LoadMsg | ClassifyMsg | WarmupMsg

async function getClassifier(): Promise<Classifier> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      try {
        return await pipeline('image-classification', MODEL_ID, { dtype: 'q8', device: 'webgpu' }) as unknown as Classifier
      } catch {
        return await pipeline('image-classification', MODEL_ID, { dtype: 'q8', device: 'wasm' }) as unknown as Classifier
      }
    })()
  }
  return classifierPromise
}

// Tiny 1x1 gray PNG — used for warmup so ONNX kernels JIT before the
// first real inference. Same size class as the eventual 512px input for
// most kernel shapes; not identical but close enough for compile-time.
const WARMUP_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII='

async function warmup(): Promise<void> {
  const c = await getClassifier()
  try { await c(WARMUP_PNG, { top_k: 1 }) } catch { /* warmup is best-effort */ }
}

self.onmessage = async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data
  try {
    if (msg.type === 'load') {
      await getClassifier()
      self.postMessage({ type: 'ready' })
      return
    }
    if (msg.type === 'warmup') {
      await warmup()
      self.postMessage({ type: 'warmed' })
      return
    }
    if (msg.type === 'classify') {
      const c = await getClassifier()
      const preds = await c(msg.dataUrl, { top_k: 5 })
      self.postMessage({ type: 'result', id: msg.id, preds })
      return
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if ('id' in msg) {
      self.postMessage({ type: 'error', id: msg.id, message })
    } else {
      self.postMessage({ type: 'error', message })
    }
  }
}

export {}
