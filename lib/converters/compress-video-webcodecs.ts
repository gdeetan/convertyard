import { getCompressVideoFFmpeg, withFfmpegLock } from './ffmpeg-client'

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.maxTouchPoints > 1 || /Android|iPhone|iPad/i.test(navigator.userAgent)
}

type HevcEncoderConfig = VideoEncoderConfig & {
  hevc?: { format?: 'annexb' | 'hevc' }
  latencyMode?: 'quality' | 'realtime'
}

type AvcEncoderConfig = VideoEncoderConfig & {
  avc?: { format?: 'annexb' | 'avc' }
  latencyMode?: 'quality' | 'realtime'
}

const HEVC_CODECS = [
  'hev1.1.6.L93.B0',
  'hev1.1.6.L120.B0',
  'hev1.1.6.L120.90',
  'hvc1.1.6.L93.B0',
  'hvc1.1.6.L120.B0',
]

const MOBILE_FAST_PATH_MAX_BYTES = 120 * 1024 * 1024

// H.264 profile.level strings, ordered widest-compat → highest.
// Baseline 3.1 → Main 3.1 → High 4.0 → High 4.1. Encoder picks the first
// its hardware backend accepts for the given resolution/fps.
const AVC_CODECS = [
  'avc1.42E01F',
  'avc1.4D401F',
  'avc1.640028',
  'avc1.640029',
  'avc1.42E028',
]

const HEVC_BPP: Record<string, number> = {
  small: 0.08,
  medium: 0.05,
  high: 0.035,
  maximum: 0.02,
}

// H.264 needs ~35–50% more bits than HEVC for perceptually equal quality.
const AVC_BPP: Record<string, number> = {
  small: 0.12,
  medium: 0.075,
  high: 0.05,
  maximum: 0.028,
}

export function canAttemptHevcWebCodecs(): boolean {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return false
  if (typeof VideoDecoder !== 'undefined') return true
  if (typeof HTMLVideoElement === 'undefined') return false
  return typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function'
}

export function canAttemptAvcWebCodecs(): boolean {
  return canAttemptHevcWebCodecs()
}

export async function pickAvcEncoderConfig(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
  format: 'annexb' | 'avc' = 'annexb',
): Promise<AvcEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null
  const extras: Array<Partial<AvcEncoderConfig>> = [
    { hardwareAcceleration: 'prefer-hardware', avc: { format } },
    { avc: { format } },
  ]
  for (const codec of AVC_CODECS) {
    for (const extra of extras) {
      const cfg: AvcEncoderConfig = {
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
        if (support.supported) return (support.config ?? cfg) as AvcEncoderConfig
      } catch {
        /* try next */
      }
    }
  }
  return null
}

export function avcBitrateForLevel(
  width: number,
  height: number,
  fps: number,
  level: string,
  source?: { sourceBytes: number; durationSeconds: number },
): number {
  const bpp = AVC_BPP[level] ?? AVC_BPP.medium
  const qualityBps = Math.max(100_000, Math.round(width * height * fps * bpp))
  if (!source || !(source.durationSeconds > 0) || !(source.sourceBytes > 0)) return qualityBps
  const sourceBps = (source.sourceBytes * 8) / source.durationSeconds
  return Math.max(100_000, Math.min(qualityBps, Math.floor(sourceBps * 0.7)))
}

export type AvcHardwareOpts = {
  maxHeight?: number | null
  bitrate?: number | null
  level?: string
  stripAudio?: boolean
  onProgress?: (pct: number) => void
}

export async function pickHevcEncoderConfig(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
  format: 'annexb' | 'hevc' = 'annexb',
): Promise<HevcEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null
  const extras: Array<Partial<HevcEncoderConfig>> = [
    { hardwareAcceleration: 'prefer-hardware', hevc: { format } },
    { hevc: { format } },
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

// ── Web Worker dispatch for the WebCodecs fast paths ─────────────────────────
// The decode-encode loop is CPU-heavy on the main thread even though the
// hardware does the actual work — enough to block interaction. We offload it
// to compress-video-worker.ts and keep only the fallback playback path here.

type WorkerRequestType = 'compress-avc' | 'compress-hevc'

type PendingEntry = {
  resolve: (file: File | null) => void
  onProgress: (pct: number) => void
}

let workerInstance: Worker | null = null
let requestSeq = 0
const pending = new Map<number, PendingEntry>()

function getWorker(): Worker {
  if (!workerInstance) {
    // new URL(...) must be inline — the bundler requires it directly inside
    // new Worker() to detect the pattern and emit the worker chunk.
    workerInstance = new Worker(
      new URL('./compress-video-worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerInstance.addEventListener('message', (e: MessageEvent) => {
      const { id, type } = e.data ?? {}
      // Diagnostic logs from the worker have no id — surface in the main console.
      if (type === 'log') { console.info('[compress-video]', e.data.message); return }
      const handler = pending.get(id)
      if (!handler) return
      if (type === 'progress') handler.onProgress(e.data.pct)
      else if (type === 'result') { pending.delete(id); handler.resolve(e.data.file ?? null) }
      else if (type === 'error') {
        console.info('[compress-video] worker posted error:', e.data.message)
        pending.delete(id)
        handler.resolve(null)
      }
    })
    workerInstance.addEventListener('error', (e: ErrorEvent) => {
      console.info('[compress-video] worker error event:', e.message, e.filename, e.lineno)
    })
    workerInstance.addEventListener('messageerror', (e: MessageEvent) => {
      console.info('[compress-video] worker messageerror (structured clone failure):', e.data)
    })
  }
  return workerInstance
}

async function dispatchToWorker(
  type: WorkerRequestType,
  file: File,
  opts: AvcHardwareOpts | HevcHardwareOpts,
): Promise<File | null> {
  console.info(`[compress-video] dispatch ${type} → worker (${file.name}, ${file.size} bytes)`)
  return new Promise((resolve) => {
    const id = ++requestSeq
    pending.set(id, {
      resolve,
      onProgress: (pct: number) => opts.onProgress?.(pct),
    })
    // Strip the onProgress function before postMessage — functions aren't
    // structured-cloneable. The pending map keeps the live callback around.
    const { onProgress: _drop, ...postOpts } =
      opts as { onProgress?: unknown; [k: string]: unknown }
    void _drop
    try {
      getWorker().postMessage({ id, type, file, opts: postOpts })
    } catch (err) {
      console.info('[compress-video] worker postMessage threw:', err instanceof Error ? err.message : String(err))
      pending.delete(id)
      resolve(null)
    }
  })
}

/**
 * Decode MP4/MOV samples faster than realtime, then hardware-encode HEVC.
 * Streams chunks straight into mp4-muxer — no ffmpeg.wasm load.
 * Non-MP4 sources or non-AAC audio (when kept) return null so the caller
 * falls back to the playback path (which still uses the ffmpeg mux tail).
 *
 * The heavy work runs in compress-video-worker.ts. This thin wrapper only
 * exists to route through it and stay on-brand with the file's public shape.
 */
async function tryEncodeViaVideoDecoder(
  file: File,
  opts: HevcHardwareOpts,
): Promise<File | null> {
  if (typeof Worker === 'undefined') return null
  // Mobile can use the one-read MP4 demux fast path for modest files. Keep a
  // cap so very large inputs still fall back to the lazier playback path.
  if (isMobileBrowser() && file.size > MOBILE_FAST_PATH_MAX_BYTES) return null
  return dispatchToWorker('compress-hevc', file, opts)
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

  // The fast path posts progress up to ~90%, then may bail; the playback path
  // then restarts at ~12%. Clamp monotonically so the UI bar never regresses.
  const originalOnProgress = opts.onProgress
  let lastPct = 0
  opts = {
    ...opts,
    onProgress: (pct: number) => {
      if (pct < lastPct) return
      lastPct = pct
      originalOnProgress?.(pct)
    },
  }

  try {
    const decoded = await tryEncodeViaVideoDecoder(file, opts)
    if (decoded) return decoded
  } catch {
    /* fall through to the playback path */
  }

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
          // Desktop HW encoders sustain 4x realtime on 1080p; Safari caps around 4x.
          // Throttle down when the encoder queue backs up so we don't drop frames.
          if (encoder.encodeQueueSize > 10) video.playbackRate = 1
          else if (encoder.encodeQueueSize > 4) video.playbackRate = 2
          else video.playbackRate = 4
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

/**
 * Decode MP4/MOV samples faster than realtime, then hardware-encode H.264.
 * Streams chunks straight into mp4-muxer — no ffmpeg.wasm load.
 * Non-MP4 sources or non-AAC audio (when kept) return null so the caller
 * falls back to the playback path (which still uses the ffmpeg mux tail).
 */
async function tryEncodeAvcViaVideoDecoder(
  file: File,
  opts: AvcHardwareOpts,
): Promise<File | null> {
  if (typeof Worker === 'undefined') return null
  if (isMobileBrowser() && file.size > MOBILE_FAST_PATH_MAX_BYTES) return null
  return dispatchToWorker('compress-avc', file, opts)
}

/**
 * Hardware H.264 via WebCodecs. Returns null when the browser cannot do it
 * so the caller can fall back to libx264 in ffmpeg.wasm.
 */
// See tryCompressVideoHevcHardware for the monotonic-progress rationale.
export async function tryCompressVideoAvcHardware(
  file: File,
  opts: AvcHardwareOpts = {},
): Promise<File | null> {
  if (!canAttemptAvcWebCodecs()) {
    console.info('[compress-video] AVC WebCodecs unavailable — falling back to wasm')
    return null
  }

  const originalOnProgress = opts.onProgress
  let lastPct = 0
  opts = {
    ...opts,
    onProgress: (pct: number) => {
      if (pct < lastPct) return
      lastPct = pct
      originalOnProgress?.(pct)
    },
  }

  try {
    const decoded = await tryEncodeAvcViaVideoDecoder(file, opts)
    if (decoded) {
      console.info('[compress-video] AVC via VideoDecoder fast path')
      return decoded
    }
    console.info('[compress-video] AVC VideoDecoder path returned null — trying playback path')
  } catch (err) {
    console.warn('[compress-video] AVC VideoDecoder path threw — trying playback path', err)
  }

  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;opacity:0.01;pointer-events:none;z-index:-1'
  document.body.appendChild(video)
  video.src = url

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Could not read video for hardware AVC'))
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
      : avcBitrateForLevel(width, height, fps, opts.level ?? 'medium', {
          sourceBytes: file.size,
          durationSeconds: duration,
        })

    const encoderConfig = await pickAvcEncoderConfig(width, height, fps, bitrate)
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
          fail(new Error('Hardware AVC stalled — no frames for 8s'))
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
          // Desktop HW encoders sustain 4x realtime on 1080p; Safari caps around 4x.
          // Throttle down when the encoder queue backs up so we don't drop frames.
          if (encoder.encodeQueueSize > 10) video.playbackRate = 1
          else if (encoder.encodeQueueSize > 4) video.playbackRate = 2
          else video.playbackRate = 4
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
    console.info('[compress-video] AVC via playback path succeeded')
    return await muxAvcAnnexB(file, annexB, opts.stripAudio === true, opts.onProgress)
  } catch (err) {
    console.warn('[compress-video] AVC playback path failed — falling back to wasm', err)
    return null
  } finally {
    URL.revokeObjectURL(url)
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
  }
}

async function muxAvcAnnexB(
  videoFile: File,
  annexB: Uint8Array,
  stripAudio: boolean,
  onProgress?: (pct: number) => void,
): Promise<File | null> {
  return withFfmpegLock(async () => {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getCompressVideoFFmpeg()
  const ts = Date.now()
  const rawName = `avc_${ts}.h264`
  const srcName = `avc_src_${ts}${videoFile.name.match(/\.[^.]+$/)?.[0] ?? '.mp4'}`
  const outName = `avc_out_${ts}.mp4`

  await ffmpeg.writeFile(rawName, annexB)
  await ffmpeg.writeFile(srcName, await fetchFile(videoFile))
  onProgress?.(90)

  try {
    const audioArgs = stripAudio ? ['-an'] : ['-map', '1:a:0?', '-c:a', 'copy']
    let exitCode = await ffmpeg.exec([
      '-f', 'h264',
      '-i', rawName,
      '-i', srcName,
      '-map', '0:v:0',
      ...audioArgs,
      '-c:v', 'copy',
      '-shortest',
      '-movflags', '+faststart',
      outName,
    ])
    if (exitCode !== 0 && !stripAudio) {
      await ffmpeg.deleteFile(outName).catch(() => {})
      exitCode = await ffmpeg.exec([
        '-f', 'h264',
        '-i', rawName,
        '-i', srcName,
        '-map', '0:v:0',
        '-map', '1:a:0?',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
        outName,
      ])
    }
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
  })
}

async function muxHevcAnnexB(
  videoFile: File,
  annexB: Uint8Array,
  stripAudio: boolean,
  onProgress?: (pct: number) => void,
): Promise<File | null> {
  return withFfmpegLock(async () => {
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
  })
}
