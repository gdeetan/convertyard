import { getFFmpeg } from './ffmpeg-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'

// jpeg → jpg so ffmpeg sequence pattern is consistent
function normaliseExt(ext: string): string {
  return ext === 'jpeg' ? 'jpg' : ext
}

// Two-pass helpers for image sequences (sequenceToGif only).
// -framerate on the input already sets the rate; no fps filter needed inside
// the filtergraph — adding it caused exit code 1 in ffmpeg.wasm.
function palettegenVf(outputWidth: number): string {
  const scale = outputWidth > 0 ? `scale=${outputWidth}:-1:flags=lanczos,` : ''
  return `${scale}palettegen=stats_mode=full`
}

function encodeFilterComplex(outputWidth: number): string {
  return outputWidth > 0
    ? `[0:v]scale=${outputWidth}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer`
    : `[0:v][1:v]paletteuse=dither=bayer`
}

// Single file → GIF. Uses a one-pass split-palette filtergraph.
// Two-pass with a separate palette.png file is unreliable for static images
// in ffmpeg.wasm: the palette pass can silently produce 0 frames (static PNG
// has ~0.04s implicit duration, so fps=N yields <1 frame), and exec() never
// throws on non-zero exit — it resolves with the return code, leaving an empty
// output.gif with no error raised.
async function singleToGif(file: File, opts: ToolOptions): Promise<File> {
  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const ext = normaliseExt(file.name.split('.').pop()?.toLowerCase() ?? 'jpg')
  const inputName = `input.${ext}`
  const outputName = 'output.gif'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const outputWidth = typeof opts.outputWidth === 'number' ? opts.outputWidth : 0
  const loop = typeof opts.loop === 'number' ? opts.loop : 0

  // split[s0][s1] copies the input stream — s0 feeds palettegen, s1 feeds
  // paletteuse. One pass, no intermediate file, works for any frame count.
  const scale = outputWidth > 0 ? `scale=${outputWidth}:-1:flags=lanczos,` : ''
  const vf = `${scale}split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer`

  const ret = await ffmpeg.exec([
    '-i', inputName,
    '-vf', vf,
    '-loop', String(loop),
    outputName,
  ])

  if (ret !== 0) throw new Error(`FFmpeg exited with code ${ret}`)

  const raw = await ffmpeg.readFile(outputName)
  const data = new Uint8Array(raw as ArrayBuffer)
  if (data.length === 0) throw new Error('FFmpeg produced empty GIF output')

  const blob = new Blob([data], { type: 'image/gif' })

  await ffmpeg.deleteFile(inputName).catch(() => {})
  await ffmpeg.deleteFile(outputName).catch(() => {})

  return new File([blob], file.name.replace(/\.[^.]+$/, '.gif'), { type: 'image/gif' })
}

// Multiple static images → one animated GIF (each file = one frame in order).
async function sequenceToGif(files: File[], opts: ToolOptions): Promise<File> {
  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const ext = normaliseExt(files[0].name.split('.').pop()?.toLowerCase() ?? 'jpg')
  const fps = typeof opts.framerate === 'number' ? opts.framerate : 10
  const outputWidth = typeof opts.outputWidth === 'number' ? opts.outputWidth : 0
  const loop = typeof opts.loop === 'number' ? opts.loop : 0

  const frameNames: string[] = []
  for (let i = 0; i < files.length; i++) {
    const name = `frame${String(i).padStart(4, '0')}.${ext}`
    frameNames.push(name)
    await ffmpeg.writeFile(name, await fetchFile(files[i]))
  }

  const inputPattern = `frame%04d.${ext}`

  // Two-pass: global palette from the full sequence, then encode all frames
  const ret1 = await ffmpeg.exec([
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', palettegenVf(outputWidth),
    'palette.png',
  ])
  if (ret1 !== 0) throw new Error(`FFmpeg palette pass exited with code ${ret1}`)

  const ret2 = await ffmpeg.exec([
    '-framerate', String(fps),
    '-i', inputPattern,
    '-i', 'palette.png',
    '-filter_complex', encodeFilterComplex(outputWidth),
    '-loop', String(loop),
    'output.gif',
  ])
  if (ret2 !== 0) throw new Error(`FFmpeg encode pass exited with code ${ret2}`)

  const raw = await ffmpeg.readFile('output.gif')
  const data = new Uint8Array(raw as ArrayBuffer)
  if (data.length === 0) throw new Error('FFmpeg produced empty GIF output')

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
