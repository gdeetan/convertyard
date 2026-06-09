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

const RESOLUTION: Record<string, { w: number; h: number }> = {
  '720p':  { w: 1280, h: 720 },
  '1080p': { w: 1920, h: 1080 },
}

export async function mp3ToMp4(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const bgType     = (options.bgType     as string) ?? 'black'
  const bgColor    = (options.bgColor    as string) ?? '#000000'
  const bgImage    = (options.bgImage    as File | null) ?? null
  const waveform   = (options.waveform   as string) ?? 'none'
  const resolution = (options.resolution as string) ?? '720p'

  const { w, h } = RESOLUTION[resolution] ?? RESOLUTION['720p']
  const size = `${w}x${h}`
  // lavfi color= filter requires 0x prefix, not #
  const lavfiColor = (bgType === 'black' ? '#000000' : bgColor).replace('#', '0x')

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)

    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp3'
      const inputName = `audio_${i}.${ext}`
      const outputName = `out_${i}.mp4`
      const imageName = `bg_${i}.jpg`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      if (bgImage) {
        await ffmpeg.writeFile(imageName, await fetchFile(bgImage))
      }
      onProgress?.(i, 15)

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(15 + progress * 80))
      }
      ffmpeg.on('progress', progressHandler)

      const baseCodecArgs = ['-c:v', 'libx264', '-crf', '28', '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '192k', '-shortest']

      if (bgType === 'image' && bgImage) {
        if (waveform === 'none') {
          await ffmpeg.exec([
            '-loop', '1', '-i', imageName,
            '-i', inputName,
            '-vf', `scale=${w}:${h},setsar=1`,
            ...baseCodecArgs,
            outputName,
          ])
        } else {
          const mode = waveform === 'bar' ? 'p2p' : 'line'
          await ffmpeg.exec([
            '-loop', '1', '-i', imageName,
            '-i', inputName,
            '-filter_complex',
            `[0:v]scale=${w}:${h},setsar=1[bg];[1:a]showwaves=s=${size}:mode=${mode}:colors=white:scale=sqrt[waves];[bg][waves]overlay[v]`,
            '-map', '[v]', '-map', '1:a',
            ...baseCodecArgs,
            outputName,
          ])
        }
      } else {
        const rate = waveform === 'none' ? '1' : '25'
        if (waveform === 'none') {
          await ffmpeg.exec([
            '-f', 'lavfi', '-i', `color=c=${lavfiColor}:size=${size}:rate=${rate}`,
            '-i', inputName,
            ...baseCodecArgs,
            outputName,
          ])
        } else {
          const mode = waveform === 'bar' ? 'p2p' : 'line'
          await ffmpeg.exec([
            '-f', 'lavfi', '-i', `color=c=${lavfiColor}:size=${size}:rate=${rate}`,
            '-i', inputName,
            '-filter_complex',
            `[1:a]showwaves=s=${size}:mode=${mode}:colors=white:scale=sqrt[waves];[0:v][waves]overlay[v]`,
            '-map', '[v]', '-map', '1:a',
            ...baseCodecArgs,
            outputName,
          ])
        }
      }

      ffmpeg.off('progress', progressHandler)

      const data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
      if (bgImage) {
        await ffmpeg.deleteFile(imageName).catch(() => {})
      }

      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error('Conversion failed'))
    }
  }

  return results
}
