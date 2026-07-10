import { getFFmpeg } from './ffmpeg-client'
import {
  loadTranscriptionModel,
  transcribeAudio as transcribeAudioClient,
  type TranscriptionError,
  type QualityMode,
  type TranscriptionResult,
} from './transcription-client'
import { classifyTranscriptionError } from './transcription-errors'

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
}

export function selectTranscriptionOutput(
  result: Pick<TranscriptionBatchResult, 'text' | 'srt'>,
  outputFormat: OutputFormat
): string {
  return outputFormat === 'srt' ? result.srt ?? result.text : result.text
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function decodeAudio(file: File): Promise<Float32Array> {
  const audioCtx = new AudioContext({ sampleRate: 16000 })
  try {
    const buffer = await audioCtx.decodeAudioData(await file.arrayBuffer())
    if (buffer.numberOfChannels === 1) {
      return buffer.getChannelData(0).slice()
    }
    // Mix down to mono
    const left = buffer.getChannelData(0)
    const right = buffer.getChannelData(1)
    const mono = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) {
      mono[i] = (left[i] + right[i]) / 2
    }
    return mono
  } finally {
    await audioCtx.close()
  }
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']

function isVideo(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext)
}

async function extractAudioFromVideo(file: File): Promise<File> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFFmpeg()

  const inputName = `input_${Date.now()}_${file.name}`
  const outputName = `output_${Date.now()}.wav`

  await ffmpeg.writeFile(inputName, await fetchFile(file))
  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      outputName,
    ])
    const data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
    return new File([data], outputName, { type: 'audio/wav' })
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
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
  onFileResult: (fileIndex: number, result: Pick<TranscriptionBatchResult, 'text' | 'srt' | 'output'>) => void,
): Promise<TranscriptionBatchResult[]> {
  await loadTranscriptionModel(options.quality, onModelProgress)
  onModelProgress(100)

  const results: TranscriptionBatchResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onFileProgress(i, 5)

      let audioFile: File = files[i]
      if (isVideo(files[i])) {
        try {
          audioFile = await extractAudioFromVideo(files[i])
        } catch (err) {
          throw classifyTranscriptionError(err, { code: 'VIDEO_AUDIO_EXTRACT_FAILED', phase: 'extract' })
        }
      }

      onFileProgress(i, 15)

      let audioData: Float32Array
      try {
        audioData = await decodeAudio(audioFile)
      } catch (err) {
        throw classifyTranscriptionError(err, { code: 'AUDIO_DECODE_FAILED', phase: 'decode' })
      }

      onFileProgress(i, 25)

      const needsTimestamps = options.outputFormat === 'srt'
      let result: TranscriptionResult
      try {
        result = await transcribeAudioClient(
          audioData,
          16000,
          options.language,
          needsTimestamps,
          (pct) => onFileProgress(i, 25 + Math.round(pct * 0.7)),
        )
      } catch (err) {
        throw classifyTranscriptionError(err, { code: 'TRANSCRIBE_FAILED', phase: 'transcribe' })
      }

      const text = result.text
      const entry: TranscriptionBatchResult = {
        filename: files[i].name,
        text,
        output: text,
      }
      if (options.outputFormat === 'srt') {
        entry.srt = buildSRT(result)
        entry.output = selectTranscriptionOutput(entry, options.outputFormat)
      }

      onFileProgress(i, 100)
      onFileResult(i, { text: entry.text, srt: entry.srt, output: entry.output })

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
