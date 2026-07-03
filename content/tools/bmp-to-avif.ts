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
      default: 80,
      hint: 'A 6MB BMP typically becomes 100–300KB AVIF at quality 80.',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Encoding effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: 'Higher effort = smaller file, slower encoding.',
    },
  ],
  faq: [
    {
      q: 'How much smaller will the AVIF be?',
      a: 'BMP is uncompressed — AVIF typically reduces file size by 95–98% versus BMP. A 10MB BMP becomes roughly 200–500KB AVIF at quality 80.',
    },
    {
      q: 'Why would I use AVIF over WebP?',
      a: 'AVIF is 30–50% smaller than WebP at equivalent quality. For high-traffic pages or large image libraries, AVIF delivers better performance. WebP has wider legacy browser support — use it if you need IE11 or older Android compatibility.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your files never leave your device.',
    },
  ],
  relatedTools: ['bmp-to-jpg', 'bmp-to-png', 'jpg-to-avif'],
  relatedArticles: [],
  meta: {
    title: 'BMP to AVIF Converter — ConvertYard',
    description:
      'Convert BMP to AVIF — up to 98% smaller files. Modernise legacy BMP from Windows apps and game pipelines. Batch convert locally, no uploads.',
  },
}
