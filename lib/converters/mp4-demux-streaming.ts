// Streaming MP4 demuxer backed by MP4Box.js. Reads the source File in 4 MB
// chunks via Blob.slice() so files above the ~2 GB v8 ArrayBuffer ceiling are
// parseable — the custom parser in mp4-demux.ts needs the whole file loaded
// via file.arrayBuffer() and blows up on desktop >2 GB sources.
//
// Returns the same DemuxedMp4 shape as demuxMp4File so callers (currently
// compress-video-worker.ts) can swap between the two without code changes.
//
// Only the source read is streaming — collected samples still live in memory
// as an array of Uint8Arrays. That's fine for desktop (Chrome/Firefox can
// hold ~4–8 GB of small allocations), and matches the existing DemuxedMp4
// contract so consumers don't need to rewrite around a stream API.

import { createFile, DataStream, Endianness, type ISOFile, type Sample } from 'mp4box'
import type { DemuxedAudio, DemuxedAudioSample } from './mp4-audio-demux'
import type { DemuxedMp4 } from './mp4-demux'
import {
  avcCodecString,
  hevcCodecStringFromHvcC,
  type DemuxSample,
  type DemuxedVideo,
} from './mp4-video-demux'

const READ_CHUNK_BYTES = 4 * 1024 * 1024

// Matrix rotation from the 3x3 tkhd matrix. Same math as parseTkhdRotation
// in mp4-video-demux.ts, but reading from MP4Box's parsed matrix array
// (entries are already 16.16 fixed-point Int32).
function rotationFromMatrix(matrix: ArrayLike<number> | undefined): 0 | 90 | 180 | 270 {
  if (!matrix || matrix.length < 6) return 0
  const a = matrix[0] / 65536
  const b = matrix[1] / 65536
  const c = matrix[3] / 65536
  const d = matrix[4] / 65536
  const near = (x: number, target: number) => Math.abs(x - target) < 0.01
  if (near(a, 0) && near(b, 1) && near(c, -1) && near(d, 0)) return 90
  if (near(a, -1) && near(b, 0) && near(c, 0) && near(d, -1)) return 180
  if (near(a, 0) && near(b, -1) && near(c, 1) && near(d, 0)) return 270
  return 0
}

// Serialize an avcC or hvcC or esds box back to bytes for VideoDecoder /
// AudioDecoder .configure({ description }). MP4Box parses these lazily —
// entry.avcC / entry.hvcC / entry.esds are Box instances with a .write()
// method that emits header+payload. Skip the 8-byte box header to leave
// just the config payload the decoders expect.
function serializeDescriptionBox(box: { write(stream: DataStream): void }): Uint8Array {
  const stream = new DataStream(undefined, 0, Endianness.BIG_ENDIAN)
  box.write(stream)
  const full = new Uint8Array(stream.buffer)
  // Strip the 8-byte box header (size + type). All three box types use the
  // small header (no extended 64-bit size) in practice.
  return full.subarray(8)
}

// Map an MP4Box codec string to the WebCodecs codec format:
//   "avc1.640028" → "avc1.640028"   (already correct)
//   "hvc1.2.4.L120.B0" → "hvc1.2.4.L120.B0"  (already correct)
//   "mp4a.40.2" → "mp4a.40.2"       (already correct)
// So we mostly pass through. Kept as a function in case future codec quirks
// need per-format normalization.
function normalizeCodecString(raw: string): string {
  return raw
}

type StsdEntry = {
  type?: string
  avcC?: { write(stream: DataStream): void }
  hvcC?: { write(stream: DataStream): void }
  esds?: { esd?: { descs?: Array<{ tag: number; data?: Uint8Array; descs?: Array<{ tag: number; data?: Uint8Array }> }> } }
}

function getVideoDescription(entry: StsdEntry): {
  codec: 'avc' | 'hevc'
  description: Uint8Array
  codecString: string
} | null {
  if (entry.avcC) {
    const description = serializeDescriptionBox(entry.avcC)
    if (description.length < 4) return null
    return {
      codec: 'avc',
      description,
      codecString: avcCodecString(description[1], description[2], description[3]),
    }
  }
  if (entry.hvcC) {
    const description = serializeDescriptionBox(entry.hvcC)
    return {
      codec: 'hevc',
      description,
      codecString: hevcCodecStringFromHvcC(description),
    }
  }
  return null
}

// AAC AudioSpecificConfig lives inside the esds → ES_Descriptor →
// DecoderConfigDescriptor → DecoderSpecificInfo (tag 0x05). MP4Box parses
// the descriptor tree eagerly, so we walk it to find that leaf. Fallback:
// build a minimal 2-byte AAC-LC config from sample rate + channel count so
// AudioDecoder still initializes.
function getAudioDescription(
  entry: StsdEntry,
  sampleRate: number,
  channelCount: number,
): Uint8Array {
  const descs = entry.esds?.esd?.descs
  if (descs) {
    for (const d of descs) {
      // ES_Descriptor children
      if (d.descs) {
        for (const child of d.descs) {
          if (child.tag === 0x05 && child.data) return child.data
        }
      }
      if (d.tag === 0x05 && d.data) return d.data
    }
  }
  return buildAacLcConfig(sampleRate, channelCount)
}

const AAC_SAMPLE_RATE_INDEX: Record<number, number> = {
  96000: 0, 88200: 1, 64000: 2, 48000: 3, 44100: 4, 32000: 5,
  24000: 6, 22050: 7, 16000: 8, 12000: 9, 11025: 10, 8000: 11, 7350: 12,
}

function buildAacLcConfig(sampleRate: number, channelCount: number): Uint8Array {
  const objectType = 2 // AAC-LC
  const freqIdx = AAC_SAMPLE_RATE_INDEX[sampleRate] ?? 15
  const chanCfg = Math.min(Math.max(channelCount, 1), 7)
  const b0 = (objectType << 3) | (freqIdx >> 1)
  const b1 = ((freqIdx & 0x01) << 7) | (chanCfg << 3)
  return new Uint8Array([b0, b1])
}

// mp4a.40.<profile> — profile matches audio object type (2=LC, 5=HE-AAC).
function aacCodecString(description: Uint8Array): string {
  if (description.length < 1) return 'mp4a.40.2'
  const objectType = description[0] >> 3
  return `mp4a.40.${objectType}`
}

type CollectorState = {
  videoSamples: DemuxSample[]
  audioSamples: DemuxedAudioSample[]
  videoTrackId: number | null
  audioTrackId: number | null
  videoTimescale: number
  audioTimescale: number
  error: Error | null
}

async function readChunk(file: File, start: number, end: number): Promise<ArrayBuffer> {
  const slice = file.slice(start, Math.min(end, file.size))
  return slice.arrayBuffer()
}

// Attach a fileStart property to the ArrayBuffer as MP4Box requires. Cast
// via unknown because MP4BoxBuffer is nominally an ArrayBuffer + fileStart.
function withFileStart(buffer: ArrayBuffer, fileStart: number): ArrayBuffer {
  ;(buffer as ArrayBuffer & { fileStart: number }).fileStart = fileStart
  return buffer
}

export async function demuxMp4FileStreaming(
  file: File,
  opts: { includeAudio?: boolean } = {},
): Promise<DemuxedMp4 | null> {
  if (file.size < 16) return null

  const mp4boxfile: ISOFile = createFile()
  const state: CollectorState = {
    videoSamples: [],
    audioSamples: [],
    videoTrackId: null,
    audioTrackId: null,
    videoTimescale: 1,
    audioTimescale: 1,
    error: null,
  }

  const built: { video: DemuxedVideo | null; audio: DemuxedAudio | null } = {
    video: null,
    audio: null,
  }
  let hasAudioTrack = false
  let readyResolved = false

  const readyPromise = new Promise<void>((resolve, reject) => {
    mp4boxfile.onError = (_module, message) => {
      state.error = new Error(`mp4box: ${message}`)
      if (!readyResolved) reject(state.error)
    }
    mp4boxfile.onReady = (info) => {
      try {
        readyResolved = true
        const videoTrack = info.videoTracks[0]
        hasAudioTrack = info.audioTracks.length > 0

        if (videoTrack) {
          // getTrackById returns the raw trakBox; navigate to stsd entries.
          // MP4Box's stbl.stsd.entries[0] holds the sample entry with avcC/hvcC.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const trak = (mp4boxfile as any).getTrackById(videoTrack.id)
          const entries: StsdEntry[] = trak?.mdia?.minf?.stbl?.stsd?.entries ?? []
          const entry = entries[0]
          const desc = entry ? getVideoDescription(entry) : null
          if (desc) {
            const rotation = rotationFromMatrix(videoTrack.matrix as unknown as number[])
            built.video = {
              codec: desc.codec,
              codecString: normalizeCodecString(videoTrack.codec) || desc.codecString,
              description: desc.description,
              width: videoTrack.video?.width ?? videoTrack.track_width ?? 0,
              height: videoTrack.video?.height ?? videoTrack.track_height ?? 0,
              rotation,
              samples: [],
            }
            state.videoTrackId = videoTrack.id
            state.videoTimescale = videoTrack.timescale
            mp4boxfile.setExtractionOptions(videoTrack.id, null, { nbSamples: 100 })
          }
        }

        if (opts.includeAudio && info.audioTracks.length > 0) {
          const audioTrack = info.audioTracks[0]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const trak = (mp4boxfile as any).getTrackById(audioTrack.id)
          const entries: StsdEntry[] = trak?.mdia?.minf?.stbl?.stsd?.entries ?? []
          const entry = entries[0]
          if (entry) {
            const sampleRate = audioTrack.audio?.sample_rate ?? 44100
            const channels = audioTrack.audio?.channel_count ?? 2
            const description = getAudioDescription(entry, sampleRate, channels)
            built.audio = {
              codecString: aacCodecString(description),
              sampleRate,
              numberOfChannels: channels,
              description,
              samples: [],
            }
            state.audioTrackId = audioTrack.id
            state.audioTimescale = audioTrack.timescale
            mp4boxfile.setExtractionOptions(audioTrack.id, null, { nbSamples: 100 })
          }
        }

        mp4boxfile.start()
        resolve()
      } catch (err) {
        state.error = err instanceof Error ? err : new Error(String(err))
        reject(state.error)
      }
    }
    mp4boxfile.onSamples = (id, _user, samples: Sample[]) => {
      if (state.error) return
      if (id === state.videoTrackId) {
        for (const s of samples) {
          if (!s.data) continue
          const data = new Uint8Array(s.data.byteLength)
          data.set(s.data)
          state.videoSamples.push({
            data,
            timestampUs: Math.round((s.cts / s.timescale) * 1_000_000),
            durationUs: Math.round((s.duration / s.timescale) * 1_000_000),
            keyframe: s.is_sync,
          })
        }
        // Free MP4Box's internal buffer for samples we've copied out.
        mp4boxfile.releaseUsedSamples(id, samples[samples.length - 1]?.number ?? 0)
      } else if (id === state.audioTrackId) {
        for (const s of samples) {
          if (!s.data) continue
          const data = new Uint8Array(s.data.byteLength)
          data.set(s.data)
          state.audioSamples.push({
            data,
            timestampUs: Math.round((s.cts / s.timescale) * 1_000_000),
            durationUs: Math.round((s.duration / s.timescale) * 1_000_000),
          })
        }
        mp4boxfile.releaseUsedSamples(id, samples[samples.length - 1]?.number ?? 0)
      }
    }
  })

  try {
    // Stream the source in chunks. MP4Box.appendBuffer returns
    // nextSeekPosition — a byte offset it needs next (used when moov is at
    // the end of the file; MP4Box asks us to jump to the moov offset before
    // it can call onReady). Honor it by resetting our read cursor.
    let cursor = 0
    let sawReady = false
    let seekReadyDeadline = 0
    while (cursor < file.size) {
      const chunkEnd = Math.min(cursor + READ_CHUNK_BYTES, file.size)
      const raw = await readChunk(file, cursor, chunkEnd)
      const buf = withFileStart(raw, cursor)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const next = mp4boxfile.appendBuffer(buf as any, chunkEnd >= file.size)
      cursor = chunkEnd
      if (state.error) throw state.error

      // If MP4Box wants a specific offset next (typically moov-at-end),
      // seek there. Guard against infinite loops with a deadline.
      if (typeof next === 'number' && next > cursor) {
        if (seekReadyDeadline === 0) seekReadyDeadline = Date.now() + 30_000
        if (Date.now() > seekReadyDeadline) throw new Error('mp4box: seek loop stalled')
        cursor = next
      }

      if (!sawReady && readyResolved) sawReady = true
    }
    mp4boxfile.flush()

    await readyPromise
  } catch (err) {
    if (!state.error) state.error = err instanceof Error ? err : new Error(String(err))
    return null
  }

  if (state.error) return null
  if (!built.video && !built.audio) return null

  if (built.video) built.video.samples = state.videoSamples
  if (built.audio) built.audio.samples = state.audioSamples

  return { video: built.video, audio: built.audio, hasAudioTrack }
}
