import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-webp',
  title: 'BMP to WebP Converter',
  subtitle: 'BMP to modern WebP — dramatically smaller files, wider web support. Batch 1,000+ images in your browser.',
  bestFor: 'Best for converting BMP assets to a web-ready format without the compatibility concerns of AVIF.',
  category: 'images',
  accepts: ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  acceptsExt: ['.bmp'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'webp', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 is the sweet spot — dramatically smaller than BMP with no visible quality loss',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Pixel-perfect output — still much smaller than BMP, ignores the quality slider',
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
      hint: 'Downscales the longer edge. 0 = keep original size. Never upscales.',
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
      q: 'Are my BMP files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'How does WebP compare to BMP?',
      a: 'BMP is uncompressed — every pixel stored raw. WebP uses modern lossy or lossless compression. At quality 80, expect 10–50x smaller files than the original BMP. A 6MB BMP photo typically becomes 150–400KB as WebP. Lossless WebP is still typically 3–5x smaller than BMP.',
    },
    {
      q: 'When should I choose WebP over AVIF for BMP conversion?',
      a: 'WebP has broader software support than AVIF — it works in image editing apps, CMS platforms, and CDNs that predate 2022. If your target environment definitely supports AVIF, it will give you slightly smaller files. If you are not sure, WebP is the safer choice and still dramatically smaller than BMP.',
    },
    {
      q: 'Does WebP support all browsers?',
      a: 'WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari (since version 14, 2020). That covers over 97% of global web traffic. For desktop software or services that do not support WebP, convert to JPG instead.',
    },
    {
      q: 'Can I batch convert 1,000 BMP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server queue. BMP files are large in memory so large batches may take time. Download all results as a single ZIP when done.',
    },
  ],

  relatedTools: ['bmp-to-jpg', 'bmp-to-png', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'BMP to WebP Converter — ConvertYard',
    description:
      'Convert BMP to WebP in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. 10–50x smaller than BMP with excellent quality.',
  },
}
