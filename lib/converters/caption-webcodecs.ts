import type { WordChunk, CaptionOptions } from './caption-types'
import { BUILTIN_FONTS } from './caption-fonts'
import { drawCaptionOverlay } from './caption-draw'
import { getFFmpeg } from './ffmpeg-client'
import { throwIfAborted } from './audio-decode'

export function canUseWebCodecs(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
}

async function loadPreviewFont(opts: CaptionOptions): Promise<string> {
  const fontName =
    opts.fontSource === 'builtin' ? opts.builtinFont :
    opts.fontSource === 'system' ? (opts.systemFontFamily || 'Arial') :
    opts.uploadedFont?.name.replace(/\.[^.]+$/, '') ?? 'Arial'

  let url: string | null = null
  let revoke: string | null = null
  if (opts.fontSource === 'builtin') {
    url = BUILTIN_FONTS.find((f) => f.name === opts.builtinFont)?.file ?? null
  } else if (opts.fontSource === 'upload' && opts.uploadedFont) {
    url = URL.createObjectURL(opts.uploadedFont)
    revoke = url
  } else if (opts.fontSource === 'system' && opts.systemFontBlob) {
    url = URL.createObjectURL(opts.systemFontBlob)
    revoke = url
  }
  if (url) {
    try {
      const face = new FontFace(fontName, `url(${url})`)
      const loaded = await face.load()
      document.fonts.add(loaded)
    } finally {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }
  return fontName
}

async function pickAvcConfig(width: number, height: number, fps: number): Promise<VideoEncoderConfig | null> {
  const bitrate = Math.max(1_500_000, Math.round(width * height * 2.5))
  const candidates: VideoEncoderConfig[] = [
    { codec: 'avc1.4D401F', width, height, bitrate, framerate: fps, avc: { format: 'annexb' }, hardwareAcceleration: 'prefer-hardware' },
    { codec: 'avc1.42001E', width, height, bitrate, framerate: fps, avc: { format: 'annexb' }, hardwareAcceleration: 'prefer-hardware' },
    { codec: 'avc1.4D401F', width, height, bitrate, framerate: fps, avc: { format: 'annexb' } },
  ]
  for (const cfg of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported(cfg)
      if (support.supported) return (support.config ?? cfg) as VideoEncoderConfig
    } catch { /* try next */ }
  }
  return null
}

function even(n: number): number {
  return n % 2 === 0 ? n : n - 1
}

/**
 * Hardware-encode captioned frames, then mux original audio with ffmpeg copy.
 * Throws if WebCodecs is missing or the encoder rejects the config.
 */
export async function burnCaptionsWebCodecs(
  videoFile: File,
  words: WordChunk[],
  opts: CaptionOptions,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<File> {
  if (!canUseWebCodecs()) throw new Error('WebCodecs is not available in this browser')
  throwIfAborted(signal)

  const fontName = await loadPreviewFont(opts)
  throwIfAborted(signal)

  const url = URL.createObjectURL(videoFile)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  // Detached videos often stop decoding after a few frames, which freezes
  // requestVideoFrameCallback mid-encode (progress stuck around 50–60%).
  video.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;opacity:0.01;pointer-events:none;z-index:-1'
  document.body.appendChild(video)
  video.src = url

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Could not read video for hardware encode'))
    })
    const width = even(video.videoWidth || 1280)
    const height = even(video.videoHeight || 720)
    const duration = video.duration
    if (!width || !height || !Number.isFinite(duration) || duration <= 0) {
      throw new Error('Video has no usable duration or size')
    }

    const fps = 30
    const encoderConfig = await pickAvcConfig(width, height, fps)
    if (!encoderConfig) throw new Error('No hardware H.264 encoder available')

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Could not create encode canvas')

    const chunks: Uint8Array[] = []
    let encodeError: Error | null = null
    const encoder = new VideoEncoder({
      output: (chunk) => {
        const buf = new Uint8Array(chunk.byteLength)
        chunk.copyTo(buf)
        chunks.push(buf)
      },
      error: (err) => { encodeError = err instanceof Error ? err : new Error(String(err)) },
    })
    encoder.configure(encoderConfig)

    onProgress(8)
    const rVFC = (
      video as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number
      }
    ).requestVideoFrameCallback
    if (typeof rVFC !== 'function') {
      throw new Error('requestVideoFrameCallback is not available')
    }

    let frameIndex = 0
    let lastFrameAt = Date.now()
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        clearInterval(watchdog)
        video.pause()
        resolve()
      }
      const fail = (err: unknown) => {
        if (settled) return
        settled = true
        clearInterval(watchdog)
        video.pause()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
      const watchdog = window.setInterval(() => {
        if (Date.now() - lastFrameAt > 8000) {
          fail(new Error('Hardware encode stalled — no frames for 8s'))
        }
      }, 1000)
      const onEnded = () => finish()
      video.addEventListener('ended', onEnded, { once: true })
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        try {
          throwIfAborted(signal)
          if (encodeError) throw encodeError
          lastFrameAt = Date.now()
          const t = meta.mediaTime
          ctx.drawImage(video, 0, 0, width, height)
          drawCaptionOverlay(ctx, width, height, words, opts, t, fontName)
          const frame = new VideoFrame(canvas, {
            timestamp: Math.round(t * 1_000_000),
            duration: Math.round((1 / fps) * 1_000_000),
          })
          encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 })
          frame.close()
          frameIndex += 1
          onProgress(8 + Math.round(Math.min(1, t / duration) * 70))
          if (encoder.encodeQueueSize > 10) video.playbackRate = 1
          else video.playbackRate = 2
          if (video.ended || t >= duration - 0.05) {
            video.removeEventListener('ended', onEnded)
            finish()
            return
          }
          rVFC.call(video, onFrame)
        } catch (err) {
          video.removeEventListener('ended', onEnded)
          fail(err)
        }
      }
      video.playbackRate = 2
      video.play().then(() => rVFC.call(video, onFrame)).catch(fail)
    })

    video.pause()
    try {
      await encoder.flush()
    } finally {
      try { encoder.close() } catch { /* already closed on error */ }
    }
    if (encodeError) throw encodeError
    if (chunks.length === 0) throw new Error('Hardware encoder produced no frames')

    onProgress(82)
    const annexB = concatBytes(chunks)
    return muxWithOriginalAudio(videoFile, annexB, onProgress, signal)
  } finally {
    URL.revokeObjectURL(url)
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
  }
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

async function muxWithOriginalAudio(
  videoFile: File,
  annexB: Uint8Array,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<File> {
  throwIfAborted(signal)
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFFmpeg()
  const ts = Date.now()
  const rawName = `wc_${ts}.h264`
  const srcName = `wc_src_${ts}${videoFile.name.match(/\.[^.]+$/)?.[0] ?? '.mp4'}`
  const outName = `wc_out_${ts}.mp4`

  await ffmpeg.writeFile(rawName, annexB)
  await ffmpeg.writeFile(srcName, await fetchFile(videoFile))
  onProgress(90)

  const logs: string[] = []
  const logHandler = ({ message }: { message: string }) => { logs.push(message) }
  ffmpeg.on('log', logHandler)
  try {
    let exitCode = await ffmpeg.exec([
      '-f', 'h264',
      '-i', rawName,
      '-i', srcName,
      '-map', '0:v:0',
      '-map', '1:a:0?',
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-shortest',
      '-movflags', '+faststart',
      outName,
    ])
    throwIfAborted(signal)
    if (exitCode !== 0) {
      await ffmpeg.deleteFile(outName).catch(() => {})
      exitCode = await ffmpeg.exec([
        '-f', 'h264',
        '-i', rawName,
        '-c:v', 'copy',
        '-an',
        '-movflags', '+faststart',
        outName,
      ])
    }
    if (exitCode !== 0) {
      throw new Error(`Could not mux hardware-encoded video. ${logs.slice(-8).join(' | ')}`)
    }
    const data = await ffmpeg.readFile(outName) as Uint8Array<ArrayBuffer>
    if (!data?.length) throw new Error('Hardware encode mux produced an empty file')
    onProgress(100)
    return new File(
      [data],
      `captioned-${videoFile.name.replace(/\.[^.]+$/, '')}.mp4`,
      { type: 'video/mp4' },
    )
  } finally {
    ffmpeg.off('log', logHandler)
    await Promise.all([
      ffmpeg.deleteFile(rawName).catch(() => {}),
      ffmpeg.deleteFile(srcName).catch(() => {}),
      ffmpeg.deleteFile(outName).catch(() => {}),
    ])
  }
}
