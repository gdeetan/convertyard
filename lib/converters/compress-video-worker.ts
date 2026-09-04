// Web Worker: runs the WebCodecs fast paths for AVC/HEVC compression off the
// main thread. Main thread posts { id, type: 'compress-avc' | 'compress-hevc',
// file, opts } and receives { id, type: 'progress', pct } during the run and
// finally { id, type: 'result', file } or { id, type: 'error', message }.
//
// The playback-path fallback stays on the main thread and lives in
// compress-video-webcodecs.ts — this worker is fast-path only.

import { demuxMp4FileStreaming as demuxMp4File } from './mp4-demux-streaming'
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

// Watchdog: some Chromium builds (Android especially, some desktop HW encoder
// combos) leave encoder.flush() / decoder.flush() pending forever after a
// silent driver failure. Wrap the awaited call in a race so we surface the
// hang as an error and let the main thread fall back cleanly.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

// Emit interpolated progress from `from` to `to` while `promise` is pending.
// Prevents the UI bar from visibly stalling between encode (82) and finalize
// (90+). Ticks every 400ms, easing so the last few percent slow down.
async function runWithTicks<T>(
  promise: Promise<T>,
  from: number,
  to: number,
  onProgress: (pct: number) => void,
): Promise<T> {
  let current = from
  onProgress(current)
  const tick = setInterval(() => {
    // Move 25% of the remaining distance each tick, capped one short of `to`
    // so we never overshoot the real completion pct.
    const step = Math.max(1, Math.floor((to - current) * 0.25))
    if (current + step < to) {
      current += step
      onProgress(current)
    }
  }, 400)
  try {
    return await promise
  } finally {
    clearInterval(tick)
  }
}

type WorkerResult = { file: File; audioDropped: boolean }

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
): Promise<WorkerResult | null> {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') { logBail('hevc: WebCodecs unavailable'); return null }

  const stripAudio = opts.stripAudio === true
  const mp4 = await demuxMp4File(file, { includeAudio: !stripAudio })
  const demuxed = mp4?.video ?? null
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

  const audio = stripAudio ? null : mp4?.audio ?? null
  // audioDropped = "worker won't include audio in the output; caller should
  // splice it back in from the source with ffmpeg". Happens when the source
  // has an audio track we can't parse as AAC (e.g. LPCM on Sony/GoPro clips).
  // Previously we bailed to the playback path, which drops frames and
  // produces sped-up output — always worse than a quick ffmpeg audio splice.
  const audioDropped = !stripAudio && !audio && !!mp4?.hasAudioTrack

  // Precompute per-source-sample presentation offsets so retiming uses the true
  // source timeline (VFR-safe) rather than frameIndex/fps. If frames get dropped
  // between decoder → encoder, we extend the last chunk's duration at finalize
  // so total video duration still equals source duration — otherwise output
  // plays back sped-up.
  const sourceStartsUs = new Array<number>(demuxed.samples.length)
  const sourceDursUs = new Array<number>(demuxed.samples.length)
  let acc = 0
  for (let i = 0; i < demuxed.samples.length; i++) {
    sourceStartsUs[i] = acc
    sourceDursUs[i] = demuxed.samples[i].durationUs > 0
      ? demuxed.samples[i].durationUs
      : Math.round(1_000_000 / fps)
    acc += sourceDursUs[i]
  }
  const sourceTotalUs = acc

  let muxer: MuxerHandle | null = null
  let muxError: Error | null = null
  let encodeError: Error | null = null
  let decodeError: Error | null = null
  const pending: VideoFrame[] = []

  type PendingChunk = { type: 'key' | 'delta', timestamp: number, duration: number, data: Uint8Array }
  const chunkBuf: { last: PendingChunk | null } = { last: null }
  const flushLastChunk = (extraDurUs = 0) => {
    if (!chunkBuf.last || !muxer) return
    const info = chunkBuf.last
    chunkBuf.last = null
    const chunk = new EncodedVideoChunk({
      type: info.type,
      timestamp: info.timestamp,
      duration: info.duration + extraDurUs,
      data: info.data,
    })
    muxer.addVideoChunk(chunk)
  }

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
            rotation: demuxed.rotation,
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
        flushLastChunk()
        const buf = new Uint8Array(chunk.byteLength)
        chunk.copyTo(buf)
        chunkBuf.last = {
          type: chunk.type,
          timestamp: chunk.timestamp,
          duration: chunk.duration ?? 0,
          data: buf,
        }
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
      // Retime using source sample offsets so the output timeline matches the
      // source exactly (handles VFR and any fps rounding). Decoder emits in
      // presentation order — for stts-only sources (no ctts) that's decode
      // order, so frameIndex aligns 1:1 with demuxed.samples[frameIndex].
      const targetTsUs = sourceStartsUs[frameIndex] ?? Math.round((frameIndex * 1_000_000) / fps)
      const targetDurUs = sourceDursUs[frameIndex] ?? Math.round(1_000_000 / fps)
      const retimed = new VideoFrame(frame, { timestamp: targetTsUs, duration: targetDurUs })
      frame.close()
      encoder.encode(retimed, { keyFrame: frameIndex % (fps * 2) === 0 })
      retimed.close()
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
    await runWithTicks(withTimeout(decoder.flush(), 30_000, 'hevc: decoder.flush()'), 82, 86, onProgress)
    await drain()
    await runWithTicks(withTimeout(encoder.flush(), 30_000, 'hevc: encoder.flush()'), 86, 90, onProgress)
    if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
    if (!muxer) return null

    // Extend the last video chunk so total video duration equals source duration.
    // Prevents "fast-play" output when some frames don't round-trip through the
    // decode → encode pipeline (queue pressure, scaleFrame fallout, etc.).
    const encodedEndUs = chunkBuf.last ? chunkBuf.last.timestamp + chunkBuf.last.duration : 0
    const extraUs = Math.max(0, sourceTotalUs - encodedEndUs)
    flushLastChunk(extraUs)
    if (muxError) throw muxError

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

    onProgress(92)
    const mp4Bytes = finalMuxer.finalize()
    onProgress(97)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      file: new File([mp4Bytes as BlobPart], `${baseName}.mp4`, { type: 'video/mp4' }),
      audioDropped,
    }
  } catch (err) {
    logBail(`encode/mux threw: ${err instanceof Error ? err.message : String(err)}`)
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
): Promise<WorkerResult | null> {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') { logBail('avc: WebCodecs unavailable'); return null }

  const stripAudio = opts.stripAudio === true
  const mp4 = await demuxMp4File(file, { includeAudio: !stripAudio })
  const demuxed = mp4?.video ?? null
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

  const audio = stripAudio ? null : mp4?.audio ?? null
  // See HEVC path: if the source has an audio track we can't parse as AAC,
  // run video-only and flag audioDropped so the caller can splice audio back
  // in via ffmpeg. Beats falling into the frame-dropping playback path.
  const audioDropped = !stripAudio && !audio && !!mp4?.hasAudioTrack

  // See HEVC path for rationale: retime from real source offsets and extend the
  // final chunk so any dropped frames don't turn into fast-play output.
  const sourceStartsUs = new Array<number>(demuxed.samples.length)
  const sourceDursUs = new Array<number>(demuxed.samples.length)
  let acc = 0
  for (let i = 0; i < demuxed.samples.length; i++) {
    sourceStartsUs[i] = acc
    sourceDursUs[i] = demuxed.samples[i].durationUs > 0
      ? demuxed.samples[i].durationUs
      : Math.round(1_000_000 / fps)
    acc += sourceDursUs[i]
  }
  const sourceTotalUs = acc

  let muxer: MuxerHandle | null = null
  let muxError: Error | null = null
  let encodeError: Error | null = null
  let decodeError: Error | null = null
  const pending: VideoFrame[] = []

  type PendingChunk = { type: 'key' | 'delta', timestamp: number, duration: number, data: Uint8Array }
  const chunkBuf: { last: PendingChunk | null } = { last: null }
  const flushLastChunk = (extraDurUs = 0) => {
    if (!chunkBuf.last || !muxer) return
    const info = chunkBuf.last
    chunkBuf.last = null
    const chunk = new EncodedVideoChunk({
      type: info.type,
      timestamp: info.timestamp,
      duration: info.duration + extraDurUs,
      data: info.data,
    })
    muxer.addVideoChunk(chunk)
  }

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
            rotation: demuxed.rotation,
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
        flushLastChunk()
        const buf = new Uint8Array(chunk.byteLength)
        chunk.copyTo(buf)
        chunkBuf.last = {
          type: chunk.type,
          timestamp: chunk.timestamp,
          duration: chunk.duration ?? 0,
          data: buf,
        }
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
      // Retime using source sample offsets so the output timeline matches the
      // source exactly (VFR-safe). See HEVC path for details.
      const targetTsUs = sourceStartsUs[frameIndex] ?? Math.round((frameIndex * 1_000_000) / fps)
      const targetDurUs = sourceDursUs[frameIndex] ?? Math.round(1_000_000 / fps)
      const retimed = new VideoFrame(frame, { timestamp: targetTsUs, duration: targetDurUs })
      frame.close()
      encoder.encode(retimed, { keyFrame: frameIndex % (fps * 2) === 0 })
      retimed.close()
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
    await runWithTicks(withTimeout(decoder.flush(), 30_000, 'avc: decoder.flush()'), 82, 86, onProgress)
    await drain()
    await runWithTicks(withTimeout(encoder.flush(), 30_000, 'avc: encoder.flush()'), 86, 90, onProgress)
    if (encodeError || decodeError || muxError) throw encodeError ?? decodeError ?? muxError
    const finalMuxer = muxer as MuxerHandle | null
    if (!finalMuxer) return null

    const encodedEndUs = chunkBuf.last ? chunkBuf.last.timestamp + chunkBuf.last.duration : 0
    const extraUs = Math.max(0, sourceTotalUs - encodedEndUs)
    flushLastChunk(extraUs)
    if (muxError) throw muxError

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

    onProgress(92)
    const mp4Bytes = finalMuxer.finalize()
    onProgress(97)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return {
      file: new File([mp4Bytes as BlobPart], `${baseName}.mp4`, { type: 'video/mp4' }),
      audioDropped,
    }
  } catch (err) {
    logBail(`encode/mux threw: ${err instanceof Error ? err.message : String(err)}`)
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
    let result: WorkerResult | null = null
    if (msg.type === 'compress-avc') {
      result = await encodeAvcInWorker(msg.file, msg.opts, onProgress)
    } else if (msg.type === 'compress-hevc') {
      result = await encodeHevcInWorker(msg.file, msg.opts, onProgress)
    }
    ;(self as unknown as Worker).postMessage({
      id,
      type: 'result',
      file: result?.file ?? null,
      audioDropped: result?.audioDropped ?? false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    ;(self as unknown as Worker).postMessage({ id, type: 'error', message })
  }
})
