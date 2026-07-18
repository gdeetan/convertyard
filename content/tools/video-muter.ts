import { muteVideo } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'video-muter',
  title: 'Mute Video',
  subtitle: 'Remove audio from any video. Stream-copied — instant, no quality loss.',
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
      q: 'Are my files uploaded to a server?',
      a: "Never. All processing runs in your browser using ffmpeg.wasm. Your files never leave your device.",
    },
    {
      q: 'How fast is muting?',
      a: 'Near-instant. The video track is copied without re-encoding — only the audio track is removed. A 2 GB video takes the same time as a 10 MB one.',
    },
    {
      q: 'Does muting affect video quality?',
      a: 'No. The video track is copied byte-for-byte. No re-encoding means no quality loss.',
    },
    {
      q: 'Can I mute multiple videos at once?',
      a: 'Yes. Drop as many files as you need — results are packaged in a single ZIP.',
    },
    {
      q: 'What is the output format?',
      a: 'MP4. The video codec and resolution are preserved exactly as in the original. Only the audio track is stripped.',
    },
  ],
  relatedTools: ['extract-audio', 'video-trimmer', 'compress-video', 'video-speed'],
  relatedArticles: [],
  meta: {
    title: 'Mute Video — Remove Audio from Any Video — ConvertYard',
    description:
      'Remove the audio track from MP4, MOV, MKV, AVI, and WebM videos in your browser. Stream-copied — instant processing, no quality loss, no uploads.',
  },
}
