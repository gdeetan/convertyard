import { decodeAudioViaWebAudio } from './audio-decode'
import {
  extractAudio,
  releaseCaptionExtractRuntime,
} from './caption-transcribe'
import {
  detectCaptionClientProfile,
  whisperAudioWindows,
  type CaptionClientProfile,
} from './caption-workload'
import {
  loadTranscriptionModel,
  transcribeAudio as transcribeAudioClient,
  type TranscriptionError,
  type QualityMode,
  type TranscriptionResult,
} from './transcription-client'
import { classifyTranscriptionError } from './transcription-errors'
import {
  applyTranscriptGlossaryToSrt,
  applyVocabToTranscriptionResult,
  buildWhisperVocabPrompt,
  parseTranscriptTerms,
} from './transcript-terms'

// ── Re-exports ─────────────────────────────────────────────────────────────────

export type { QualityMode }

// ── Types ──────────────────────────────────────────────────────────────────────

export type OutputFormat = 'txt' | 'srt'

export interface TranscriptionBatchResult {
  filename: string
  text: string
  output: string
  srt?: string
  error?: TranscriptionError
}

export interface TranscriptionOptions {
  quality: QualityMode
  language: string | null
  outputFormat: OutputFormat
  terms?: string
}

export function selectTranscriptionOutput(
  result: Pick<TranscriptionBatchResult, 'text' | 'srt'>,
  outputFormat: OutputFormat
): string {
  return outputFormat === 'srt' ? result.srt ?? result.text : result.text
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']

function isVideo(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext)
}

function currentCaptionProfile() {
  if (typeof navigator === 'undefined') return 'desktop' as const
  return detectCaptionClientProfile(
    navigator.userAgent,
    navigator.maxTouchPoints,
    navigator.platform,
  )
}

const DESKTOP_SLICE_SEC = 30
const DESKTOP_HOP_SEC = 27

/** 30s Whisper windows on desktop/Android; iPhone keeps the 15s Safari slices. */
export function transcriptionAudioWindows(
  sampleCount: number,
  sampleRate: number,
  profile: CaptionClientProfile,
): { start: number; end: number; offsetSec: number }[] {
  if (profile === 'ios') return whisperAudioWindows(sampleCount, sampleRate, profile)
  if (sampleCount <= 0) return [{ start: 0, end: 0, offsetSec: 0 }]
  const win = Math.round(DESKTOP_SLICE_SEC * sampleRate)
  const hop = Math.round(DESKTOP_HOP_SEC * sampleRate)
  const out: { start: number; end: number; offsetSec: number }[] = []
  for (let start = 0; start < sampleCount; start += hop) {
    const end = Math.min(sampleCount, start + win)
    out.push({ start, end, offsetSec: start / sampleRate })
    if (end >= sampleCount) break
  }
  return out.length > 0 ? out : [{ start: 0, end: sampleCount, offsetSec: 0 }]
}

function joinTranscriptParts(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function offsetChunks(
  chunks: TranscriptionResult['chunks'] | undefined,
  offsetSec: number,
): NonNullable<TranscriptionResult['chunks']> {
  if (!chunks) return []
  return chunks.map((chunk) => {
    const t0 = (chunk.timestamp?.[0] ?? 0) + offsetSec
    const t1 = (chunk.timestamp?.[1] ?? t0) + offsetSec
    return { text: chunk.text, timestamp: [t0, t1] as [number, number] }
  })
}

async function pcmForTranscription(file: File): Promise<Float32Array> {
  if (isVideo(file)) {
    try {
      const pcm = await extractAudio(file)
      await releaseCaptionExtractRuntime()
      return pcm
    } catch (err) {
      await releaseCaptionExtractRuntime().catch(() => {})
      throw classifyTranscriptionError(err, { code: 'VIDEO_AUDIO_EXTRACT_FAILED', phase: 'extract' })
    }
  }
  try {
    return await decodeAudioViaWebAudio(file)
  } catch (err) {
    throw classifyTranscriptionError(err, { code: 'AUDIO_DECODE_FAILED', phase: 'decode' })
  }
}

// ── SRT builder ────────────────────────────────────────────────────────────────

function toSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

export function buildSRT(result: TranscriptionResult): string {
  if (!result.chunks || result.chunks.length === 0) {
    return `1\n00:00:00,000 --> 00:00:10,000\n${result.text}\n`
  }

  return result.chunks
    .map((chunk, idx) => {
      const start = chunk.timestamp?.[0] ?? idx * 5
      const end = chunk.timestamp?.[1] ?? start + 5
      return `${idx + 1}\n${toSRTTime(start)} --> ${toSRTTime(end)}\n${chunk.text.trim()}\n`
    })
    .join('\n')
}

// ── Batch orchestrator ─────────────────────────────────────────────────────────

export async function transcribeBatch(
  files: File[],
  options: TranscriptionOptions,
  onModelProgress: (pct: number) => void,
  onFileProgress: (fileIndex: number, pct: number) => void,
  onFileResult: (
    fileIndex: number,
    result: Pick<TranscriptionBatchResult, 'text' | 'srt' | 'output'>,
    isFinal?: boolean,
  ) => void,
): Promise<TranscriptionBatchResult[]> {
  const terms = parseTranscriptTerms(options.terms ?? '')
  const prompt = buildWhisperVocabPrompt(terms)
  const desktopParallel = currentCaptionProfile() === 'desktop'

  let modelReady = false
  const modelPromise = desktopParallel
    ? loadTranscriptionModel(options.quality, onModelProgress).then(() => {
        modelReady = true
        onModelProgress(100)
      })
    : null

  const results: TranscriptionBatchResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onFileProgress(i, 5)

      const audioData = await pcmForTranscription(files[i])
      onFileProgress(i, 25)

      if (!desktopParallel) {
        if (!modelReady) {
          await loadTranscriptionModel(options.quality, onModelProgress)
          modelReady = true
          onModelProgress(100)
        }
      } else {
        await modelPromise
      }

      const needsTimestamps = options.outputFormat === 'srt'
      const sampleRate = 16000
      const windows = transcriptionAudioWindows(audioData.length, sampleRate, currentCaptionProfile())
      const textParts: string[] = []
      const mergedChunks: NonNullable<TranscriptionResult['chunks']> = []

      let entry: TranscriptionBatchResult = {
        filename: files[i].name,
        text: '',
        output: '',
      }

      try {
        for (let w = 0; w < windows.length; w++) {
          const { start, end, offsetSec } = windows[w]
          const slice = audioData.subarray(start, end)
          const windowResult = await transcribeAudioClient(
            slice,
            sampleRate,
            options.language,
            needsTimestamps,
            (pct) => {
              const base = (w + pct / 100) / windows.length
              onFileProgress(i, 25 + Math.round(base * 0.7))
            },
            undefined,
            prompt || undefined,
          )
          if (windowResult.text) textParts.push(windowResult.text)
          mergedChunks.push(...offsetChunks(windowResult.chunks, offsetSec))

          let result: TranscriptionResult = {
            text: joinTranscriptParts(textParts),
            chunks: mergedChunks.length > 0 ? mergedChunks : undefined,
          }
          if (prompt || terms.length > 0) {
            result = applyVocabToTranscriptionResult(result, prompt, terms)
          }

          entry = {
            filename: files[i].name,
            text: result.text,
            output: result.text,
          }
          if (options.outputFormat === 'srt') {
            const srt = buildSRT(result)
            entry.srt = terms.length > 0 ? applyTranscriptGlossaryToSrt(srt, terms) : srt
            entry.output = selectTranscriptionOutput(entry, options.outputFormat)
          }

          const isFinal = w === windows.length - 1
          onFileProgress(i, isFinal ? 100 : 25 + Math.round(((w + 1) / windows.length) * 0.7))
          onFileResult(i, { text: entry.text, srt: entry.srt, output: entry.output }, isFinal)
          await new Promise<void>((r) => setTimeout(r, 0))
        }
      } catch (err) {
        throw classifyTranscriptionError(err, { code: 'TRANSCRIBE_FAILED', phase: 'transcribe' })
      }

      results.push(entry)
    } catch (err) {
      const error = classifyTranscriptionError(err)
      results.push({
        filename: files[i].name,
        text: '',
        output: '',
        error,
      })
    }
  }

  return results
}
