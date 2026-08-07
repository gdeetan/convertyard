import { getFFmpeg } from './ffmpeg-client'
import { loadTranscriptionModel, transcribeAudio } from './transcription-client'
import type { WordChunk } from './caption-types'

export type CaptionQuality = 'fast' | 'balanced' | 'accurate'

async function extractAudio(videoFile: File): Promise<Float32Array> {
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

export async function transcribeToWords(
  videoFile: File,
  quality: CaptionQuality,
  language: string | null,
  onModelProgress: (pct: number) => void,
  onTranscribeProgress: (pct: number) => void,
): Promise<WordChunk[]> {
  await loadTranscriptionModel(quality, onModelProgress)
  onModelProgress(100)

  const audioData = await extractAudio(videoFile)
  onTranscribeProgress(10)

  const result = await transcribeAudio(
    audioData,
    16000,
    language,
    'word',
    onTranscribeProgress,
  )

  if (!result.chunks || result.chunks.length === 0) {
    return [{ text: result.text.trim(), start: 0, end: 9999 }]
  }

  return result.chunks
    .filter((c) => c.text.trim().length > 0)
    .map((c) => ({
      text: c.text.trim(),
      start: c.timestamp?.[0] ?? 0,
      end: c.timestamp?.[1] ?? 0,
    }))
}
