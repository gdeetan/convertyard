import { aacToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'aac-to-mp3',
  title: 'AAC to MP3 Converter',
  subtitle: 'Convert AAC to MP3. Batch-ready, stays in your browser.',
  category: 'video-audio',
  accepts: ['audio/aac', 'audio/x-aac', 'audio/mp4'],
  acceptsExt: ['.aac', '.m4a'],
  outputExt: '.mp3',
  convertFn: (files, opts, onProgress) => aacToMp3(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Why convert AAC to MP3?',
      a: 'AAC is the default audio format on Apple devices — iTunes purchases, Voice Memos, and most iPhone recordings save as AAC or M4A. MP3 has broader compatibility with older hardware, car stereos, non-Apple devices, and software that predates AAC support.',
    },
    {
      q: 'Will quality change after conversion?',
      a: 'Both AAC and MP3 are lossy formats, so converting between them involves a second round of lossy compression. The output quality is good but not identical to the source. For archiving, keep the original AAC. For sharing or compatibility, MP3 is fine.',
    },
    {
      q: 'Does this work with M4A files?',
      a: 'Yes. M4A is an AAC audio stream inside an MPEG-4 container — this tool handles both .aac and .m4a files.',
    },
    {
      q: 'Can I convert multiple AAC files at once?',
      a: 'Yes. Drop as many as you need. Each file converts separately in your browser, and the results download as a ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files do not leave your device.',
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
