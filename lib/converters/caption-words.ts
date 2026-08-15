import type { TranscriptionResult } from './transcription-client'
import type { WordChunk } from './caption-types'
import { filterWhisperChunks } from './whisper-postprocess'

export interface CaptionTranscript {
  words: WordChunk[]
  timestampsEstimated: boolean
}

function splitWords(text: string): string[] {
  return text.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean)
}

function distributeWords(tokens: string[], start: number, end: number): WordChunk[] {
  if (tokens.length === 0) return []
  const span = Math.max(end - start, 0.01)
  const step = span / tokens.length
  return tokens.map((text, i) => ({
    text,
    start: start + i * step,
    end: start + (i + 1) * step,
  }))
}

function chunkHasTiming(timestamp?: [number, number]): timestamp is [number, number] {
  return timestamp != null && Number.isFinite(timestamp[0])
}

/** True when chunks look like phrases, not individual words. */
export function looksLikeSegments(chunks: { text: string }[]): boolean {
  if (chunks.length === 0) return false
  const multi = chunks.filter((c) => splitWords(c.text).length > 2).length
  return multi / chunks.length >= 0.5
}

/**
 * Map a Whisper result to word chunks.
 * Uses real word timestamps when present. Segment timestamps are split
 * across the words in that segment. Never invents a 2-second grid.
 */
export function wordsFromTranscription(result: TranscriptionResult): CaptionTranscript {
  const raw = result.chunks ?? []
  const chunks = filterWhisperChunks(raw)

  if (chunks.length > 0 && chunks.every((c) => chunkHasTiming(c.timestamp))) {
    if (looksLikeSegments(chunks)) {
      const words: WordChunk[] = []
      for (const chunk of chunks) {
        const start = chunk.timestamp![0]
        const end = Number.isFinite(chunk.timestamp![1])
          ? chunk.timestamp![1]
          : start + Math.max(0.4, splitWords(chunk.text).length * 0.3)
        words.push(...distributeWords(splitWords(chunk.text), start, end))
      }
      return { words, timestampsEstimated: false }
    }

    const words: WordChunk[] = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const start = chunk.timestamp![0]
      const nextStart = chunks[i + 1]?.timestamp?.[0]
      const rawEnd = chunk.timestamp![1]
      const end = Number.isFinite(rawEnd)
        ? rawEnd
        : nextStart != null
          ? nextStart
          : start + 0.4
      const tokens = splitWords(chunk.text)
      if (tokens.length <= 1) {
        words.push({ text: tokens[0] ?? chunk.text.trim(), start, end })
      } else {
        words.push(...distributeWords(tokens, start, end))
      }
    }
    return { words, timestampsEstimated: false }
  }

  const tokens = splitWords(result.text ?? '')
  if (tokens.length === 0) return { words: [], timestampsEstimated: false }

  // Text exists but Whisper did not return usable timings. Do not invent a
  // 2-second grid — the UI must warn and require an SRT/VTT or a re-run.
  return {
    words: tokens.map((text) => ({ text, start: 0, end: 0 })),
    timestampsEstimated: true,
  }
}
