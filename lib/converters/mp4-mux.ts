import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

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
  finalize(): Uint8Array
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
}

function build(codec: 'avc' | 'hevc', opts: MuxOpts): MuxerHandle {
  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    fastStart: 'in-memory',
    // Auto-normalize per-track start timestamps to zero. Sources with edit
    // lists or non-zero composition offsets (common in iOS/Android camera
    // captures, especially after the streaming MP4Box demuxer preserves
    // absolute pts) otherwise trip mp4-muxer's "first chunk must have
    // timestamp 0" invariant, kill the fast path, and send the whole
    // encode into the wasm fallback where big files OOM.
    firstTimestampBehavior: 'offset',
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
      return new Uint8Array(target.buffer)
    },
  }
}

export function createAvcMuxer(opts: MuxOpts): MuxerHandle {
  return build('avc', opts)
}

export function createHevcMuxer(opts: MuxOpts): MuxerHandle {
  return build('hevc', opts)
}
