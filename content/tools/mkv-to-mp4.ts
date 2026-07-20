import { mkvToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mkv-to-mp4',
  title: 'MKV to MP4 Converter',
  subtitle: 'Convert MKV to MP4. Batch-ready, stays in your browser.',
  bestFor: 'Best for making MKV files from media servers or Linux systems play on Apple devices and smart TVs.',
  category: 'video-audio',
  accepts: ['video/x-matroska', 'video/mkv'],
  acceptsExt: ['.mkv'],
  outputExt: '.mp4',
  convertFn: (files, opts, onProgress) => mkvToMp4(files, opts, onProgress),

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
      hint: 'Used only if the MKV needs re-encoding. H.264/AAC MKV files convert by stream copy — instant, no quality loss.',
    },
  ],

  faq: [
    {
      q: 'Why convert MKV to MP4?',
      a: 'MKV (Matroska) is a flexible open container popular for HD video and multi-language content, but support on Apple devices, iOS, and many smart TVs is patchy. MP4 plays everywhere without plugins or format negotiation.',
    },
    {
      q: 'Will this re-encode the video?',
      a: 'Only if it needs to. Most MKV files already contain H.264 video and AAC audio — in those cases, conversion is a stream copy: near-instant with zero quality loss. If the MKV contains an incompatible codec (H.265, VP9, etc.), the tool re-encodes to H.264 automatically.',
    },
    {
      q: 'What does the quality setting do?',
      a: 'Quality only applies when re-encoding is needed. If your MKV is already H.264/AAC, the setting is ignored and the file copies directly. When re-encoding, CRF 23 (Better) is the balanced default.',
    },
    {
      q: 'Can I convert multiple MKV files at once?',
      a: 'Yes. Drop as many as you need. Each file converts separately in your browser, and the results download as a ZIP.',
    },
    {
      q: 'Does my MKV file leave my device to convert it?',
      a: 'No. Conversion runs in your browser using ffmpeg.wasm — a full media engine compiled to WebAssembly. Your video never touches a server.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'No hard limit. The constraint is your device\'s available RAM. H.264 MKV files that stream-copy convert almost instantly at any size. Re-encoded files take longer and use more memory.',
    },
  ],

  relatedTools: ['compress-video', 'mov-to-mp4', 'avi-to-mp4', 'mp4-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'MKV to MP4 Converter — ConvertYard',
    description:
      'Convert MKV files to MP4 in your browser. Stream-copies H.264/AAC MKV instantly — no re-encode, no quality loss. Batch convert, no uploads, no account.',
  },
}
