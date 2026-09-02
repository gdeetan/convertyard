import { demuxMp4Audio, hasAudioTrack, type DemuxedAudio } from './mp4-audio-demux'
import { demuxMp4Video, type DemuxedVideo } from './mp4-video-demux'

export type DemuxedMp4 = {
  video: DemuxedVideo | null
  audio: DemuxedAudio | null
  // True when the source contains a 'soun' track — lets callers distinguish
  // "silent source" from "audio present but unparseable".
  hasAudioTrack: boolean
}

export async function demuxMp4File(
  file: File,
  opts: { includeAudio?: boolean } = {},
): Promise<DemuxedMp4 | null> {
  if (file.size < 16 || file.size > 4 * 1024 * 1024 * 1024) return null
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const video = demuxMp4Video(bytes)
    const audio = opts.includeAudio ? demuxMp4Audio(bytes) : null
    return { video, audio, hasAudioTrack: hasAudioTrack(bytes) }
  } catch {
    return null
  }
}
