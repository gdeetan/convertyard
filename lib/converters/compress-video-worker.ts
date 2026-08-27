// Web Worker: runs the WebCodecs fast paths for AVC/HEVC compression off the
// main thread. Main thread posts { id, type: 'compress-avc' | 'compress-hevc',
// file, opts } and receives { id, type: 'progress', pct } during the run and
// finally { id, type: 'result', file } or { id, type: 'error', message }.
//
// The playback-path fallback stays on the main thread and lives in
// compress-video-webcodecs.ts — this worker is fast-path only.

import { demuxMp4VideoFile } from './mp4-video-demux'
import { demuxMp4AudioFile } from './mp4-audio-demux'
import { createAvcMuxer, createHevcMuxer, type MuxerHandle } from './mp4-mux'
import {
  avcBitrateForLevel,
  hevcBitrateForLevel,
  pickAvcEncoderConfig,
  pickHevcEncoderConfig,
  type AvcHardwareOpts,
  type HevcHardwareOpts,
} from './compress-video-webcodecs'

function even(n: number): number {
  return n % 2 === 0 ? n : n - 1
}

// Posts a diagnostic string back to main so it shows up in the browser's
// regular console (worker console output is hidden in DevTools by default).
function logBail(reason: string): void {
  try {
    (self as unknown as { postMessage: (m: unknown) => void }).postMessage({
      type: 'log',
      message: `fast-path bail: ${reason}`,
    })
  } catch { /* worker without postMessage — impossible in practice */ }
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

async function encodeHevcInWorker(
  file: File,
  opts: HevcHardwareOpts,
  onProgress: (pct: number) => void,
): Promise<File | null> {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') { logBail('hevc: WebCodecs unavailable'); return null }

  const demuxed = await demuxMp4VideoFile(file)
  if (!demuxed || demuxed.samples.length === 0) { logBail('hevc: mp4 video demux failed or no samples'); return null }

  const srcW = even(demuxed.width)
  const srcH = even(demuxed.height)
  if (srcW < 2 || srcH < 2) { logBail(`hevc: bad source dimensions ${srcW}x${srcH}`); return null }
  const height = opts.maxHeight && srcH > opts.maxHeight ? even(opts.maxHeight) : srcH
  const width = height === srcH ? srcW : even(Math.round(srcW * (height / srcH)))
  if (width < 2 || height < 2) { logBail(`hevc: bad target dimensions ${width}x${height}`); return null }

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
  if (!encoderConfig) { logBail(`hevc: no supported HEVC encoder config for ${width}x${height}@${fps} format=hevc`); return null }

  const decoderConfig: VideoDecoderConfig = {
    codec: demuxed.codecString,
    codedWidth: demuxed.width,
    codedHeight: demuxed.height,
    description: demuxed.description.slice(),
  }
  try {
    const support = await VideoDecoder.isConfigSupported(decoderConfig)
    if (!support.supported) { logBail(`hevc: VideoDecoder config unsupported for ${demuxed.codecString}`); return null }
  } catch (err) {
    logBail(`hevc: VideoDecoder.isConfigSupported threw: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }

  const stripAudio = opts.stripAudio === true
  const audio = stripAudio ? null : await demuxMp4AudioFile(file)
  if (!stripAudio && !audio) { logBail('hevc: keep-audio requested but source has no AAC audio track'); return null }

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
      onProgress(12 + Math.round(Math.min(1, frameIndex / demuxed.samples.length) * 70))
    }
  }

  try {
    onProgress(12)
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

    onProgress(90)
    const mp4Bytes = finalMuxer.finalize()
    onProgress(98)
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

async function encodeAvcInWorker(
  file: File,
  opts: AvcHardwareOpts,
  onProgress: (pct: number) => void,
): Promise<File | null> {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') { logBail('avc: WebCodecs unavailable'); return null }

  const demuxed = await demuxMp4VideoFile(file)
  if (!demuxed || demuxed.samples.length === 0) { logBail('avc: mp4 video demux failed or no samples'); return null }

  const srcW = even(demuxed.width)
  const srcH = even(demuxed.height)
  if (srcW < 2 || srcH < 2) { logBail(`avc: bad source dimensions ${srcW}x${srcH}`); return null }
  const height = opts.maxHeight && srcH > opts.maxHeight ? even(opts.maxHeight) : srcH
  const width = height === srcH ? srcW : even(Math.round(srcW * (height / srcH)))
  if (width < 2 || height < 2) { logBail(`avc: bad target dimensions ${width}x${height}`); return null }

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
  if (!encoderConfig) { logBail(`avc: no supported AVC encoder config for ${width}x${height}@${fps} format=avc`); return null }

  const decoderConfig: VideoDecoderConfig = {
    codec: demuxed.codecString,
    codedWidth: demuxed.width,
    codedHeight: demuxed.height,
    description: demuxed.description.slice(),
  }
  try {
    const support = await VideoDecoder.isConfigSupported(decoderConfig)
    if (!support.supported) { logBail(`avc: VideoDecoder config unsupported for ${demuxed.codecString}`); return null }
  } catch (err) {
    logBail(`avc: VideoDecoder.isConfigSupported threw: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }

  const stripAudio = opts.stripAudio === true
  const audio = stripAudio ? null : await demuxMp4AudioFile(file)
  // If the user wants audio but the source has non-AAC (or no) audio, bail so
  // the caller falls back to the playback + ffmpeg-mux path (which handles it).
  if (!stripAudio && !audio) { logBail('avc: keep-audio requested but source has no AAC audio track'); return null }

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
      onProgress(12 + Math.round(Math.min(1, frameIndex / demuxed.samples.length) * 70))
    }
  }

  try {
    onProgress(12)
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

    onProgress(90)
    const mp4Bytes = finalMuxer.finalize()
    onProgress(98)
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

type WorkerRequest =
  | { id: number; type: 'compress-avc'; file: File; opts: AvcHardwareOpts }
  | { id: number; type: 'compress-hevc'; file: File; opts: HevcHardwareOpts }

self.addEventListener('message', async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (!msg || typeof msg.id !== 'number') return
  const { id } = msg
  const onProgress = (pct: number) => {
    ;(self as unknown as Worker).postMessage({ id, type: 'progress', pct })
  }
  try {
    let file: File | null = null
    if (msg.type === 'compress-avc') {
      file = await encodeAvcInWorker(msg.file, msg.opts, onProgress)
    } else if (msg.type === 'compress-hevc') {
      file = await encodeHevcInWorker(msg.file, msg.opts, onProgress)
    }
    ;(self as unknown as Worker).postMessage({ id, type: 'result', file })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    ;(self as unknown as Worker).postMessage({ id, type: 'error', message })
  }
})
