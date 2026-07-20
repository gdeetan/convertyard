import { mp4ToMov } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp4-to-mov',
  title: 'MP4 to MOV Converter',
  subtitle: 'Convert MP4 to MOV for Final Cut Pro and Apple workflows. Near-instant.',
  bestFor: 'Best for editors handing off footage to Apple production pipelines.',
  category: 'video-audio',
  accepts: ['video/mp4'],
  acceptsExt: ['.mp4'],
  outputExt: '.mov',
  convertFn: (files, opts, onProgress) => mp4ToMov(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Why convert MP4 to MOV?',
      a: 'MOV is the QuickTime container format — some older Mac applications, Final Cut Pro projects, and Apple-native workflows specifically expect .mov files. If you\'re handing off video to a production pipeline that requires QuickTime format, this is the tool.',
    },
    {
      q: 'Does this re-encode the video?',
      a: 'No. MP4 and MOV both support H.264 video and AAC audio, so conversion is a container swap — the video and audio streams copy directly with no quality change and no re-encoding time. It\'s near-instant regardless of file size.',
    },
    {
      q: 'Will the file size change?',
      a: 'Barely. The video and audio data is identical — only the container wrapper changes. Expect within 1% of the original file size.',
    },
    {
      q: 'MP4 vs MOV — what actually differs?',
      a: 'Almost nothing. Both formats share the same MPEG-4 foundation. MOV is Apple\'s variant; MP4 is the ISO standard. The main practical difference is that some Apple tools (older versions of Final Cut, iMovie, QuickTime Player 7) default to .mov and may not accept .mp4. Modern Apple software handles both interchangeably.',
    },
    {
      q: 'What can go wrong when converting MP4 to MOV?',
      a: 'If the source MP4 uses a non-H.264 codec (like HEVC/H.265 or VP9), the stream copy may not work correctly in the MOV container — some Apple apps don\'t handle HEVC in MOV. If playback is broken after conversion, the source codec may need transcoding rather than a simple container swap.',
    },
    {
      q: 'Do my MP4 files leave my device when I use this tool?',
      a: 'No. The conversion is a container swap that runs entirely in your browser using ffmpeg.wasm. Your video files never leave your device.',
    },
  ],

  relatedTools: ['mov-to-mp4', 'compress-video', 'mp4-to-mp3', 'extract-audio'],
  relatedArticles: [],

  meta: {
    title: 'MP4 to MOV Converter — ConvertYard',
    description:
      'Convert MP4 to MOV in your browser. Stream copy — no re-encode, no quality loss, near-instant. Batch convert multiple MP4 files at once — no uploads, no account.',
  },
}
