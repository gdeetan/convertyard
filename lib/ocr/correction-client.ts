// lib/ocr/correction-client.ts
// Singleton Web Worker client for OCR correction, following the project's worker pattern.

import type { OcrWordMeta } from '@/lib/types'

let worker: Worker | null = null
const pending = new Map<string, {
  resolve: (v: OcrWordMeta[]) => void
  reject: (e: Error) => void
}>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./correction.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{
      id: string
      corrected?: OcrWordMeta[]
      error?: string
    }>) => {
      const p = pending.get(e.data.id)
      if (!p) return
      pending.delete(e.data.id)
      if (e.data.error) p.reject(new Error(e.data.error))
      else p.resolve(e.data.corrected!)
    }
    worker.onerror = (err) => {
      for (const p of pending.values()) p.reject(new Error(err.message ?? 'correction worker error'))
      pending.clear()
      worker = null
    }
  }
  return worker
}

export async function correctWords(
  words: OcrWordMeta[],
  trocr: boolean
): Promise<OcrWordMeta[]> {
  if (words.length === 0) return words
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ id, words, trocr })
  })
}
