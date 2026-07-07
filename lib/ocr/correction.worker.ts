// lib/ocr/correction.worker.ts
// Web Worker: loads /public/dicts/en.txt.gz once, builds DictIndex, handles correction requests.
// Dictionary build runs here to avoid blocking the main thread.

import { applyCorrections, type DictIndex } from './correction'
import type { OcrWordMeta } from '@/lib/types'

let dictIndex: DictIndex | null = null
let loading: Promise<DictIndex> | null = null

async function buildIndex(): Promise<DictIndex> {
  const res = await fetch('/dicts/en.txt.gz')
  if (!res.ok) throw new Error(`Dictionary fetch failed: ${res.status}`)
  const ds = new DecompressionStream('gzip')
  const stream = res.body!.pipeThrough(ds)
  const text = await new Response(stream).text()
  const lines = text.split('\n')
  const words = new Set<string>()
  const freq = new Map<string, number>()
  let rank = 1
  for (const raw of lines) {
    const w = raw.trim().toLowerCase()
    if (w) {
      words.add(w)
      freq.set(w, rank++)
    }
  }
  return { words, freq }
}

async function getIndex(): Promise<DictIndex> {
  if (dictIndex) return dictIndex
  if (!loading) {
    loading = buildIndex()
      .then(idx => { dictIndex = idx; return idx })
      .catch(err => { loading = null; throw err })
  }
  return loading
}

self.onmessage = async (e: MessageEvent<{
  id: string
  words: OcrWordMeta[]
  trocr: boolean
}>) => {
  const { id, words, trocr } = e.data
  try {
    const dict = await getIndex()
    const corrected = applyCorrections(words, dict, trocr)
    self.postMessage({ id, corrected })
  } catch (err) {
    self.postMessage({ id, error: String(err) })
  }
}
