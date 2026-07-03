import { svgConvert } from '@/lib/converters/svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'svg-to-jpg',
  title: 'SVG to JPG Converter',
  subtitle: 'Export SVG illustrations as JPG thumbnails. Set background colour and quality.',
  category: 'images',
  accepts: ['image/svg+xml'],
  acceptsExt: ['.svg'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress) => svgConvert(files, 'jpg', opts, onProgress),
  options: [
    {
      type: 'slider',
      name: 'scale',
      label: 'Scale',
      min: 1,
      max: 8,
      step: 1,
      default: 2,
      hint: '2× outputs at double the SVG\'s native size',
    },
    {
      type: 'number',
      name: 'outputWidth',
      label: 'Custom width (px)',
      min: 0,
      max: 8192,
      step: 1,
      default: 0,
      hint: 'Overrides scale. 0 = use scale multiplier.',
    },
    {
      type: 'slider',
      name: 'quality',
      label: 'JPEG quality',
      min: 1,
      max: 100,
      step: 1,
      default: 92,
      hint: '92 gives near-lossless output. Drop to 70–80 for smaller thumbnails.',
    },
    {
      type: 'color',
      name: 'bgColor',
      label: 'Background colour',
      default: '#ffffff',
      hint: 'JPG has no transparency — choose what fills the background',
    },
  ],
  faq: [
    {
      q: 'Why would I use JPG instead of PNG from an SVG?',
      a: 'JPG files are smaller than PNGs for large rasterised illustrations. For blog thumbnails and social media previews where transparency isn\'t needed, JPG loads faster.',
    },
    {
      q: 'What background colour is used?',
      a: 'White (#ffffff) is the default. JPG has no transparency support so every pixel gets a background colour.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion uses your browser\'s Canvas API. Your SVGs stay on your device.',
    },
  ],
  relatedTools: ['svg-to-png', 'svg-to-webp', 'jpg-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'SVG to JPG Converter — ConvertYard',
    description: 'Convert SVG to JPG for blog thumbnails and social media. Set scale, quality, and background colour. Batch convert locally — no uploads.',
  },
}
