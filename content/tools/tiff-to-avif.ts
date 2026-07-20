import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-avif',
  title: 'TIFF to AVIF Converter',
  subtitle: 'Modernise archival TIFFs for web delivery — AVIF is 70–80% smaller at equivalent quality.',
  bestFor: 'Best for publishers converting scanned archival TIFFs into web-ready AVIF for modern browsers.',
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
      q: 'Are my TIFF files uploaded to convert them?',
      a: 'No. Conversion runs via WebAssembly entirely in your browser. Your TIFFs never leave your device.',
    },
    {
      q: 'How much smaller will my AVIF files be compared to TIFF?',
      a: 'A 50MB TIFF scan typically becomes 2–5MB AVIF at quality 80 with no visible quality loss — a 10–25× reduction. AVIF achieves this because it uses the AV1 video codec for compression, which is far more efficient than TIFF\'s LZW or ZIP compression.',
    },
    {
      q: 'Why use AVIF instead of JPG or WebP for TIFFs going to the web?',
      a: 'AVIF is the most efficient of the three — typically 20–30% smaller than WebP and 50% smaller than JPG at equivalent perceptual quality. If your target browsers support AVIF (Chrome 85+, Firefox 93+, Safari 16+, Edge 121+), it is the best single format for web delivery of archival scans.',
    },
    {
      q: 'What browser support does AVIF have?',
      a: 'AVIF is supported by Chrome 85+, Firefox 93+, Safari 16+, and Edge 121+. That covers the vast majority of modern web traffic. For maximum compatibility, serve AVIF with a WebP fallback using a <picture> element.',
    },
    {
      q: 'Why does AVIF encoding take a long time for large TIFFs?',
      a: 'AVIF uses the AV1 codec, which prioritises compression efficiency over encoding speed. A large, high-resolution TIFF at effort 4 may take 10–30 seconds per file in the browser. Reduce the effort slider to 0–2 if you need faster encoding — file sizes will be slightly larger but still far smaller than the original TIFF.',
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
