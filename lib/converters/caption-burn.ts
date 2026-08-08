import { getSingleThreadFFmpeg } from './ffmpeg-client'
import type { WordChunk, CaptionOptions } from './caption-types'
import { loadBuiltinFont } from './caption-fonts'
import { buildASS } from './caption-ass-builder'

// Derive the font family name to embed in the ASS [V4+ Styles] header.
// libass scans fontsdir and matches by the TTF's internal name; for builtin
// and system fonts that name is well-known. Uploaded fonts fall back to the
// filename stem which is usually close enough; libass falls back to Arial if
// it can't find an exact match.
function assFontName(opts: CaptionOptions): string {
  if (opts.fontSource === 'builtin') return opts.builtinFont
  if (opts.fontSource === 'system')  return opts.systemFontFamily || 'Arial'
  return opts.uploadedFont?.name.replace(/\.[^.]+$/, '') ?? 'Arial'
}

export async function burnCaptions(
  videoFile: File,
  words: WordChunk[],
  opts: CaptionOptions,
  fontBlob: Blob | null,
  onProgress: (pct: number) => void,
  videoDims?: { width: number; height: number },
): Promise<File> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getSingleThreadFFmpeg()

  const ts = Date.now()
  const inputName  = `cap_in_${ts}${getExt(videoFile.name)}`
  const midName    = `cap_mid_${ts}.mkv`
  const assName    = `cap_ass_${ts}.ass`
  const outputName = `cap_out_${ts}.mp4`

  onProgress(5)
  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))

  try { await ffmpeg.createDir('/capfonts') } catch { /* already exists */ }

  if (fontBlob) {
    await ffmpeg.writeFile('/capfonts/userfont.ttf', new Uint8Array(await fontBlob.arrayBuffer()))
  } else {
    await ffmpeg.writeFile('/capfonts/builtin.ttf', await loadBuiltinFont(opts.builtinFont))
  }

  // Build the subtitle file. Each style maps to the correct event format
  // (word-by-word for mrbeast/tiktok, grouped lines for others) via buildASS —
  // no filter count limit, exact match to the preview.
  const assContent = buildASS(words, opts, assFontName(opts), videoDims?.width, videoDims?.height)
  await ffmpeg.writeFile(assName, new TextEncoder().encode(assContent))

  onProgress(10)

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
  let progressHandler = () => {}
  ffmpeg.on('progress', progressHandler)

  let data: Uint8Array<ArrayBuffer> | null = null
  let pass2Timer: ReturnType<typeof setInterval> | null = null

  try {
    // Pass 1 — transcode to MJPEG + AAC in Matroska (.mkv).
    // MJPEG is all-intra (every frame is an independent JPEG) so its decoder
    // carries no sequence state and structurally cannot emit AVERROR_INPUT_CHANGED
    // during Pass 2 — that's the "Error reinitialising filters" crash.
    //
    // qscale:v=18 keeps each JPEG ~3–5× smaller so the MJPEG file and the H.264
    // output can coexist in WASM's 2 GB MEMFS heap (prevents OOM crash).
    //
    // NO scale filter: any scale expression that alters frame geometry can produce
    // subtly inconsistent MJPEG headers, reintroducing AVERROR_INPUT_CHANGED.
    let exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'fps=30,format=yuvj420p',
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
      throw new Error(`Failed to normalise video (pass 1): ${logs.slice(-10).join(' | ')}`)
    }

    await ffmpeg.deleteFile(inputName).catch(() => {})
    logs.length = 0
    onProgress(45)

    // Pass 2 — burn captions via ASS subtitles filter.
    // The subtitles filter uses libass which reads the .ass file directly —
    // no per-word drawtext filter needed, so word count is unlimited and
    // word-by-word styles render exactly as the preview shows.
    let pass2Pct = 46
    pass2Timer = setInterval(() => {
      pass2Pct = Math.min(93, pass2Pct + 1)
      onProgress(pass2Pct)
    }, 3000)

    progressHandler = () => {}
    ffmpeg.on('progress', progressHandler)

    exitCode = await ffmpeg.exec([
      '-i', midName,
      '-vf', `format=yuv420p,subtitles=${assName}:fontsdir=/capfonts`,
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
      throw new Error(`ffmpeg exited with code ${exitCode}. ${logs.slice(-10).join(' | ')}`)
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
      ffmpeg.deleteFile(assName).catch(() => {}),
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
