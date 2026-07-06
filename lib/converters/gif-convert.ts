import { getFFmpeg } from './ffmpeg-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'

// jpeg → jpg so ffmpeg sequence pattern is consistent
function normaliseExt(ext: string): string {
  return ext === 'jpeg' ? 'jpg' : ext
}

function scaleFilter(outputWidth: number): string {
  // scale=-1:-1 is invalid in ffmpeg; omit scale entirely when no resize needed
  return outputWidth > 0 ? `scale=${outputWidth}:-1:flags=lanczos,` : ''
}

// Single file → GIF. Handles static images and animated sources (WebP, GIF).
// ffmpeg reads all frames from animated sources automatically.
async function singleToGif(file: File, opts: ToolOptions): Promise<File> {
  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const ext = normaliseExt(file.name.split('.').pop()?.toLowerCase() ?? 'jpg')
  const inputName = `input.${ext}`
  const outputName = 'output.gif'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const fps = typeof opts.framerate === 'number' ? opts.framerate : 15
  const sw = scaleFilter(typeof opts.outputWidth === 'number' ? opts.outputWidth : 0)
  const loop = typeof opts.loop === 'number' ? opts.loop : 0

  await ffmpeg.exec([
    '-i', inputName,
    '-vf', `fps=${fps},${sw}palettegen=stats_mode=full`,
    'palette.png',
  ])
  await ffmpeg.exec([
    '-i', inputName,
    '-i', 'palette.png',
    '-filter_complex', `fps=${fps},${sw}[x];[x][1:v]paletteuse=dither=bayer`,
    '-loop', String(loop),
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  const blob = new Blob([data], { type: 'image/gif' })

  await ffmpeg.deleteFile(inputName).catch(() => {})
  await ffmpeg.deleteFile(outputName).catch(() => {})
  await ffmpeg.deleteFile('palette.png').catch(() => {})

  return new File([blob], file.name.replace(/\.[^.]+$/, '.gif'), { type: 'image/gif' })
}

// Multiple static images → one animated GIF (each file = one frame in order).
async function sequenceToGif(files: File[], opts: ToolOptions): Promise<File> {
  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const ext = normaliseExt(files[0].name.split('.').pop()?.toLowerCase() ?? 'jpg')
  const fps = typeof opts.framerate === 'number' ? opts.framerate : 10
  const sw = scaleFilter(typeof opts.outputWidth === 'number' ? opts.outputWidth : 0)
  const loop = typeof opts.loop === 'number' ? opts.loop : 0

  const frameNames: string[] = []
  for (let i = 0; i < files.length; i++) {
    const name = `frame${String(i).padStart(4, '0')}.${ext}`
    frameNames.push(name)
    await ffmpeg.writeFile(name, await fetchFile(files[i]))
  }

  const inputPattern = `frame%04d.${ext}`

  // Two-pass: global palette from the full sequence, then encode all frames
  await ffmpeg.exec([
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', `fps=${fps},${sw}palettegen=stats_mode=full`,
    'palette.png',
  ])
  await ffmpeg.exec([
    '-framerate', String(fps),
    '-i', inputPattern,
    '-i', 'palette.png',
    '-filter_complex', `fps=${fps},${sw}[x];[x][1:v]paletteuse=dither=bayer`,
    '-loop', String(loop),
    'output.gif',
  ])

  const data = await ffmpeg.readFile('output.gif')
  const blob = new Blob([data], { type: 'image/gif' })

  for (const name of frameNames) await ffmpeg.deleteFile(name).catch(() => {})
  await ffmpeg.deleteFile('output.gif').catch(() => {})
  await ffmpeg.deleteFile('palette.png').catch(() => {})

  return new File([blob], files[0].name.replace(/\.[^.]+$/, '.gif'), { type: 'image/gif' })
}

export async function gifConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  if (files.length === 0) return []

  // Multiple files → combine into one animated GIF (each file = one frame)
  if (files.length > 1) {
    onProgress?.(0, 10)
    try {
      const out = await sequenceToGif(files, opts)
      for (let i = 0; i < files.length; i++) onProgress?.(i, 100)
      return [out]
    } catch (err) {
      for (let i = 0; i < files.length; i++) onProgress?.(i, 100)
      return [err instanceof Error ? err : new Error(String(err))]
    }
  }

  // Single file → handles both static images and animated sources (WebP, GIF)
  onProgress?.(0, 10)
  try {
    const out = await singleToGif(files[0], opts)
    onProgress?.(0, 100)
    return [out]
  } catch (err) {
    onProgress?.(0, 100)
    return [err instanceof Error ? err : new Error(String(err))]
  }
}
