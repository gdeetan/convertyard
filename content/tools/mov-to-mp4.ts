import { movToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mov-to-mp4',
  title: 'MOV to MP4 Converter',
  subtitle: 'Convert MOV to MP4. Batch-ready, stays in your browser.',
  bestFor: 'Best for sharing iPhone or Mac video recordings with Windows users or uploading to platforms that reject MOV.',
  category: 'video-audio',
  accepts: ['video/quicktime'],
  acceptsExt: ['.mov'],
  outputExt: '.mp4',
  convertFn: (files, opts, onProgress) => movToMp4(files, opts, onProgress),

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
      q: 'Why convert MOV to MP4?',
      a: 'MOV is a QuickTime container — native to Apple devices but not universally supported. MP4 with H.264 video and AAC audio plays on every device, browser, and platform without needing QuickTime installed. If you need to share a video with someone on Windows or upload it to a social platform, MP4 is the safer choice.',
    },
    {
      q: 'Will it work with iPhone videos?',
      a: 'Yes. iPhone MOV files — including those shot in HEVC (H.265) mode — convert correctly. HEVC footage will re-encode to H.264, which means the output file may be slightly larger than the original. That is expected: H.264 is less efficient than H.265 but has far wider playback support.',
    },
    {
      q: 'What does the quality setting do?',
      a: 'Quality controls the H.264 CRF (constant rate factor). Best (CRF 18) produces the sharpest image at the cost of a larger file. Good (CRF 28) cuts file size noticeably with a modest quality reduction. Better (CRF 23) is the default — ffmpeg\'s own recommended starting point for most content.',
    },
    {
      q: 'Can I convert multiple MOV files at once?',
      a: 'Yes. Drop as many as you need. Each MOV is converted separately in your browser using ffmpeg.wasm, and the results download as a ZIP. There is no queue, no upload, and no per-file limit on count.',
    },
    {
      q: 'Does my MOV file leave my device to convert it?',
      a: 'No. Conversion runs in your browser using ffmpeg.wasm — a full media engine compiled to WebAssembly. Your video never touches a server.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'No hard limit. The constraint is your device\'s available RAM — the converted MP4 is held in memory before download. Files under 500 MB convert without issue on most devices. Larger files work on desktops with sufficient RAM; on mobile, very large files may cause the browser tab to reload.',
    },
  ],

  relatedTools: ['compress-video', 'mp4-to-mp3', 'video-to-gif', 'extract-audio'],
  relatedArticles: [],

  meta: {
    title: 'iPhone MOV to MP4 Converter — ConvertYard',
    description:
      'Convert MOV files to MP4 in your browser. H.264 video, AAC audio, works on every device. Batch convert multiple MOV files at once — no uploads, no account.',
  },
}
