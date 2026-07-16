import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from './ffmpeg-client'
import { probeVideoTrack } from './media-probe'
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

function explainMp4ToWebpError(error: Error): Error {
  if (
    error.message.includes('Output file #0 does not contain any stream') ||
    error.message.includes('ErrnoError: FS error')
  ) {
    return new Error('This MP4 has no video track. MP4 to WebP only works on video clips, not audio-only MP4/M4A files.')
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
        results.push(new Error('This MP4 has no video track. MP4 to WebP only works on video clips, not audio-only MP4/M4A files.'))
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
  onProgress?: (fileIndex: number, pct: number) => void
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
        results.push(new Error('This file has no video track. Video Compressor only works on video files, not audio-only files.'))
        continue
      }

      const ffmpeg = await getFFmpeg()
      const ext    = file.name.split('.').pop() ?? 'mp4'
      const inputName  = `cv_in_${i}.${ext}`
      const outputName = `cv_out_${i}.mp4`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      let data: Uint8Array<ArrayBuffer> | undefined

      if (!targetSizeMode) {
        const crf = crfMap[level] ?? 23
        const progressHandler = ({ progress }: { progress: number }) => {
          onProgress?.(i, Math.round(10 + progress * 85))
        }
        ffmpeg.on('progress', progressHandler)
        try {
          await ffmpeg.exec([
            '-i', inputName,
            ...vfArgs,
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
                '-i', inputName,
                ...vfArgs,
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

      await ffmpeg.deleteFile(outputName).catch(() => {})

      if (!data || data.byteLength === 0) throw new Error('Compression produced no output')
      const baseName = file.name.replace(/\.[^.]+$/, '')
      results.push(new File([data], `${baseName}.mp4`, { type: 'video/mp4' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(toError(err))
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
      const useStreamCopy = isAudio && format === 'keep'

      const fmt = useStreamCopy
        ? { ext: `.${inputExt}`, mime: file.type, lossless: true }
        : (FORMAT_MAP[format] ?? FORMAT_MAP.mp3)

      const inputName  = `at_in_${i}.${inputExt}`
      const outputName = `at_out_${i}${fmt.ext}`

      await ffmpeg.writeFile(inputName, await fetchFile(file))
      onProgress?.(i, 10)

      const trimArgs: string[] = []
      if (startTime !== null) trimArgs.push('-ss', String(startTime))
      if (endTime   !== null) trimArgs.push('-to', String(endTime))

      const audioArgs: string[] = useStreamCopy
        ? ['-c', 'copy']
        : fmt.lossless
          ? ['-map', 'a', '-vn', '-codec:a', (FORMAT_MAP[format] ?? FORMAT_MAP.mp3).codec, '-ar', '44100']
          : ['-map', 'a', '-vn', '-codec:a', (FORMAT_MAP[format] ?? FORMAT_MAP.mp3).codec, '-b:a', '192k', '-ar', '44100']

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
