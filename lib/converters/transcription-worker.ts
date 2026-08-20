/// <reference lib="webworker" />

// Runs entirely in a Web Worker — never imported server-side.
// Handles Whisper-based audio transcription via transformers.js automatic-speech-recognition pipeline.
// Separate from transformers-worker.ts because Whisper uses a completely different pipeline type.

import { pipeline, env } from '@huggingface/transformers'
import {
  classifyTranscriptionError,
  type TranscriptionErrorShape,
  type TranscriptionLoadAttempt,
} from './transcription-errors'
import {
  decodeParamsForQuality,
  effectiveWhisperTimestamps,
  filterWhisperResult,
  modelVariantsForQuality,
  type ModelVariant,
  type WhisperQuality,
} from './whisper-postprocess'
import { detectCaptionClientProfile, needsSafariOnnxWasm } from './caption-workload'

export type { WhisperQuality }

// Injected at build time — empty string when env var is not set
declare const __HF_TOKEN__: string

env.allowLocalModels = false

function isConstrainedClient(): boolean {
  const nav = self.navigator
  if (!nav) return false
  return detectCaptionClientProfile(nav.userAgent ?? '', nav.maxTouchPoints ?? 0, nav.platform ?? '') !== 'desktop'
}

function applyOnnxRuntimeHints() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onnx = (env.backends as any).onnx
    if (!onnx?.wasm) return
    onnx.wasm.proxy = false

    const nav = self.navigator
    const profile = nav
      ? detectCaptionClientProfile(nav.userAgent ?? '', nav.maxTouchPoints ?? 0, nav.platform ?? '')
      : 'desktop'

    // COOP/COEP is set site-wide in next.config, so SharedArrayBuffer is
    // available on desktop. iOS Safari's WASM threading is broken (session
    // create hangs), and phones don't benefit enough to justify the memory
    // cost. Keep single-thread on mobile, spin up hardware concurrency on
    // desktop for a 2–4× Whisper speedup.
    if (profile === 'desktop' && typeof SharedArrayBuffer !== 'undefined') {
      const cores = nav?.hardwareConcurrency ?? 4
      onnx.wasm.numThreads = Math.max(1, Math.min(8, Math.floor(cores / 2)))
    } else {
      onnx.wasm.numThreads = 1
    }

    if (profile !== 'ios') return
    const version = onnx.versions?.web
    if (!version) return
    const prefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${version}/dist/`
    onnx.wasm.wasmPaths = {
      mjs: `${prefix}ort-wasm-simd-threaded.mjs`,
      wasm: `${prefix}ort-wasm-simd-threaded.wasm`,
    }
  } catch { /* env shape varies by transformers.js version */ }
}

applyOnnxRuntimeHints()

let _authReady = false

async function ensureHfAuth() {
  if (_authReady) return
  _authReady = true
  if (typeof __HF_TOKEN__ === 'undefined' || !__HF_TOKEN__) return
  const _fetch = env.fetch
  env.fetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const u = url instanceof Request ? url.url : url instanceof URL ? url.href : String(url)
    if (u.includes('huggingface.co') || u.includes('hf.co')) {
      const headers = new Headers((init?.headers ?? {}) as HeadersInit)
      headers.set('Authorization', `Bearer ${__HF_TOKEN__}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return _fetch(u as any, { ...init, headers })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return _fetch(url as any, init)
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface LoadMsg {
  type: 'load'
  quality: WhisperQuality
}

interface TranscribeMsg {
  type: 'transcribe'
  id: string
  audioData: Float32Array
  sampleRate: number
  language: string | null
  timestamps: boolean | 'word'
}

type IncomingMsg = LoadMsg | TranscribeMsg

interface ModelErrorMsg {
  type: 'error'
  id?: string
  error: TranscriptionErrorShape
}

interface ModelProgressMsg {
  type: 'model-progress'
  quality: WhisperQuality
  progress: number
}

interface ModelReadyMsg {
  type: 'model-ready'
  quality: WhisperQuality
  modelId: string
  dtype: string
}

// ── Model state ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let whisperPipeline: any = null
let loadedQuality: WhisperQuality | null = null
let loadedVariant: ModelVariant | null = null

// ── Aggregated download progress tracker ──────────────────────────────────────

function makeProgressCallback(quality: WhisperQuality) {
  const downloaded: Record<string, number> = {}
  const totals: Record<string, number> = {}

  return (info: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (info.status === 'progress' && info.file && info.loaded != null && info.total != null) {
      downloaded[info.file] = info.loaded
      totals[info.file] = info.total
      const totalDown = Object.values(downloaded).reduce((a, b) => a + b, 0)
      const totalExpected = Object.values(totals).reduce((a, b) => a + b, 0)
      const pct = totalExpected > 0 ? Math.round((totalDown / totalExpected) * 100) : 0
      self.postMessage({ type: 'model-progress', quality, progress: pct } satisfies ModelProgressMsg)
    }
  }
}

function postError(error: TranscriptionErrorShape, id?: string) {
  self.postMessage({ type: 'error', id, error } satisfies ModelErrorMsg)
}

// ── Model loader ──────────────────────────────────────────────────────────────

async function loadWhisperModel(quality: WhisperQuality) {
  if (whisperPipeline && loadedQuality === quality) return

  await ensureHfAuth()

  const variants = modelVariantsForQuality(quality, { constrained: isConstrainedClient() })
  const attempts: TranscriptionLoadAttempt[] = []
  let lastError: TranscriptionErrorShape | null = null

  whisperPipeline = null
  loadedQuality = null
  loadedVariant = null

  for (const variant of variants) {
    try {
      const cb = makeProgressCallback(quality)
      whisperPipeline = await pipeline('automatic-speech-recognition', variant.modelId, {
        dtype: variant.dtype,
        device: 'wasm',
        progress_callback: cb,
      })
      loadedQuality = quality
      loadedVariant = variant
      return
    } catch (err) {
      lastError = classifyTranscriptionError(err, {
        modelId: variant.modelId,
        dtype: variant.dtype,
      })
      attempts.push({
        modelId: variant.modelId,
        dtype: variant.dtype,
        quality,
        error: lastError.rawMessage,
      })
      try { await whisperPipeline?.dispose?.() } catch { /* ignore */ }
      whisperPipeline = null
    }
  }

  throw {
    ...(lastError ?? classifyTranscriptionError('Whisper model failed to load')),
    phase: 'load' as const,
    attempts,
  } satisfies TranscriptionErrorShape
}

// ── Transcription ─────────────────────────────────────────────────────────────

async function runTranscribe(
  id: string,
  audioData: Float32Array,
  sampleRate: number,
  language: string | null,
  timestamps: boolean | 'word',
) {
  self.postMessage({ type: 'transcribe-progress', id, progress: 10 })

  const decode = decodeParamsForQuality(loadedQuality ?? 'balanced', {
    constrained: isConstrainedClient(),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (whisperPipeline as any)(audioData, {
    language: language ?? undefined,
    task: 'transcribe',
    return_timestamps: effectiveWhisperTimestamps(timestamps, loadedVariant?.supportsWord),
    chunk_length_s: 30,
    stride_length_s: 3,
    sampling_rate: sampleRate,
    ...decode,
  })

  const result = filterWhisperResult(raw)

  self.postMessage({ type: 'transcribe-progress', id, progress: 95 })
  self.postMessage({ type: 'transcribe-result', id, result })
}

// ── Message router ────────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      await loadWhisperModel(msg.quality)
      self.postMessage({
        type: 'model-ready',
        quality: msg.quality,
        modelId: loadedVariant?.modelId ?? modelVariantsForQuality(msg.quality)[0].modelId,
        dtype: loadedVariant?.dtype ?? 'fp32',
      } satisfies ModelReadyMsg)
    } catch (err) {
      postError(classifyTranscriptionError(err, { phase: 'load' }))
    }
    return
  }

  if (msg.type === 'transcribe') {
    const { id, audioData, sampleRate, language, timestamps } = msg
    try {
      await runTranscribe(id, audioData, sampleRate, language, timestamps)
    } catch (err) {
      postError(classifyTranscriptionError(err, {
        phase: 'transcribe',
        code: 'TRANSCRIBE_FAILED',
        modelId: loadedVariant?.modelId,
        dtype: loadedVariant?.dtype,
      }), id)
    }
  }
})
