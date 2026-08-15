import { getSingleThreadFFmpeg } from './ffmpeg-client'
import type { WordChunk, CaptionOptions } from './caption-types'
import { builtinAssFontName, loadBuiltinFont } from './caption-fonts'
import { buildASS } from './caption-ass-builder'
import { probeVideoDimensions, probeVideoDuration } from './media-probe'
import { throwIfAborted } from './audio-decode'

// ffmpeg emits stats lines like "frame= 123 fps=45 ... time=00:01:23.45 bitrate=..."
// Parse the time= field into seconds so real encode progress can drive the UI.
function parseFFmpegTimeSeconds(line: string): number | null {
  const m = line.match(/time=(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/)
  if (!m) return null
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

// Derive the font family name to embed in the ASS [V4+ Styles] header.
// libass scans fontsdir and matches by the TTF's internal name; for builtin
// and system fonts that name is well-known. Uploaded fonts fall back to the
// filename stem which is usually close enough; libass falls back to Arial if
// it can't find an exact match.
function assFontName(opts: CaptionOptions): string {
  if (opts.fontSource === 'builtin') return builtinAssFontName(opts.builtinFont)
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
  signal?: AbortSignal,
): Promise<File> {
  throwIfAborted(signal)
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getSingleThreadFFmpeg()
  throwIfAborted(signal)

  const ts = Date.now()
  const inputName  = `cap_in_${ts}${getExt(videoFile.name)}`
  const midName    = `cap_mid_${ts}.mkv`
  const assName    = `cap_ass_${ts}.ass`
  const outputName = `cap_out_${ts}.mp4`

  onProgress(2)
  // Duration drives real progress. If probe fails (0), fall back to a slow
  // timer so the bar still moves — better than freezing at a fake number.
  const duration = await probeVideoDuration(videoFile)
  const probed = await probeVideoDimensions(videoFile)
  const frameW = probed?.width || videoDims?.width || 1920
  const frameH = probed?.height || videoDims?.height || 1080
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
  const assContent = buildASS(words, opts, assFontName(opts), frameW, frameH)
  await ffmpeg.writeFile(assName, new TextEncoder().encode(assContent))

  onProgress(10)

  const logs: string[] = []
  // Progress state: a phase maps the encode's time= (in seconds) into a UI
  // percentage window. Two-pass mode swaps phases between passes.
  let phaseStart = 10
  let phaseEnd = 95
  let lastPct = 10
  const logHandler = ({ message }: { message: string }) => {
    logs.push(message)
    if (duration > 0) {
      const t = parseFFmpegTimeSeconds(message)
      if (t !== null) {
        const frac = Math.max(0, Math.min(1, t / duration))
        const pct = Math.round(phaseStart + (phaseEnd - phaseStart) * frac)
        if (pct > lastPct) {
          lastPct = pct
          onProgress(pct)
        }
      }
    }
  }
  ffmpeg.on('log', logHandler)

  const setPhase = (start: number, end: number) => {
    phaseStart = start
    phaseEnd = end
    lastPct = start
    onProgress(start)
  }

  let data: Uint8Array<ArrayBuffer> | null = null
  // Fallback ticker for when duration probe failed — slow drip so the bar
  // still moves, capped just below the phase end.
  let timer: ReturnType<typeof setInterval> | null = null
  const startFallbackTimer = () => {
    if (duration > 0 || timer) return
    let pct = lastPct
    timer = setInterval(() => {
      pct = Math.min(phaseEnd - 3, pct + 1)
      if (pct > lastPct) { lastPct = pct; onProgress(pct) }
    }, 2500)
  }
  const stopFallbackTimer = () => {
    if (timer) { clearInterval(timer); timer = null }
  }

  try {
    // Fast path: single-pass encode. Works for most well-formed inputs (H.264 MP4,
    // constant-framerate MOV, etc.) and is ~2× faster than the 2-pass approach.
    // Falls back to 2-pass if the subtitle filter emits AVERROR_INPUT_CHANGED,
    // which happens with VFR or variable-parameter streams where the MJPEG
    // intermediate is required as a stable, all-intra normalisation step.
    // No fps= filter here: the subtitles filter is timestamp-driven, so forcing
    // 30fps only costs a frame-conversion pass and silently drops frames for
    // 60fps sources (quality loss). The 2-pass fallback still needs fps= because
    // MJPEG is CFR-only.
    setPhase(10, 95)
    startFallbackTimer()

    let exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-vf', `format=yuv420p,subtitles=${assName}:fontsdir=/capfonts:original_size=${frameW}x${frameH}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputName,
    ])

    stopFallbackTimer()
    throwIfAborted(signal)

    if (exitCode !== 0) {
      // Single-pass failed; wipe partial output and fall back to 2-pass.
      await ffmpeg.deleteFile(outputName).catch(() => {})
      logs.length = 0

      // Pass 1 — transcode to MJPEG + AAC in Matroska (.mkv).
      // MJPEG is all-intra so its decoder carries no sequence state and
      // cannot emit AVERROR_INPUT_CHANGED during Pass 2.
      // qscale:v=18 keeps each JPEG ~3–5× smaller so both MJPEG and the
      // H.264 output can coexist within WASM's 2 GB MEMFS heap.
      setPhase(10, 45)
      startFallbackTimer()

      exitCode = await ffmpeg.exec([
        '-i', inputName,
        '-vf', 'fps=30,format=yuvj420p',
        '-c:v', 'mjpeg',
        '-qscale:v', '18',
        '-c:a', 'aac',
        '-b:a', '128k',
        midName,
      ])

      stopFallbackTimer()

      if (exitCode !== 0) {
        throw new Error(`Failed to normalise video (pass 1): ${logs.slice(-10).join(' | ')}`)
      }

      await ffmpeg.deleteFile(inputName).catch(() => {})
      logs.length = 0

      // Pass 2 — burn captions via ASS subtitles filter.
      setPhase(45, 95)
      startFallbackTimer()

      exitCode = await ffmpeg.exec([
        '-i', midName,
        '-vf', `format=yuv420p,subtitles=${assName}:fontsdir=/capfonts:original_size=${frameW}x${frameH}`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        outputName,
      ])

      stopFallbackTimer()

      if (exitCode !== 0) {
        throw new Error(`ffmpeg exited with code ${exitCode}. ${logs.slice(-10).join(' | ')}`)
      }
    }

    onProgress(98)
    data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
    if (!data || data.length === 0) {
      throw new Error('ffmpeg produced an empty output file')
    }
  } finally {
    stopFallbackTimer()
    ffmpeg.off('log', logHandler)
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
