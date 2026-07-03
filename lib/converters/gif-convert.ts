import { getFFmpeg } from './ffmpeg-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'

async function toGif(file: File, opts: ToolOptions): Promise<File> {
  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const inputName = `input.${ext}`
  const outputName = 'output.gif'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const fps = typeof opts.framerate === 'number' ? opts.framerate : 15
  const width = typeof opts.outputWidth === 'number' && opts.outputWidth > 0
    ? opts.outputWidth : -1

  await ffmpeg.exec([
    '-i', inputName,
    '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
    'palette.png',
  ])
  await ffmpeg.exec([
    '-i', inputName,
    '-i', 'palette.png',
    '-filter_complex', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer`,
    '-loop', String(typeof opts.loop === 'number' ? opts.loop : 0),
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  const blob = new Blob([data], { type: 'image/gif' })

  await ffmpeg.deleteFile(inputName).catch(() => {})
  await ffmpeg.deleteFile(outputName).catch(() => {})
  await ffmpeg.deleteFile('palette.png').catch(() => {})

  const name = file.name.replace(/\.[^.]+$/, '.gif')
  return new File([blob], name, { type: 'image/gif' })
}

export async function gifConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 10)
    try {
      const out = await toGif(files[i], opts)
      onProgress?.(i, 100)
      results.push(out)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }
  return results
}
