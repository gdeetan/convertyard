/// <reference lib="webworker" />

// Runs entirely in a Web Worker — never imported server-side.
// Handles Whisper-based audio transcription via transformers.js automatic-speech-recognition pipeline.
// Separate from transformers-worker.ts because Whisper uses a completely different pipeline type.

import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(env.backends as any).onnx.wasm.proxy = false

// ── Types ──────────────────────────────────────────────────────────────────────

export type WhisperQuality = 'fast' | 'balanced' | 'accurate'

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
  timestamps: boolean
}

type IncomingMsg = LoadMsg | TranscribeMsg

// ── Model state ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let whisperPipeline: any = null
let loadedQuality: WhisperQuality | null = null

// ── Model ID mapping ──────────────────────────────────────────────────────────

function modelIdForQuality(quality: WhisperQuality): string {
  switch (quality) {
    case 'fast':     return 'Xenova/whisper-tiny'
    case 'balanced': return 'Xenova/whisper-base'
    case 'accurate': return 'Xenova/whisper-small'
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
      self.postMessage({ type: 'model-progress', quality, progress: pct })
    }
  }
}

// ── Model loader ──────────────────────────────────────────────────────────────

async function loadWhisperModel(quality: WhisperQuality) {
  if (whisperPipeline && loadedQuality === quality) return

  const modelId = modelIdForQuality(quality)
  const cb = makeProgressCallback(quality)

  whisperPipeline = await pipeline('automatic-speech-recognition', modelId, {
    dtype: 'q8',
    progress_callback: cb,
  })
  loadedQuality = quality
}

// ── Transcription ─────────────────────────────────────────────────────────────

async function runTranscribe(
  id: string,
  audioData: Float32Array,
  sampleRate: number,
  language: string | null,
  timestamps: boolean
) {
  self.postMessage({ type: 'transcribe-progress', id, progress: 10 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (whisperPipeline as any)(audioData, {
    language: language ?? undefined,
    task: 'transcribe',
    return_timestamps: timestamps,
    chunk_length_s: 30,
    stride_length_s: 5,
    sampling_rate: sampleRate,
  })

  self.postMessage({ type: 'transcribe-progress', id, progress: 95 })
  self.postMessage({ type: 'transcribe-result', id, result })
}

// ── Message router ────────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      await loadWhisperModel(msg.quality)
      self.postMessage({ type: 'model-ready', quality: msg.quality })
    } catch (err) {
      self.postMessage({ type: 'error', message: (err as Error).message })
    }
    return
  }

  if (msg.type === 'transcribe') {
    const { id, audioData, sampleRate, language, timestamps } = msg
    try {
      await runTranscribe(id, audioData, sampleRate, language, timestamps)
    } catch (err) {
      self.postMessage({ type: 'error', id, message: (err as Error).message })
    }
  }
})
