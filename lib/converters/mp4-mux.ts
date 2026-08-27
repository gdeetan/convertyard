import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export type AacAudioMeta = {
  numberOfChannels: number
  sampleRate: number
  description: Uint8Array
}

export type VideoDecoderConfigDesc = {
  codec: string
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
}

function build(codec: 'avc' | 'hevc', opts: MuxOpts): MuxerHandle {
  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    fastStart: 'in-memory',
    video: {
      codec,
      width: opts.width,
      height: opts.height,
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
