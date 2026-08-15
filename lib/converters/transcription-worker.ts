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
  filterWhisperResult,
  type WhisperQuality,
} from './whisper-postprocess'

export type { WhisperQuality }

env.allowLocalModels = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(env.backends as any).onnx.wasm.proxy = false

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

interface ModelVariant {
  modelId: string
  dtype: 'fp32' | 'fp16' | 'int8' | 'q4' | 'q8'
}

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

// ── Model fallback mapping ────────────────────────────────────────────────────

function modelVariantsForQuality(quality: WhisperQuality): ModelVariant[] {
  switch (quality) {
    case 'fast':
      return [{ modelId: 'Xenova/whisper-tiny', dtype: 'fp32' }]
    case 'balanced':
      return [
        { modelId: 'Xenova/whisper-base', dtype: 'fp32' },
        { modelId: 'Xenova/whisper-tiny', dtype: 'fp32' },
      ]
    case 'accurate':
      return [
        { modelId: 'onnx-community/whisper-large-v3-turbo', dtype: 'int8' },
        { modelId: 'Xenova/whisper-small', dtype: 'fp32' },
        { modelId: 'Xenova/whisper-base', dtype: 'fp32' },
        { modelId: 'Xenova/whisper-tiny', dtype: 'fp32' },
      ]
  }
}

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

  const variants = modelVariantsForQuality(quality)
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

  const decode = decodeParamsForQuality(loadedQuality ?? 'balanced')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await (whisperPipeline as any)(audioData, {
    language: language ?? undefined,
    task: 'transcribe',
    return_timestamps: timestamps,
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
