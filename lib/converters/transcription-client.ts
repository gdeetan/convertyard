import type { WhisperQuality } from './transcription-worker'

// ── Singleton worker ───────────────────────────────────────────────────────────

let workerInstance: Worker | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
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
        reject(new Error(d.message as string))
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
  timestamps: boolean,
  onProgress?: (pct: number) => void
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const id = crypto.randomUUID()

    const handler = (e: MessageEvent) => {
      const d = e.data
      if (d.id !== id) return

      if (d.type === 'transcribe-progress') {
        onProgress?.(d.progress as number)
      } else if (d.type === 'transcribe-result') {
        worker.removeEventListener('message', handler)
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
        worker.removeEventListener('message', handler)
        reject(new Error(d.message as string))
      }
    }

    worker.addEventListener('message', handler)
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
