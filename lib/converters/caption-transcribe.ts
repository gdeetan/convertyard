import { getFFmpeg } from './ffmpeg-client'
import { loadTranscriptionModel, transcribeAudio } from './transcription-client'
import { wordsFromTranscription, type CaptionTranscript } from './caption-words'
import { decodeAudioViaWebAudio, throwIfAborted, isCancelError } from './audio-decode'

export type CaptionQuality = 'fast' | 'balanced' | 'accurate'
export type { CaptionTranscript }

async function extractAudioViaFfmpeg(videoFile: File): Promise<Float32Array> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFFmpeg()
  const inputName = `cap_in_${Date.now()}`
  const outputName = `cap_out_${Date.now()}.wav`

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))
  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vn', '-acodec', 'pcm_s16le',
      '-ar', '16000', '-ac', '1',
      outputName,
    ])
    const raw = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
    const wav = raw.buffer
    // Skip 44-byte WAV header, read Int16 samples, normalize to Float32
    const int16 = new Int16Array(wav, 44)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }
    return float32
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
  }
}

export async function extractAudio(
  videoFile: File,
  signal?: AbortSignal,
): Promise<Float32Array> {
  throwIfAborted(signal)
  try {
    return await decodeAudioViaWebAudio(videoFile)
  } catch (err) {
    throwIfAborted(signal)
    if (isCancelError(err)) throw err
    return extractAudioViaFfmpeg(videoFile)
  }
}

export async function transcribeToWords(
  videoFile: File,
  quality: CaptionQuality,
  language: string | null,
  onModelProgress: (pct: number) => void,
  onTranscribeProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<CaptionTranscript> {
  throwIfAborted(signal)
  await loadTranscriptionModel(quality, onModelProgress)
  throwIfAborted(signal)
  onModelProgress(100)

  const audioData = await extractAudio(videoFile, signal)
  throwIfAborted(signal)

  // Whisper's pipeline only reports 10% then 95%. Split into 30s slices so the
  // bar actually moves — otherwise the UI sits at 55% for the whole inference.
  const sampleRate = 16000
  const chunkSamples = 30 * sampleRate
  const totalChunks = Math.max(1, Math.ceil(audioData.length / chunkSamples))
  const merged: { text: string; timestamp?: [number, number] }[] = []
  const textParts: string[] = []

  for (let i = 0; i < totalChunks; i++) {
    throwIfAborted(signal)
    const start = i * chunkSamples
    const end = Math.min(audioData.length, start + chunkSamples)
    const offsetSec = start / sampleRate
    const slice = audioData.slice(start, end)
    onTranscribeProgress(Math.round((i / totalChunks) * 100))

    const result = await transcribeAudio(
      slice,
      sampleRate,
      language,
      'word',
      (p) => onTranscribeProgress(Math.round(((i + p / 100) / totalChunks) * 100)),
      signal,
    )

    if (result.chunks) {
      for (const c of result.chunks) {
        const t0 = (c.timestamp?.[0] ?? 0) + offsetSec
        const t1 = (c.timestamp?.[1] ?? t0) + offsetSec
        merged.push({ text: c.text, timestamp: [t0, t1] })
      }
    }
    if (result.text) textParts.push(result.text)
  }

  onTranscribeProgress(100)
  throwIfAborted(signal)
  return wordsFromTranscription({ text: textParts.join(' '), chunks: merged })
}
