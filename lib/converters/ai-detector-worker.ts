/// <reference lib="webworker" />
//
// Runs the Organika/sdxl-detector SwinV2 classifier off the main thread.
// Loaded lazily by ai-detector.ts via new Worker(new URL(...)).

import { classifierLoadAttempts, detectorWasmThreads } from './ai-detector-logic'
import { detectCaptionClientProfile } from './caption-workload'

const MODEL_HOST = 'https://pub-4e06a0715aae49b1975bbe46902137a3.r2.dev/'
const MODEL_ID = MODEL_HOST ? 'models/sdxl-detector' : 'Organika/sdxl-detector'

type Classifier = (
  input: Blob,
  opts?: { top_k?: number },
) => Promise<Array<{ label: string; score: number }>>

let classifierPromise: Promise<Classifier> | null = null
let loadedDevice: 'webgpu' | 'wasm' | null = null
let taskChain: Promise<void> = Promise.resolve()

interface LoadMsg { type: 'load' }
interface ClassifyMsg {
  type: 'classify'
  id: string
  mimeType: string
  buffer: ArrayBuffer
}
type IncomingMsg = LoadMsg | ClassifyMsg

function makeProgressCallback() {
  const downloaded: Record<string, number> = {}
  const totals: Record<string, number> = {}
  return (info: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (info.status === 'progress' && info.file && info.loaded != null && info.total != null) {
      downloaded[info.file] = info.loaded
      totals[info.file] = info.total
      const totalDown = Object.values(downloaded).reduce((a, b) => a + b, 0)
      const totalExpected = Object.values(totals).reduce((a, b) => a + b, 0)
      const pct = totalExpected > 0 ? Math.round((totalDown / totalExpected) * 100) : 0
      if (pct >= 100) self.postMessage({ type: 'compiling', device: 'wasm' })
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
        const nav = self.navigator
        const profile = detectCaptionClientProfile(
          nav?.userAgent ?? '',
          nav?.maxTouchPoints ?? 0,
          nav?.platform ?? '',
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onnx = (env.backends as any).onnx
        if (onnx?.wasm) {
          onnx.wasm.proxy = false
          onnx.wasm.simd = true
          onnx.wasm.numThreads = detectorWasmThreads(
            profile,
            typeof SharedArrayBuffer !== 'undefined',
            nav?.hardwareConcurrency ?? 4,
          )
        }
        // iOS Chrome/Firefox are WebKit; transformers.js only picks the
        // Safari-safe (non-asyncify) ORT build when the UA looks like Safari.
        if (profile === 'ios' && onnx?.versions?.web && onnx.wasm) {
          const prefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${onnx.versions.web}/dist/`
          onnx.wasm.wasmPaths = {
            mjs: `${prefix}ort-wasm-simd-threaded.mjs`,
            wasm: `${prefix}ort-wasm-simd-threaded.wasm`,
          }
        }
      } catch { /* backends config best-effort */ }

      self.postMessage({ type: 'load-progress', pct: 0 })
      const [opts] = classifierLoadAttempts()
      const clf = await pipeline('image-classification', MODEL_ID, {
        ...opts,
        progress_callback: makeProgressCallback(),
      }) as unknown as Classifier
      loadedDevice = opts.device
      return clf
    })()
  }
  return classifierPromise
}

async function handleMessage(msg: IncomingMsg): Promise<void> {
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
  }
}

self.onmessage = (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data
  taskChain = taskChain.then(() => handleMessage(msg)).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    if ('id' in msg) {
      self.postMessage({ type: 'error', id: msg.id, message })
    } else {
      classifierPromise = null
      self.postMessage({ type: 'error', message })
    }
  })
}

export {}
