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

// Wrap text at word boundaries, returns ffmpeg-escaped string with \n line breaks
function wrapAndEscape(raw: string, maxChars: number, uppercase: boolean): string | null {
  const text = (uppercase ? raw.toUpperCase() : raw).trim()
  if (!text) return null
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (!current) {
      current = word
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  // Each line is escaped individually; lines joined with ffmpeg newline sequence
  return lines.map(escapeDrawtext).join('\\n')
}

function buildDrawtextFilter(words: WordChunk[], opts: CaptionOptions, fontPath: string): string {
  const { fontSize, primaryColor, outlineColor, outlineWidth, position, uppercase, styleId, maxCharsPerLine } = opts

  const fc = toDrawColor(primaryColor)
  const oc = toDrawColor(outlineColor)
  // Colons must be escaped in option values; path has no other specials
  const escapedFont = fontPath.replace(/:/g, '\\:')

  const pad = Math.round(fontSize * 1.2)
  const yExpr =
    position === 'top'    ? String(pad) :
    position === 'center' ? `(h-${fontSize})/2` :
    /* bottom */            `h-${pad}-${fontSize}`

  const base = `fontfile=${escapedFont}:fontsize=${fontSize}:fontcolor=${fc}:x=(w-text_w)/2:y=${yExpr}`
  const withOutline = `:borderw=${outlineWidth}:bordercolor=${oc}`
  const withBox     = `:box=1:boxcolor=0x000000:boxborderw=8`
  const withShadow  = `:shadowx=2:shadowy=2:shadowcolor=0x000000`

  const makeEntry = (rawText: string, start: number, end: number, extra: string): string | null => {
    // Word-by-word styles show individual tokens — skip wrapping, just escape
    const t = (styleId === 'mrbeast' || styleId === 'tiktok')
      ? escapeDrawtext((uppercase ? rawText.toUpperCase() : rawText).trim())
      : wrapAndEscape(rawText, maxCharsPerLine, uppercase)
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
      styleId === 'netflix'  ? withBox :
      styleId === 'classic'  ? withOutline + withShadow :
      styleId === 'karaoke'  ? withOutline + withShadow :
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
  const midName    = `cap_mid_${ts}.mp4`
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

  onProgress(10)

  const drawFilter = buildDrawtextFilter(words, opts, activeFontPath)

  const logs: string[] = []
  const logHandler = ({ message }: { message: string }) => logs.push(message)
  ffmpeg.on('log', logHandler)

  // progressHandler is reassigned between passes; declare here so finally can always unregister it
  let progressHandler = ({ progress }: { progress: number }) => {
    onProgress(10 + Math.round(progress * 35))
  }
  ffmpeg.on('progress', progressHandler)

  let data: Uint8Array<ArrayBuffer> | null = null
  try {
    // Pass 1 — transcode to clean CFR 30fps yuv420p H.264 + AAC.
    //
    // Phone videos (iOS MOV, Android MP4) are almost always VFR and may carry
    // non-standard pixel formats (yuvj420p, yuv420p10, HDR, etc.). Running drawtext
    // directly on such input causes ffmpeg to attempt filter-graph reinitialization
    // mid-stream, which fails with "Error reinitializing filters / Invalid argument".
    // Normalising first gives drawtext a perfectly consistent, predictable input.
    let exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-c:a', 'aac',
      '-b:a', '128k',
      midName,
    ])

    ffmpeg.off('progress', progressHandler)

    if (exitCode !== 0) {
      throw new Error(`Failed to normalise video (pass 1): ${logs.slice(-5).join(' | ')}`)
    }

    // Delete input now — frees memory before pass 2 allocates the output
    await ffmpeg.deleteFile(inputName).catch(() => {})
    logs.length = 0
    onProgress(45)

    // Pass 2 — burn captions onto the clean intermediate.
    // No fps/format prefix needed: intermediate is already 30fps yuv420p.
    progressHandler = ({ progress }: { progress: number }) => {
      onProgress(45 + Math.round(progress * 50))
    }
    ffmpeg.on('progress', progressHandler)

    exitCode = await ffmpeg.exec([
      '-i', midName,
      '-vf', drawFilter,
      '-pix_fmt', 'yuv420p',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputName,
    ])

    ffmpeg.off('progress', progressHandler)

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
      ffmpeg.deleteFile(midName).catch(() => {}),
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
