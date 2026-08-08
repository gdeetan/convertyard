import { getSingleThreadFFmpeg } from './ffmpeg-client'
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
  return lines.map(escapeDrawtext).join('\\n')
}

function buildDrawtextFilter(words: WordChunk[], opts: CaptionOptions, fontPath: string): string {
  const { fontSize, primaryColor, outlineColor, outlineWidth, position, uppercase, styleId, maxCharsPerLine } = opts

  const fc = toDrawColor(primaryColor)
  const oc = toDrawColor(outlineColor)
  const escapedFont = fontPath.replace(/:/g, '\\:')

  const pad = Math.round(fontSize * 1.2)
  const yVisible =
    position === 'top'    ? String(pad) :
    position === 'center' ? `(h-${fontSize})/2` :
    /* bottom */            `h-${pad}-${fontSize}`

  // Off-screen y position used to hide text outside its time window.
  // enable='between(t,...)' was tested but causes ffmpeg.wasm to deadlock in the
  // wasm worker thread during filter-graph reconfiguration (no progress events,
  // no error, just a permanent hang). The y-expression keeps every filter always
  // active (no reconfiguration) — off-screen text is clipped by the compositing
  // step so the per-frame cost for hidden captions is negligible.
  const yHidden = `(h+${fontSize})`

  const baseXFont = `fontfile=${escapedFont}:fontsize=${fontSize}:fontcolor=${fc}:x=(w-text_w)/2`
  const withOutline = `:borderw=${outlineWidth}:bordercolor=${oc}`
  const withBox     = `:box=1:boxcolor=0x000000:boxborderw=8`
  const withShadow  = `:shadowx=2:shadowy=2:shadowcolor=0x000000`

  const makeEntry = (rawText: string, start: number, end: number, extra: string): string | null => {
    const t = (styleId === 'mrbeast' || styleId === 'tiktok')
      ? escapeDrawtext((uppercase ? rawText.toUpperCase() : rawText).trim())
      : wrapAndEscape(rawText, maxCharsPerLine, uppercase)
    if (!t) return null
    const yExpr = `if(between(t,${start.toFixed(3)},${end.toFixed(3)}),${yVisible},${yHidden})`
    return `drawtext=${baseXFont}:y='${yExpr}'${extra}:text='${t}'`
  }

  // Each drawtext filter allocates its own FreeType library + face in WASM linear
  // memory (~2-5 MB each). Exceeding ~20 filters on a 4 GB WASM heap is fine;
  // exceeding ~100+ causes OOM and freezes the tab. Cap hard at 20.
  const MAX_FILTERS = 20

  const entries: string[] = []

  if (styleId === 'mrbeast' || styleId === 'tiktok') {
    if (words.length <= MAX_FILTERS) {
      for (const w of words) {
        const e = makeEntry(w.text, w.start, w.end, withOutline)
        if (e) entries.push(e)
      }
    } else {
      // Too many words for word-by-word — group into MAX_FILTERS chunks so WASM
      // memory stays bounded. Visual effect: 2-3 words highlighted at a time.
      const chunkSize = Math.ceil(words.length / MAX_FILTERS)
      const groups = groupIntoLines(words, chunkSize, Infinity)
      for (const group of groups) {
        const text = group.map(w => w.text).join(' ')
        const e = makeEntry(text, group[0].start, group[group.length - 1].end, withOutline)
        if (e) entries.push(e)
      }
    }
  } else {
    const groups = groupIntoLines(words)
    const extra =
      styleId === 'netflix'  ? withBox :
      styleId === 'classic'  ? withOutline + withShadow :
      styleId === 'karaoke'  ? withOutline + withShadow :
      withOutline
    const capped = groups.length <= MAX_FILTERS ? groups : groups.slice(0, MAX_FILTERS)
    for (const group of capped) {
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
  const ffmpeg = await getSingleThreadFFmpeg()

  const ts = Date.now()
  const inputName  = `cap_in_${ts}${getExt(videoFile.name)}`
  const midName    = `cap_mid_${ts}.mkv`
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

  // Timer drives Pass 1 progress (11 → 44%) at 1%/2 s. ffmpeg's 'progress' events are
  // unreliable for many input formats (e.g. WebM, VFR MOV) that lack header duration
  // metadata, leaving the bar frozen at 10% for the entire normalisation step.
  let pass1Pct = 11
  let pass1Timer: ReturnType<typeof setInterval> | null = setInterval(() => {
    pass1Pct = Math.min(44, pass1Pct + 1)
    onProgress(pass1Pct)
  }, 2000)
  // No-op — timer owns the bar for Pass 1.
  let progressHandler = () => {}
  ffmpeg.on('progress', progressHandler)

  let data: Uint8Array<ArrayBuffer> | null = null
  // pass2Timer advances the bar from 46% → 93% at ~1%/3 s so the UI never appears
  // frozen. We can't rely on ffmpeg's progress events for Pass 2 because the MJPEG
  // intermediate doesn't always have the duration metadata that @ffmpeg/ffmpeg needs
  // to compute a valid 0–1 ratio.
  let pass2Timer: ReturnType<typeof setInterval> | null = null

  try {
    // Pass 1 — transcode to MJPEG + AAC in Matroska (.mkv).
    // MJPEG is all-intra: every frame is an independent JPEG. Its decoder has no
    // sequence state, so it structurally cannot emit AVERROR_INPUT_CHANGED during
    // Pass 2, eliminating the "Error reinitialising filters" crash.
    //
    // scale caps width at 1920 px (no upscale), -2 keeps height even for MJPEG.
    // qscale:v=18 (vs old 10) shrinks each JPEG ~3–5×; during Pass 2 the MJPEG
    // file and the H.264 output coexist in WASM MEMFS (2 GB heap), so keeping
    // the intermediate small prevents RuntimeError: memory access out of bounds.
    let exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-vf', `fps=30,scale='if(gt(iw,1920),1920,iw)':-2,format=yuvj420p`,
      '-c:v', 'mjpeg',
      '-qscale:v', '18',
      '-c:a', 'aac',
      '-b:a', '128k',
      midName,
    ])

    clearInterval(pass1Timer)
    pass1Timer = null
    ffmpeg.off('progress', progressHandler)

    if (exitCode !== 0) {
      throw new Error(`Failed to normalise video (pass 1): ${logs.slice(-5).join(' | ')}`)
    }

    await ffmpeg.deleteFile(inputName).catch(() => {})
    logs.length = 0
    onProgress(45)

    // Pass 2 — burn captions onto the MJPEG intermediate.
    // Timer drives the progress bar so the user can see work is happening.
    let pass2Pct = 46
    pass2Timer = setInterval(() => {
      pass2Pct = Math.min(93, pass2Pct + 1)
      onProgress(pass2Pct)
    }, 3000)

    // no-op handler; timer owns progress for Pass 2
    progressHandler = () => {}
    ffmpeg.on('progress', progressHandler)

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

    clearInterval(pass2Timer)
    pass2Timer = null
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
    if (pass1Timer) clearInterval(pass1Timer)
    if (pass2Timer) clearInterval(pass2Timer)
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
