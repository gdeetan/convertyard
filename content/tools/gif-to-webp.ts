import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-webp',
  title: 'GIF to Animated WebP Converter',
  subtitle: 'Convert animated GIFs to animated WebP — 25–40% smaller, same motion. Drop 1,000 at once.',
  category: 'images',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'webp', { ...opts, animated: true }, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 gives excellent quality at a fraction of the GIF file size',
    },
    {
      type: 'slider',
      name: 'method',
      label: 'Compression effort',
      min: 0,
      max: 6,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 6 = smallest file (slower)',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: 'Downscales the longer edge across all frames. 0 = keep original size.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes any embedded metadata from the output WebP',
    },
  ],

  faq: [
    {
      q: 'Does this preserve the GIF animation?',
      a: 'Yes. The output WebP file contains all frames and timing data from the original GIF. The animation plays exactly as in the original — animated WebP is a direct replacement for animated GIF with much better compression.',
    },
    {
      q: 'How much smaller is animated WebP compared to GIF?',
      a: 'Typically 25–40% smaller than an equivalent GIF. WebP uses more modern compression that handles the repeated patterns in animation frames far more efficiently than GIF\'s LZW compression.',
    },
    {
      q: 'Does animated WebP work everywhere?',
      a: 'Animated WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari (since version 14). It\'s also supported on iOS and Android. The only platforms that still need GIF are very old systems and some email clients.',
    },
    {
      q: 'Can I convert 1,000 GIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each in your browser — no uploads, no server. Each animated GIF produces one animated WebP. Download all results as a single ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['gif-to-mp4', 'gif-to-jpg', 'gif-to-png', 'webp-to-gif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'GIF to WebP Converter — ConvertYard',
    description:
      'Convert animated GIFs to animated WebP in your browser. 25–40% smaller files, full animation preserved. Batch convert 1,000 GIFs — no uploads.',
  },
}
