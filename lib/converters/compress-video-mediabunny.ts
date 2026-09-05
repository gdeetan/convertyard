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
  const videoTrack = await probeInput.getPrimaryVideoTrack()
  if (!videoTrack) {
    return new Error('This file has no video track. Video Compressor only works on video files.')
  }
  const durationSeconds = await probeInput.computeDuration()
  const srcW = await videoTrack.getCodedWidth()
  const srcH = await videoTrack.getCodedHeight()
  const packetStats = await videoTrack.computePacketStats().catch(() => null)
  const fps = packetStats?.averagePacketRate && packetStats.averagePacketRate > 0
    ? Math.min(60, Math.max(1, Math.round(packetStats.averagePacketRate)))
    : 30

  // Compute target dimensions. Mediabunny handles the actual resize.
  const targetHeight = RESOLUTION_HEIGHT[resolution]
  let outW = srcW
  let outH = srcH
  if (targetHeight && srcH > targetHeight) {
    outH = targetHeight
    outW = Math.round(srcW * (outH / srcH))
    // Even dims — WebCodecs encoders reject odd values for 4:2:0 subsampling.
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

  const opfs = await openOpfsWritable(baseName)
  if (!opfs) {
    return new Error('Could not open temporary storage for large-file compression. Try again, or use a smaller file.')
  }

  try {
    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
    // Bridge mediabunny's { type: 'write', data, position } chunks to the
    // OPFS FileSystemWritableFileStream's positional write() signature.
    // Direct typing mismatch: StreamTarget expects
    // WritableStream<StreamTargetChunk>, OPFS is WritableStream<FileSystemWriteChunkType>.
    const bridge = new WritableStream<{ type: 'write'; data: Uint8Array; position: number }>({
      async write(chunk) {
        // Cast: the DOM lib types Uint8Array<ArrayBufferLike> but OPFS
        // accepts BufferSource which allows any Uint8Array in practice.
        await opfs.stream.write({
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
        width: outW,
        height: outH,
        fit: 'contain',
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

    conversion.onProgress = (progress: number) => {
      // Reserve 5–95 for the encode; 96–99 for finalize/OPFS close.
      onProgress(5 + Math.round(progress * 90))
    }

    await conversion.execute()

    onProgress(96)
    await opfs.stream.close()
    onProgress(98)

    const opfsFile = await opfs.handle.getFile()
    cleanupOldOpfs(opfs.fileName).catch(() => {})

    // Rename via wrapping. new File() shares the underlying blob reference
    // in Chromium so this doesn't copy the bytes.
    onProgress(100)
    return new File([opfsFile], `${baseName}.mp4`, { type: 'video/mp4' })
  } catch (err) {
    // Cleanup on failure — leaving partial files in OPFS wastes quota.
    try { await opfs.stream.close() } catch { /* already closed */ }
    try {
      const root = await navigator.storage.getDirectory()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dir = await (root as any).getDirectoryHandle(OPFS_DIR, { create: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dir as any).removeEntry(opfs.fileName).catch(() => {})
    } catch { /* best-effort */ }
    return err instanceof Error ? err : new Error(String(err))
  }
}
