import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from './ffmpeg-client'
import type { ToolOptions, ConversionResult } from '@/lib/types'

export async function mp4ToMp3(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)

    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName = `in_${i}.${ext}`
      const outputName = `out_${i}.mp3`

      const bitrate = typeof options.bitrate === 'string' ? options.bitrate : '128'
      const sampleRate = typeof options.sampleRate === 'string' ? options.sampleRate : '44100'

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)

      await ffmpeg.exec([
        '-i', inputName,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ab', `${bitrate}k`,
        '-ar', sampleRate,
        outputName,
      ])

      ffmpeg.off('progress', progressHandler)

      const data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)

      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp3`, { type: 'audio/mpeg' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error('Conversion failed'))
    }
  }

  return results
}
