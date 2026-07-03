import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-avif',
  title: 'TIFF to AVIF Converter',
  subtitle: 'Modernise archival TIFFs for web delivery. 70–80% smaller than TIFF.',
  category: 'images',
  accepts: ['image/tiff', 'image/x-tiff'],
  acceptsExt: ['.tiff', '.tif'],
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
      default: 80,
      hint: '80 gives excellent quality with significant file size reduction versus TIFF',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Encoding effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: 'Higher effort = smaller file, slower encoding. 4 is a good default.',
    },
  ],
  faq: [
    {
      q: "What's the browser support for AVIF?",
      a: 'AVIF is supported by Chrome 85+, Firefox 93+, Safari 16+, and Edge 89+.',
    },
    {
      q: 'How much smaller is AVIF than TIFF?',
      a: 'A 50MB TIFF typically becomes 2–5MB AVIF at quality 80 with no visible quality loss.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your TIFFs never leave your device.',
    },
  ],
  relatedTools: ['tiff-to-jpg', 'tiff-to-png', 'jpg-to-avif'],
  relatedArticles: [],
  meta: {
    title: 'TIFF to AVIF Converter — ConvertYard',
    description:
      'Convert TIFF to AVIF for web delivery. 70–80% smaller than TIFF at equivalent quality. Batch convert locally in your browser — no uploads.',
  },
}
