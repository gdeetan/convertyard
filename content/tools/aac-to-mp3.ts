import { aacToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'aac-to-mp3',
  title: 'AAC to MP3 Converter',
  subtitle: 'Convert AAC to MP3. Batch-ready, stays in your browser.',
  bestFor: 'Best for making iPhone recordings or iTunes audio play on car stereos, older phones, or non-Apple gear.',
  category: 'video-audio',
  accepts: ['audio/aac', 'audio/x-aac', 'audio/mp4'],
  acceptsExt: ['.aac', '.m4a'],
  outputExt: '.mp3',
  convertFn: (files, opts, onProgress) => aacToMp3(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Does my AAC file leave my device to convert it?',
      a: 'No. Conversion runs in your browser using ffmpeg.wasm — a full media engine compiled to WebAssembly. Your audio never touches a server.',
    },
    {
      q: 'Will quality change after converting AAC to MP3?',
      a: 'Yes, slightly. Both AAC and MP3 are lossy formats, so you go through a second round of compression. The output is good enough for playback and sharing, but not identical to the source. Keep the original AAC if you need to archive or re-edit.',
    },
    {
      q: 'Does this work with M4A files?',
      a: 'Yes. M4A is AAC audio inside an MPEG-4 container — this tool accepts both .aac and .m4a files and outputs MP3.',
    },
    {
      q: 'When should I use AAC-to-MP3 instead of just keeping the AAC?',
      a: 'Convert when the destination device or software does not support AAC — common cases are older car stereos, some Android media players, and legacy audio software. For anything modern, AAC is the better format.',
    },
    {
      q: 'What happens if the AAC file is already low bitrate?',
      a: 'The output MP3 will reflect the same low quality — converting cannot recover audio detail that was discarded during the original AAC encoding. If the source sounds bad, the MP3 will too.',
    },
  ],

  relatedTools: ['mp4-to-mp3', 'm4a-to-mp3', 'mp3-to-wav', 'audio-trimmer'],
  relatedArticles: [],

  meta: {
    title: 'AAC to MP3 Converter — ConvertYard',
    description:
      'Convert AAC and M4A files to MP3 in your browser. Works with iTunes and iPhone audio. Batch convert at once — no uploads, no account.',
  },
}
