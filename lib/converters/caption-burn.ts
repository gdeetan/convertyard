import { getFFmpeg } from './ffmpeg-client'
import type { WordChunk, CaptionOptions } from './caption-types'

let defaultFontCache: Uint8Array | null = null

async function getDefaultFont(): Promise<Uint8Array> {
  if (defaultFontCache) return defaultFontCache
  const res = await fetch('/fonts/caption-font.ttf')
  if (!res.ok) throw new Error(`Failed to load caption font: ${res.status}`)
  defaultFontCache = new Uint8Array(await res.arrayBuffer())
  return defaultFontCache
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/'/g, "\\'")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

function groupIntoLines(words: WordChunk[], maxWords = 8, maxDuration = 3): WordChunk[][] {
  const groups: WordChunk[][] = []
  let current: WordChunk[] = []
  let groupStart = words[0]?.start ?? 0
  for (const word of words) {
    if (current.length >= maxWords || (current.length > 0 && word.end - groupStart >= maxDuration)) {
      groups.push(current)
      current = []
      groupStart = word.start
    }
    current.push(word)
  }
  if (current.length > 0) groups.push(current)
  return groups
}

function buildDrawtextFilter(words: WordChunk[], opts: CaptionOptions, fontPath: string): string {
  const { fontSize, primaryColor, outlineColor, outlineWidth, position, uppercase, styleId } = opts

  const fc = primaryColor.replace('#', '0x') + 'FF'
  const oc = outlineColor.replace('#', '0x') + 'FF'
  const escapedFont = fontPath.replace(/:/g, '\\:').replace(/,/g, '\\,')

  const yExpr =
    position === 'top'    ? `${Math.round(fontSize * 1.5)}` :
    position === 'center' ? `(h-text_h)/2` :
    /* bottom */            `h-text_h-${Math.round(fontSize * 1.5)}`

  const base = `fontfile=${escapedFont}:fontsize=${fontSize}:fontcolor=${fc}:x=(w-text_w)/2:y=${yExpr}`

  const withOutline = `:borderw=${outlineWidth}:bordercolor=${oc}`
  const withBox     = `:box=1:boxcolor=0x00000080:boxborderw=10`
  const withShadow  = `:shadowx=2:shadowy=2:shadowcolor=0x00000080`

  const entry = (text: string, start: number, end: number, extra: string) => {
    const t = escapeDrawtext((uppercase ? text.toUpperCase() : text).trim())
    if (!t) return null
    return `drawtext=${base}${extra}:text='${t}':enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'`
  }

  const entries: string[] = []

  if (styleId === 'mrbeast' || styleId === 'tiktok') {
    for (const w of words) {
      const e = entry(w.text, w.start, w.end, withOutline)
      if (e) entries.push(e)
    }
  } else {
    const groups = groupIntoLines(words)
    const extra = styleId === 'netflix' ? withBox : styleId === 'classic' ? withOutline + withShadow : withOutline
    for (const group of groups) {
      const text = group.map(w => w.text).join(' ')
      const e = entry(text, group[0].start, group[group.length - 1].end, extra)
      if (e) entries.push(e)
    }
  }

  return entries.join(',')
}

export async function burnCaptions(
  videoFile: File,
  words: WordChunk[],
  opts: CaptionOptions,
  fontBlob: Blob | null,
  onProgress: (pct: number) => void,
): Promise<File> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFFmpeg()

  const ts = Date.now()
  const inputName  = `cap_in_${ts}${getExt(videoFile.name)}`
  const outputName = `cap_out_${ts}.mp4`

  onProgress(5)
  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))

  try { await ffmpeg.createDir('/capfonts') } catch { /* already exists */ }
  const defaultFont = await getDefaultFont()
  await ffmpeg.writeFile('/capfonts/default.ttf', defaultFont)

  let activeFontPath = '/capfonts/default.ttf'
  if (fontBlob) {
    const fontBytes = new Uint8Array(await fontBlob.arrayBuffer())
    await ffmpeg.writeFile('/capfonts/userfont.ttf', fontBytes)
    activeFontPath = '/capfonts/userfont.ttf'
  }

  onProgress(15)

  const drawFilter = buildDrawtextFilter(words, opts, activeFontPath)

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress(15 + Math.round(progress * 80))
  }
  ffmpeg.on('progress', progressHandler)

  let data: Uint8Array<ArrayBuffer> | null = null
  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', drawFilter,
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
