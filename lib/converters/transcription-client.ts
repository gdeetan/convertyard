import type { WhisperQuality } from './transcription-worker'
import {
  classifyTranscriptionError,
  type TranscriptionErrorShape,
} from './transcription-errors'

// ── Singleton worker ───────────────────────────────────────────────────────────

let workerInstance: Worker | null = null
let workerFactory: (() => Worker) | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = workerFactory
      ? workerFactory()
      : new Worker(
          new URL('./transcription-worker.ts', import.meta.url),
          { type: 'module' }
        )
  }
  return workerInstance
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type QualityMode = WhisperQuality

export interface TranscriptionChunk {
  text: string
  timestamp?: [number, number]
}

export interface TranscriptionResult {
  text: string
  chunks?: TranscriptionChunk[]
}

export type { TranscriptionErrorShape as TranscriptionError }

export function __setWorkerFactoryForTests(factory: (() => Worker) | null): void {
  workerFactory = factory
  workerInstance = null
}

export function __resetTranscriptionClientForTests(): void {
  workerFactory = null
  workerInstance = null
  for (const key of Object.keys(modelReady) as QualityMode[]) delete modelReady[key]
  for (const key of Object.keys(loadingPromise) as QualityMode[]) delete loadingPromise[key]
}

/** Stop an in-flight Whisper job. The next transcribe reloads the model. */
export function abortTranscription(): void {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
  }
  for (const key of Object.keys(modelReady) as QualityMode[]) delete modelReady[key]
  for (const key of Object.keys(loadingPromise) as QualityMode[]) delete loadingPromise[key]
}

// ── Model loading ─────────────────────────────────────────────────────────────

const modelReady: Partial<Record<QualityMode, boolean>> = {}
// Deduplication: if model is already loading, return the same promise
const loadingPromise: Partial<Record<QualityMode, Promise<void>>> = {}

export function loadTranscriptionModel(
  quality: QualityMode,
  onProgress: (pct: number) => void
): Promise<void> {
  if (modelReady[quality]) return Promise.resolve()
  if (loadingPromise[quality]) return loadingPromise[quality]!

  const p = new Promise<void>((resolve, reject) => {
    const worker = getWorker()

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.type === 'model-progress' && d.quality === quality) {
        onProgress(d.progress as number)
      } else if (d.type === 'model-ready' && d.quality === quality) {
        worker.removeEventListener('message', handler)
        modelReady[quality] = true
        delete loadingPromise[quality]
        onProgress(100)
        resolve()
      } else if (d.type === 'error' && !d.id) {
        worker.removeEventListener('message', handler)
        delete loadingPromise[quality]
        reject(d.error as TranscriptionErrorShape)
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage({ type: 'load', quality })
  })

  loadingPromise[quality] = p
  return p
}

// ── Transcription ──────────────────────────────────────────────────────────────

export function transcribeAudio(
  audioData: Float32Array,
  sampleRate: number,
  language: string | null,
  timestamps: boolean | 'word',
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(Object.assign(new Error('Cancelled'), { name: 'AbortError' }))
      return
    }

    const worker = getWorker()
    const id = crypto.randomUUID()

    const cleanup = () => {
      worker.removeEventListener('message', handler)
      worker.removeEventListener('error', errorHandler)
      signal?.removeEventListener('abort', onAbort)
    }

    const onAbort = () => {
      cleanup()
      abortTranscription()
      reject(Object.assign(new Error('Cancelled'), { name: 'AbortError' }))
    }

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.id !== id) return

      if (d.type === 'transcribe-progress') {
        onProgress?.(d.progress as number)
      } else if (d.type === 'transcribe-result') {
        cleanup()
        const result = d.result
        // Transform Whisper result into TranscriptionResult format
        const output: TranscriptionResult = {
          text: result.text || '',
        }
        // If Whisper returned chunks with timestamps
        if (result.chunks && Array.isArray(result.chunks)) {
          output.chunks = result.chunks.map((chunk: any) => ({
            text: chunk.text,
            timestamp: chunk.timestamp ? [chunk.timestamp[0], chunk.timestamp[1]] : undefined,
          }))
        }
        resolve(output)
      } else if (d.type === 'error' && d.id === id) {
        cleanup()
        reject(d.error as TranscriptionErrorShape)
      }
    }

    const errorHandler = (e: ErrorEvent) => {
      cleanup()
      reject(classifyTranscriptionError(e.message ?? 'Worker error', {
        code: 'WORKER_INIT_FAILED',
        phase: 'worker',
      }))
    }

    worker.addEventListener('message', handler)
    worker.addEventListener('error', errorHandler, { once: true })
    signal?.addEventListener('abort', onAbort, { once: true })
    worker.postMessage({
      type: 'transcribe',
      id,
      audioData,
      sampleRate,
      language,
      timestamps,
    })
  })
}
