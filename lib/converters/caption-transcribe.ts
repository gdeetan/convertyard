import { getSingleThreadFFmpeg, resetFFmpeg, resetSingleThreadFFmpeg } from './ffmpeg-client'
import { loadTranscriptionModel, transcribeAudio } from './transcription-client'
import { applyWhisperWordLead, wordsFromTranscription, type CaptionTranscript } from './caption-words'
import { snapWordsToOnsets } from './caption-align'
import { decodeAudioViaWebAudio, throwIfAborted, isCancelError } from './audio-decode'
import {
  detectCaptionClientProfile,
  preferWebAudioExtract,
  type CaptionClientProfile,
} from './caption-workload'
import { classifyTranscriptionError } from './transcription-errors'
import { extractMp4AacAdts, looksLikeMp4 } from './mp4-audio-extract'
import {
  captionFfmpegInputName,
  materializeCaptionFile,
} from './caption-file'

export { captionFfmpegInputName, captionFileFromBytes, materializeCaptionFile } from './caption-file'

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

export function captionExtractFfmpegArgSets(inputName: string, outputName: string): string[][] {
  const encode = ['-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', outputName]
  return [
    ['-i', inputName, '-map', '0:a:0', ...encode],
    ['-i', inputName, '-map', 'a:0', ...encode],
    ['-i', inputName, ...encode],
  ]
}

export function captionExtractFfmpegArgs(inputName: string, outputName: string): string[] {
  return captionExtractFfmpegArgSets(inputName, outputName)[0]
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

async function wavToPcm(raw: Uint8Array<ArrayBuffer>, outputName: string): Promise<Float32Array> {
  try {
    return await decodeAudioViaWebAudio(new File([raw], outputName, { type: 'audio/wav' }))
  } catch {
    return pcmFromWavBytes(raw)
  }
}

async function extractAudioViaFfmpeg(videoFile: File): Promise<Float32Array> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getSingleThreadFFmpeg()
  const inputName = captionFfmpegInputName(videoFile.name, Date.now(), videoFile.type)
  const outputName = `cap_out_${Date.now()}.wav`

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))
  const logs: string[] = []
  const onLog = ({ message }: { message: string }) => {
    if (message) logs.push(message)
  }
  ffmpeg.on('log', onLog)
  let lastError: Error | null = null
  try {
    for (const args of captionExtractFfmpegArgSets(inputName, outputName)) {
      logs.length = 0
      await ffmpeg.deleteFile(outputName).catch(() => {})
      // exec() resolves with the exit code and does not throw on failure.
      const code = await ffmpeg.exec(args)
      if (code !== 0) {
        const tail = logs.filter(Boolean).slice(-6).join(' | ')
        lastError = new Error(
          tail
            ? `ffmpeg extract failed (exit ${code}): ${tail}`
            : `ffmpeg extract failed (exit ${code})`,
        )
        continue
      }
      const raw = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      return wavToPcm(raw, outputName)
    }
    throw lastError ?? new Error('ffmpeg extract failed')
  } finally {
    ffmpeg.off('log', onLog)
    await ffmpeg.deleteFile(inputName).catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
  }
}

export async function releaseCaptionExtractRuntime(): Promise<void> {
  await Promise.all([resetFFmpeg(), resetSingleThreadFFmpeg()])
}

async function extractAudioViaMp4Aac(file: File): Promise<Float32Array> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const adts = extractMp4AacAdts(bytes)
  if (!adts) throw new Error('No AAC audio track in MP4')
  return decodeAudioViaWebAudio(new File([adts], 'track.aac', { type: 'audio/aac' }))
}

export async function extractAudio(
  videoFile: File,
  signal?: AbortSignal,
  profile: CaptionClientProfile = currentProfile(),
): Promise<Float32Array> {
  const errors: string[] = []
  try {
    throwIfAborted(signal)
    const file = videoFile.size > 0 && /\.[^.]+$/.test(videoFile.name)
      ? videoFile
      : await materializeCaptionFile(videoFile)
    throwIfAborted(signal)

    if (looksLikeMp4(file)) {
      try {
        return await extractAudioViaMp4Aac(file)
      } catch (err) {
        throwIfAborted(signal)
        if (isCancelError(err)) throw err
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }

    if (preferWebAudioExtract(profile, file.size)) {
      try {
        return await decodeAudioViaWebAudio(file)
      } catch (err) {
        throwIfAborted(signal)
        if (isCancelError(err)) throw err
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }

    try {
      return await extractAudioViaFfmpeg(file)
    } catch (err) {
      throwIfAborted(signal)
      if (isCancelError(err)) throw err
      errors.push(err instanceof Error ? err.message : String(err))
      throw err
    }
  } catch (err) {
    throwIfAborted(signal)
    if (isCancelError(err)) throw err
    const combined = errors.length > 0 ? errors.join(' | ') : err
    throw classifyTranscriptionError(combined, { code: 'VIDEO_AUDIO_EXTRACT_FAILED', phase: 'extract' })
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

  // One Whisper pass. The pipeline already windows at 30s with a 3s stride.
  // Hard-cutting here mid-word made captions drift from the voice.
  const sampleRate = 16000
  const durationSec = audioData.length / sampleRate
  const started = Date.now()
  const tick = setInterval(() => {
    const elapsed = (Date.now() - started) / 1000
    onProgress('transcribe', Math.min(95, Math.round((elapsed / Math.max(1, durationSec * 2)) * 100)))
  }, 250)

  let result
  try {
    result = await transcribeAudio(
      audioData.slice(),
      sampleRate,
      language,
      'word',
      (p) => onProgress('transcribe', Math.min(95, Math.round(p))),
      signal,
    )
  } finally {
    clearInterval(tick)
  }

  onProgress('transcribe', 100)
  throwIfAborted(signal)
  const transcript = wordsFromTranscription(result)
  if (transcript.timestampsEstimated) return transcript
  const snapped = snapWordsToOnsets(transcript.words, audioData, sampleRate)
  const moved = snapped.some((w, i) => Math.abs(w.start - transcript.words[i].start) > 0.03)
  if (moved) return { ...transcript, words: snapped }
  return applyWhisperWordLead(transcript)
}
