import type { TranscriptionResult } from './transcription-client'
import type { WordChunk } from './caption-types'
import { filterWhisperChunks } from './whisper-postprocess'

export interface CaptionTranscript {
  words: WordChunk[]
  timestampsEstimated: boolean
  /**
   * True when word starts/ends were interpolated across segment bounds rather
   * than emitted by the model. Real DTW word timings from the timestamped
   * variants are accurate enough that the segment-lead compensation and the
   * energy-onset snap should be skipped for them.
   */
  wordsInterpolated: boolean
}

export const WHISPER_WORD_LEAD_SEC = 0.12
const MIN_WORD_SPAN_SEC = 0.05

/**
 * Shift Whisper segment-derived word stamps earlier — Whisper's segment start
 * lands well before the first spoken word, so interpolated words are late.
 * Skip real word timings (already sub-100 ms accurate) and estimated/zero rows.
 */
export function applyWhisperWordLead(
  transcript: CaptionTranscript,
  leadSec = WHISPER_WORD_LEAD_SEC,
): CaptionTranscript {
  if (transcript.timestampsEstimated) return transcript
  if (!transcript.wordsInterpolated) return transcript
  if (!transcript.words.some((w) => w.end > 0)) return transcript
  return {
    ...transcript,
    words: transcript.words.map((w) => {
      const start = Math.max(0, w.start - leadSec)
      return { ...w, start, end: Math.max(start + MIN_WORD_SPAN_SEC, w.end - leadSec) }
    }),
  }
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
    anchorStart: start,
    anchorEnd: start + span,
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
      return { words, timestampsEstimated: false, wordsInterpolated: true }
    }

    const words: WordChunk[] = []
    let anyInterpolated = false
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
        anyInterpolated = true
        words.push(...distributeWords(tokens, start, end))
      }
    }
    return { words, timestampsEstimated: false, wordsInterpolated: anyInterpolated }
  }

  const tokens = splitWords(result.text ?? '')
  if (tokens.length === 0) {
    return { words: [], timestampsEstimated: false, wordsInterpolated: false }
  }

  // Text exists but Whisper did not return usable timings. Do not invent a
  // 2-second grid — the UI must warn and require an SRT/VTT or a re-run.
  return {
    words: tokens.map((text) => ({ text, start: 0, end: 0 })),
    timestampsEstimated: true,
    wordsInterpolated: false,
  }
}
