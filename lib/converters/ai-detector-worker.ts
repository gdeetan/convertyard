/// <reference lib="webworker" />
//
// Runs the Organika/sdxl-detector SwinV2 classifier off the main thread.
// Loaded lazily by ai-detector.ts via new Worker(new URL(...)).

import { classifierLoadAttempts } from './ai-detector-logic'

const MODEL_HOST = 'https://pub-4e06a0715aae49b1975bbe46902137a3.r2.dev/'
const MODEL_ID = MODEL_HOST ? 'models/sdxl-detector' : 'Organika/sdxl-detector'

type Classifier = (
  input: Blob,
  opts?: { top_k?: number },
) => Promise<Array<{ label: string; score: number }>>

let classifierPromise: Promise<Classifier> | null = null
let loadedDevice: 'webgpu' | 'wasm' | null = null

interface LoadMsg { type: 'load' }
interface ClassifyMsg {
  type: 'classify'
  id: string
  mimeType: string
  buffer: ArrayBuffer
}
type IncomingMsg = LoadMsg | ClassifyMsg

async function probeWebGPU(): Promise<boolean> {
  try {
    const gpu = (self as unknown as { navigator?: { gpu?: { requestAdapter: () => Promise<unknown> } } }).navigator?.gpu
    if (!gpu) return false
    return !!(await gpu.requestAdapter())
  } catch {
    return false
  }
}

function makeProgressCallback(device: 'webgpu' | 'wasm') {
  const downloaded: Record<string, number> = {}
  const totals: Record<string, number> = {}
  return (info: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (info.status === 'progress' && info.file && info.loaded != null && info.total != null) {
      downloaded[info.file] = info.loaded
      totals[info.file] = info.total
      const totalDown = Object.values(downloaded).reduce((a, b) => a + b, 0)
      const totalExpected = Object.values(totals).reduce((a, b) => a + b, 0)
      const pct = totalExpected > 0 ? Math.round((totalDown / totalExpected) * 100) : 0
      if (pct >= 100) self.postMessage({ type: 'compiling', device })
      else self.postMessage({ type: 'load-progress', pct })
    }
  }
}

async function getClassifier(): Promise<Classifier> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      if (MODEL_HOST) env.remoteHost = MODEL_HOST
      try {
        const cores = (self.navigator?.hardwareConcurrency ?? 4) as number
        const wasm = (env.backends as unknown as { onnx?: { wasm?: { numThreads?: number; simd?: boolean } } }).onnx?.wasm
        if (wasm) {
          wasm.numThreads = Math.max(1, Math.min(cores, 8))
          wasm.simd = true
        }
      } catch { /* backends config best-effort */ }

      const webgpu = await probeWebGPU()
      const attempts = classifierLoadAttempts(webgpu)
      let lastErr: unknown
      for (const opts of attempts) {
        try {
          self.postMessage({ type: 'compiling', device: opts.device })
          const clf = await pipeline('image-classification', MODEL_ID, {
            ...opts,
            progress_callback: makeProgressCallback(opts.device),
          }) as unknown as Classifier
          loadedDevice = opts.device
          return clf
        } catch (err) {
          lastErr = err
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error('Classifier failed to load')
    })()
  }
  return classifierPromise
}

self.onmessage = async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data
  try {
    if (msg.type === 'load') {
      await getClassifier()
      self.postMessage({ type: 'ready', device: loadedDevice ?? 'wasm' })
      return
    }
    if (msg.type === 'classify') {
      const c = await getClassifier()
      const blob = new Blob([msg.buffer], { type: msg.mimeType || 'image/png' })
      const preds = await c(blob, { top_k: 5 })
      self.postMessage({ type: 'result', id: msg.id, preds })
      return
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if ('id' in msg) {
      self.postMessage({ type: 'error', id: msg.id, message })
    } else {
      classifierPromise = null
      self.postMessage({ type: 'error', message })
    }
  }
}

export {}
