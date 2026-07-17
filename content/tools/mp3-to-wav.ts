import { mp3ToWav } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp3-to-wav',
  title: 'MP3 to WAV Converter',
  subtitle: 'Convert MP3 to WAV. Batch-ready, stays in your browser.',
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/mp3'],
  acceptsExt: ['.mp3'],
  outputExt: '.wav',
  convertFn: (files, opts, onProgress) => mp3ToWav(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Why convert MP3 to WAV?',
      a: 'WAV is an uncompressed audio format required by many DAWs, audio editors, and professional recording tools. If you\'re importing audio into GarageBand, Logic, Ableton, Audacity, or a video editor that requires uncompressed source material, WAV is the right format.',
    },
    {
      q: 'Does converting MP3 to WAV improve quality?',
      a: 'No. MP3 is a lossy format — the quality reduction from the original MP3 encoding is permanent. Converting to WAV produces an uncompressed file of the same audio quality as the MP3 source, not the original recording. The file will be much larger, but not higher quality.',
    },
    {
      q: 'How much larger will the WAV file be?',
      a: 'Significantly larger. A typical 4-minute MP3 at 128 kbps is around 4 MB. The same audio as a 44.1 kHz 16-bit WAV is around 40 MB — roughly 10× larger.',
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

  relatedTools: ['mp4-to-mp3', 'extract-audio', 'audio-trimmer', 'aac-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'MP3 to WAV Converter — ConvertYard',
    description:
      'Convert MP3 to WAV in your browser. Uncompressed audio for DAWs and audio editors. Batch convert multiple MP3 files at once — no uploads, no account.',
  },
}
