/**
 * mp3-to-mp4-mediabunny.ts
 *
 * Fast MP3→MP4 passthrough using Mediabunny. Pre-encoded MP3 packets are muxed
 * directly into MP4 without decode/re-encode. A trivial black canvas is encoded
 * via WebCodecs to produce the video track (1-fps AVC, tiny bitrate).
 *
 * Use isMp3PassthroughSupported() to gate; falls back to ffmpeg.wasm otherwise.
 */

// ---------------------------------------------------------------------------
// Capability detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the environment can run the Mediabunny MP3 passthrough
 * path. Requirements:
 *   - VideoEncoder (WebCodecs) present
 *   - OffscreenCanvas present
 *   - Not mobile (iOS / Android)
 *   - Not an iPad masquerading as Mac (maxTouchPoints > 1 + Macintosh UA)
 *
 * Unlike isMediabunnySupported() we do NOT require OPFS — we use BufferTarget.
 */
export function isMp3PassthroughSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  if (typeof VideoEncoder === 'undefined') return false
  if (typeof OffscreenCanvas === 'undefined') return false
  const ua = navigator.userAgent
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return false
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return false
  return true
}

// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------

export async function mp3ToMp4Passthrough(
  file: File,
  opts: {
    w: number
    h: number
    bgColor: string       // hex e.g. '#000000'
    trimStartSec: number  // 0 = no trim at start
    trimEndSec: number    // 0 = no trim at end
  },
  onProgress?: (pct: number) => void,
): Promise<File> {
  try {
    return await _mp3ToMp4Passthrough(file, opts, onProgress)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`mp3 passthrough failed: ${msg}`)
  }
}

async function _mp3ToMp4Passthrough(
  file: File,
  opts: { w: number; h: number; bgColor: string; trimStartSec: number; trimEndSec: number },
  onProgress?: (pct: number) => void,
): Promise<File> {
  const report = (pct: number) => onProgress?.(Math.round(pct))

  report(0)

  // Dynamic import — keeps mediabunny out of the initial JS bundle.
  const {
    Input,
    Output,
    BlobSource,
    BufferTarget,
    Mp4OutputFormat,
    ALL_FORMATS,
    EncodedAudioPacketSource,
    EncodedPacketSink,
    EncodedPacket: MbEncodedPacket,
    CanvasSource,
  } = await import('mediabunny')

  report(2)

  // ------------------------------------------------------------------
  // Probe the MP3 source
  // ------------------------------------------------------------------
  const probeInput = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  let durationSec: number
  let codec: string | null

  try {
    const audioTrack = await probeInput.getPrimaryAudioTrack()
    if (!audioTrack) {
      throw new Error('No audio track found in file')
    }
    durationSec = await probeInput.computeDuration()
    codec = await audioTrack.getCodec()
  } finally {
    probeInput.dispose()
  }

  if (!codec) {
    throw new Error('Could not detect audio codec — file may be corrupt')
  }

  report(5)

  // ------------------------------------------------------------------
  // Determine effective duration after trim
  // ------------------------------------------------------------------
  const { trimStartSec, trimEndSec } = opts
  const effectiveEnd = trimEndSec > 0 ? Math.min(trimEndSec, durationSec) : durationSec
  const effectiveStart = trimStartSec > 0 ? Math.min(trimStartSec, effectiveEnd) : 0
  const effectiveDuration = Math.max(0, effectiveEnd - effectiveStart)

  if (effectiveDuration <= 0) {
    throw new Error('Trim range produces an empty clip')
  }

  const { w, h, bgColor } = opts

  // ------------------------------------------------------------------
  // Build output
  // ------------------------------------------------------------------
  const bufTarget = new BufferTarget()
  const output = new Output({ format: new Mp4OutputFormat(), target: bufTarget })

  // Audio: passthrough MP3 packets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioSrc = new EncodedAudioPacketSource(codec as any)
  output.addAudioTrack(audioSrc)

  // Video: single black OffscreenCanvas, 1-fps AVC, low bitrate
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable')
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)

  const videoSrc = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: 100_000,
  })
  output.addVideoTrack(videoSrc)

  await output.start()
  report(8)

  // ------------------------------------------------------------------
  // Feed audio packets
  // ------------------------------------------------------------------
  const feedInput = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })

  try {
    const audioTrack = await feedInput.getPrimaryAudioTrack()
    if (!audioTrack) throw new Error('No audio track on second open')

    // MP3's getDecoderConfig() returns null in Mediabunny, which leaves the
    // muxer without the info it needs to write a valid mp4a/mp3 track header —
    // the output file then plays with no audio. Build the config ourselves
    // from the track's sample rate and channel count.
    let decoderConfig: AudioDecoderConfig | null = null
    try {
      decoderConfig = await audioTrack.getDecoderConfig()
    } catch {
      // fall through
    }
    if (!decoderConfig) {
      const sampleRate = await audioTrack.getSampleRate()
      const numberOfChannels = audioTrack.numberOfChannels
      decoderConfig = { codec, sampleRate, numberOfChannels }
    }

    const sink = new EncodedPacketSink(audioTrack)

    // Estimate total packet count for progress (best-effort, not required)
    let totalPackets = 0
    try {
      const stats = await audioTrack.computePacketStats()
      totalPackets = stats?.packetCount ?? 0
    } catch {
      // ignore — progress will be time-based fallback
    }

    let packetIndex = 0
    let tsOffset = 0          // shift so trimmed output starts at t=0
    let tsOffsetSet = false
    let isFirstPacket = true
    let lastProgressPct = 8
    let lastProgressTime = Date.now()

    for await (const packet of sink.packets()) {
      const packetEnd = packet.timestamp + packet.duration

      // Skip packets entirely before trim start
      if (trimStartSec > 0 && packetEnd <= effectiveStart) {
        packetIndex++
        continue
      }

      // Stop after trim end
      if (trimEndSec > 0 && packet.timestamp >= effectiveEnd) {
        break
      }

      // On first kept packet, record timestamp offset so output starts at 0
      if (!tsOffsetSet) {
        tsOffset = packet.timestamp
        tsOffsetSet = true
      }

      const shiftedTs = packet.timestamp - tsOffset
      const shifted = new MbEncodedPacket(
        packet.data,
        packet.type,
        shiftedTs,
        packet.duration,
        packet.sequenceNumber,
      )

      // First packet: pass the decoder config metadata (always available now)
      if (isFirstPacket) {
        await audioSrc.add(shifted, { decoderConfig } as EncodedAudioChunkMetadata)
        isFirstPacket = false
      } else {
        await audioSrc.add(shifted)
      }

      packetIndex++

      // Progress: ~every 500ms or ~5% of packets
      const now = Date.now()
      const shouldReport =
        now - lastProgressTime >= 500 ||
        (totalPackets > 0 && packetIndex / totalPackets - lastProgressPct / 100 >= 0.05)

      if (shouldReport) {
        const audioPct = totalPackets > 0
          ? (packetIndex / totalPackets) * 80
          : Math.min(80, (shiftedTs / effectiveDuration) * 80)
        const pct = 8 + audioPct
        report(pct)
        lastProgressPct = pct
        lastProgressTime = now
      }
    }
  } finally {
    feedInput.dispose()
  }

  report(88)

  // ------------------------------------------------------------------
  // Feed video: one black frame per second across effective duration
  // ------------------------------------------------------------------
  const frameCount = Math.max(1, Math.floor(effectiveDuration))
  for (let i = 0; i < frameCount; i++) {
    await videoSrc.add(i, 1)
  }
  // Final partial-second frame if needed
  const remainder = effectiveDuration - frameCount
  if (remainder > 0.01) {
    await videoSrc.add(frameCount, remainder)
  }

  report(95)

  // ------------------------------------------------------------------
  // Finalize and return
  // ------------------------------------------------------------------
  await output.finalize()

  report(100)

  const bytes = bufTarget.buffer
  if (!bytes) throw new Error('BufferTarget produced no data after finalize')

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([bytes], `${baseName}.mp4`, { type: 'video/mp4' })
}
