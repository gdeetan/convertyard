import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'webp-to-avif',
  title: 'WebP to AVIF Converter',
  subtitle: 'Local-first WebP to AVIF conversion. Built for batches.',
  category: 'images',
  accepts: ['image/webp'],
  acceptsExt: ['.webp'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'avif', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 60,
      hint: 'AVIF is more efficient than WebP — 60 gives quality equivalent to WebP at 80',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Compression effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 9 = smallest file (much slower)',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Pixel-perfect output — larger files, ignores the quality slider',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: 'Downscales the longer edge. 0 = keep original size. Never upscales.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and camera data from the output AVIF',
    },
  ],

  faq: [
    {
      q: 'Why convert WebP to AVIF?',
      a: 'AVIF achieves 10–20% better compression than WebP at equal quality, with no visible difference. If your web platform supports AVIF (Chrome 85+, Firefox 93+, Safari 16+), serving AVIF instead of WebP means smaller files, faster page loads, and lower bandwidth costs. It\'s a straightforward upgrade for modern web projects.',
    },
    {
      q: 'Is AVIF supported in all browsers?',
      a: 'AVIF is supported in Chrome 85+, Edge 121+, Firefox 93+, and Safari 16+ (released September 2022). Older browsers and some mobile apps do not support it. For maximum compatibility, WebP remains the safer default. For modern web projects where you control the browser environment (or serve AVIF with a WebP fallback), AVIF is the better choice.',
    },
    {
      q: 'Why is the default quality 60 instead of 80?',
      a: 'AVIF\'s compression is more efficient than WebP, so lower quality numbers produce the same perceptual quality. AVIF at 60 is visually similar to WebP at 80. If you push quality above 80, you\'ll get slightly larger files than the original WebP with no visible improvement.',
    },
    {
      q: 'Can I convert 1,000 WebP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server queue. AVIF encoding is CPU-intensive; on a modern laptop, 1,000 files at effort 4 typically finishes in 10–20 minutes. Lower the effort setting to speed up encoding.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['avif-to-webp', 'png-to-avif', 'jpg-to-avif', 'webp-to-jpg'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'batch-convert-images'],

  meta: {
    title: 'WebP to AVIF Converter — ConvertYard',
    description:
      'Convert WebP to AVIF in your browser. Batch up to 1,000 files — no uploads, no account. 10–20% smaller than WebP with no visible quality loss.',
  },
}
