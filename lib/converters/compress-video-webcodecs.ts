import { getCompressVideoFFmpeg } from './ffmpeg-client'

type HevcEncoderConfig = VideoEncoderConfig & {
  hevc?: { format?: 'annexb' | 'hevc' }
  latencyMode?: 'quality' | 'realtime'
}

const HEVC_CODECS = [
  'hev1.1.6.L93.B0',
  'hev1.1.6.L120.B0',
  'hev1.1.6.L120.90',
  'hvc1.1.6.L93.B0',
  'hvc1.1.6.L120.B0',
]

const HEVC_BPP: Record<string, number> = {
  small: 0.08,
  medium: 0.05,
  high: 0.035,
  maximum: 0.02,
}

export function canAttemptHevcWebCodecs(): boolean {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return false
  if (typeof HTMLVideoElement === 'undefined') return false
  return typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function'
}

export async function pickHevcEncoderConfig(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
): Promise<HevcEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null
  const extras: Array<Partial<HevcEncoderConfig>> = [
    { hardwareAcceleration: 'prefer-hardware', hevc: { format: 'annexb' } },
    { hevc: { format: 'annexb' } },
  ]
  for (const codec of HEVC_CODECS) {
    for (const extra of extras) {
      const cfg: HevcEncoderConfig = {
        codec,
        width,
        height,
        bitrate,
        framerate: fps,
        latencyMode: 'realtime',
        ...extra,
      }
      try {
        const support = await VideoEncoder.isConfigSupported(cfg)
        if (support.supported) return (support.config ?? cfg) as HevcEncoderConfig
      } catch {
        /* try next */
      }
    }
  }
  return null
}

function even(n: number): number {
  return n % 2 === 0 ? n : n - 1
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

export function hevcBitrateForLevel(
  width: number,
  height: number,
  fps: number,
  level: string,
  source?: { sourceBytes: number; durationSeconds: number },
): number {
  const bpp = HEVC_BPP[level] ?? HEVC_BPP.medium
  const qualityBps = Math.max(100_000, Math.round(width * height * fps * bpp))
  if (!source || !(source.durationSeconds > 0) || !(source.sourceBytes > 0)) return qualityBps
  const sourceBps = (source.sourceBytes * 8) / source.durationSeconds
  return Math.max(100_000, Math.min(qualityBps, Math.floor(sourceBps * 0.6)))
}

export type HevcHardwareOpts = {
  maxHeight?: number | null
  bitrate?: number | null
  level?: string
  stripAudio?: boolean
  onProgress?: (pct: number) => void
}

/**
 * Hardware HEVC via WebCodecs. Returns null when the browser cannot do it
 * so the caller can fall back to libx265.
 */
export async function tryCompressVideoHevcHardware(
  file: File,
  opts: HevcHardwareOpts = {},
): Promise<File | null> {
  if (!canAttemptHevcWebCodecs()) return null

  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  // Detached <video> often stops decoding after a few frames (see caption-webcodecs).
  video.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;opacity:0.01;pointer-events:none;z-index:-1'
  document.body.appendChild(video)
  video.src = url

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Could not read video for hardware HEVC'))
    })

    const srcW = video.videoWidth
    const srcH = video.videoHeight
    const duration = video.duration
    if (!srcW || !srcH || !Number.isFinite(duration) || duration <= 0) return null

    const maxHeight = opts.maxHeight ?? null
    const height = even(maxHeight && srcH > maxHeight ? maxHeight : srcH)
    const width = even(Math.round(srcW * (height / srcH)))
    if (width < 2 || height < 2) return null

    const fps = 30
    const bitrate = opts.bitrate && opts.bitrate > 0
      ? opts.bitrate
      : hevcBitrateForLevel(width, height, fps, opts.level ?? 'medium', {
          sourceBytes: file.size,
          durationSeconds: duration,
        })

    const encoderConfig = await pickHevcEncoderConfig(width, height, fps, bitrate)
    if (!encoderConfig) return null

    const needsScale = width !== even(srcW) || height !== even(srcH)
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    if (needsScale) {
      canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
    }

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

    opts.onProgress?.(12)
    const rVFC = video.requestVideoFrameCallback.bind(video)

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
          fail(new Error('Hardware HEVC stalled — no frames for 8s'))
        }
      }, 1000)
      const onEnded = () => finish()
      video.addEventListener('ended', onEnded, { once: true })
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        try {
          if (encodeError) throw encodeError
          lastFrameAt = Date.now()
          const t = meta.mediaTime
          let frame: VideoFrame
          if (ctx && canvas) {
            ctx.drawImage(video, 0, 0, width, height)
            frame = new VideoFrame(canvas, {
              timestamp: Math.round(t * 1_000_000),
              duration: Math.round((1 / fps) * 1_000_000),
            })
          } else {
            frame = new VideoFrame(video, {
              timestamp: Math.round(t * 1_000_000),
              duration: Math.round((1 / fps) * 1_000_000),
            })
          }
          encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 })
          frame.close()
          frameIndex += 1
          opts.onProgress?.(12 + Math.round(Math.min(1, t / duration) * 70))
          if (encoder.encodeQueueSize > 10) video.playbackRate = 1
          else video.playbackRate = 2
          if (video.ended || t >= duration - 0.05) {
            video.removeEventListener('ended', onEnded)
            finish()
            return
          }
          rVFC(onFrame)
        } catch (err) {
          video.removeEventListener('ended', onEnded)
          fail(err)
        }
      }
      video.playbackRate = 1
      video.play().then(() => rVFC(onFrame)).catch(fail)
    })

    video.pause()
    try {
      await encoder.flush()
    } finally {
      try { encoder.close() } catch { /* already closed */ }
    }
    if (encodeError) throw encodeError
    if (chunks.length === 0) return null

    opts.onProgress?.(84)
    const annexB = concatBytes(chunks)
    return await muxHevcAnnexB(file, annexB, opts.stripAudio === true, opts.onProgress)
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
  }
}

async function muxHevcAnnexB(
  videoFile: File,
  annexB: Uint8Array,
  stripAudio: boolean,
  onProgress?: (pct: number) => void,
): Promise<File | null> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getCompressVideoFFmpeg()
  const ts = Date.now()
  const rawName = `hevc_${ts}.h265`
  const srcName = `hevc_src_${ts}${videoFile.name.match(/\.[^.]+$/)?.[0] ?? '.mp4'}`
  const outName = `hevc_out_${ts}.mp4`

  await ffmpeg.writeFile(rawName, annexB)
  await ffmpeg.writeFile(srcName, await fetchFile(videoFile))
  onProgress?.(90)

  try {
    const audioArgs = stripAudio ? ['-an'] : ['-map', '1:a:0?', '-c:a', 'copy']
    let exitCode = await ffmpeg.exec([
      '-f', 'hevc',
      '-i', rawName,
      '-i', srcName,
      '-map', '0:v:0',
      ...audioArgs,
      '-c:v', 'copy',
      '-tag:v', 'hvc1',
      '-shortest',
      '-movflags', '+faststart',
      outName,
    ])
    if (exitCode !== 0 && !stripAudio) {
      await ffmpeg.deleteFile(outName).catch(() => {})
      exitCode = await ffmpeg.exec([
        '-f', 'hevc',
        '-i', rawName,
        '-i', srcName,
        '-map', '0:v:0',
        '-map', '1:a:0?',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-tag:v', 'hvc1',
        '-shortest',
        '-movflags', '+faststart',
        outName,
      ])
    }
    if (exitCode !== 0) {
      await ffmpeg.deleteFile(outName).catch(() => {})
      exitCode = await ffmpeg.exec([
        '-f', 'hevc',
        '-i', rawName,
        '-c:v', 'copy',
        '-an',
        '-tag:v', 'hvc1',
        '-movflags', '+faststart',
        outName,
      ])
    }
    if (exitCode !== 0) return null
    const data = await ffmpeg.readFile(outName) as Uint8Array<ArrayBuffer>
    if (!data?.length) return null
    onProgress?.(98)
    const baseName = videoFile.name.replace(/\.[^.]+$/, '')
    return new File([data], `${baseName}.mp4`, { type: 'video/mp4' })
  } finally {
    await Promise.all([
      ffmpeg.deleteFile(rawName).catch(() => {}),
      ffmpeg.deleteFile(srcName).catch(() => {}),
      ffmpeg.deleteFile(outName).catch(() => {}),
    ])
  }
}
