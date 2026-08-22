/// <reference lib="webworker" />
//
// CommunityForensics ViT-S (single fake-logit). Loaded lazily via Worker.

import {
  CLASSIFIER_CROP,
  aiScoreFromLogits,
  detectorLoadSources,
  detectorWasmThreads,
  rgbToNchwFloat32,
} from './ai-detector-logic'
import { detectCaptionClientProfile } from './caption-workload'

declare const __HF_TOKEN__: string

const MODEL_HOST = 'https://pub-4e06a0715aae49b1975bbe46902137a3.r2.dev/'
const HF_HOST = 'https://huggingface.co/'
const HF_TEMPLATE = '{model}/resolve/{revision}/'

type Session = {
  model: (inputs: unknown) => Promise<{ logits: { data: ArrayLike<number> } }>
}

let sessionPromise: Promise<Session> | null = null
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

async function ensureHfAuth(env: { fetch: typeof fetch }): Promise<void> {
  if (typeof __HF_TOKEN__ === 'undefined' || !__HF_TOKEN__) return
  const inner = env.fetch
  env.fetch = ((url: RequestInfo | URL, init?: RequestInit) => {
    const u = url instanceof Request ? url.url : url instanceof URL ? url.href : String(url)
    if (u.includes('huggingface.co') || u.includes('hf.co')) {
      const headers = new Headers((init?.headers ?? {}) as HeadersInit)
      headers.set('Authorization', `Bearer ${__HF_TOKEN__}`)
      return inner(url as Parameters<typeof inner>[0], { ...init, headers })
    }
    return inner(url as Parameters<typeof inner>[0], init)
  }) as typeof env.fetch
}

function applyOnnxHints(env: { backends: unknown }): void {
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
  if (profile === 'ios' && onnx?.versions?.web && onnx.wasm) {
    const prefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${onnx.versions.web}/dist/`
    onnx.wasm.wasmPaths = {
      mjs: `${prefix}ort-wasm-simd-threaded.mjs`,
      wasm: `${prefix}ort-wasm-simd-threaded.wasm`,
    }
  }
}

async function getSession(): Promise<Session> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { AutoModelForImageClassification, env } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      await ensureHfAuth(env)
      try { applyOnnxHints(env) } catch { /* best-effort */ }

      self.postMessage({ type: 'load-progress', pct: 0 })
      const cb = makeProgressCallback()
      let lastErr: unknown
      for (const src of detectorLoadSources(MODEL_HOST)) {
        const prevHost = env.remoteHost
        const prevTemplate = env.remotePathTemplate
        try {
          env.remoteHost = src.host ?? HF_HOST
          env.remotePathTemplate = src.template
          const model = await AutoModelForImageClassification.from_pretrained(src.modelId, {
            dtype: src.dtype,
            device: 'wasm',
            progress_callback: cb,
          })
          loadedDevice = 'wasm'
          return { model } as unknown as Session
        } catch (err) {
          lastErr = err
        } finally {
          env.remoteHost = prevHost
          env.remotePathTemplate = prevTemplate ?? HF_TEMPLATE
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error('Classifier failed to load')
    })()
  }
  return sessionPromise
}

async function handleMessage(msg: IncomingMsg): Promise<void> {
  if (msg.type === 'load') {
    await getSession()
    self.postMessage({ type: 'ready', device: loadedDevice ?? 'wasm' })
    return
  }
  if (msg.type === 'classify') {
    const { model } = await getSession()
    const { RawImage, Tensor } = await import('@huggingface/transformers')
    const blob = new Blob([msg.buffer], { type: msg.mimeType || 'image/png' })
    let image = await RawImage.fromBlob(blob)
    if (image.width !== CLASSIFIER_CROP || image.height !== CLASSIFIER_CROP) {
      image = await image.resize(CLASSIFIER_CROP, CLASSIFIER_CROP)
    }
    if (image.channels === 4) image = image.rgb()
    const nchw = rgbToNchwFloat32(image.data, image.width, image.height, image.channels)
    const pixel_values = new Tensor('float32', nchw, [1, 3, image.height, image.width])
    const out = await model({ pixel_values })
    const p = aiScoreFromLogits(out.logits.data)
    self.postMessage({
      type: 'result',
      id: msg.id,
      preds: [
        { label: 'fake', score: p },
        { label: 'human', score: 1 - p },
      ],
    })
  }
}

self.onmessage = (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data
  taskChain = taskChain.then(() => handleMessage(msg)).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    if ('id' in msg) {
      self.postMessage({ type: 'error', id: msg.id, message })
    } else {
      sessionPromise = null
      self.postMessage({ type: 'error', message })
    }
  })
}

export {}
