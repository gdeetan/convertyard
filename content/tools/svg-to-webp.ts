import { svgConvert } from '@/lib/converters/svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'svg-to-webp',
  title: 'SVG to WebP Converter',
  subtitle: 'Rasterise SVG to WebP for smaller file sizes on the web.',
  category: 'images',
  accepts: ['image/svg+xml'],
  acceptsExt: ['.svg'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) => svgConvert(files, 'webp', opts, onProgress),
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
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 90,
      hint: '90 gives excellent quality. WebP is smaller than PNG at the same visual quality.',
    },
    {
      type: 'toggle',
      name: 'transparent',
      label: 'Transparent background',
      default: true,
      hint: 'WebP supports transparency — keep SVG backgrounds transparent',
    },
  ],
  faq: [
    {
      q: 'Why WebP instead of PNG for SVG exports?',
      a: 'WebP files are typically 25–35% smaller than equivalent PNGs. For icon sets deployed on high-traffic pages, this reduces page weight noticeably. Both formats support transparency.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion uses your browser\'s Canvas API. Your SVGs stay on your device.',
    },
  ],
  relatedTools: ['svg-to-png', 'svg-to-jpg', 'png-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'SVG to WebP Converter — ConvertYard',
    description: 'Convert SVG to WebP for better web performance. 25–35% smaller than PNG at equal quality. Batch convert locally — no uploads, no account.',
  },
}
