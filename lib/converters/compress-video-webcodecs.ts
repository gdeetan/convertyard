import { getCompressVideoFFmpeg, withFfmpegLock } from './ffmpeg-client'

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.maxTouchPoints > 1 || /Android|iPhone|iPad/i.test(navigator.userAgent)
}

function isIOSBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))
}

// Per-platform cap for the VideoDecoder worker fast path. Above the cap the
// caller falls back to the realtime playback capture, which drops frames on
// mobile and produces laggy output. iOS Safari has a ~1 GB per-tab budget;
// Android Chrome has 2–4 GB. 500 MB matches the hard-block ceiling in
// ffmpeg.ts — files above that error out clean before either path runs.
function mobileFastPathMaxBytes(): number {
  return isIOSBrowser() ? 400 * 1024 * 1024 : 500 * 1024 * 1024
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

type WorkerOutcome = { file: File; audioDropped: boolean } | null

type PendingEntry = {
  resolve: (outcome: WorkerOutcome) => void
  onProgress: (pct: number) => void
  lastActivityAt: number
  heartbeatTimer: ReturnType<typeof setInterval>
  hardTimeoutTimer: ReturnType<typeof setTimeout>
}

let workerInstance: Worker | null = null
let requestSeq = 0
const pending = new Map<number, PendingEntry>()

// Fail a hung request: clear timers, drop it from pending, terminate the
// worker so subsequent files don't inherit a wedged state, and resolve null
// so the caller falls back to the playback / ffmpeg path.
function failRequest(id: number, reason: string): void {
  const entry = pending.get(id)
  if (!entry) return
  console.info(`[compress-video] worker request ${id} aborted: ${reason}`)
  clearInterval(entry.heartbeatTimer)
  clearTimeout(entry.hardTimeoutTimer)
  pending.delete(id)
  try { workerInstance?.terminate() } catch { /* ignore */ }
  workerInstance = null
  for (const [otherId, other] of pending) {
    clearInterval(other.heartbeatTimer)
    clearTimeout(other.hardTimeoutTimer)
    pending.delete(otherId)
    other.resolve(null as WorkerOutcome)
  }
  entry.resolve(null as WorkerOutcome)
}

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
      handler.lastActivityAt = Date.now()
      if (type === 'progress') handler.onProgress(e.data.pct)
      else if (type === 'result') {
        clearInterval(handler.heartbeatTimer)
        clearTimeout(handler.hardTimeoutTimer)
        pending.delete(id)
        const outcome: WorkerOutcome = e.data.file
          ? { file: e.data.file as File, audioDropped: !!e.data.audioDropped }
          : null
        handler.resolve(outcome)
      }
      else if (type === 'error') {
        console.info('[compress-video] worker posted error:', e.data.message)
        clearInterval(handler.heartbeatTimer)
        clearTimeout(handler.hardTimeoutTimer)
        pending.delete(id)
        handler.resolve(null)
      }
    })
    workerInstance.addEventListener('error', (e: ErrorEvent) => {
      console.info('[compress-video] worker error event:', e.message, e.filename, e.lineno)
      // A worker-level error kills every in-flight request — fail them all.
      for (const [id] of pending) failRequest(id, 'worker error event')
    })
    workerInstance.addEventListener('messageerror', (e: MessageEvent) => {
      console.info('[compress-video] worker messageerror (structured clone failure):', e.data)
    })
  }
  return workerInstance
}

// Rough per-file compute budget. Scales with input size so a 500MB file has
// headroom while a 10MB file fails fast. Floor of 90s, ceiling of 20 minutes.
function hardTimeoutForFile(bytes: number): number {
  const seconds = Math.max(90, Math.min(1200, 60 + Math.round(bytes / (1024 * 1024)) * 3))
  return seconds * 1000
}

async function dispatchToWorker(
  type: WorkerRequestType,
  file: File,
  opts: AvcHardwareOpts | HevcHardwareOpts,
): Promise<WorkerOutcome> {
  console.info(`[compress-video] dispatch ${type} → worker (${file.name}, ${file.size} bytes)`)
  return new Promise<WorkerOutcome>((resolve) => {
    const id = ++requestSeq
    const now = Date.now()
    // Heartbeat: if the worker sends no progress or result for 30s, treat it
    // as wedged (silent driver hang on some Android WebCodecs stacks).
    const heartbeatTimer = setInterval(() => {
      const entry = pending.get(id)
      if (!entry) return
      if (Date.now() - entry.lastActivityAt > 30_000) {
        failRequest(id, 'no worker activity for 30s')
      }
    }, 5_000)
    // Hard ceiling — even if progress keeps ticking, don't sit forever.
    const hardTimeoutTimer = setTimeout(() => {
      failRequest(id, `hard timeout after ${Math.round(hardTimeoutForFile(file.size) / 1000)}s`)
    }, hardTimeoutForFile(file.size))
    pending.set(id, {
      resolve,
      onProgress: (pct: number) => opts.onProgress?.(pct),
      lastActivityAt: now,
      heartbeatTimer,
      hardTimeoutTimer,
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
      clearInterval(heartbeatTimer)
      clearTimeout(hardTimeoutTimer)
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
// The worker runs video-only when the source has an audio track it can't
// parse as AAC (LPCM in Sony/GoPro clips, for example). This helper splices
// the source audio back in with a single ffmpeg pass — copy if the source
// audio is mp4-compatible, transcode to AAC otherwise. Beats falling into
// the playback path, which drops frames and produces sped-up output.
async function spliceSourceAudio(
  videoOnly: File,
  source: File,
  onProgress?: (pct: number) => void,
): Promise<File> {
  // The splice is a "best effort" — if anything below fails (ffmpeg load,
  // WORKERFS quirk, silent WASM abort, missing output), we return the
  // video-only file instead of crashing the whole compression. A silent
  // audio drop is strictly better than the raw "ErrnoError: FS error" that
  // used to bubble up to the UI on iOS Safari and Android Chrome.
  let ffmpegClient: typeof import('./ffmpeg-client')
  let ffFs: typeof import('@ffmpeg/ffmpeg')
  try {
    ffmpegClient = await import('./ffmpeg-client')
    ffFs = await import('@ffmpeg/ffmpeg')
  } catch (err) {
    console.warn('[compress-video] splice: ffmpeg module load failed — returning video-only', err)
    return videoOnly
  }
  const { getCompressVideoFFmpeg, withFfmpegLock } = ffmpegClient
  const { FFFSType } = ffFs
  return withFfmpegLock(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ffmpeg: any
    try {
      ffmpeg = await getCompressVideoFFmpeg()
    } catch (err) {
      console.warn('[compress-video] splice: ffmpeg core load failed — returning video-only', err)
      return videoOnly
    }
    const ts = Date.now()
    const vName = `spl_v_${ts}.mp4`
    const srcExt = source.name.match(/\.[^.]+$/)?.[0] ?? '.mp4'
    const sBase = `spl_s_${ts}${srcExt}`
    // WORKERFS mounts the source File directly instead of copying it into
    // MEMFS via fetchFile+writeFile. On iOS Safari the MEMFS copy blows the
    // ~1 GB WASM heap for source files ≳150 MB.
    const mountPoint = `/mnt/spl_${ts}`
    const sName = `${mountPoint}/${sBase}`
    const oName = `spl_o_${ts}.mp4`

    // Splice progress: the caller has already ticked up to ~90. Move 91→99
    // during exec so the UI bar doesn't visibly freeze. Uses both ffmpeg's
    // real progress events and a heartbeat so we still tick even if the core
    // never emits (ST core on iOS often skips them for -c copy).
    let splicePct = 91
    const emit = (pct: number) => {
      if (pct <= splicePct) return
      splicePct = Math.min(99, pct)
      onProgress?.(splicePct)
    }
    emit(91)
    const progressHandler = ({ progress }: { progress: number }) => {
      emit(91 + Math.round(Math.min(1, Math.max(0, progress)) * 8))
    }
    const heartbeat = setInterval(() => emit(splicePct + 1), 800)

    let mounted = false
    let wroteVideo = false
    try {
      try {
        ffmpeg.on('progress', progressHandler)
      } catch { /* older ffmpeg-wasm — ignore */ }

      try {
        await ffmpeg.writeFile(vName, new Uint8Array(await videoOnly.arrayBuffer()))
        wroteVideo = true
      } catch (err) {
        console.warn('[compress-video] splice: writeFile(videoOnly) failed — returning video-only', err)
        return videoOnly
      }
      try {
        await ffmpeg.createDir(mountPoint).catch(() => {})
        await ffmpeg.mount(
          FFFSType.WORKERFS,
          { blobs: [{ name: sBase, data: source }] },
          mountPoint,
        )
        mounted = true
      } catch (err) {
        console.warn('[compress-video] splice: WORKERFS mount failed — returning video-only', err)
        return videoOnly
      }

      // Log tail so a non-zero exit tells us WHY the splice failed instead
      // of silently returning video-only. Same pattern as execWithReason
      // in ffmpeg.ts.
      const logLines: string[] = []
      const logHandler = ({ message }: { message: string }) => {
        if (!message) return
        logLines.push(message)
        if (logLines.length > 20) logLines.shift()
      }
      try { ffmpeg.on('log', logHandler) } catch { /* ignore */ }

      const runExec = async (args: string[]): Promise<number> => {
        try {
          return await ffmpeg.exec(args)
        } catch (err) {
          console.warn('[compress-video] splice: ffmpeg.exec threw —', err instanceof Error ? err.message : String(err))
          return -1
        }
      }

      try {
        let code = await runExec([
          '-i', vName,
          '-i', sName,
          '-map', '0:v:0',
          '-map', '1:a:0?',
          '-c:v', 'copy',
          '-c:a', 'copy',
          '-shortest',
          '-movflags', '+faststart',
          oName,
        ])
        if (code !== 0) {
          await ffmpeg.deleteFile(oName).catch(() => {})
          code = await runExec([
            '-i', vName,
            '-i', sName,
            '-map', '0:v:0',
            '-map', '1:a:0?',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-shortest',
            '-movflags', '+faststart',
            oName,
          ])
        }
        if (code !== 0) {
          const tail = logLines.slice(-4).join(' | ')
          console.warn(`[compress-video] splice: exec failed (code ${code})${tail ? ` — ${tail}` : ''} — returning video-only`)
          return videoOnly
        }

        let data: Uint8Array<ArrayBuffer> | undefined
        try {
          data = await ffmpeg.readFile(oName) as Uint8Array<ArrayBuffer>
        } catch (err) {
          console.warn('[compress-video] splice: readFile(output) failed — returning video-only', err)
          return videoOnly
        }
        if (!data?.byteLength) return videoOnly
        const baseName = source.name.replace(/\.[^.]+$/, '')
        emit(99)
        return new File([data], `${baseName}.mp4`, { type: 'video/mp4' })
      } finally {
        try { ffmpeg.off('log', logHandler) } catch { /* ignore */ }
      }
    } finally {
      clearInterval(heartbeat)
      try { ffmpeg.off('progress', progressHandler) } catch { /* ignore */ }
      // WORKERFS is read-only, so deleteFile(sName) would fail — unmount +
      // deleteDir is the correct cleanup for the mounted source.
      if (mounted) {
        await ffmpeg.unmount(mountPoint).catch(() => {})
        await ffmpeg.deleteDir(mountPoint).catch(() => {})
      }
      if (wroteVideo) await ffmpeg.deleteFile(vName).catch(() => {})
      await ffmpeg.deleteFile(oName).catch(() => {})
    }
  })
}

type CapturedChunk = { type: 'key' | 'delta'; timestamp: number; duration: number; data: Uint8Array }

// Build a video-only MP4 from encoded chunks, extending the last chunk so total
// duration equals the source duration. Used by the playback path so frame drops
// (rVFC at high playbackRate on mobile / large clips) don't produce sped-up
// output. The caller splices audio back in with ffmpeg when keep-audio is on.
async function buildVideoOnlyMp4(
  codec: 'avc' | 'hevc',
  width: number,
  height: number,
  chunks: CapturedChunk[],
  firstMeta: EncodedVideoChunkMetadata | undefined,
  sourceDurationUs: number,
  filename: string,
): Promise<File | null> {
  if (chunks.length === 0) return null
  const desc = firstMeta?.decoderConfig?.description
  if (!desc || !firstMeta?.decoderConfig?.codec) return null
  const descBytes = desc instanceof Uint8Array
    ? desc
    : ArrayBuffer.isView(desc)
      ? new Uint8Array(desc.buffer, desc.byteOffset, desc.byteLength)
      : new Uint8Array(desc as ArrayBuffer)
  const { createAvcMuxer, createHevcMuxer } = await import('./mp4-mux')
  const maker = codec === 'hevc' ? createHevcMuxer : createAvcMuxer
  const muxer = maker({
    width,
    height,
    hasAudio: false,
    videoDecoderConfig: { codec: firstMeta.decoderConfig.codec, description: descBytes },
  })
  const last = chunks[chunks.length - 1]
  const encodedEndUs = last.timestamp + last.duration
  const extraUs = Math.max(0, sourceDurationUs - encodedEndUs)
  for (let i = 0; i < chunks.length - 1; i++) {
    const c = chunks[i]
    muxer.addVideoChunk(new EncodedVideoChunk({
      type: c.type, timestamp: c.timestamp, duration: c.duration, data: c.data,
    }))
  }
  muxer.addVideoChunk(new EncodedVideoChunk({
    type: last.type, timestamp: last.timestamp, duration: last.duration + extraUs, data: last.data,
  }))
  const bytes = muxer.finalize()
  return new File([bytes as BlobPart], filename, { type: 'video/mp4' })
}

async function tryEncodeViaVideoDecoder(
  file: File,
  opts: HevcHardwareOpts,
): Promise<WorkerOutcome> {
  if (typeof Worker === 'undefined') return null
  // Mobile can use the one-read MP4 demux fast path for modest files. Keep a
  // per-platform cap so very large inputs still fall back to the lazier
  // playback path — iOS Safari's tab budget forces a lower ceiling than
  // Android Chrome.
  if (isMobileBrowser() && file.size > mobileFastPathMaxBytes()) return null
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
    if (decoded) {
      console.info('[compress-video] HEVC via VideoDecoder fast path')
      if (decoded.audioDropped) {
        console.info('[compress-video] source audio not parseable as AAC — splicing via ffmpeg')
        return await spliceSourceAudio(decoded.file, file, opts.onProgress)
      }
      return decoded.file
    }
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

    // Prefer hvcc bitstream so mp4-muxer honours real chunk timestamps.
    // Falls back to annexb + ffmpeg mux on browsers that reject hvcc output.
    let encoderConfig = await pickHevcEncoderConfig(width, height, fps, bitrate, 'hevc')
    let useMp4Muxer = true
    if (!encoderConfig) {
      encoderConfig = await pickHevcEncoderConfig(width, height, fps, bitrate, 'annexb')
      useMp4Muxer = false
    }
    if (!encoderConfig) return null

    // Mobile Safari can hand back raw (pre-rotation) pixels via
    // `new VideoFrame(video)` while videoWidth/videoHeight report the
    // display-oriented dims — the mismatch is what plays iPhone clips back
    // rotated. drawImage() to canvas bakes in the display orientation, so
    // route mobile through canvas regardless of scale.
    const mobile = isMobileBrowser()
    const needsScale = width !== even(srcW) || height !== even(srcH)
    const useCanvas = mobile || needsScale
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    if (useCanvas) {
      canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
    }

    const rawChunks: Uint8Array[] = []
    const capturedChunks: CapturedChunk[] = []
    let firstMeta: EncodedVideoChunkMetadata | undefined
    let encodeError: Error | null = null
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        if (!firstMeta && meta) firstMeta = meta
        const buf = new Uint8Array(chunk.byteLength)
        chunk.copyTo(buf)
        if (useMp4Muxer) {
          capturedChunks.push({
            type: chunk.type,
            timestamp: chunk.timestamp,
            duration: chunk.duration ?? Math.round(1_000_000 / fps),
            data: buf,
          })
        } else {
          rawChunks.push(buf)
        }
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
      // Mobile buffers one frame so each encoded chunk can be stamped with
      // its true duration (nextT - thisT). Without this, iOS Safari drops
      // rendered frames but we stamp every chunk with a fixed 1/30s duration,
      // leaving gaps in the muxed timeline that play back as freezes.
      let prevFrame: VideoFrame | null = null
      let prevTsSec = 0
      const cleanupPrev = () => {
        if (prevFrame) { try { prevFrame.close() } catch { /* already closed */ } prevFrame = null }
      }
      const encodePrev = (durSec: number) => {
        if (!prevFrame) return
        const durUs = Math.max(1, Math.round(durSec * 1_000_000))
        const retimed = new VideoFrame(prevFrame, {
          timestamp: Math.round(prevTsSec * 1_000_000),
          duration: durUs,
        })
        prevFrame.close()
        prevFrame = null
        encoder.encode(retimed, { keyFrame: frameIndex % (fps * 2) === 0 })
        retimed.close()
        frameIndex += 1
      }
      const finish = () => {
        if (settled) return
        settled = true
        clearInterval(watchdog)
        cleanupPrev()
        video.pause()
        resolve()
      }
      const fail = (err: unknown) => {
        if (settled) return
        settled = true
        clearInterval(watchdog)
        cleanupPrev()
        video.pause()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
      const watchdog = window.setInterval(() => {
        if (Date.now() - lastFrameAt > 8000) {
          fail(new Error('Hardware HEVC stalled — no frames for 8s'))
        }
      }, 1000)
      const onEnded = () => {
        if (mobile && prevFrame) {
          try { encodePrev(Math.max(0.001, duration - prevTsSec)) } catch { cleanupPrev() }
        }
        finish()
      }
      video.addEventListener('ended', onEnded, { once: true })
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        try {
          if (encodeError) throw encodeError
          lastFrameAt = Date.now()
          const t = meta.mediaTime
          if (mobile) {
            ctx!.drawImage(video, 0, 0, width, height)
            const frame = new VideoFrame(canvas!, {
              timestamp: Math.round(t * 1_000_000),
              duration: Math.round((1 / fps) * 1_000_000),
            })
            if (prevFrame) encodePrev(Math.max(0.001, t - prevTsSec))
            prevFrame = frame
            prevTsSec = t
            opts.onProgress?.(12 + Math.round(Math.min(1, t / duration) * 70))
            if (video.ended || t >= duration - 0.05) {
              encodePrev(Math.max(0.001, duration - prevTsSec))
              video.removeEventListener('ended', onEnded)
              finish()
              return
            }
            rVFC(onFrame)
            return
          }
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

    opts.onProgress?.(84)
    console.info('[compress-video] HEVC via playback path succeeded')
    if (useMp4Muxer) {
      if (capturedChunks.length === 0) return null
      const sourceDurationUs = Math.round(duration * 1_000_000)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const videoOnly = await buildVideoOnlyMp4('hevc', width, height, capturedChunks, firstMeta, sourceDurationUs, `${baseName}.mp4`)
      if (!videoOnly) return null
      if (opts.stripAudio === true) return videoOnly
      return await spliceSourceAudio(videoOnly, file, opts.onProgress)
    }
    if (rawChunks.length === 0) return null
    const annexB = concatBytes(rawChunks)
    return await muxHevcAnnexB(file, annexB, opts.stripAudio === true, fps, opts.onProgress)
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
): Promise<WorkerOutcome> {
  if (typeof Worker === 'undefined') return null
  if (isMobileBrowser() && file.size > mobileFastPathMaxBytes()) return null
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
      if (decoded.audioDropped) {
        console.info('[compress-video] source audio not parseable as AAC — splicing via ffmpeg')
        return await spliceSourceAudio(decoded.file, file, opts.onProgress)
      }
      return decoded.file
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

    // Prefer avcc bitstream so we can mux via mp4-muxer with real chunk
    // timestamps — rVFC at 4x on mobile / large clips drops source frames, and
    // the old raw-AnnexB → ffmpeg mux would then interpret N chunks at a
    // constant fps and produce a shorter (fast-play) output. Fall back to
    // annexb + ffmpeg mux only if the browser can't do avcc.
    let encoderConfig = await pickAvcEncoderConfig(width, height, fps, bitrate, 'avc')
    let useMp4Muxer = true
    if (!encoderConfig) {
      encoderConfig = await pickAvcEncoderConfig(width, height, fps, bitrate, 'annexb')
      useMp4Muxer = false
    }
    if (!encoderConfig) return null

    // See HEVC playback path: route mobile through canvas so drawImage()
    // bakes in the display orientation, and buffer one frame so each
    // encoded chunk gets its true (nextT - thisT) duration.
    const mobile = isMobileBrowser()
    const needsScale = width !== even(srcW) || height !== even(srcH)
    const useCanvas = mobile || needsScale
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    if (useCanvas) {
      canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
    }

    const rawChunks: Uint8Array[] = []
    const capturedChunks: CapturedChunk[] = []
    let firstMeta: EncodedVideoChunkMetadata | undefined
    let encodeError: Error | null = null
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        if (!firstMeta && meta) firstMeta = meta
        const buf = new Uint8Array(chunk.byteLength)
        chunk.copyTo(buf)
        if (useMp4Muxer) {
          capturedChunks.push({
            type: chunk.type,
            timestamp: chunk.timestamp,
            duration: chunk.duration ?? Math.round(1_000_000 / fps),
            data: buf,
          })
        } else {
          rawChunks.push(buf)
        }
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
      let prevFrame: VideoFrame | null = null
      let prevTsSec = 0
      const cleanupPrev = () => {
        if (prevFrame) { try { prevFrame.close() } catch { /* already closed */ } prevFrame = null }
      }
      const encodePrev = (durSec: number) => {
        if (!prevFrame) return
        const durUs = Math.max(1, Math.round(durSec * 1_000_000))
        const retimed = new VideoFrame(prevFrame, {
          timestamp: Math.round(prevTsSec * 1_000_000),
          duration: durUs,
        })
        prevFrame.close()
        prevFrame = null
        encoder.encode(retimed, { keyFrame: frameIndex % (fps * 2) === 0 })
        retimed.close()
        frameIndex += 1
      }
      const finish = () => {
        if (settled) return
        settled = true
        clearInterval(watchdog)
        cleanupPrev()
        video.pause()
        resolve()
      }
      const fail = (err: unknown) => {
        if (settled) return
        settled = true
        clearInterval(watchdog)
        cleanupPrev()
        video.pause()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
      const watchdog = window.setInterval(() => {
        if (Date.now() - lastFrameAt > 8000) {
          fail(new Error('Hardware AVC stalled — no frames for 8s'))
        }
      }, 1000)
      const onEnded = () => {
        if (mobile && prevFrame) {
          try { encodePrev(Math.max(0.001, duration - prevTsSec)) } catch { cleanupPrev() }
        }
        finish()
      }
      video.addEventListener('ended', onEnded, { once: true })
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        try {
          if (encodeError) throw encodeError
          lastFrameAt = Date.now()
          const t = meta.mediaTime
          if (mobile) {
            ctx!.drawImage(video, 0, 0, width, height)
            const frame = new VideoFrame(canvas!, {
              timestamp: Math.round(t * 1_000_000),
              duration: Math.round((1 / fps) * 1_000_000),
            })
            if (prevFrame) encodePrev(Math.max(0.001, t - prevTsSec))
            prevFrame = frame
            prevTsSec = t
            opts.onProgress?.(12 + Math.round(Math.min(1, t / duration) * 70))
            if (video.ended || t >= duration - 0.05) {
              encodePrev(Math.max(0.001, duration - prevTsSec))
              video.removeEventListener('ended', onEnded)
              finish()
              return
            }
            rVFC(onFrame)
            return
          }
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

    opts.onProgress?.(84)
    console.info('[compress-video] AVC via playback path succeeded')
    if (useMp4Muxer) {
      if (capturedChunks.length === 0) return null
      const sourceDurationUs = Math.round(duration * 1_000_000)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const videoOnly = await buildVideoOnlyMp4('avc', width, height, capturedChunks, firstMeta, sourceDurationUs, `${baseName}.mp4`)
      if (!videoOnly) return null
      if (opts.stripAudio === true) return videoOnly
      return await spliceSourceAudio(videoOnly, file, opts.onProgress)
    }
    if (rawChunks.length === 0) return null
    const annexB = concatBytes(rawChunks)
    return await muxAvcAnnexB(file, annexB, opts.stripAudio === true, fps, opts.onProgress)
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
  fps: number,
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
      '-framerate', String(fps),
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
  fps: number,
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
      '-framerate', String(fps),
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
