import { getFFmpeg } from './ffmpeg-client'

let defaultFontCache: Uint8Array | null = null

async function getDefaultFont(): Promise<Uint8Array> {
  if (defaultFontCache) return defaultFontCache
  const res = await fetch('https://cdn.jsdelivr.net/npm/roboto-fontface@0.10.0/fonts/roboto/Roboto-Regular.ttf')
  if (!res.ok) throw new Error(`Failed to fetch caption font: ${res.status}`)
  defaultFontCache = new Uint8Array(await res.arrayBuffer())
  return defaultFontCache
}

export async function burnCaptions(
  videoFile: File,
  assContent: string,
  fontBlob: Blob | null,
  onProgress: (pct: number) => void,
): Promise<File> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFFmpeg()

  const ts = Date.now()
  const inputName  = `cap_in_${ts}${getExt(videoFile.name)}`
  const assName    = `cap_subs_${ts}.ass`
  const outputName = `cap_out_${ts}.mp4`

  onProgress(5)
  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))
  await ffmpeg.writeFile(assName, new TextEncoder().encode(assContent))

  // libass requires at least one font in fontsdir or captions are invisible.
  // We always ship a default TTF so the fallback path always renders.
  try { await ffmpeg.createDir('/capfonts') } catch { /* already exists */ }
  const defaultFont = await getDefaultFont()
  await ffmpeg.writeFile('/capfonts/default.ttf', defaultFont)

  if (fontBlob) {
    const fontBytes = new Uint8Array(await fontBlob.arrayBuffer())
    await ffmpeg.writeFile('/capfonts/userfont.ttf', fontBytes)
  }

  onProgress(15)

  const assFilter = `ass=${assName}:fontsdir=/capfonts`

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress(15 + Math.round(progress * 80))
  }
  ffmpeg.on('progress', progressHandler)

  let data: Uint8Array<ArrayBuffer> | null = null
  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', assFilter,
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputName,
    ])
    onProgress(98)
    data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
  } finally {
    ffmpeg.off('progress', progressHandler)
    await Promise.all([
      ffmpeg.deleteFile(inputName).catch(() => {}),
      ffmpeg.deleteFile(assName).catch(() => {}),
      ffmpeg.deleteFile(outputName).catch(() => {}),
      ffmpeg.deleteFile('/capfonts/default.ttf').catch(() => {}),
      fontBlob ? ffmpeg.deleteFile('/capfonts/userfont.ttf').catch(() => {}) : Promise.resolve(),
    ])
  }

  const outFile = new File(
    [data!],
    `captioned-${videoFile.name.replace(/\.[^.]+$/, '')}.mp4`,
    { type: 'video/mp4' },
  )
  onProgress(100)
  return outFile
}

function getExt(name: string): string {
  const m = name.match(/\.[^.]+$/)
  return m ? m[0] : '.mp4'
}
