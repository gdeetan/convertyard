import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer'

export type AacAudioMeta = {
  numberOfChannels: number
  sampleRate: number
  /** AudioSpecificConfig payload extracted from the esds box. */
  description: Uint8Array
}

export type VideoDecoderConfigDesc = {
  codec: string
  /** avcC box payload (AVC) or hvcC box payload (HEVC). */
  description: Uint8Array
}

export type MuxerHandle = {
  addVideoChunk(chunk: EncodedVideoChunk): void
  addAudioChunk(chunk: EncodedAudioChunk): void
  /** In-memory targets return the finished MP4; stream targets return null. */
  finalize(): Uint8Array | null
}

type MuxOpts = {
  width: number
  height: number
  hasAudio: boolean
  videoDecoderConfig: VideoDecoderConfigDesc
  audio?: AacAudioMeta
  /**
   * Clockwise display rotation in degrees. Written into the output tkhd matrix
   * so iOS-recorded portrait video (landscape sensor pixels + 90° metadata)
   * plays back right-side-up instead of sideways.
   */
  rotation?: 0 | 90 | 180 | 270
  /**
   * When set, output is streamed to an OPFS-backed FileSystemWritableFileStream
   * instead of accumulated in memory. Required for >2 GB files (V8 caps a
   * single Uint8Array at ~2 GB). Caller is responsible for closing the stream
   * and reading the resulting file after finalize().
   */
  streamTarget?: FileSystemWritableFileStream
}

function build(codec: 'avc' | 'hevc', opts: MuxOpts): MuxerHandle {
  const bufferTarget = opts.streamTarget ? null : new ArrayBufferTarget()
  const muxer = new Muxer({
    target: opts.streamTarget
      ? new FileSystemWritableFileStreamTarget(opts.streamTarget)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      : bufferTarget!,
    // Stream targets need a fixed moov reservation up front (there's no way
    // to seek back after we've handed bytes to the disk stream). Fragmented
    // MP4 avoids the seek-back entirely — plays fine in Chrome/Edge/Safari/
    // ffplay/VLC and is the canonical shape for streaming muxers.
    fastStart: opts.streamTarget ? 'fragmented' : 'in-memory',
    video: {
      codec,
      width: opts.width,
      height: opts.height,
      rotation: opts.rotation ?? 0,
    },
    audio: opts.hasAudio && opts.audio
      ? {
          codec: 'aac',
          numberOfChannels: opts.audio.numberOfChannels,
          sampleRate: opts.audio.sampleRate,
        }
      : undefined,
  })

  const videoMeta: EncodedVideoChunkMetadata = {
    decoderConfig: {
      codec: opts.videoDecoderConfig.codec,
      description: opts.videoDecoderConfig.description,
      codedWidth: opts.width,
      codedHeight: opts.height,
    },
  }

  const audioMeta: EncodedAudioChunkMetadata | undefined = opts.hasAudio && opts.audio
    ? {
        decoderConfig: {
          codec: 'mp4a.40.2',
          numberOfChannels: opts.audio.numberOfChannels,
          sampleRate: opts.audio.sampleRate,
          description: opts.audio.description,
        },
      }
    : undefined

  return {
    addVideoChunk(chunk) {
      muxer.addVideoChunk(chunk, videoMeta)
    },
    addAudioChunk(chunk) {
      if (!audioMeta) throw new Error('addAudioChunk called on video-only muxer')
      muxer.addAudioChunk(chunk, audioMeta)
    },
    finalize() {
      muxer.finalize()
      if (bufferTarget) return new Uint8Array(bufferTarget.buffer)
      return null
    },
  }
}

export function createAvcMuxer(opts: MuxOpts): MuxerHandle {
  return build('avc', opts)
}

export function createHevcMuxer(opts: MuxOpts): MuxerHandle {
  return build('hevc', opts)
}
