import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg, getCompressVideoFFmpeg } from './ffmpeg-client'
import { probeVideoTrack, probeVideoDuration, probeVideoDimensions, probeAudioInfo } from './media-probe'
import type { ToolOptions, ConversionResult } from '@/lib/types'

function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'string' && err.trim()) return new Error(err)
  if (typeof err === 'object' && err !== null) {
    const maybeMessage = Reflect.get(err, 'message')
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return new Error(maybeMessage)
    }
  }
  return new Error('Conversion failed')
}

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.maxTouchPoints > 1 || /Android|iPhone|iPad/i.test(navigator.userAgent)
}

function explainMp4ToWebpError(error: Error): Error {
  if (
    error.message.includes('Output file #0 does not contain any stream') ||
    error.message.includes('ErrnoError: FS error')
  ) {
    return new Error('This file has no video track. Video to WebP only works on video clips, not audio-only files.')
  }
  return error
}

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

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec([
          '-i', inputName,
          '-vn',
          '-acodec', 'libmp3lame',
          '-ab', `${bitrate}k`,
          '-ar', sampleRate,
          outputName,
        ])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp3`, { type: 'audio/mpeg' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(toError(err))
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
  const bgColor    = (options.bgColor    as string) ?? '#1a1a2e'
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
      const imageExt = bgImage?.name.split('.').pop() ?? 'jpg'
      const imageName = `bg_${i}.${imageExt}`

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

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
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
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
        if (bgImage) await ffmpeg.deleteFile(imageName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(toError(err))
    }
  }

  return results
}

const GIF_SCALE: Record<string, string> = {
  'original': 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
  '480p':     'scale=-2:480',
  '720p':     'scale=-2:720',
  '1080p':    'scale=-2:1080',
}

export async function gifToMp4(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const resolution = (options.resolution as string) ?? 'original'
  const loop       = (options.loop       as string) ?? '1x'
  const scaleFilter = GIF_SCALE[resolution] ?? GIF_SCALE['original']

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)

    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputName  = `gif_in_${i}.gif`
      const outputName = `gif_out_${i}.mp4`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        // -stream_loop must come before -i; -t (duration cap) applies to output
        const preInputArgs =
          loop === '2x'       ? ['-stream_loop', '1',  '-i', inputName] :
          loop === 'infinite' ? ['-stream_loop', '-1', '-i', inputName] :
                                ['-i', inputName]

        const durationArgs = loop === 'infinite' ? ['-t', '30'] : []

        await ffmpeg.exec([
          ...preInputArgs,
          ...durationArgs,
          '-movflags', 'faststart',
          '-pix_fmt', 'yuv420p',
          '-vf', scaleFilter,
          '-an',
          outputName,
        ])

        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(toError(err))
    }
  }

  return results
}

export async function aviToMp4(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const quality = (options.quality as string) ?? 'better'
  const crf = quality === 'best' ? '18' : quality === 'good' ? '28' : '23'
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputName = `avi_in_${i}.avi`
      const outputName = `avi_out_${i}.mp4`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-crf', crf, '-preset', 'fast', '-c:a', 'aac', '-b:a', '192k', '-movflags', 'faststart', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function mkvToMp4(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const quality = (options.quality as string) ?? 'better'
  const crf = quality === 'best' ? '18' : quality === 'good' ? '28' : '23'
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputName = `mkv_in_${i}.mkv`
      const outputName = `mkv_out_${i}.mp4`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        // Try stream-copy first (near-instant for H.264/AAC MKV); fall back to re-encode
        try {
          await ffmpeg.exec(['-i', inputName, '-c', 'copy', '-movflags', 'faststart', outputName])
          data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
        } catch {
          await ffmpeg.deleteFile(outputName).catch(() => {})
          await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-crf', crf, '-preset', 'fast', '-c:a', 'aac', '-b:a', '192k', '-movflags', 'faststart', outputName])
          data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
        }
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function mp3ToWav(
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
      const ext = file.name.split('.').pop() ?? 'mp3'
      const inputName = `mp3wav_in_${i}.${ext}`
      const outputName = `mp3wav_out_${i}.wav`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.wav`, { type: 'audio/wav' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function aacToMp3(
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
      const ext = file.name.split('.').pop() ?? 'aac'
      const inputName = `aac_in_${i}.${ext}`
      const outputName = `aac_out_${i}.mp3`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-c:a', 'libmp3lame', '-q:a', '2', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.mp3`, { type: 'audio/mpeg' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function mp3ToOgg(
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
      const ext = file.name.split('.').pop() ?? 'mp3'
      const inputName = `mp3ogg_in_${i}.${ext}`
      const outputName = `mp3ogg_out_${i}.ogg`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-c:a', 'libvorbis', '-q:a', '4', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.ogg`, { type: 'audio/ogg' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function mp4ToWebm(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const quality = (options.quality as string) ?? 'better'
  const crf = quality === 'best' ? '24' : quality === 'good' ? '36' : '30'
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName = `mp4webm_in_${i}.${ext}`
      const outputName = `mp4webm_out_${i}.webm`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0', '-c:a', 'libopus', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.webm`, { type: 'video/webm' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function mp3ToAac(
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
      const ext = file.name.split('.').pop() ?? 'mp3'
      const inputName = `mp3aac_in_${i}.${ext}`
      const outputName = `mp3aac_out_${i}.aac`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-c:a', 'aac', '-b:a', '192k', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.aac`, { type: 'audio/aac' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function mp4ToMov(
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
      const inputName = `mp4mov_in_${i}.${ext}`
      const outputName = `mp4mov_out_${i}.mov`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        // Stream copy — MOV is a QuickTime container that accepts H.264/AAC directly
        await ffmpeg.exec(['-i', inputName, '-c', 'copy', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.mov`, { type: 'video/quicktime' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function webmToMp4(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const quality = (options.quality as string) ?? 'better'
  const crf = quality === 'best' ? '18' : quality === 'good' ? '28' : '23'

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputName  = `webm_in_${i}.webm`
      const outputName = `webm_out_${i}.mp4`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec([
          '-i', inputName,
          '-c:v', 'libx264',
          '-crf', crf,
          '-preset', 'fast',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', 'faststart',
          outputName,
        ])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(toError(err))
    }
  }

  return results
}

export async function movToMp4(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const quality = (options.quality as string) ?? 'better'
  const crf = quality === 'best' ? '18' : quality === 'good' ? '28' : '23'

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputName  = `mov_in_${i}.mov`
      const outputName = `mov_out_${i}.mp4`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec([
          '-i', inputName,
          '-c:v', 'libx264',
          '-crf', crf,
          '-preset', 'fast',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', 'faststart',
          outputName,
        ])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(toError(err))
    }
  }

  return results
}

const WEBP_CROP_FILTERS: Record<string, string | null> = {
  original: null,
  square: "crop='min(iw,ih)':'min(iw,ih)'",
  '16:9': "crop='if(gte(iw/ih,16/9),ih*16/9,iw)':'if(gte(iw/ih,16/9),ih,iw*9/16)'",
  '4:3': "crop='if(gte(iw/ih,4/3),ih*4/3,iw)':'if(gte(iw/ih,4/3),ih,iw*3/4)'",
}

function buildAnimatedWebpScale(maxDimension: number): string | null {
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) return null
  return `scale='if(gte(iw,ih),min(iw,${maxDimension}),-2)':'if(gte(iw,ih),-2,min(ih,${maxDimension}))':flags=lanczos`
}

function buildAnimatedWebpFilter(options: ToolOptions): string {
  const filters: string[] = []
  const cropPreset = typeof options.cropPreset === 'string' ? options.cropPreset : 'original'
  const cropFilter = WEBP_CROP_FILTERS[cropPreset] ?? WEBP_CROP_FILTERS.original
  if (cropFilter) filters.push(cropFilter)

  const fps = typeof options.fps === 'number' && options.fps > 0 ? options.fps : 12
  filters.push(`fps=${fps}`)

  const maxDimension = typeof options.maxDimension === 'number' ? options.maxDimension : 0
  const scaleFilter = buildAnimatedWebpScale(maxDimension)
  if (scaleFilter) filters.push(scaleFilter)

  return filters.join(',')
}

export async function mp4ToWebp(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const quality = typeof options.quality === 'number' ? options.quality : 80
  const loopCount = typeof options.loopCount === 'number' ? options.loopCount : 0
  const startTime = typeof options.startTime === 'number' && options.startTime > 0 ? options.startTime : null
  const endTime = typeof options.endTime === 'number' && options.endTime > 0 ? options.endTime : null
  const filterGraph = buildAnimatedWebpFilter(options)

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    let logTail = ''

    try {
      const file = files[i]
      const hasVideoTrack = await probeVideoTrack(file)
      if (hasVideoTrack === false) {
        results.push(new Error('This file has no video track. Video to WebP only works on video clips, not audio-only files.'))
        continue
      }

      const ffmpeg = await getFFmpeg()
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName = `video_in_${i}.${ext}`
      const outputName = `video_out_${i}.webp`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      const logLines: string[] = []
      const logHandler = ({ message }: { message: string }) => {
        if (!message) return
        logLines.push(message)
        if (logLines.length > 20) logLines.shift()
        logTail = logLines.join(' | ')
      }
      ffmpeg.on('progress', progressHandler)
      ffmpeg.on('log', logHandler)

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        const trimArgs: string[] = []
        if (startTime !== null) trimArgs.push('-ss', String(startTime))
        if (endTime !== null) trimArgs.push('-to', String(endTime))

        await ffmpeg.exec([
          ...trimArgs,
          '-i', inputName,
          '-an',
          '-vf', filterGraph,
          '-c:v', 'libwebp',
          '-lossless', '0',
          '-compression_level', '4',
          '-q:v', String(quality),
          '-loop', String(loopCount),
          '-preset', 'picture',
          '-vsync', '0',
          outputName,
        ])

        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        ffmpeg.off('log', logHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.webp`, { type: 'image/webp' }))
      onProgress?.(i, 100)
    } catch (err) {
      let error = toError(err)
      if (logTail && !error.message.includes(logTail)) {
        error.message = `${error.message} | ffmpeg: ${logTail}`
      }
      error = explainMp4ToWebpError(error)
      results.push(error)
    }
  }

  return results
}

function buildVideoToGifFilter(options: ToolOptions): string {
  const fps = typeof options.fps === 'number' && options.fps > 0 ? options.fps : 12
  const outputWidth = typeof options.outputWidth === 'number' ? options.outputWidth : 0
  const scale = outputWidth > 0 ? `,scale=${outputWidth}:-2:flags=lanczos` : ''
  return `fps=${fps}${scale},split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer`
}

export async function videoToGif(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const startTime = typeof options.startTime === 'number' && options.startTime > 0 ? options.startTime : null
  const endTime = typeof options.endTime === 'number' && options.endTime > 0 ? options.endTime : null
  const loop = typeof options.loop === 'number' ? options.loop : 0
  const filterGraph = buildVideoToGifFilter(options)

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)

    try {
      const file = files[i]
      const hasVideoTrack = await probeVideoTrack(file)
      if (hasVideoTrack === false) {
        results.push(new Error('This file has no video track. Video to GIF only works on video clips, not audio-only MP4/M4A files.'))
        continue
      }

      const ffmpeg = await getFFmpeg()
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName = `video_in_${i}.${ext}`
      const outputName = `video_out_${i}.gif`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        const trimArgs: string[] = []
        if (startTime !== null) trimArgs.push('-ss', String(startTime))
        if (endTime !== null) trimArgs.push('-to', String(endTime))

        await ffmpeg.exec([
          ...trimArgs,
          '-i', inputName,
          '-vf', filterGraph,
          '-loop', String(loop),
          outputName,
        ])

        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.gif`, { type: 'image/gif' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(toError(err))
    }
  }

  return results
}

const H264_CRF: Record<string, number> = { small: 18, medium: 23, high: 28, maximum: 35 }
const H265_CRF: Record<string, number> = { small: 22, medium: 26, high: 30, maximum: 36 }
const RESOLUTION_HEIGHT: Record<string, number> = { '1080p': 1080, '720p': 720, '480p': 480, '360p': 360 }

export async function compressVideo(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const targetSizeMode = options.targetSizeMode === true || options.targetSizeMode === 'true'
  const level         = (options.level      as string)  ?? 'medium'
  const resolution    = (options.resolution as string)  ?? 'original'
  const h265          = options.h265         === true || options.h265 === 'true'
  const stripAudio    = options.stripAudio   === true || options.stripAudio === 'true'
  const targetKB      = typeof options.targetKB === 'number' ? options.targetKB : 51200

  const codec  = h265 ? 'libx265' : 'libx264'
  const crfMap = h265 ? H265_CRF  : H264_CRF

  // Tell x264/x265 to use all available CPU cores. Meaningful gain with the MT build;
  // ignored by the ST build which is inherently single-threaded.
  const cpuThreads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency > 0
    ? Math.min(navigator.hardwareConcurrency, 16)
    : 0
  const threadArgs = cpuThreads > 0 ? ['-threads', String(cpuThreads)] : []

  const resHeight = RESOLUTION_HEIGHT[resolution]
  const vfArgs: string[] = resHeight
    ? ['-vf', `scale=-2:${resHeight}`]
    : []
  const audioArgs: string[] = stripAudio
    ? ['-an']
    : ['-c:a', 'aac', '-b:a', '128k']

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const file   = files[i]
      const hasVideoTrack = await probeVideoTrack(file)
      if (hasVideoTrack === false) {
        const noTrackErr = new Error('This file has no video track. Video Compressor only works on video files, not audio-only files.')
        results.push(noTrackErr)
        onResult?.(i, noTrackErr)
        continue
      }

      const ffmpeg = await getCompressVideoFFmpeg()
      const ext    = file.name.split('.').pop() ?? 'mp4'
      const inputName  = `cv_in_${i}.${ext}`
      const outputName = `cv_out_${i}.mp4`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      let data: Uint8Array<ArrayBuffer> | undefined

      if (!targetSizeMode) {
        const crf = crfMap[level] ?? 23
        // Mobile: cap at 720p for large files when user didn't set a resolution — prevents OOM tab kill on iOS/Android
        let effectiveCrfVfArgs = vfArgs
        if (resolution === 'original' && isMobileBrowser() && file.size > 50 * 1024 * 1024) {
          const mobileCapHeight = file.size > 100 * 1024 * 1024 ? 480 : 720
          const dims = await probeVideoDimensions(file)
          if (dims && dims.height > mobileCapHeight) {
            effectiveCrfVfArgs = ['-vf', `scale=-2:${mobileCapHeight}`]
          }
        }
        const progressHandler = ({ progress }: { progress: number }) => {
          onProgress?.(i, Math.round(10 + progress * 85))
        }
        ffmpeg.on('progress', progressHandler)
        try {
          await ffmpeg.exec([
            ...threadArgs,
            '-i', inputName,
            ...effectiveCrfVfArgs,
            '-c:v', codec,
            '-crf', String(crf),
            '-preset', 'ultrafast',
            ...audioArgs,
            outputName,
          ])
          data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
        } finally {
          ffmpeg.off('progress', progressHandler)
          await ffmpeg.deleteFile(inputName).catch(() => {})
          await ffmpeg.deleteFile(outputName).catch(() => {})
        }
      } else {
        const targetBytes = targetKB * 1024

        if (file.size <= targetBytes) {
          // Already fits: fast remux to MP4 container, no re-encode
          const progressHandler = ({ progress }: { progress: number }) => {
            onProgress?.(i, Math.round(10 + progress * 85))
          }
          ffmpeg.on('progress', progressHandler)
          try {
            await ffmpeg.exec(['-i', inputName, '-c', 'copy', outputName])
            data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
          } finally {
            ffmpeg.off('progress', progressHandler)
            await ffmpeg.deleteFile(inputName).catch(() => {})
            await ffmpeg.deleteFile(outputName).catch(() => {})
          }
        } else {
          // Compute effective vf args — auto-scale when user didn't set a resolution
          let effectiveVfArgs = vfArgs
          if (resolution === 'original') {
            const dims = await probeVideoDimensions(file)
            if (dims) {
              const autoHeight = isMobileBrowser()
                ? (targetKB <= 50 * 1024 ? 720 : 1080)
                : (targetKB <= 10 * 1024 ? 720 : targetKB <= 50 * 1024 ? 1080 : null)
              if (autoHeight !== null && dims.height > autoHeight) {
                effectiveVfArgs = ['-vf', `scale=-2:${autoHeight}`]
              }
            }
          }

          const durationSeconds = await probeVideoDuration(file)

          if (durationSeconds > 0) {
            // Adaptive audio: smaller targets get lower bitrate, freeing bits for video
            const adaptiveAudioKbps = targetKB <= 10 * 1024 ? 64 : targetKB <= 50 * 1024 ? 96 : 128
            const audioInfo = !stripAudio ? await probeAudioInfo(ffmpeg, inputName) : null
            const shouldCopyAudio =
              audioInfo !== null &&
              audioInfo.codec === 'aac' &&
              audioInfo.bitrateKbps <= adaptiveAudioKbps + 16
            const targetAudioArgs: string[] = stripAudio
              ? audioArgs
              : shouldCopyAudio
                ? ['-c:a', 'copy']
                : ['-c:a', 'aac', '-b:a', `${adaptiveAudioKbps}k`]
            const audioBitsPerSec = stripAudio
              ? 0
              : shouldCopyAudio
                ? audioInfo!.bitrateKbps * 1000
                : adaptiveAudioKbps * 1000
            const videoBitsPerSec = Math.max(
              100_000,
              Math.floor((targetBytes * 8 - audioBitsPerSec * durationSeconds) / durationSeconds)
            )
            const progressHandler = ({ progress }: { progress: number }) => {
              onProgress?.(i, Math.round(10 + progress * 85))
            }
            ffmpeg.on('progress', progressHandler)
            try {
              await ffmpeg.exec([
                ...threadArgs,
                '-i', inputName,
                ...effectiveVfArgs,
                '-c:v', codec,
                '-b:v', String(videoBitsPerSec),
                '-maxrate', String(Math.floor(videoBitsPerSec * 1.5)),
                '-bufsize', String(videoBitsPerSec * 2),
                '-preset', 'ultrafast',
                ...targetAudioArgs,
                outputName,
              ])
              data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
            } finally {
              ffmpeg.off('progress', progressHandler)
              await ffmpeg.deleteFile(inputName).catch(() => {})
              await ffmpeg.deleteFile(outputName).catch(() => {})
            }
          } else {
            // Fallback: CRF iteration when duration probe unavailable (e.g. unsupported format)
            let crf = h265 ? 26 : 23
            const MAX_PASSES = 6
            try {
              for (let pass = 0; pass < MAX_PASSES; pass++) {
                const pctBase = 10 + pass * 13
                const progressHandler = ({ progress }: { progress: number }) => {
                  onProgress?.(i, Math.round(pctBase + progress * 13))
                }
                ffmpeg.on('progress', progressHandler)
                try {
                  await ffmpeg.exec([
                    ...threadArgs,
                    '-i', inputName,
                    ...effectiveVfArgs,
                    '-c:v', codec,
                    '-crf', String(crf),
                    '-preset', 'ultrafast',
                    ...audioArgs,
                    outputName,
                  ])
                } finally {
                  ffmpeg.off('progress', progressHandler)
                }
                const candidate = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
                if (candidate.byteLength <= targetBytes || pass === MAX_PASSES - 1) {
                  data = candidate
                  break
                }
                await ffmpeg.deleteFile(outputName).catch(() => {})
                crf = Math.min(crf + 5, 51)
              }
            } finally {
              await ffmpeg.deleteFile(inputName).catch(() => {})
            }
          }
        }
      }

      await ffmpeg.deleteFile(outputName).catch(() => {})

      if (!data || data.byteLength === 0) throw new Error('Compression produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const outFile = new File([data], `${baseName}.mp4`, { type: 'video/mp4' })
      results.push(outFile)
      onResult?.(i, outFile)
      onProgress?.(i, 100)
    } catch (err) {
      const errResult = toError(err)
      results.push(errResult)
      onResult?.(i, errResult)
    }
  }
  return results
}

function explainExtractAudioError(error: Error): Error {
  if (
    error.message.includes('Output file #0 does not contain any stream') ||
    error.message.includes('ErrnoError: FS error')
  ) {
    return new Error(
      'This file has no audio track. Extract Audio only works on video files that contain audio.'
    )
  }
  return error
}

export async function extractAudio(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const format     = typeof options.format     === 'string' ? options.format     : 'mp3'
  const bitrate    = typeof options.bitrate    === 'string' ? options.bitrate    : '192'
  const sampleRate = typeof options.sampleRate === 'string' ? options.sampleRate : '44100'

  const FORMAT_MAP: Record<string, { codec: string; ext: string; mime: string; lossless: boolean }> = {
    mp3:  { codec: 'libmp3lame', ext: '.mp3',  mime: 'audio/mpeg', lossless: false },
    aac:  { codec: 'aac',        ext: '.m4a',  mime: 'audio/mp4',  lossless: false },
    wav:  { codec: 'pcm_s16le',  ext: '.wav',  mime: 'audio/wav',  lossless: true  },
    ogg:  { codec: 'libvorbis',  ext: '.ogg',  mime: 'audio/ogg',  lossless: false },
    flac: { codec: 'flac',       ext: '.flac', mime: 'audio/flac', lossless: true  },
  }

  const fmt = FORMAT_MAP[format] ?? FORMAT_MAP.mp3

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)

    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName = `ea_in_${i}.${ext}`
      const outputName = `ea_out_${i}${fmt.ext}`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const audioArgs = fmt.lossless
        ? ['-map', 'a', '-vn', '-codec:a', fmt.codec, '-ar', sampleRate]
        : ['-map', 'a', '-vn', '-codec:a', fmt.codec, '-b:a', `${bitrate}k`, '-ar', sampleRate]

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, ...audioArgs, outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}${fmt.ext}`, { type: fmt.mime }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(explainExtractAudioError(toError(err)))
    }
  }

  return results
}

function explainTrimAudioError(error: Error): Error {
  if (
    error.message.includes('Output file #0 does not contain any stream') ||
    error.message.includes('ErrnoError: FS error')
  ) {
    return new Error('This file has no audio track. Audio Trimmer only works on files that contain audio.')
  }
  return error
}

export async function trimAudio(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const startTime = typeof options.startTime === 'number' && options.startTime > 0 ? options.startTime : null
  const endTime   = typeof options.endTime   === 'number' && options.endTime   > 0 ? options.endTime   : null
  const format    = typeof options.format    === 'string'                          ? options.format    : 'keep'

  const FORMAT_MAP: Record<string, { codec: string; ext: string; mime: string; lossless: boolean }> = {
    mp3:  { codec: 'libmp3lame', ext: '.mp3',  mime: 'audio/mpeg', lossless: false },
    aac:  { codec: 'aac',        ext: '.m4a',  mime: 'audio/mp4',  lossless: false },
    wav:  { codec: 'pcm_s16le',  ext: '.wav',  mime: 'audio/wav',  lossless: true  },
    ogg:  { codec: 'libvorbis',  ext: '.ogg',  mime: 'audio/ogg',  lossless: false },
    flac: { codec: 'flac',       ext: '.flac', mime: 'audio/flac', lossless: true  },
  }

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)

    try {
      const ffmpeg    = await getFFmpeg()
      const file      = files[i]
      const inputExt  = file.name.split('.').pop() ?? 'mp3'
      const isAudio   = file.type.startsWith('audio/')
      const useStreamCopy = isAudio && format === 'original'

      const reEncodeFmt = format === 'original' ? FORMAT_MAP.aac : (FORMAT_MAP[format] ?? FORMAT_MAP.mp3)
      const fmt = useStreamCopy
        ? { ext: `.${inputExt}`, mime: file.type, lossless: true }
        : reEncodeFmt

      const inputName  = `at_in_${i}.${inputExt}`
      const outputName = `at_out_${i}${fmt.ext}`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      if (startTime !== null && endTime !== null && startTime >= endTime) {
        throw new Error(`Start time (${startTime}s) must be less than end time (${endTime}s).`)
      }

      const trimArgs: string[] = []
      if (startTime !== null) trimArgs.push('-ss', String(startTime))
      if (endTime   !== null) trimArgs.push('-to', String(endTime))

      const audioArgs: string[] = useStreamCopy
        ? ['-map', 'a', '-c:a', 'copy']
        : fmt.lossless
          ? ['-map', 'a', '-vn', '-codec:a', reEncodeFmt.codec, '-ar', '44100']
          : ['-map', 'a', '-vn', '-codec:a', reEncodeFmt.codec, '-b:a', '192k', '-ar', '44100']

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)

      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec([...trimArgs, '-i', inputName, ...audioArgs, outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }

      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}-trimmed${fmt.ext}`, { type: fmt.mime }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(explainTrimAudioError(toError(err)))
    }
  }

  return results
}

export async function trimVideo(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const startTime = typeof options.startTime === 'number' && options.startTime > 0 ? options.startTime : null
  const endTime   = typeof options.endTime   === 'number' && options.endTime   > 0 ? options.endTime   : null
  const precise   = options.precise === true

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName  = `tv_in_${i}.${ext}`
      const outputName = `tv_out_${i}.${ext}`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      if (startTime !== null && endTime !== null && startTime >= endTime) {
        throw new Error(`Start time (${startTime}s) must be less than end time (${endTime}s).`)
      }

      let args: string[]
      if (precise) {
        // Input-seeking after -i for frame-accurate cuts (requires re-encode)
        const timeArgs: string[] = []
        if (startTime !== null) timeArgs.push('-ss', String(startTime))
        if (endTime   !== null) timeArgs.push('-to', String(endTime))
        args = ['-i', inputName, ...timeArgs, outputName]
      } else {
        // Fast mode: seek before -i, stream copy
        const seekArgs: string[] = []
        if (startTime !== null) seekArgs.push('-ss', String(startTime))
        if (endTime   !== null) seekArgs.push('-to', String(endTime))
        args = [...seekArgs, '-i', inputName, '-c', 'copy', outputName]
      }

      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(args)
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Trim produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}_trimmed.${ext}`, { type: file.type }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function muteVideo(
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
      const inputName  = `mute_in_${i}.${ext}`
      const outputName = `mute_out_${i}.mp4`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-c:v', 'copy', '-an', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Mute produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}_muted.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

const ROTATE_FILTERS: Record<string, string> = {
  '90cw':   'transpose=1',
  '90ccw':  'transpose=2',
  '180':    'transpose=2,transpose=2',
  'flip-h': 'hflip',
  'flip-v': 'vflip',
}

export async function rotateVideo(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const rotation = typeof options.rotation === 'string' ? options.rotation : '90cw'
  const vf = ROTATE_FILTERS[rotation] ?? ROTATE_FILTERS['90cw']

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName  = `rot_in_${i}.${ext}`
      const outputName = `rot_out_${i}.mp4`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-vf', vf, '-c:a', 'copy', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Rotate produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}_rotated.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function makeRingtone(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const startTime = typeof options.startTime === 'number' && options.startTime >= 0 ? options.startTime : 0
  const rawEnd    = typeof options.endTime   === 'number' && options.endTime   >  0 ? options.endTime   : 30
  const endTime   = Math.min(rawEnd, startTime + 40)

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp3'
      const inputName  = `rt_in_${i}.${ext}`
      const outputName = `rt_out_${i}.m4r`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec([
          '-i', inputName,
          '-ss', String(startTime),
          '-to', String(endTime),
          '-vn',
          '-acodec', 'aac',
          '-b:a', '128k',
          '-ar', '44100',
          '-movflags', '+faststart',
          outputName,
        ])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Ringtone conversion produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.m4r`, { type: 'audio/x-m4r' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

function buildAtempoChain(speed: number): string {
  const filters: string[] = []
  let s = speed
  while (s > 2.0 + 1e-9) { filters.push('atempo=2.0'); s /= 2.0 }
  while (s < 0.5 - 1e-9) { filters.push('atempo=0.5'); s /= 0.5 }
  filters.push(`atempo=${s.toFixed(4)}`)
  return filters.join(',')
}

function audioCodecForExt(ext: string): { codec: string; mime: string } {
  switch (ext.toLowerCase()) {
    case 'mp3':  return { codec: 'libmp3lame', mime: 'audio/mpeg' }
    case 'aac':
    case 'm4a':  return { codec: 'aac',        mime: 'audio/mp4' }
    case 'wav':  return { codec: 'pcm_s16le',  mime: 'audio/wav' }
    case 'ogg':  return { codec: 'libvorbis',  mime: 'audio/ogg' }
    case 'flac': return { codec: 'flac',       mime: 'audio/flac' }
    default:     return { codec: 'libmp3lame', mime: 'audio/mpeg' }
  }
}

export async function changeVideoSpeed(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const speed = options.speed != null ? parseFloat(String(options.speed)) : 2
  const ptsMultiplier = (1 / speed).toFixed(6)
  const atempoChain = buildAtempoChain(speed)

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp4'
      const inputName  = `vs_in_${i}.${ext}`
      const outputName = `vs_out_${i}.mp4`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec([
          '-i', inputName,
          '-vf', `setpts=${ptsMultiplier}*PTS`,
          '-af', atempoChain,
          '-c:v', 'libx264', '-crf', '23', '-preset', 'fast',
          '-c:a', 'aac', '-b:a', '128k',
          outputName,
        ])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Speed change produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const label = speed === Math.floor(speed) ? `${speed}x` : `${speed}x`
      results.push(new File([data], `${baseName}_${label}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

const AUDIO_SPEED_FORMAT_MAP: Record<string, { codec: string; ext: string; mime: string }> = {
  mp3:  { codec: 'libmp3lame', ext: '.mp3', mime: 'audio/mpeg' },
  wav:  { codec: 'pcm_s16le',  ext: '.wav', mime: 'audio/wav' },
  aac:  { codec: 'aac',        ext: '.m4a', mime: 'audio/mp4' },
  ogg:  { codec: 'libvorbis',  ext: '.ogg', mime: 'audio/ogg' },
  flac: { codec: 'flac',       ext: '.flac', mime: 'audio/flac' },
}

export async function changeAudioSpeed(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const speed  = options.speed  != null ? parseFloat(String(options.speed))  : 1.5
  const format = typeof options.format === 'string' ? options.format : 'original'
  const atempoChain = buildAtempoChain(speed)

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputExt = file.name.split('.').pop() ?? 'mp3'
      const inputName = `as_in_${i}.${inputExt}`

      const codecInfo = format === 'original'
        ? audioCodecForExt(inputExt)
        : { codec: (AUDIO_SPEED_FORMAT_MAP[format] ?? AUDIO_SPEED_FORMAT_MAP.mp3).codec, mime: (AUDIO_SPEED_FORMAT_MAP[format] ?? AUDIO_SPEED_FORMAT_MAP.mp3).mime }
      const outputExt = format === 'original' ? `.${inputExt}` : (AUDIO_SPEED_FORMAT_MAP[format] ?? AUDIO_SPEED_FORMAT_MAP.mp3).ext
      const outputName = `as_out_${i}${outputExt}`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        const encodeArgs = codecInfo.codec === 'libmp3lame'
          ? ['-c:a', 'libmp3lame', '-q:a', '2']
          : ['-c:a', codecInfo.codec]
        await ffmpeg.exec(['-i', inputName, '-af', atempoChain, ...encodeArgs, outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Speed change produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}_${speed}x${outputExt}`, { type: codecInfo.mime }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function mergeAudio(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  if (files.length < 2) throw new Error('Select at least 2 audio files to merge.')

  const format = typeof options.format === 'string' ? options.format : 'mp3'
  const MERGE_AUDIO_FMT: Record<string, { codec: string; ext: string; mime: string }> = {
    mp3:  { codec: 'libmp3lame', ext: '.mp3',  mime: 'audio/mpeg' },
    wav:  { codec: 'pcm_s16le',  ext: '.wav',  mime: 'audio/wav'  },
    aac:  { codec: 'aac',        ext: '.m4a',  mime: 'audio/mp4'  },
    ogg:  { codec: 'libvorbis',  ext: '.ogg',  mime: 'audio/ogg'  },
    flac: { codec: 'flac',       ext: '.flac', mime: 'audio/flac' },
  }
  const fmt = MERGE_AUDIO_FMT[format] ?? MERGE_AUDIO_FMT.mp3

  const ffmpeg = await getFFmpeg()
  onProgress?.(0, 5)

  const inputNames: string[] = []
  for (let i = 0; i < files.length; i++) {
    const ext = files[i].name.split('.').pop() ?? 'mp3'
    const name = `ma_in_${i}.${ext}`
    inputNames.push(name)
    await ffmpeg.writeFile(name, await fetchFile(files[i]))
    onProgress?.(0, Math.round(5 + ((i + 1) / files.length) * 20))
  }

  const listContent = 'ffconcat version 1.0\n' + inputNames.map((n) => `file '${n}'`).join('\n') + '\n'
  await ffmpeg.writeFile('ma_list.txt', new TextEncoder().encode(listContent))
  onProgress?.(0, 30)

  const outputName = `ma_out${fmt.ext}`
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(0, Math.round(30 + progress * 65))
  }
  ffmpeg.on('progress', progressHandler)
  let data: Uint8Array<ArrayBuffer> | undefined
  try {
    const encodeArgs = fmt.codec === 'libmp3lame'
      ? ['-c:a', 'libmp3lame', '-q:a', '2']
      : ['-c:a', fmt.codec]
    await ffmpeg.exec([
      '-f', 'concat', '-safe', '0', '-i', 'ma_list.txt',
      ...encodeArgs,
      outputName,
    ])
    data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
  } finally {
    ffmpeg.off('progress', progressHandler)
    for (const name of inputNames) await ffmpeg.deleteFile(name).catch(() => {})
    await ffmpeg.deleteFile('ma_list.txt').catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
  }
  if (!data || data.byteLength === 0) throw new Error('Merge produced no output')
  return [new File([data], `merged${fmt.ext}`, { type: fmt.mime })]
}

export async function mergeVideo(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  if (files.length < 2) throw new Error('Select at least 2 video files to merge.')

  const CRF = ['18', '23', '28'].includes(String(options.quality)) ? String(options.quality) : '23'

  const ffmpeg = await getFFmpeg()

  const dims = await Promise.all(files.map((f) => probeVideoDimensions(f)))
  const validHeights = dims.filter(Boolean).map((d) => d!.height)
  const targetHeight = validHeights.length > 0 ? Math.min(Math.max(...validHeights), 1080) : 1080

  onProgress?.(0, 5)

  // Phase 1: Normalize each file to H.264/AAC at consistent resolution.
  // Files without an audio track get a synthetic silent track via lavfi anullsrc.
  const normalizedNames: string[] = []
  for (let i = 0; i < files.length; i++) {
    const ext = files[i].name.split('.').pop() ?? 'mp4'
    const inputName = `mvn_in_${i}.${ext}`
    const normName  = `mvn_norm_${i}.mp4`
    normalizedNames.push(normName)

    await ffmpeg.writeFile(inputName, await fetchFile(files[i]))
    const hasAudio = (await probeAudioInfo(ffmpeg, inputName)) !== null

    const progressHandler = ({ progress }: { progress: number }) => {
      const base = 5 + (i / files.length) * 70
      onProgress?.(0, Math.round(base + (progress * 70) / files.length))
    }
    ffmpeg.on('progress', progressHandler)
    try {
      if (hasAudio) {
        await ffmpeg.exec([
          '-i', inputName,
          '-vf', `scale=-2:${targetHeight},fps=30,setsar=1`,
          '-c:v', 'libx264', '-crf', CRF, '-preset', 'fast',
          '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
          normName,
        ])
      } else {
        await ffmpeg.exec([
          '-i', inputName,
          '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
          '-vf', `scale=-2:${targetHeight},fps=30,setsar=1`,
          '-c:v', 'libx264', '-crf', CRF, '-preset', 'fast',
          '-c:a', 'aac', '-b:a', '1k', '-ar', '44100', '-ac', '2',
          '-map', '0:v:0', '-map', '1:a:0',
          '-shortest',
          normName,
        ])
      }
    } finally {
      ffmpeg.off('progress', progressHandler)
      await ffmpeg.deleteFile(inputName).catch(() => {})
    }
    onProgress?.(0, Math.round(5 + ((i + 1) / files.length) * 70))
  }

  // Phase 2: Concat normalized files with stream copy (fast, lossless).
  const listContent = 'ffconcat version 1.0\n' + normalizedNames.map((n) => `file '${n}'`).join('\n') + '\n'
  await ffmpeg.writeFile('mvn_list.txt', new TextEncoder().encode(listContent))
  onProgress?.(0, 80)

  const outputName = 'mvn_out.mp4'
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(0, Math.round(80 + progress * 18))
  }
  ffmpeg.on('progress', progressHandler)
  let data: Uint8Array<ArrayBuffer> | undefined
  try {
    await ffmpeg.exec([
      '-f', 'concat', '-safe', '0', '-i', 'mvn_list.txt',
      '-c', 'copy',
      outputName,
    ])
    data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
  } finally {
    ffmpeg.off('progress', progressHandler)
    for (const name of normalizedNames) await ffmpeg.deleteFile(name).catch(() => {})
    await ffmpeg.deleteFile('mvn_list.txt').catch(() => {})
    await ffmpeg.deleteFile(outputName).catch(() => {})
  }
  if (!data || data.byteLength === 0) throw new Error('Merge produced no output')
  return [new File([data], 'merged.mp4', { type: 'video/mp4' })]
}

export async function flvToMp4(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const quality = (options.quality as string) ?? 'better'
  const crf = quality === 'best' ? '18' : quality === 'good' ? '28' : '23'
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputName = `flv_in_${i}.flv`
      const outputName = `flv_out_${i}.mp4`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-crf', crf, '-preset', 'fast', '-c:a', 'aac', '-b:a', '192k', '-movflags', 'faststart', outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      results.push(new File([data], `${file.name.replace(/\.[^.]+$/, '')}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) { results.push(toError(err)) }
  }
  return results
}

export async function dngToPng(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    try {
      const ffmpeg = await getFFmpeg()
      const file = files[i]
      const inputName = `dng_in_${i}.dng`
      const outputName = `dng_out_${i}.png`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)
      const progressHandler = ({ progress }: { progress: number }) => {
        onProgress?.(i, Math.round(10 + progress * 85))
      }
      ffmpeg.on('progress', progressHandler)
      let data: Uint8Array<ArrayBuffer> | undefined
      try {
        await ffmpeg.exec(['-i', inputName, outputName])
        data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
      } finally {
        ffmpeg.off('progress', progressHandler)
        await ffmpeg.deleteFile(inputName).catch(() => {})
        await ffmpeg.deleteFile(outputName).catch(() => {})
      }
      if (!data || data.byteLength === 0) throw new Error('Conversion produced no output')
      const result = new File([data], `${file.name.replace(/\.[^.]+$/, '')}.png`, { type: 'image/png' })
      results.push(result)
      onProgress?.(i, 100)
      onResult?.(i, result)
    } catch (err) {
      const error = toError(err)
      results.push(error)
      onResult?.(i, error)
    }
  }
  return results
}
