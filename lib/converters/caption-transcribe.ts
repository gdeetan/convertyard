import { getSingleThreadFFmpeg, resetFFmpeg, resetSingleThreadFFmpeg } from './ffmpeg-client'
import { loadTranscriptionModel, transcribeAudio } from './transcription-client'
import { wordsFromTranscription, type CaptionTranscript } from './caption-words'
import { decodeAudioViaWebAudio, throwIfAborted, isCancelError } from './audio-decode'
import {
  detectCaptionClientProfile,
  preferWebAudioExtract,
  type CaptionClientProfile,
} from './caption-workload'
import { classifyTranscriptionError } from './transcription-errors'

export type CaptionQuality = 'fast' | 'balanced' | 'accurate'
export type CaptionTranscribePhase = 'extract' | 'model' | 'transcribe'
export type { CaptionTranscript }

function currentProfile(): CaptionClientProfile {
  if (typeof navigator === 'undefined') return 'desktop'
  return detectCaptionClientProfile(
    navigator.userAgent,
    navigator.maxTouchPoints,
    navigator.platform,
  )
}

/** Copy ffmpeg MEMFS bytes out of the WASM heap and decode PCM s16le. */
export function pcmFromWavBytes(raw: Uint8Array): Float32Array {
  const bytes = raw.slice()
  if (bytes.byteLength < 44) {
    throw new Error('WAV audio is empty')
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 12
  let dataOffset = -1
  let dataLength = 0

  while (offset + 8 <= bytes.byteLength) {
    const id = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    )
    const size = view.getUint32(offset + 4, true)
    if (id === 'data') {
      dataOffset = offset + 8
      dataLength = size
      break
    }
    offset += 8 + size + (size % 2)
    if (size < 0) break
  }

  if (dataOffset < 0) {
    dataOffset = 44
    dataLength = bytes.byteLength - 44
  }

  const available = bytes.byteLength - dataOffset
  const sampleBytes = Math.max(0, Math.min(dataLength, available) & ~1)
  if (sampleBytes < 2) {
    throw new Error('WAV audio is empty')
  }

  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset + dataOffset, sampleBytes / 2)
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768
  }
  return float32
}

async function extractAudioViaFfmpeg(videoFile: File): Promise<Float32Array> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getSingleThreadFFmpeg()
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
    return pcmFromWavBytes(raw)
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
  }
}

export async function releaseCaptionExtractRuntime(): Promise<void> {
  await Promise.all([resetFFmpeg(), resetSingleThreadFFmpeg()])
}

export async function extractAudio(
  videoFile: File,
  signal?: AbortSignal,
  profile: CaptionClientProfile = currentProfile(),
): Promise<Float32Array> {
  try {
    throwIfAborted(signal)
    if (preferWebAudioExtract(profile, videoFile.size)) {
      try {
        return await decodeAudioViaWebAudio(videoFile)
      } catch (err) {
        throwIfAborted(signal)
        if (isCancelError(err)) throw err
      }
    }
    return await extractAudioViaFfmpeg(videoFile)
  } catch (err) {
    throwIfAborted(signal)
    if (isCancelError(err)) throw err
    throw classifyTranscriptionError(err, { code: 'VIDEO_AUDIO_EXTRACT_FAILED', phase: 'extract' })
  }
}

export async function transcribeToWords(
  videoFile: File,
  quality: CaptionQuality,
  language: string | null,
  onProgress: (phase: CaptionTranscribePhase, pct: number) => void,
  signal?: AbortSignal,
): Promise<CaptionTranscript> {
  const profile = currentProfile()
  throwIfAborted(signal)

  onProgress('extract', 5)
  const audioData = await extractAudio(videoFile, signal, profile)
  throwIfAborted(signal)
  onProgress('extract', 100)

  await releaseCaptionExtractRuntime()
  throwIfAborted(signal)

  await loadTranscriptionModel(quality, (pct) => onProgress('model', pct))
  throwIfAborted(signal)
  onProgress('model', 100)

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
    onProgress('transcribe', Math.round((i / totalChunks) * 100))

    const result = await transcribeAudio(
      slice,
      sampleRate,
      language,
      'word',
      (p) => onProgress('transcribe', Math.round(((i + p / 100) / totalChunks) * 100)),
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
    await new Promise<void>((r) => setTimeout(r, 0))
  }

  onProgress('transcribe', 100)
  throwIfAborted(signal)
  return wordsFromTranscription({ text: textParts.join(' '), chunks: merged })
}
