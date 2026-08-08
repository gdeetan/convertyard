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
  const yVisible =
    position === 'top'    ? String(pad) :
    position === 'center' ? `(h-${fontSize})/2` :
    /* bottom */            `h-${pad}-${fontSize}`

  // Place text one font-height below the frame when outside its time window.
  // We avoid enable='between(t,...)' because toggling a filter's enabled state
  // triggers AVERROR_INPUT_CHANGED propagation in ffmpeg.wasm, which causes
  // "Error reinitializing filters" on every real-world video. Using a y
  // expression instead keeps the filter always-on — no state change, no reinit.
  const yHidden = `(h+${fontSize})`

  // x is always centred; y switches between visible and off-screen per frame
  const baseXFont = `fontfile=${escapedFont}:fontsize=${fontSize}:fontcolor=${fc}:x=(w-text_w)/2`
  const withOutline = `:borderw=${outlineWidth}:bordercolor=${oc}`
  const withBox     = `:box=1:boxcolor=0x000000:boxborderw=8`
  const withShadow  = `:shadowx=2:shadowy=2:shadowcolor=0x000000`

  const makeEntry = (rawText: string, start: number, end: number, extra: string): string | null => {
    // Word-by-word styles show individual tokens — skip wrapping, just escape
    const t = (styleId === 'mrbeast' || styleId === 'tiktok')
      ? escapeDrawtext((uppercase ? rawText.toUpperCase() : rawText).trim())
      : wrapAndEscape(rawText, maxCharsPerLine, uppercase)
    if (!t) return null
    // Single-quote the y value so commas inside if()/between() are not
    // tokenised as filter-option separators by ffmpeg's option parser.
    const yExpr = `if(between(t,${start.toFixed(3)},${end.toFixed(3)}),${yVisible},${yHidden})`
    return `drawtext=${baseXFont}:y='${yExpr}'${extra}:text='${t}'`
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
  const midName    = `cap_mid_${ts}.mkv`
  const outputName = `cap_out_${ts}.mp4`

  // Pre-read duration so progress handlers can use time/duration instead of the
  // unreliable `progress` ratio (which breaks for MJPEG intermediates).
  const videoDurationS = await getVideoDuration(videoFile)

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

  // Use `time` (µs position in current pass) + known video duration for progress.
  // The `progress` ratio from @ffmpeg/ffmpeg is unreliable when total duration
  // can't be determined (MJPEG intermediate), emitting raw µs timestamps instead.
  const timeRatio = (timeUs: number) =>
    videoDurationS > 0 ? Math.min(1, Math.max(0, timeUs / 1_000_000 / videoDurationS)) : 0

  let progressHandler = ({ time }: { progress: number; time: number }) => {
    onProgress(10 + Math.round(timeRatio(time) * 35))
  }
  ffmpeg.on('progress', progressHandler)

  let data: Uint8Array<ArrayBuffer> | null = null
  try {
    // Pass 1 — transcode to MJPEG + AAC in Matroska (.mkv).
    //
    // Root cause of all "Error reinitializing filters" crashes: every H.264 decoder —
    // even for a carefully normalised intermediate — can return AVERROR_INPUT_CHANGED
    // when the decoder encounters a new I-frame whose SPS/SEI colorspace metadata
    // differs from the previous one. ffmpeg.wasm then tries to reconfigure the filter
    // graph, which fails with "Invalid argument".
    //
    // MJPEG is all-intra: every frame is an independent JPEG. Its decoder keeps no
    // state between frames, so it structurally cannot emit AVERROR_INPUT_CHANGED.
    // This eliminates the root cause rather than trying to mask it.
    let exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'fps=30,scale=iw:ih,format=yuvj420p',
      '-c:v', 'mjpeg',
      '-qscale:v', '10',
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
    progressHandler = ({ time }: { progress: number; time: number }) => {
      onProgress(45 + Math.round(timeRatio(time) * 50))
    }
    ffmpeg.on('progress', progressHandler)

    // Pass 2 — burn captions onto the MJPEG intermediate.
    // format=yuv420p converts MJPEG's full-range yuvj420p to limited-range yuv420p
    // as a one-time initialisation step — not a mid-stream format change — so
    // AVERROR_INPUT_CHANGED is impossible here too.
    exitCode = await ffmpeg.exec([
      '-i', midName,
      '-vf', `format=yuv420p,${drawFilter}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
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

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(isFinite(v.duration) && v.duration > 0 ? v.duration : 0) }
    v.onerror = () => resolve(0)
    v.src = URL.createObjectURL(file)
  })
}
