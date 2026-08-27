import { mp3ToAac } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp3-to-aac',
  title: 'MP3 to AAC Converter',
  subtitle: 'Convert MP3 to AAC. Batch-ready, stays in your browser.',
  bestFor: 'Best for importing MP3s into Apple-ecosystem video projects or iOS apps that require native AAC audio.',
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/mp3'],
  acceptsExt: ['.mp3'],
  outputExt: '.aac',
  convertFn: (files, opts, onProgress) => mp3ToAac(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Does my MP3 file leave my device to convert it?',
      a: 'No. Conversion runs in your browser using ffmpeg.wasm — a full media engine compiled to WebAssembly. Your audio never touches a server.',
    },
    {
      q: 'Why convert MP3 to AAC?',
      a: 'AAC is the default audio format for Apple devices and produces better quality than MP3 at the same file size. Use this when importing audio into iMovie, Final Cut Pro, or any iOS app that expects AAC, or when you need the file to play natively on Apple hardware without extra codecs.',
    },
    {
      q: 'Will quality improve after converting to AAC?',
      a: 'No. MP3 is lossy — quality lost during the original MP3 encoding is permanent. Converting to AAC re-encodes the already-compressed audio, so the output matches the MP3 source quality, not the original recording.',
    },
    {
      q: 'What bitrate does the output use?',
      a: '192 kbps AAC — a solid balance between file size and quality. At this bitrate, AAC sounds comparable to a 256 kbps MP3, and the file is roughly 40% smaller than a 320 kbps MP3.',
    },
    {
      q: 'Can I convert multiple MP3 files at once?',
      a: 'Yes. Drop as many files as you need. Each converts separately in your browser and results download as a ZIP.',
    },
  ],

  relatedTools: ['compress-mp3', 'aac-to-mp3', 'mp3-to-wav', 'mp3-to-ogg', 'm4a-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'MP3 to AAC Converter — ConvertYard',
    description:
      'Convert MP3 to AAC in your browser. 192 kbps output, works natively on Apple devices. Batch convert multiple MP3 files at once — no uploads, no account.',
  },
}
