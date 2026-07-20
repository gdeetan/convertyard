import { aviToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avi-to-mp4',
  title: 'AVI to MP4 Converter',
  subtitle: 'Convert AVI to MP4. Batch-ready, stays in your browser.',
  bestFor: 'Best for making old Windows video files play on phones, smart TVs, or any platform that rejects AVI.',
  category: 'video-audio',
  accepts: ['video/x-msvideo', 'video/avi'],
  acceptsExt: ['.avi'],
  outputExt: '.mp4',
  convertFn: (files, opts, onProgress) => aviToMp4(files, opts, onProgress),

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
      q: 'Why convert AVI to MP4?',
      a: 'AVI is a legacy Windows container from the 1990s. It plays on most desktop software but fails on modern mobile devices, browsers, and streaming platforms. MP4 with H.264 is the universal format — it plays on every phone, tablet, smart TV, and browser without any additional codecs.',
    },
    {
      q: 'Will the video quality change?',
      a: 'The conversion re-encodes the video to H.264, which involves a small quality trade-off. At CRF 23 (Better) the difference is not visible on typical content. Use Best (CRF 18) if you need maximum fidelity.',
    },
    {
      q: 'My AVI has multiple audio tracks — what happens?',
      a: 'ffmpeg.wasm selects the first audio track by default and encodes it to AAC. If your AVI has multiple tracks and you need a specific one, this tool picks the default. Multi-track selection is not supported here.',
    },
    {
      q: 'Can I convert multiple AVI files at once?',
      a: 'Yes. Drop as many as you need. Each file converts separately in your browser, and the results download as a ZIP. No queue, no upload, no per-file count limit.',
    },
    {
      q: 'Does my AVI file leave my device to convert it?',
      a: 'No. Conversion runs in your browser using ffmpeg.wasm — a full media engine compiled to WebAssembly. Your video never touches a server.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'No hard limit. The constraint is your device\'s available RAM. Files under 500 MB convert without issue on most devices. Very large AVI files may require a desktop with sufficient memory.',
    },
  ],

  relatedTools: ['compress-video', 'mov-to-mp4', 'webm-to-mp4', 'mp4-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'AVI to MP4 Converter — ConvertYard',
    description:
      'Convert AVI files to MP4 in your browser. H.264 video, AAC audio, plays on every device. Batch convert multiple AVI files at once — no uploads, no account.',
  },
}
