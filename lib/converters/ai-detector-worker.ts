/// <reference lib="webworker" />
//
// Community Forensics ViT-S @384 with the 2026 re-fit head (single fake-logit).
// Loaded as a standalone fp32 ONNX via ORT WASM — not AutoModel (I/O names differ).

import {
  CLASSIFIER_CROP,
  DETECTOR_R2_HOST,
  aiScoreFromLogitList,
  centerCropOrigin,
  cropHwc,
  detectorOnnxUrls,
  detectorWasmThreads,
  fiveCropOrigins,
  rgbToNchwFloat32,
} from './ai-detector-logic'
import { detectCaptionClientProfile } from './caption-workload'

type OrtModule = {
  env: {
    wasm?: {
      proxy?: boolean
      simd?: boolean
      numThreads?: number
      wasmPaths?: string | Record<string, string>
    }
  }
  Tensor: new (type: 'float32', data: Float32Array, dims: number[]) => unknown
  InferenceSession: {
    create: (
      data: Uint8Array,
      opts: { executionProviders: string[] },
    ) => Promise<{
      inputNames: string[]
      outputNames: string[]
      run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: ArrayLike<number> }>>
    }>
  }
}

let sessionPromise: Promise<Awaited<ReturnType<OrtModule['InferenceSession']['create']>>> | null = null
let loadedDevice: 'webgpu' | 'wasm' | null = null
let taskChain: Promise<void> = Promise.resolve()
let ortApi: OrtModule | null = null

interface LoadMsg { type: 'load' }
interface ClassifyMsg {
  type: 'classify'
  id: string
  mimeType: string
  buffer: ArrayBuffer
  tta?: boolean
}
type IncomingMsg = LoadMsg | ClassifyMsg

function applyOnnxHints(ort: OrtModule, transformersEnv?: { backends?: { onnx?: { versions?: { web?: string }; wasm?: OrtModule['env']['wasm'] } } }): void {
  const nav = self.navigator
  const profile = detectCaptionClientProfile(
    nav?.userAgent ?? '',
    nav?.maxTouchPoints ?? 0,
    nav?.platform ?? '',
  )
  const wasm = ort.env?.wasm
  if (wasm) {
    wasm.proxy = false
    wasm.simd = true
    wasm.numThreads = detectorWasmThreads(
      profile,
      typeof SharedArrayBuffer !== 'undefined',
      nav?.hardwareConcurrency ?? 4,
    )
  }
  if (profile === 'ios' && wasm) {
    const version = transformersEnv?.backends?.onnx?.versions?.web
    if (version) {
      const prefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${version}/dist/`
      const paths = {
        mjs: `${prefix}ort-wasm-simd-threaded.mjs`,
        wasm: `${prefix}ort-wasm-simd-threaded.wasm`,
      }
      wasm.wasmPaths = paths
      if (transformersEnv?.backends?.onnx?.wasm) transformersEnv.backends.onnx.wasm.wasmPaths = paths
    }
  }
}

async function getOrt(): Promise<OrtModule> {
  if (ortApi) return ortApi
  const { env } = await import('@huggingface/transformers')
  const mod = await import('onnxruntime-web/wasm')
  const api = ((mod as { default?: OrtModule }).default ?? mod) as OrtModule
  if (!api.Tensor || !api.InferenceSession) {
    throw new Error('onnxruntime-web is missing Tensor or InferenceSession')
  }
  try { applyOnnxHints(api, env as { backends?: { onnx?: { versions?: { web?: string }; wasm?: OrtModule['env']['wasm'] } } }) } catch { /* best-effort */ }
  ortApi = api
  return api
}

async function fetchOnnx(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error(`Classifier download failed (${res.status})`)
  const total = Number(res.headers.get('content-length') || 0)
  if (!res.body) return new Uint8Array(await res.arrayBuffer())

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    const pct = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0
    self.postMessage({ type: 'load-progress', pct })
  }
  const out = new Uint8Array(loaded)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }
  return out
}

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      self.postMessage({ type: 'load-progress', pct: 0 })
      const ort = await getOrt()
      let lastErr: unknown
      let bytes: Uint8Array | null = null
      for (const url of detectorOnnxUrls(DETECTOR_R2_HOST)) {
        try {
          bytes = await fetchOnnx(url)
          break
        } catch (err) {
          lastErr = err
        }
      }
      if (!bytes) throw lastErr instanceof Error ? lastErr : new Error('Classifier failed to load')
      self.postMessage({ type: 'compiling', device: 'wasm' })
      const session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] })
      loadedDevice = 'wasm'
      return session
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
    const session = await getSession()
    const ort = await getOrt()
    const { RawImage } = await import('@huggingface/transformers')
    const blob = new Blob([msg.buffer], { type: msg.mimeType || 'image/png' })
    let image = await RawImage.fromBlob(blob)
    if (image.channels === 4) image = image.rgb()
    const origins = msg.tta
      ? fiveCropOrigins(image.width, image.height, CLASSIFIER_CROP)
      : [centerCropOrigin(image.width, image.height, CLASSIFIER_CROP)]
    const logits: number[] = []
    const inputName = session.inputNames[0]
    const outputName = session.outputNames[0]
    for (const origin of origins) {
      const cropped = cropHwc(image.data, image.width, image.height, image.channels, origin)
      const nchw = rgbToNchwFloat32(cropped, origin.side, origin.side, image.channels)
      const tensor = new ort.Tensor('float32', nchw, [1, 3, origin.side, origin.side])
      const out = await session.run({ [inputName]: tensor })
      logits.push(Number(out[outputName].data[0] ?? 0))
    }
    const p = aiScoreFromLogitList(logits)
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
