import { flvToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'flv-to-mp4',
  title: 'FLV to MP4 Converter',
  subtitle: 'Convert legacy Flash Video files to MP4. Batch-ready, stays in your browser.',
  bestFor: 'Best for rescuing old FLV recordings, screen captures, or Flash-era video archives and making them play on modern devices.',
  category: 'video-audio',
  accepts: ['video/x-flv', 'video/flv'],
  acceptsExt: ['.flv'],
  outputExt: '.mp4',
  convertFn: (files, opts, onProgress) => flvToMp4(files, opts, onProgress),

  options: [
    {
      type: 'dropdown',
      name: 'quality',
      label: 'Quality',
      choices: [
        { value: 'best',   label: 'Best (larger file)' },
        { value: 'better', label: 'Better (balanced)' },
        { value: 'good',   label: 'Good (smaller file)' },
      ],
      default: 'better',
      hint: 'Controls the H.264 CRF value. Better is the right choice for most files.',
    },
  ],

  faq: [
    {
      q: 'Why convert FLV to MP4?',
      a: 'FLV (Flash Video) is a legacy Adobe format from the 2000s that requires the Adobe Flash Player plugin to play — a plugin discontinued in 2020. Modern browsers, phones, and streaming platforms do not support FLV at all. MP4 with H.264 plays on every device without any plugins.',
    },
    {
      q: 'Will my video quality change after conversion?',
      a: 'The conversion re-encodes video to H.264, which involves a slight quality trade-off. At the Better setting (CRF 23) the difference is not visible on typical content. Use Best (CRF 18) if you need the highest fidelity.',
    },
    {
      q: 'Does my FLV file get uploaded anywhere?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm — a full media engine compiled to WebAssembly. Your video never touches a server.',
    },
    {
      q: 'Can I convert multiple FLV files at once?',
      a: 'Yes. Drop as many FLV files as you need. Each converts separately in your browser and the results download as a ZIP. No queue, no upload limit.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'No hard limit. The constraint is your device\'s available RAM. Files under 500 MB convert without issue on most desktops. Very large FLV files may require a machine with sufficient memory.',
    },
    {
      q: 'My FLV has no audio — will the MP4 still work?',
      a: 'Yes. ffmpeg.wasm handles video-only FLV files. The output MP4 will contain only the video track, which is valid and playable.',
    },
  ],

  relatedTools: ['avi-to-mp4', 'mkv-to-mp4', 'compress-video', 'mov-to-mp4'],
  relatedArticles: [],

  meta: {
    title: 'FLV to MP4 Converter — ConvertYard',
    description:
      'Convert FLV Flash Video to MP4 in your browser. H.264 video, AAC audio, plays on every device. Batch convert multiple FLV files at once — no uploads, no account.',
  },
}
