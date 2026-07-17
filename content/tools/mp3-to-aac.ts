import { mp3ToAac } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp3-to-aac',
  title: 'MP3 to AAC Converter',
  subtitle: 'Convert MP3 to AAC. Batch-ready, stays in your browser.',
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/mp3'],
  acceptsExt: ['.mp3'],
  outputExt: '.aac',
  convertFn: (files, opts, onProgress) => mp3ToAac(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Why convert MP3 to AAC?',
      a: 'AAC is the default audio format for Apple devices and generally produces better quality than MP3 at the same file size. If you\'re importing audio into an Apple ecosystem tool, adding sound to a video project, or need audio that plays natively on iOS without additional codecs, AAC is the right choice.',
    },
    {
      q: 'Will quality improve after converting to AAC?',
      a: 'No. MP3 is lossy, so quality reduction from the original encoding is permanent. Converting to AAC re-encodes the already-compressed audio — the output quality matches the MP3 source, not the original recording. For archiving, keep your source files.',
    },
    {
      q: 'What bitrate does the output use?',
      a: '192 kbps — a solid balance between file size and audio quality for most content. This produces files roughly 40% smaller than a 320 kbps MP3 at comparable perceptual quality.',
    },
    {
      q: 'Can I convert multiple MP3 files at once?',
      a: 'Yes. Drop as many as you need. Each file converts separately in your browser, and the results download as a ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files do not leave your device.',
    },
  ],

  relatedTools: ['aac-to-mp3', 'mp3-to-wav', 'mp3-to-ogg', 'm4a-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'MP3 to AAC Converter — ConvertYard',
    description:
      'Convert MP3 to AAC in your browser. 192 kbps output, works natively on Apple devices. Batch convert multiple MP3 files at once — no uploads, no account.',
  },
}
