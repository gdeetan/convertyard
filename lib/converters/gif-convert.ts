import { getFFmpeg } from './ffmpeg-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'

// Single file → GIF. Uses a one-pass split-palette filtergraph.
// Two-pass with a separate palette.png file is unreliable for static images
// in ffmpeg.wasm: the palette pass can silently produce 0 frames (static PNG
// has ~0.04s implicit duration, so fps=N yields <1 frame), and exec() never
// throws on non-zero exit — it resolves with the return code, leaving an empty
// output.gif with no error raised.
async function singleToGif(file: File, opts: ToolOptions): Promise<File> {
  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const inputName = `input.${ext}`
  const outputName = 'output.gif'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const outputWidth = typeof opts.outputWidth === 'number' ? opts.outputWidth : 0
  const loop = typeof opts.loop === 'number' ? opts.loop : 0

  // split[s0][s1] copies the input stream — s0 feeds palettegen, s1 feeds
  // paletteuse. One pass, no intermediate file, works for any frame count.
  const scale = outputWidth > 0 ? `scale=${outputWidth}:-2:flags=lanczos,` : ''
  const vf = `${scale}split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer`

  const ret = await ffmpeg.exec(['-i', inputName, '-vf', vf, '-loop', String(loop), outputName])
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
// Uses a concat filter_complex so each input is independently scaled and
// format-normalized before joining. The image-sequence pattern (-i frame%04d)
// approach fails with "Internal bug" in paletteuse when any two frames differ
// in dimensions or pixel format (pal8 vs rgba etc.), because ffmpeg reconfigures
// the filter graph at the source — before scale/format filters can normalize.
async function sequenceToGif(files: File[], opts: ToolOptions): Promise<File> {
  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const fps = typeof opts.framerate === 'number' ? opts.framerate : 10
  const outputWidth = typeof opts.outputWidth === 'number' ? opts.outputWidth : 0
  const loop = typeof opts.loop === 'number' ? opts.loop : 0

  // Get first frame dimensions to set the target canvas size.
  const bmp = await createImageBitmap(files[0])
  const fw = bmp.width
  const fh = bmp.height
  bmp.close()
  const targetW = outputWidth > 0 ? outputWidth : fw
  const targetH = outputWidth > 0 ? Math.round(fh * (outputWidth / fw)) : fh

  // Write all frames individually (not as a %04d sequence pattern).
  const ext = files[0].name.split('.').pop()?.toLowerCase() ?? 'png'
  const frameNames: string[] = []
  for (let i = 0; i < files.length; i++) {
    const name = `frame${String(i).padStart(4, '0')}.${ext}`
    frameNames.push(name)
    await ffmpeg.writeFile(name, await fetchFile(files[i]))
  }

  // Build filter_complex: scale+format each input independently, then concat,
  // then split → palettegen + paletteuse in one pass.
  const perInput = frameNames.map((_, i) =>
    `[${i}:v]scale=${targetW}:${targetH}:flags=lanczos,format=rgb24,setpts=PTS-STARTPTS[v${i}]`
  )
  const concatIn = frameNames.map((_, i) => `[v${i}]`).join('')
  const concat = `${concatIn}concat=n=${files.length}:v=1:a=0[seq]`
  const palFilter = `[seq]split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer[gif]`
  const filterComplex = [...perInput, concat, palFilter].join(';')

  const inputs = frameNames.flatMap(name => ['-i', name])
  const ret = await ffmpeg.exec([
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[gif]',
    '-r', String(fps),
    '-loop', String(loop),
    'output.gif',
  ])
  if (ret !== 0) throw new Error(`FFmpeg sequence encode exited with code ${ret}`)

  const raw = await ffmpeg.readFile('output.gif')
  const data = new Uint8Array(raw as ArrayBuffer)
  if (data.length === 0) throw new Error('FFmpeg produced empty GIF output')

  const blob = new Blob([data], { type: 'image/gif' })
  for (const name of frameNames) await ffmpeg.deleteFile(name).catch(() => {})
  await ffmpeg.deleteFile('output.gif').catch(() => {})

  return new File([blob], files[0].name.replace(/\.[^.]+$/, '.gif'), { type: 'image/gif' })
}

export async function gifConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  if (files.length === 0) return []

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
