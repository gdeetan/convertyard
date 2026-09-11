import { getSingleThreadFFmpeg, withFfmpegLock } from './ffmpeg-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'

// Detect APNG by scanning for an acTL chunk before the first IDAT.
// PNG signature is 8 bytes, then a sequence of length(4) + type(4) + data + crc(4) chunks.
export async function isAnimatedPng(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, Math.min(file.size, 65536)).arrayBuffer())
  if (head.length < 8 || head[0] !== 0x89 || head[1] !== 0x50 || head[2] !== 0x4e || head[3] !== 0x47) return false
  let off = 8
  const dv = new DataView(head.buffer, head.byteOffset, head.byteLength)
  while (off + 8 <= head.length) {
    const len = dv.getUint32(off)
    const type = String.fromCharCode(head[off + 4], head[off + 5], head[off + 6], head[off + 7])
    if (type === 'acTL') return true
    if (type === 'IDAT') return false
    off += 8 + len + 4
  }
  return false
}

// Single file → GIF. Uses a one-pass split-palette filtergraph.
// Two-pass with a separate palette.png file is unreliable for static images
// in ffmpeg.wasm: the palette pass can silently produce 0 frames (static PNG
// has ~0.04s implicit duration, so fps=N yields <1 frame), and exec() never
// throws on non-zero exit — it resolves with the return code, leaving an empty
// output.gif with no error raised.
let jobCounter = 0

// GIF max palette is 256; palettegen requires min 4.
function clampColors(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 256
  return Math.max(4, Math.min(256, n))
}

async function singleToGif(
  file: File,
  opts: ToolOptions,
  previewMaxFrames?: number,
): Promise<File> {
  const jobId = ++jobCounter
  const ffmpeg = await getSingleThreadFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const inputName = `input_${jobId}.${ext}`
  const outputName = `output_${jobId}.gif`

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const outputWidth = typeof opts.outputWidth === 'number' ? opts.outputWidth : 0
  const loop = typeof opts.loop === 'number' ? opts.loop : 0
  const fps = typeof opts.framerate === 'number' ? opts.framerate : 10
  const maxColors = clampColors(opts.maxColors)

  // Animated PNGs (APNG) need bounded frame count and cheaper palette stats,
  // otherwise palettegen=full over hundreds of full-res frames takes hours in wasm.
  const animated = (ext === 'png' || ext === 'apng') && await isAnimatedPng(file)
  const inputArgs = animated ? ['-f', 'apng', '-i', inputName] : ['-i', inputName]

  // Order matters: fps + scale go BEFORE split so palettegen sees a bounded stream.
  // stats_mode=diff is far cheaper than full and visually equivalent for most APNGs.
  const scale = outputWidth > 0 ? `scale=${outputWidth}:-2:flags=lanczos,` : ''
  const rate = animated ? `fps=${fps},` : ''
  const statsMode = animated ? 'diff' : 'full'
  const vf = `${rate}${scale}split[s0][s1];[s0]palettegen=max_colors=${maxColors}:stats_mode=${statsMode}[p];[s1][p]paletteuse=dither=bayer`

  const frameCap = previewMaxFrames && animated ? ['-frames:v', String(previewMaxFrames)] : []
  const ret = await ffmpeg.exec([...inputArgs, '-vf', vf, '-loop', String(loop), ...frameCap, outputName])
  if (ret !== 0) throw new Error(`FFmpeg exited with code ${ret}`)

  const raw = await ffmpeg.readFile(outputName)
  const data = new Uint8Array(raw as ArrayBuffer)
  if (data.length === 0) throw new Error('FFmpeg produced empty GIF output')

  const blob = new Blob([data], { type: 'image/gif' })
  await ffmpeg.deleteFile(inputName).catch(() => {})
  await ffmpeg.deleteFile(outputName).catch(() => {})

  return new File([blob], file.name.replace(/\.[^.]+$/, '.gif'), { type: 'image/gif' })
}

// Fast APNG→GIF sample for the live preview UI. Encodes only the first N frames
// at current settings so users can eyeball dither/fps/scale without waiting for
// the full animation. Serialized against the real convert via withFfmpegLock.
export async function gifPreview(
  file: File,
  opts: ToolOptions,
  maxFrames = 12,
): Promise<File> {
  return withFfmpegLock(() => singleToGif(file, opts, maxFrames))
}

// Multiple static images → one animated GIF (each file = one frame in order).
// Uses the concat demuxer (a text list with explicit per-frame duration) so every
// frame gets a proper PTS. A per-input filter_complex concat approach fails because
// static PNGs have near-zero implicit duration: concat cannot offset frames
// correctly and the -r flag at output conflicts with PTS-based GIF frame delays.
async function sequenceToGif(files: File[], opts: ToolOptions): Promise<File> {
  const ffmpeg = await getSingleThreadFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const fps = typeof opts.framerate === 'number' ? opts.framerate : 10
  const outputWidth = typeof opts.outputWidth === 'number' ? opts.outputWidth : 0
  const loop = typeof opts.loop === 'number' ? opts.loop : 0
  const maxColors = clampColors(opts.maxColors)

  // Get first frame dimensions for target canvas size.
  const bmp = await createImageBitmap(files[0])
  const fw = bmp.width
  const fh = bmp.height
  bmp.close()
  const targetW = outputWidth > 0 ? outputWidth : fw
  const targetH = outputWidth > 0 ? Math.round(fh * (outputWidth / fw)) : fh

  // Write all frames individually.
  const frameNames: string[] = []
  for (let i = 0; i < files.length; i++) {
    const ext = files[i].name.split('.').pop()?.toLowerCase() ?? 'png'
    const name = `frame${String(i).padStart(4, '0')}.${ext}`
    frameNames.push(name)
    await ffmpeg.writeFile(name, await fetchFile(files[i]))
  }

  // Write concat demuxer list. Each entry gets an explicit duration so ffmpeg
  // assigns correct PTS to every frame. The final entry has no duration (concat
  // demuxer uses the last entry as a "hold" frame to close the last segment).
  const frameDuration = 1 / fps
  let concatList = ''
  for (const name of frameNames) {
    concatList += `file '${name}'\nduration ${frameDuration}\n`
  }
  concatList += `file '${frameNames[frameNames.length - 1]}'\n`
  await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatList))

  // Encode directly — ffmpeg's built-in GIF encoder handles palette quantization.
  // palettegen/paletteuse via filter_complex fails in ffmpeg.wasm (two-input sync
  // issues, split buffering problems). Direct encoding is reliable and produces
  // correct animated output.
  const vf = `scale=${targetW}:${targetH}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${maxColors}:stats_mode=full[p];[s1][p]paletteuse=dither=bayer`
  const ret = await ffmpeg.exec([
    '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
    '-vf', vf,
    '-loop', String(loop),
    'output.gif',
  ])
  if (ret !== 0) throw new Error(`FFmpeg sequence encode exited with code ${ret}`)

  const raw = await ffmpeg.readFile('output.gif')
  const data = new Uint8Array(raw as ArrayBuffer)
  if (data.length === 0) throw new Error('FFmpeg produced empty GIF output')

  const blob = new Blob([data], { type: 'image/gif' })
  for (const name of frameNames) await ffmpeg.deleteFile(name).catch(() => {})
  await ffmpeg.deleteFile('concat.txt').catch(() => {})
  await ffmpeg.deleteFile('output.gif').catch(() => {})

  return new File([blob], files[0].name.replace(/\.[^.]+$/, '.gif'), { type: 'image/gif' })
}

export async function gifConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void,
): Promise<ConversionResult[]> {
  if (files.length === 0) return []

  if (files.length > 1) {
    onProgress?.(0, 10)
    try {
      const out = await withFfmpegLock(() => sequenceToGif(files, opts))
      for (let i = 0; i < files.length; i++) onProgress?.(i, 100)
      onResult?.(0, out)
      return [out]
    } catch (err) {
      for (let i = 0; i < files.length; i++) onProgress?.(i, 100)
      const error = err instanceof Error ? err : new Error(String(err))
      onResult?.(0, error)
      return [error]
    }
  }

  onProgress?.(0, 10)
  try {
    const out = await withFfmpegLock(() => singleToGif(files[0], opts))
    onProgress?.(0, 100)
    onResult?.(0, out)
    return [out]
  } catch (err) {
    onProgress?.(0, 100)
    const error = err instanceof Error ? err : new Error(String(err))
    onResult?.(0, error)
    return [error]
  }
}
