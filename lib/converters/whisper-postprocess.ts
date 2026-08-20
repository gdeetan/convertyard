export type WhisperQuality = 'fast' | 'balanced' | 'accurate'

export interface ModelVariant {
  modelId: string
  dtype: 'fp32' | 'fp16' | 'int8' | 'q4' | 'q8'
  /**
   * True when the ONNX export includes cross-attention tensors so
   * transformers.js can return real DTW word-level timestamps.
   * The `onnx-community/whisper-*_timestamped` builds do; the older
   * `Xenova/whisper-*` builds do not.
   */
  supportsWord?: boolean
}

/**
 * Accurate uses Small, not Turbo — Turbo often OOMs and poisons the WASM heap.
 *
 * The `_timestamped` variants are the modern onnx-community exports with
 * cross-attentions, so `return_timestamps: 'word'` returns real per-word
 * timings. Xenova/* is kept as a fallback for clients that can't fetch the
 * newer files.
 *
 * Constrained (phones) never use q8/q4. Xenova quantized Whisper files use
 * MatMulNBits without the required scale tensors, so session create fails with
 * TransposeDQWeightsForMatMulNBits. That failed session poisons ORT WASM and
 * the fp32 fallback then also fails. Tiny fp32 is the working path (same as TrOCR).
 */
export function modelVariantsForQuality(
  quality: WhisperQuality,
  opts?: { constrained?: boolean },
): ModelVariant[] {
  if (opts?.constrained) {
    return [
      { modelId: 'onnx-community/whisper-tiny_timestamped', dtype: 'fp32', supportsWord: true },
      { modelId: 'Xenova/whisper-tiny', dtype: 'fp32' },
    ]
  }

  switch (quality) {
    case 'fast':
      return [
        { modelId: 'onnx-community/whisper-tiny_timestamped', dtype: 'fp32', supportsWord: true },
        { modelId: 'Xenova/whisper-tiny', dtype: 'fp32' },
      ]
    case 'balanced':
      return [
        { modelId: 'onnx-community/whisper-base_timestamped', dtype: 'fp32', supportsWord: true },
        { modelId: 'onnx-community/whisper-tiny_timestamped', dtype: 'fp32', supportsWord: true },
        { modelId: 'Xenova/whisper-base', dtype: 'fp32' },
        { modelId: 'Xenova/whisper-tiny', dtype: 'fp32' },
      ]
    case 'accurate':
      return [
        { modelId: 'onnx-community/whisper-small_timestamped', dtype: 'fp32', supportsWord: true },
        { modelId: 'onnx-community/whisper-base_timestamped', dtype: 'fp32', supportsWord: true },
        { modelId: 'onnx-community/whisper-tiny_timestamped', dtype: 'fp32', supportsWord: true },
        { modelId: 'Xenova/whisper-small', dtype: 'fp32' },
        { modelId: 'Xenova/whisper-base', dtype: 'fp32' },
        { modelId: 'Xenova/whisper-tiny', dtype: 'fp32' },
      ]
  }
}

export interface WhisperChunk {
  text: string
  timestamp?: [number, number]
}

export interface WhisperResultLike {
  text?: string
  chunks?: WhisperChunk[]
}

/**
 * `onnx-community/whisper-*_timestamped` variants expose cross-attentions and
 * accept `return_timestamps: 'word'`. Legacy `Xenova/whisper-*` variants throw
 * mid-generation on that value, so downgrade to segment-level timestamps for
 * them.
 */
export function effectiveWhisperTimestamps(
  requested: boolean | 'word',
  supportsWord = false,
): boolean | 'word' {
  if (requested === 'word') return supportsWord ? 'word' : true
  return requested
}

/** Greedy decode for Fast/Balanced. Accurate keeps a small beam for harder audio. */
export function decodeParamsForQuality(
  quality: WhisperQuality,
  opts?: { constrained?: boolean },
): {
  num_beams: number
  no_repeat_ngram_size: number
  condition_on_previous_text: boolean
} {
  return {
    num_beams: !opts?.constrained && quality === 'accurate' ? 5 : 1,
    no_repeat_ngram_size: 3,
    condition_on_previous_text: false,
  }
}

const HALLUCINATION_PHRASES = [
  'thank you for watching',
  'thanks for watching',
  'thanks for listening',
  'please subscribe',
  'like and subscribe',
  'please like and subscribe',
  'see you next time',
  'subtitles by the amara.org community',
  'www.youtube.com',
]

const TAG_RE = /^\[(music|applause|laughter|silence|inaudible)\]$/i
const NOTES_RE = /^[♪♫]+$/

function normalizeToken(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isJunkChunk(text: string): boolean {
  const raw = text.trim()
  if (!raw) return true
  if (TAG_RE.test(raw) || NOTES_RE.test(raw)) return true
  const norm = normalizeToken(raw)
  if (!norm) return true
  return HALLUCINATION_PHRASES.includes(norm)
}

/** Drop empty/junk chunks, 3+ identical repeats, and known Whisper outro phrases. */
export function filterWhisperChunks(chunks: WhisperChunk[]): WhisperChunk[] {
  const cleaned: WhisperChunk[] = []
  let repeatCount = 0
  let lastNorm = ''

  for (const chunk of chunks) {
    if (isJunkChunk(chunk.text)) continue
    const norm = normalizeToken(chunk.text)
    if (norm === lastNorm) {
      repeatCount += 1
      if (repeatCount >= 3) continue
    } else {
      lastNorm = norm
      repeatCount = 1
    }
    cleaned.push({
      text: chunk.text,
      timestamp: chunk.timestamp,
    })
  }

  return dropHallucinationWindows(dedupeStrideOverlaps(cleaned))
}

function dropHallucinationWindows(chunks: WhisperChunk[]): WhisperChunk[] {
  if (chunks.length === 0) return chunks
  const drop = new Set<number>()
  const norms = chunks.map((c) => normalizeToken(c.text))

  for (const phrase of HALLUCINATION_PHRASES) {
    const parts = phrase.split(' ')
    for (let i = 0; i <= norms.length - parts.length; i++) {
      if (norms.slice(i, i + parts.length).join(' ') === phrase) {
        for (let j = 0; j < parts.length; j++) drop.add(i + j)
      }
    }
  }

  if (drop.size === 0) return chunks
  return chunks.filter((_, i) => !drop.has(i))
}

/** Drop duplicate words created by Whisper's sliding 30s window. */
export function dedupeStrideOverlaps(chunks: WhisperChunk[]): WhisperChunk[] {
  const out: WhisperChunk[] = []
  for (const chunk of chunks) {
    const prev = out[out.length - 1]
    if (!prev) {
      out.push(chunk)
      continue
    }
    const start = chunk.timestamp?.[0]
    const prevStart = prev.timestamp?.[0]
    const prevEnd = prev.timestamp?.[1]
    const same = normalizeToken(chunk.text) === normalizeToken(prev.text)
    if (
      same &&
      start != null &&
      prevStart != null &&
      prevEnd != null &&
      start < prevEnd &&
      start + 0.05 >= prevStart
    ) {
      continue
    }
    if (start != null && prevStart != null && start + 0.15 < prevStart) {
      continue
    }
    out.push(chunk)
  }
  return out
}

export function filterWhisperResult(result: WhisperResultLike): { text: string; chunks?: WhisperChunk[] } {
  if (result.chunks && result.chunks.length > 0) {
    const chunks = filterWhisperChunks(result.chunks)
    const text = chunks
      .map((c) => c.text)
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
    return { text, chunks }
  }

  const text = (result.text ?? '').trim()
  if (!text || isJunkChunk(text) || HALLUCINATION_PHRASES.includes(normalizeToken(text))) {
    return { text: '', chunks: [] }
  }
  return { text, chunks: result.chunks }
}
