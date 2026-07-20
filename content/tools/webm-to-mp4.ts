import { webmToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'webm-to-mp4',
  title: 'WebM to MP4 Converter',
  subtitle: 'Convert WebM recordings to MP4 for universal device playback.',
  bestFor: 'Best for sharing screen recordings or browser captures on any device.',
  category: 'video-audio',
  accepts: ['video/webm'],
  acceptsExt: ['.webm'],
  outputExt: '.mp4',
  convertFn: (files, opts, onProgress) => webmToMp4(files, opts, onProgress),

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
      q: 'Why convert WebM to MP4?',
      a: 'WebM is an open format designed for the web — Chrome and Firefox play it natively, but support on Apple devices, Windows Media Player, and most video editors is limited. MP4 with H.264 plays everywhere without plugins or format negotiation. If you need to share a WebM recording or export a screen capture, MP4 is the compatible choice.',
    },
    {
      q: 'What video codecs does WebM use?',
      a: 'WebM files contain VP8 or VP9 video and Vorbis or Opus audio. ffmpeg.wasm handles all four codecs and re-encodes them to H.264 video and AAC audio, which is the standard MP4 payload for broad device support.',
    },
    {
      q: 'Will the quality change after conversion?',
      a: 'Re-encoding from VP8/VP9 to H.264 involves transcoding, so there is a small quality reduction — this is unavoidable when changing codecs. At CRF 23 (Better) the difference is not visible on most content. Use Best (CRF 18) if you need to preserve as much quality as possible.',
    },
    {
      q: 'What does the quality setting do?',
      a: 'Quality controls the H.264 CRF (constant rate factor). Best (CRF 18) produces the sharpest image at the cost of a larger file. Good (CRF 28) cuts file size noticeably with a visible quality reduction on detailed footage. Better (CRF 23) is the balanced default.',
    },
    {
      q: 'What can go wrong when converting WebM to MP4?',
      a: 'WebM files recorded by screen-capture tools sometimes have a variable frame rate (VFR), which can cause audio sync issues in the MP4 output. If audio drifts out of sync, the source WebM may have been recorded with VFR. Very long WebM files from browser recordings may also have timing issues in the header that cause conversion to stall — try splitting them before converting.',
    },
    {
      q: 'Do my WebM files leave my device during conversion?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm. Your files do not leave your device at any point.',
    },
  ],

  relatedTools: ['compress-video', 'mp4-to-mp3', 'video-to-gif', 'mov-to-mp4'],
  relatedArticles: [],

  meta: {
    title: 'WebM to MP4 Converter — ConvertYard',
    description:
      'Convert WebM files to MP4 in your browser. H.264 video, AAC audio, works on every device. Batch convert multiple WebM files at once — no uploads, no account.',
  },
}
