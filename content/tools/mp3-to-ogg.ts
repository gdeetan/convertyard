import { mp3ToOgg } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp3-to-ogg',
  title: 'MP3 to OGG Converter',
  subtitle: 'Convert MP3 to OGG Vorbis. Batch-ready, stays in your browser.',
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/mp3'],
  acceptsExt: ['.mp3'],
  outputExt: '.ogg',
  convertFn: (files, opts, onProgress) => mp3ToOgg(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Why convert MP3 to OGG?',
      a: 'OGG Vorbis is an open, patent-free audio format used in games, Linux systems, and web audio. If you\'re embedding audio in a browser game, using an open-source game engine like Godot, or working in a Linux environment that prefers patent-free codecs, OGG is the target format.',
    },
    {
      q: 'Is OGG better quality than MP3 at the same file size?',
      a: 'Generally yes — OGG Vorbis tends to produce slightly better quality than MP3 at equivalent bitrates, particularly at lower bitrates. However, since this tool converts from MP3 (already lossy), you\'re not recovering original quality — just re-encoding to a different lossy format.',
    },
    {
      q: 'Will OGG files play on all devices?',
      a: 'Not all. OGG plays natively in Chrome, Firefox, and most Android devices. Safari and iOS do not support OGG — they require MP3 or AAC. If you need cross-platform compatibility, stay with MP3.',
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

  relatedTools: ['ogg-to-mp3', 'mp3-to-wav', 'mp3-to-aac', 'audio-trimmer'],
  relatedArticles: [],

  meta: {
    title: 'MP3 to OGG Converter — ConvertYard',
    description:
      'Convert MP3 to OGG Vorbis in your browser. Open, patent-free audio for games and Linux. Batch convert multiple MP3 files at once — no uploads, no account.',
  },
}
