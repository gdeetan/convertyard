import { mp3ToOgg } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp3-to-ogg',
  title: 'MP3 to OGG Converter',
  subtitle: 'Convert MP3 to OGG Vorbis for games, Linux apps, and open-source projects.',
  bestFor: 'Best for game developers and Linux users who need patent-free audio.',
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
      a: 'Not all. OGG plays natively in Chrome, Firefox, and most Android devices. Safari and iOS do not support OGG — they require MP3 or AAC. If you need cross-platform compatibility, stay with MP3. For web use, always provide an MP3 fallback alongside any OGG file.',
    },
    {
      q: 'MP3 to OGG vs staying with MP3 — when does OGG actually matter?',
      a: 'OGG matters when the target system explicitly requires a patent-free codec. Godot Engine, for example, uses OGG as its primary audio format. Web browser games often prefer OGG. Outside of those contexts, MP3 has better device support and there is little reason to convert.',
    },
    {
      q: 'What can go wrong when converting MP3 to OGG?',
      a: 'The most common issue is that the output OGG won\'t play on iOS or in iTunes — those environments don\'t support OGG. Additionally, since you\'re re-encoding a lossy file to another lossy format, at very low bitrates (under 96 kbps) you may notice audible degradation. Use 128 kbps or higher to keep quality acceptable.',
    },
    {
      q: 'Do my MP3 files leave my device when I convert them here?',
      a: 'No. Converting MP3 to OGG runs entirely in your browser using ffmpeg.wasm. Your audio files never leave your device — ConvertYard\'s servers only serve the page code and never see your files.',
    },
  ],

  relatedTools: ['compress-mp3', 'ogg-to-mp3', 'mp3-to-wav', 'mp3-to-aac', 'audio-trimmer'],
  relatedArticles: [],

  meta: {
    title: 'MP3 to OGG Converter — ConvertYard',
    description:
      'Convert MP3 to OGG Vorbis in your browser. Open, patent-free audio for games and Linux. Batch convert multiple MP3 files at once — no uploads, no account.',
  },
}
