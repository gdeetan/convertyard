import { getFFmpeg } from './ffmpeg-client'
import type { WordChunk, CaptionOptions } from './caption-types'
import { loadBuiltinFont } from './caption-fonts'

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

// '#RRGGBB' → '0xRRGGBB' (6-digit hex, always valid in drawtext)
function toDrawColor(hex: string): string {
  return '0x' + hex.replace('#', '').padStart(6, '0').slice(0, 6).toUpperCase()
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

  const fc = toDrawColor(primaryColor)
  const oc = toDrawColor(outlineColor)
  // Escape only the path chars that break drawtext option parsing
  const escapedFont = fontPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'")

  // Fixed pixel offsets — avoids text_h/text_w variables that some builds don't expose pre-render
  const pad = Math.round(fontSize * 1.2)
  const yExpr =
    position === 'top'    ? String(pad) :
    position === 'center' ? `(h-${fontSize})/2` :
    /* bottom */            `h-${pad}-${fontSize}`

  const base = `fontfile='${escapedFont}':fontsize=${fontSize}:fontcolor=${fc}:x=(w-text_w)/2:y=${yExpr}`
  const withOutline = `:borderw=${outlineWidth}:bordercolor=${oc}`
  const withBox     = `:box=1:boxcolor=black@0.5:boxborderw=8`
  const withShadow  = `:shadowx=2:shadowy=2:shadowcolor=black@0.7`

  const makeEntry = (text: string, start: number, end: number, extra: string): string | null => {
    const t = escapeDrawtext((uppercase ? text.toUpperCase() : text).trim())
    if (!t) return null
    return `drawtext=${base}${extra}:text='${t}':enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'`
  }

  const entries: string[] = []

  if (styleId === 'mrbeast' || styleId === 'tiktok') {
    for (const w of words) {
      const e = makeEntry(w.text, w.start, w.end, withOutline)
      if (e) entries.push(e)
    }
  } else {
    const groups = groupIntoLines(words)
    const extra =
      styleId === 'netflix' ? withBox :
      styleId === 'classic' ? withOutline + withShadow :
      withOutline
    for (const group of groups) {
      const text = group.map(w => w.text).join(' ')
      const e = makeEntry(text, group[0].start, group[group.length - 1].end, extra)
      if (e) entries.push(e)
    }
  }

  if (entries.length === 0) throw new Error('No caption entries to burn — transcript may be empty')
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

  let activeFontPath: string
  if (fontBlob) {
    await ffmpeg.writeFile('/capfonts/userfont.ttf', new Uint8Array(await fontBlob.arrayBuffer()))
    activeFontPath = '/capfonts/userfont.ttf'
  } else {
    await ffmpeg.writeFile('/capfonts/builtin.ttf', await loadBuiltinFont(opts.builtinFont))
    activeFontPath = '/capfonts/builtin.ttf'
  }

  onProgress(15)

  const drawFilter = buildDrawtextFilter(words, opts, activeFontPath)

  // Capture ffmpeg logs so we can include them in error messages
  const logs: string[] = []
  const logHandler = ({ message }: { message: string }) => logs.push(message)
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress(15 + Math.round(progress * 80))
  }
  ffmpeg.on('log', logHandler)
  ffmpeg.on('progress', progressHandler)

  let data: Uint8Array<ArrayBuffer> | null = null
  try {
    // exec() in @ffmpeg/ffmpeg 0.12.x resolves with exit code, does NOT throw on failure
    const exitCode: number = await ffmpeg.exec([
      '-i', inputName,
      '-vf', drawFilter,
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputName,
    ])
    if (exitCode !== 0) {
      throw new Error(`ffmpeg exited with code ${exitCode}. ${logs.slice(-5).join(' | ')}`)
    }
    onProgress(98)
    data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
    if (!data || data.length === 0) {
      throw new Error('ffmpeg produced an empty output file')
    }
  } finally {
    ffmpeg.off('log', logHandler)
    ffmpeg.off('progress', progressHandler)
    await Promise.all([
      ffmpeg.deleteFile(inputName).catch(() => {}),
      ffmpeg.deleteFile(outputName).catch(() => {}),
      fontBlob
        ? ffmpeg.deleteFile('/capfonts/userfont.ttf').catch(() => {})
        : ffmpeg.deleteFile('/capfonts/builtin.ttf').catch(() => {}),
    ])
  }

  onProgress(100)
  return new File(
    [data!],
    `captioned-${videoFile.name.replace(/\.[^.]+$/, '')}.mp4`,
    { type: 'video/mp4' },
  )
}

function getExt(name: string): string {
  const m = name.match(/\.[^.]+$/)
  return m ? m[0] : '.mp4'
}
