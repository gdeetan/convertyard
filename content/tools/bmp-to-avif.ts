import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-avif',
  title: 'BMP to AVIF Converter',
  subtitle: 'Compress legacy BMP files into modern AVIF. Up to 98% smaller.',
  category: 'images',
  accepts: ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  acceptsExt: ['.bmp'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress) => libvipsConvert(files, 'avif', opts, onProgress),
  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 70,
      hint: '70 is the sweet spot for AVIF — visually identical to the source at a fraction of the BMP file size',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Encoding effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 9 = smallest file (slower). AVIF encoding is thorough — large files may take a few seconds.',
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
      hint: 'Removes any embedded metadata from the output AVIF',
    },
  ],

  faq: [
    {
      q: 'How much smaller will the AVIF be compared to the original BMP?',
      a: 'BMP is an uncompressed format — AVIF typically reduces file size by 95–98%. A 10MB BMP becomes roughly 200–500KB AVIF at quality 70. Exact results depend on image content; flat graphics compress further than photographic images.',
    },
    {
      q: 'Why use AVIF instead of WebP or JPG for BMP conversion?',
      a: 'AVIF is 30–50% smaller than WebP at equivalent quality, and 40–50% smaller than JPG. For web publishing, asset pipelines, or archiving large BMP libraries, AVIF gives you the best file sizes. If you need broader compatibility with older software, convert to WebP or JPG instead.',
    },
    {
      q: 'Does AVIF work in all modern browsers?',
      a: 'AVIF is supported in Chrome (since 85), Edge (since 121), Firefox (since 93), and Safari (since 16). That covers over 90% of global web traffic. For environments where AVIF support is uncertain, WebP is a safer choice.',
    },
    {
      q: 'Can I convert 1,000 BMP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server queue. BMP files are large but fast to decode since they\'re uncompressed. AVIF encoding takes slightly longer than JPG or WebP. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['bmp-to-jpg', 'bmp-to-png', 'bmp-to-webp', 'jpg-to-avif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],
  meta: {
    title: 'BMP to AVIF Converter — ConvertYard',
    description:
      'Convert BMP to AVIF — up to 98% smaller files. Modernise legacy BMP from Windows apps and game pipelines. Batch convert locally, no uploads.',
  },
}
