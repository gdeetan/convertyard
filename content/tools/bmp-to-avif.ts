import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-avif',
  title: 'BMP to AVIF Converter',
  subtitle: 'Compress legacy BMP files into modern AVIF. Up to 98% smaller.',
  bestFor: 'Best for modernising BMP asset libraries for web delivery — game assets, screenshots, or scanned diagrams.',
  category: 'images',
  accepts: ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  acceptsExt: ['.bmp'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress, onResult) => libvipsConvert(files, 'avif', opts, onProgress, onResult),
  enablePresets: true,
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
      q: 'Are my BMP files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'How much smaller will the AVIF be compared to the original BMP?',
      a: 'BMP is uncompressed — AVIF typically reduces file size by 95–98%. A 10MB BMP becomes roughly 200–500KB AVIF at quality 70. Flat graphics like screenshots or diagrams compress further than photographic images.',
    },
    {
      q: 'Why does BMP exist if it is so inefficient?',
      a: 'BMP was designed for simplicity, not storage efficiency. Every pixel is stored directly with no compression. This makes it trivially fast to read and write in software, and it avoids any codec licensing. That is why old Windows applications, embedded systems, and game engines still use it — but it makes terrible sense for web delivery.',
    },
    {
      q: 'Why choose AVIF over JPG for this conversion?',
      a: 'AVIF is 30–50% smaller than JPG at the same visual quality. If you are converting BMPs for web delivery, AVIF gives the best file sizes. If you need to support older browsers or software that predates AVIF, convert to WebP or JPG instead.',
    },
    {
      q: 'Will AVIF encoding take longer for BMP files?',
      a: 'BMP files are fast to decode because there is no compression to unpack. But AVIF encoding itself is slower than JPG or WebP — expect 2–5x longer encode times. Lower the compression effort slider to speed things up at a small file size cost.',
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
