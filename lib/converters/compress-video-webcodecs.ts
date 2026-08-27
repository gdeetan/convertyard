import { getCompressVideoFFmpeg, withFfmpegLock } from './ffmpeg-client'
import { demuxMp4VideoFile } from './mp4-video-demux'
import { demuxMp4AudioFile } from './mp4-audio-demux'
import { createAvcMuxer, createHevcMuxer, type MuxerHandle } from './mp4-mux'

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scaleFrame(frame: VideoFrame, width: number, height: number): Promise<VideoFrame> {
  if (frame.displayWidth === width && frame.displayHeight === height) return frame
  if (typeof createImageBitmap !== 'function') {
    frame.close()
    throw new Error('createImageBitmap is not available')
  }
  const bitmap = await createImageBitmap(frame, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: 'high',
  })
  const scaled = new VideoFrame(bitmap, {
    timestamp: frame.timestamp,
    duration: frame.duration ?? undefined,
  })
  bitmap.close()
  frame.close()
  return scaled
}

/**
 * Decode MP4/MOV samples faster than realtime, then hardware-encode HEVC.
 * Streams chunks straight into mp4-muxer — no ffmpeg.wasm load.
 * Non-MP4 sources or non-AAC audio (when kept) return null so the caller
 * falls back to the playback path (which still uses the ffmpeg mux tail).
 */
async function tryEncodeViaVideoDecoder(
  file: File,
  opts: HevcHardwareOpts,
): Promise<File | null> {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') return null

  const demuxed = await demuxMp4VideoFile(file)
  if (!demuxed || demuxed.samples.length === 0) return null

  const srcW = even(demuxed.width)
  const srcH = even(demuxed.height)
  if (srcW < 2 || srcH < 2) return null
  const height = opts.maxHeight && srcH > opts.maxHeight ? even(opts.maxHeight) : srcH
  const width = height === srcH ? srcW : even(Math.round(srcW * (height / srcH)))
  if (width < 2 || height < 2) return null

  const durationSeconds = demuxed.samples.reduce((sum, s) => sum + s.durationUs, 0) / 1_000_000
  const fps = durationSeconds > 0
    ? Math.min(60, Math.max(1, Math.round(demuxed.samples.length / durationSeconds)))
    : 30
  const bitrate = opts.bitrate && opts.bitrate > 0
    ? opts.bitrate
    : hevcBitrateForLevel(width, height, fps, opts.level ?? 'medium', {
        sourceBytes: file.size,
        durationSeconds: durationSeconds || 1,
      })

  const encoderConfig = await pickHevcEncoderConfig(width, height, fps, bitrate, 'hevc')
  if (!encoderConfig) return null

  const decoderConfig: VideoDecoderConfig = {
    codec: demuxed.codecString,
    codedWidth: demuxed.width,
    codedHeight: demuxed.height,
    description: demuxed.description.slice(),
  }
  try {
    const support = await VideoDecoder.isConfigSupported(decoderConfig)
    if (!support.supported) return null
  } catch {
    return null
  }

  const stripAudio = opts.stripAudio === true
  const audio = stripAudio ? null : await demuxMp4AudioFile(file)
  if (!stripAudio && !audio) return null

  let muxer: MuxerHandle | null = null
  let muxError: Error | null = null
  let encodeError: Error | null = null
  let decodeError: Error | null = null
  const pending: VideoFrame[] = []

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        if (!muxer) {
          const desc = meta?.decoderConfig?.description
          if (!desc) throw new Error('encoder metadata missing decoderConfig.description')
          const descBytes = desc instanceof Uint8Array
            ? desc
            : ArrayBuffer.isView(desc)
              ? new Uint8Array(desc.buffer, desc.byteOffset, desc.byteLength)
              : new Uint8Array(desc as ArrayBuffer)
          muxer = createHevcMuxer({
            width,
            height,
            hasAudio: !!audio,
            videoDecoderConfig: {
              codec: meta.decoderConfig!.codec,
              description: descBytes,
            },
            audio: audio
              ? {
                  numberOfChannels: audio.numberOfChannels,
                  sampleRate: audio.sampleRate,
                  description: audio.description,
                }
              : undefined,
          })
        }
        muxer.addVideoChunk(chunk)
      } catch (err) {
        muxError = err instanceof Error ? err : new Error(String(err))
      }
    },
    error: (err) => { encodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  encoder.configure(encoderConfig)

  const decoder = new VideoDecoder({
    output: (frame) => { pending.push(frame) },
    error: (err) => { decodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  decoder.configure(decoderConfig)

  let frameIndex = 0
  const drain = async () => {
    while (pending.length > 0) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (encoder.encodeQueueSize > 8) await sleep(0)
      let frame = pending.shift()!
      frame = await scaleFrame(frame, width, height)
      encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 })
      frame.close()
      frameIndex += 1
      opts.onProgress?.(12 + Math.round(Math.min(1, frameIndex / demuxed.samples.length) * 70))
    }
  }

  try {
    opts.onProgress?.(12)
    for (const sample of demuxed.samples) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (decoder.decodeQueueSize > 8) {
        await drain()
        if (decoder.decodeQueueSize > 8) await sleep(0)
      }
      decoder.decode(new EncodedVideoChunk({
        type: sample.keyframe ? 'key' : 'delta',
        timestamp: sample.timestampUs,
        duration: sample.durationUs,
        data: sample.data,
      }))
      await drain()
    }
    await decoder.flush()
    await drain()
    await encoder.flush()
    if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
    if (!muxer) return null

    const finalMuxer = muxer as MuxerHandle
    if (audio) {
      for (const s of audio.samples) {
        finalMuxer.addAudioChunk(new EncodedAudioChunk({
          type: 'key',
          timestamp: s.timestampUs,
          duration: s.durationUs,
          data: s.data,
        }))
      }
    }

    opts.onProgress?.(90)
    const mp4Bytes = finalMuxer.finalize()
    opts.onProgress?.(98)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([mp4Bytes as BlobPart], `${baseName}.mp4`, { type: 'video/mp4' })
  } catch {
    return null
  } finally {
    for (const frame of pending) {
      try { frame.close() } catch { /* already closed */ }
    }
    pending.length = 0
    try { decoder.close() } catch { /* already closed */ }
    try { encoder.close() } catch { /* already closed */ }
  }
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
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') return null

  const demuxed = await demuxMp4VideoFile(file)
  if (!demuxed || demuxed.samples.length === 0) return null

  const srcW = even(demuxed.width)
  const srcH = even(demuxed.height)
  if (srcW < 2 || srcH < 2) return null
  const height = opts.maxHeight && srcH > opts.maxHeight ? even(opts.maxHeight) : srcH
  const width = height === srcH ? srcW : even(Math.round(srcW * (height / srcH)))
  if (width < 2 || height < 2) return null

  const durationSeconds = demuxed.samples.reduce((sum, s) => sum + s.durationUs, 0) / 1_000_000
  const fps = durationSeconds > 0
    ? Math.min(60, Math.max(1, Math.round(demuxed.samples.length / durationSeconds)))
    : 30
  const bitrate = opts.bitrate && opts.bitrate > 0
    ? opts.bitrate
    : avcBitrateForLevel(width, height, fps, opts.level ?? 'medium', {
        sourceBytes: file.size,
        durationSeconds: durationSeconds || 1,
      })

  // AVCC format so mp4-muxer can consume chunks directly (no annex-B stripping).
  const encoderConfig = await pickAvcEncoderConfig(width, height, fps, bitrate, 'avc')
  if (!encoderConfig) return null

  const decoderConfig: VideoDecoderConfig = {
    codec: demuxed.codecString,
    codedWidth: demuxed.width,
    codedHeight: demuxed.height,
    description: demuxed.description.slice(),
  }
  try {
    const support = await VideoDecoder.isConfigSupported(decoderConfig)
    if (!support.supported) return null
  } catch {
    return null
  }

  const stripAudio = opts.stripAudio === true
  const audio = stripAudio ? null : await demuxMp4AudioFile(file)
  // If the user wants audio but the source has non-AAC (or no) audio, bail so
  // the caller falls back to the playback + ffmpeg-mux path (which handles it).
  if (!stripAudio && !audio) return null

  let muxer: MuxerHandle | null = null
  let muxError: Error | null = null
  let encodeError: Error | null = null
  let decodeError: Error | null = null
  const pending: VideoFrame[] = []

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        if (!muxer) {
          const desc = meta?.decoderConfig?.description
          if (!desc) throw new Error('encoder metadata missing decoderConfig.description')
          const descBytes = desc instanceof Uint8Array
            ? desc
            : ArrayBuffer.isView(desc)
              ? new Uint8Array(desc.buffer, desc.byteOffset, desc.byteLength)
              : new Uint8Array(desc as ArrayBuffer)
          muxer = createAvcMuxer({
            width,
            height,
            hasAudio: !!audio,
            videoDecoderConfig: {
              codec: meta.decoderConfig!.codec,
              description: descBytes,
            },
            audio: audio
              ? {
                  numberOfChannels: audio.numberOfChannels,
                  sampleRate: audio.sampleRate,
                  description: audio.description,
                }
              : undefined,
          })
        }
        muxer.addVideoChunk(chunk)
      } catch (err) {
        muxError = err instanceof Error ? err : new Error(String(err))
      }
    },
    error: (err) => { encodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  encoder.configure(encoderConfig)

  const decoder = new VideoDecoder({
    output: (frame) => { pending.push(frame) },
    error: (err) => { decodeError = err instanceof Error ? err : new Error(String(err)) },
  })
  decoder.configure(decoderConfig)

  let frameIndex = 0
  const drain = async () => {
    while (pending.length > 0) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (encoder.encodeQueueSize > 8) await sleep(0)
      let frame = pending.shift()!
      frame = await scaleFrame(frame, width, height)
      encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 })
      frame.close()
      frameIndex += 1
      opts.onProgress?.(12 + Math.round(Math.min(1, frameIndex / demuxed.samples.length) * 70))
    }
  }

  try {
    opts.onProgress?.(12)
    for (const sample of demuxed.samples) {
      if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
      while (decoder.decodeQueueSize > 8) {
        await drain()
        if (decoder.decodeQueueSize > 8) await sleep(0)
      }
      decoder.decode(new EncodedVideoChunk({
        type: sample.keyframe ? 'key' : 'delta',
        timestamp: sample.timestampUs,
        duration: sample.durationUs,
        data: sample.data,
      }))
      await drain()
    }
    await decoder.flush()
    await drain()
    await encoder.flush()
    if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
    const finalMuxer = muxer as MuxerHandle | null
    if (!finalMuxer) return null

    // Audio passthrough: AAC frames are all keyframes.
    if (audio) {
      for (const s of audio.samples) {
        finalMuxer.addAudioChunk(new EncodedAudioChunk({
          type: 'key',
          timestamp: s.timestampUs,
          duration: s.durationUs,
          data: s.data,
        }))
      }
    }

    opts.onProgress?.(90)
    const mp4Bytes = finalMuxer.finalize()
    opts.onProgress?.(98)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([mp4Bytes as BlobPart], `${baseName}.mp4`, { type: 'video/mp4' })
  } catch {
    return null
  } finally {
    for (const frame of pending) {
      try { frame.close() } catch { /* already closed */ }
    }
    pending.length = 0
    try { decoder.close() } catch { /* already closed */ }
    try { encoder.close() } catch { /* already closed */ }
  }
}

/**
 * Hardware H.264 via WebCodecs. Returns null when the browser cannot do it
 * so the caller can fall back to libx264 in ffmpeg.wasm.
 */
export async function tryCompressVideoAvcHardware(
  file: File,
  opts: AvcHardwareOpts = {},
): Promise<File | null> {
  if (!canAttemptAvcWebCodecs()) {
    console.info('[compress-video] AVC WebCodecs unavailable — falling back to wasm')
    return null
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
