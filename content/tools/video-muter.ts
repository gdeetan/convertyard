import { muteVideo } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'video-muter',
  title: 'Mute Video',
  subtitle: 'Strip the audio track without re-encoding — a 2 GB video takes the same time as a 10 MB one.',
  bestFor: 'Good for removing the background mic noise from a screen recording before sharing.',
  category: 'video-audio',
  accepts: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-ms-wmv',
  ],
  acceptsExt: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.wmv'],
  outputExt: '.mp4',
  convertFn: muteVideo,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take a moment to load into the browser. Processing itself is fast — the video track is stream-copied without re-encoding.'
      : null
  },
  options: [],
  faq: [
    {
      q: 'How fast is muting?',
      a: 'Near-instant. The video track is copied without re-encoding — only the audio track is removed. A 2 GB video takes the same time as a 10 MB one.',
    },
    {
      q: 'Does muting affect video quality?',
      a: 'No. The video track is copied byte-for-byte. No re-encoding means no quality loss.',
    },
    {
      q: 'What is the output format?',
      a: 'MP4. The video codec and resolution are preserved exactly as in the original. Only the audio track is stripped.',
    },
    {
      q: 'Mute video vs extract audio — what\'s the difference?',
      a: 'Muting keeps the video and removes the audio. Extracting audio keeps the audio and removes the video. Use the Mute Video tool when you want the visual footage without sound. Use the Extract Audio tool when you want the audio track as a standalone file.',
    },
    {
      q: 'What can go wrong when muting a video?',
      a: 'If the source video has no audio track (already silent), the output is identical to the input — no error, just the same file. Files with unusual or corrupt audio tracks may cause the remux to fail; if that happens, try the file individually. Very large files (over 500 MB) may take a moment to load into browser memory before processing starts.',
    },
  ],
  relatedTools: ['extract-audio', 'video-trimmer', 'compress-video', 'video-speed'],
  relatedArticles: [],
  meta: {
    title: 'Remove Audio from a Video — ConvertYard',
    description:
      'Remove the audio track from MP4, MOV, MKV, AVI, and WebM videos in your browser. Stream-copied — instant processing, no quality loss, no uploads.',
  },
}
