import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-webp',
  title: 'GIF to Animated WebP Converter',
  subtitle: 'Convert animated GIFs to animated WebP — 25–40% smaller, same motion. Drop 1,000 at once.',
  bestFor: 'Best for web developers replacing heavy animated GIFs with smaller animated WebP on modern sites.',
  category: 'images',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'webp', { ...opts, animated: true }, onProgress, onResult),
  enablePresets: true,

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
      q: 'Are my GIF files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Does this preserve the full GIF animation?',
      a: 'Yes. The output WebP file contains all frames and timing data from the original GIF. The animation plays exactly as in the original — animated WebP is a direct replacement for animated GIF in modern browsers.',
    },
    {
      q: 'How much smaller is animated WebP compared to GIF?',
      a: 'Typically 25–40% smaller. WebP uses modern compression that handles the repeated patterns in animation frames far more efficiently than GIF\'s LZW compression. For GIFs with large flat-color areas or repeated content, savings can reach 50%.',
    },
    {
      q: 'What does GIF lose that WebP keeps?',
      a: 'GIF is limited to 256 colors per frame, uses a 1-bit transparency mask (pixel is either fully transparent or fully opaque), and can only loop at fixed intervals. Animated WebP supports full 24-bit color, proper alpha transparency, and more precise timing — though for most web animations these differences are not visible.',
    },
    {
      q: 'Does animated WebP work in all browsers?',
      a: 'Animated WebP is supported in Chrome, Edge, Firefox, and Safari (since version 14, 2020). It also works on iOS and Android. The only platforms that still require GIF are old email clients and legacy systems.',
    },
  ],

  relatedTools: ['gif-to-mp4', 'gif-to-jpg', 'gif-to-png', 'webp-to-gif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'Animated GIF to WebP Converter — ConvertYard',
    description:
      'Convert animated GIFs to animated WebP. Same motion, typically 25–40% smaller files. Batch up to 1,000 GIFs in your browser — no uploads. Keeps looping.',
  },
}
