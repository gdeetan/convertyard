// Compress-video path for files that don't fit in V8's ~2 GB Uint8Array cap.
// Uses mediabunny's Conversion API which streams source reads (Blob.slice)
// and streams output writes (FileSystemWritableFileStream → OPFS). None of
// the file ever lives in memory as a single buffer, so we can process the
// full source size the device's disk quota allows — typically tens of GB on
// desktop Chromium.
//
// This module is dynamically imported ONLY when a >2 GB source is picked
// and the environment supports it. The classic ffmpeg-wasm + WebCodecs
// stack in ffmpeg.ts handles every other case, unchanged.

import type { ConversionResult, ToolOptions } from '@/lib/types'
import type { Quality as MbQuality } from 'mediabunny'

const OPFS_DIR = 'compress-video-out'

// Below this source size, finalize the mux in memory instead of streaming to
// OPFS. OPFS stream.close() + handle.getFile() takes 15–30 s on 400 MB–1 GB
// outputs in Chromium (incl. Edge), freezing the progress bar between 97%
// and 100%. V8's ~2 GB Uint8Array ceiling means in-memory is only safe below
// ~1.2 GB source; above that we still need the streaming path.
const OPFS_MIN_BYTES = 1200 * 1024 * 1024

export function isMediabunnySupported(): boolean {
  if (typeof navigator === 'undefined') return false
  if (!navigator.storage?.getDirectory) return false
  if (typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') return false
  if (typeof FileSystemWritableFileStream === 'undefined') return false
  // Desktop only — mobile OPFS + WebCodecs is too spotty and the streaming
  // path hasn't been tested there. Hard-gate to Chromium desktop for now.
  const ua = navigator.userAgent
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return false
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return false
  return true
}

const RESOLUTION_HEIGHT: Record<string, number> = {
  '1080p': 1080,
  '720p': 720,
  '480p': 480,
  '360p': 360,
}

/** Height-only resize so mediabunny keeps display aspect ratio and rotation. */
export function mediabunnyVideoTarget(
  resolution: string,
  displayHeight: number,
): { height: number; fit: 'contain' } | undefined {
  const targetHeight = RESOLUTION_HEIGHT[resolution]
  if (!targetHeight || !(displayHeight > targetHeight)) return undefined
  return { height: targetHeight, fit: 'contain' }
}

// Same bits-per-pixel table as compress-video-webcodecs.ts so quality levels
// feel consistent regardless of which pipeline handled the file.
const AVC_BPP: Record<string, number> = {
  small: 0.12,
  medium: 0.075,
  high: 0.05,
  maximum: 0.028,
}
const HEVC_BPP: Record<string, number> = {
  small: 0.08,
  medium: 0.05,
  high: 0.035,
  maximum: 0.02,
}

function computeBitrate(
  width: number,
  height: number,
  fps: number,
  level: string,
  h265: boolean,
  sourceBytes: number,
  durationSeconds: number,
): number {
  const bpp = h265 ? (HEVC_BPP[level] ?? HEVC_BPP.medium) : (AVC_BPP[level] ?? AVC_BPP.medium)
  const qualityBps = Math.max(100_000, Math.round(width * height * fps * bpp))
  if (!(sourceBytes > 0) || !(durationSeconds > 0)) return qualityBps
  const sourceBps = (sourceBytes * 8) / durationSeconds
  return Math.max(100_000, Math.min(qualityBps, Math.floor(sourceBps * 0.7)))
}

async function openOpfsWritable(baseName: string): Promise<{
  stream: FileSystemWritableFileStream
  handle: FileSystemFileHandle
  fileName: string
} | null> {
  const root = await navigator.storage.getDirectory()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dir = await (root as any).getDirectoryHandle(OPFS_DIR, { create: true }) as FileSystemDirectoryHandle
  const fileName = `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`
  const handle = await dir.getFileHandle(fileName, { create: true })
  const stream = await handle.createWritable()
  return { stream, handle, fileName }
}

// Best-effort cleanup of prior-session output files so the OPFS directory
// doesn't grow unbounded across visits. Browsers evict under quota pressure
// anyway; this is just polite housekeeping.
async function cleanupOldOpfs(currentFileName: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dir = await (root as any).getDirectoryHandle(OPFS_DIR, { create: false }) as FileSystemDirectoryHandle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = (dir as any).values?.() as AsyncIterable<FileSystemHandle> | undefined
    if (!values) return
    for await (const entry of values) {
      if (entry.kind !== 'file' || entry.name === currentFileName) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dir as any).removeEntry(entry.name).catch(() => {})
    }
  } catch { /* absent dir / api variance — best-effort */ }
}

// Race a promise against a timeout so an OPFS hang can't freeze the whole
// pipeline at 99%. Same shape as compress-video-worker's helper.
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
// Prevents the UI bar from visibly stalling at 96/98 while OPFS close +
// getFile run (15–30 s on Chromium for 400 MB+ outputs). Ticks every 400 ms.
async function runWithTicks<T>(
  promise: Promise<T>,
  from: number,
  to: number,
  onProgress: (pct: number) => void,
): Promise<T> {
  let current = from
  onProgress(current)
  let settled = false
  const tick = () => {
    if (settled) return
    const remaining = to - current
    const step = Math.max(0.1, remaining * 0.1)
    current = Math.min(to, current + step)
    onProgress(current)
    setTimeout(tick, 400)
  }
  setTimeout(tick, 400)
  try {
    return await promise
  } finally {
    settled = true
    onProgress(to)
  }
}

// In-memory sink for mediabunny's positional writes. MP4 muxing writes
// headers at position 0 at the end, so writes are NOT sequential — track a
// growable buffer and memcpy each chunk at its position. Only used below
// OPFS_MIN_BYTES, so total output comfortably fits under V8's ~2 GB cap.
function createMemorySink(): {
  bridge: WritableStream<{ type: 'write'; data: Uint8Array; position: number }>
  finalize: () => Uint8Array
} {
  let buf = new Uint8Array(1024 * 1024)
  let highWater = 0
  const ensure = (needed: number) => {
    if (buf.length >= needed) return
    let cap = buf.length
    while (cap < needed) cap *= 2
    const next = new Uint8Array(cap)
    next.set(buf)
    buf = next
  }
  const bridge = new WritableStream<{ type: 'write'; data: Uint8Array; position: number }>({
    write(chunk) {
      const end = chunk.position + chunk.data.byteLength
      ensure(end)
      buf.set(chunk.data, chunk.position)
      if (end > highWater) highWater = end
    },
  })
  return {
    bridge,
    finalize: () => buf.subarray(0, highWater),
  }
}

function logPhase(phase: string, pct: number | null = null): void {
  const suffix = pct == null ? '' : ` pct=${pct}`
  console.info(`[compress-video][phase] codec=mediabunny phase=${phase}${suffix}`)
}

export async function compressVideoWithMediabunny(
  file: File,
  options: ToolOptions,
  onProgress: (pct: number) => void,
): Promise<ConversionResult> {
  // Dynamic import — mediabunny is only fetched when we actually need it.
  const {
    Input,
    Output,
    BlobSource,
    Mp4OutputFormat,
    ALL_FORMATS,
    Conversion,
    QUALITY_LOW,
    QUALITY_MEDIUM,
    QUALITY_HIGH,
    QUALITY_VERY_HIGH,
    StreamTarget,
  } = await import('mediabunny')

  const targetSizeMode = options.targetSizeMode === true || options.targetSizeMode === 'true'
  const level = (options.level as string) ?? 'medium'
  const resolution = (options.resolution as string) ?? 'original'
  const h265 = options.h265 === true || options.h265 === 'true'
  const stripAudio = options.stripAudio === true || options.stripAudio === 'true'
  const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 51200

  const baseName = file.name.replace(/\.[^.]+$/, '')

  onProgress(3)

  // Probe the source so we can pick a bitrate that hits the compression
  // level or target size. Mediabunny reads only the moov via BlobSource,
  // so this is fast even on multi-GB inputs.
  const probeInput = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  let durationSeconds: number
  let srcW: number
  let srcH: number
  let fps: number
  try {
    const videoTrack = await probeInput.getPrimaryVideoTrack()
    if (!videoTrack) {
      return new Error('This file has no video track. Video Compressor only works on video files.')
    }
    durationSeconds = await probeInput.computeDuration()
    srcW = await (videoTrack.getDisplayWidth?.() ?? videoTrack.getCodedWidth())
    srcH = await (videoTrack.getDisplayHeight?.() ?? videoTrack.getCodedHeight())
    const packetStats = await videoTrack.computePacketStats().catch(() => null)
    fps = packetStats?.averagePacketRate && packetStats.averagePacketRate > 0
      ? Math.min(60, Math.max(1, Math.round(packetStats.averagePacketRate)))
      : 30
  } finally {
    probeInput.dispose()
  }

  // Height-only resize. Passing both coded width and height with fit:contain
  // letterboxes when the track is rotated or has non-square pixels.
  const resize = mediabunnyVideoTarget(resolution, srcH)
  let outW = srcW
  let outH = srcH
  if (resize) {
    outH = resize.height
    outW = Math.round(srcW * (outH / srcH))
    if (outW % 2) outW -= 1
    if (outH % 2) outH -= 1
  }

  // Bitrate: target-size mode computes to hit the KB budget; quality mode
  // uses BPP × pixels × fps.
  let bitrate: number
  if (targetSizeMode) {
    const audioKbps = stripAudio ? 0 : (targetKB <= 10 * 1024 ? 64 : targetKB <= 50 * 1024 ? 96 : 128)
    bitrate = Math.max(
      100_000,
      Math.floor((targetKB * 1024 * 8 - audioKbps * 1000 * durationSeconds) / durationSeconds),
    )
  } else {
    bitrate = computeBitrate(outW, outH, fps, level, h265, file.size, durationSeconds)
  }

  // Map our named levels to mediabunny Quality presets for the audio track.
  // Quality is per-codec — mediabunny picks a sensible bitrate.
  const audioQuality: MbQuality = level === 'small' ? QUALITY_VERY_HIGH
    : level === 'medium' ? QUALITY_HIGH
    : level === 'high' ? QUALITY_MEDIUM
    : QUALITY_LOW

  onProgress(5)

  // Size-gate: in-memory for small/medium sources (no OPFS finalize tax),
  // OPFS streaming for anything that would risk the V8 Uint8Array ceiling.
  const useOpfs = file.size >= OPFS_MIN_BYTES
  const opfs = useOpfs ? await openOpfsWritable(baseName) : null
  if (useOpfs && !opfs) {
    return new Error('Could not open temporary storage for large-file compression. Try again, or use a smaller file.')
  }
  const memorySink = useOpfs ? null : createMemorySink()
  logPhase(useOpfs ? 'sink-opfs' : 'sink-memory', 5)

  try {
    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
    // Bridge mediabunny's { type: 'write', data, position } chunks to the
    // chosen sink. OPFS path forwards to FileSystemWritableFileStream;
    // in-memory path memcpy's into a growable buffer.
    const bridge = memorySink
      ? memorySink.bridge
      : new WritableStream<{ type: 'write'; data: Uint8Array; position: number }>({
          async write(chunk) {
            // Cast: the DOM lib types Uint8Array<ArrayBufferLike> but OPFS
            // accepts BufferSource which allows any Uint8Array in practice.
            await opfs!.stream.write({
              type: 'write',
              position: chunk.position,
              data: chunk.data as unknown as BufferSource,
            })
          },
        })
    const output = new Output({
      format: new Mp4OutputFormat(),
      target: new StreamTarget(bridge),
    })

    const conversion = await Conversion.init({
      input,
      output,
      video: {
        ...resize,
        codec: h265 ? 'hevc' : 'avc',
        bitrate,
        hardwareAcceleration: 'prefer-hardware',
      },
      audio: stripAudio
        ? { discard: true }
        : { codec: 'aac', quality: audioQuality },
    })

    if (!conversion.isValid) {
      const reasons = (conversion.discardedTracks ?? []).map(t => t.reason).join('; ')
      throw new Error(`Streaming compression not supported for this file${reasons ? ` (${reasons})` : ''}.`)
    }

    let firstProgressLogged = false
    let lastLoggedBand = -1
    conversion.onProgress = (progress: number) => {
      // Reserve 5–95 for the encode; keep tenths so a multi-GB 360p/480p
      // run can move the bar instead of sitting on a rounded 5%.
      const mapped = 5 + Math.min(1, Math.max(0, progress)) * 90
      if (!firstProgressLogged) {
        firstProgressLogged = true
        logPhase('execute-first-progress', mapped)
      }
      const band = Math.floor(mapped / 10)
      if (band !== lastLoggedBand && band >= 1) {
        lastLoggedBand = band
        logPhase('execute-progress', Math.round(mapped))
      }
      onProgress(mapped)
    }

    logPhase(resize ? `execute-start-${resolution}` : 'execute-start', 5)
    await conversion.execute()
    logPhase('execute-done', 95)

    if (memorySink) {
      // In-memory finalize: a Uint8Array → File is a direct wrap, no I/O.
      logPhase('memory-finalize', 96)
      const bytes = memorySink.finalize()
      onProgress(100)
      logPhase('done', 100)
      return new File([bytes as BlobPart], `${baseName}.mp4`, { type: 'video/mp4' })
    }

    // OPFS path: interpolate 95→99 while the two awaits run so the bar
    // doesn't visibly stall on Chromium's slow stream.close / getFile.
    logPhase('opfs-close-start', 95)
    await runWithTicks(
      withTimeout(opfs!.stream.close(), 60_000, 'mediabunny: opfs.stream.close()'),
      95, 98, onProgress,
    )
    logPhase('opfs-close-done', 98)

    logPhase('opfs-getFile-start', 98)
    const opfsFile = await runWithTicks(
      withTimeout(opfs!.handle.getFile(), 30_000, 'mediabunny: opfs.handle.getFile()'),
      98, 99, onProgress,
    )
    logPhase('opfs-getFile-done', 99)
    cleanupOldOpfs(opfs!.fileName).catch(() => {})

    // Rename via wrapping. new File() shares the underlying blob reference
    // in Chromium so this doesn't copy the bytes.
    onProgress(100)
    logPhase('done', 100)
    return new File([opfsFile], `${baseName}.mp4`, { type: 'video/mp4' })
  } catch (err) {
    // Cleanup on failure — leaving partial files in OPFS wastes quota.
    if (opfs) {
      try { await opfs.stream.close() } catch { /* already closed */ }
      try {
        const root = await navigator.storage.getDirectory()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dir = await (root as any).getDirectoryHandle(OPFS_DIR, { create: false })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (dir as any).removeEntry(opfs.fileName).catch(() => {})
      } catch { /* best-effort */ }
    }
    return err instanceof Error ? err : new Error(String(err))
  }
}
