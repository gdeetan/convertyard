import { mp4ToMov } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp4-to-mov',
  title: 'MP4 to MOV Converter',
  subtitle: 'Convert MP4 to MOV. Batch-ready, stays in your browser.',
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
      q: 'Can I convert multiple MP4 files at once?',
      a: 'Yes. Drop as many as you need. Each file converts separately in your browser, and the results download as a ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files do not leave your device.',
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
