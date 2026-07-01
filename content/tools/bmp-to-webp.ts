import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-webp',
  title: 'BMP to WebP Converter',
  subtitle: 'BMP to modern WebP — dramatically smaller files, wider web support. Batch 1,000+ images in your browser.',
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
      q: 'Why convert BMP to WebP?',
      a: 'BMP files are enormous — uncompressed, every pixel stored individually. WebP gives you 20–40x smaller files for photographs, and even lossless WebP is typically 3–5x smaller than the equivalent BMP. WebP is the right modern format for web use: supported in all current browsers, dramatically smaller than BMP, and better than JPG at the same quality.',
    },
    {
      q: 'How much smaller will my WebP files be?',
      a: 'At quality 80, expect 10–50x smaller than the original BMP. A 6MB BMP photo typically becomes 150–400KB as WebP. ConvertYard shows the exact byte savings per file so you can see the reduction immediately.',
    },
    {
      q: 'Does WebP support all browsers?',
      a: 'WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari (since version 14, 2020). That covers over 97% of global web traffic. For use in desktop software or services that don\'t support WebP, convert to JPG instead.',
    },
    {
      q: 'Can I convert 1,000 BMP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server queue. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['bmp-to-jpg', 'bmp-to-png', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'batch-convert-images'],

  meta: {
    title: 'BMP to WebP Converter — ConvertYard',
    description:
      'Convert BMP to WebP in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. 10–50x smaller than BMP with excellent quality.',
  },
}
