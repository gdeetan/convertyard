import { svgConvert } from '@/lib/converters/svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'svg-to-webp',
  title: 'SVG to WebP Converter',
  subtitle: 'Rasterise SVG to WebP — 25–35% smaller than PNG at equal quality, transparency supported.',
  bestFor: 'Best for web developers exporting SVG icons or illustrations as WebP for lighter page payloads.',
  category: 'images',
  accepts: ['image/svg+xml'],
  acceptsExt: ['.svg'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) => svgConvert(files, 'webp', opts, onProgress),
  enablePresets: true,
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
      q: 'Are my SVG files uploaded to convert them?',
      a: 'No. Conversion uses your browser\'s Canvas API. Your SVGs never leave your device.',
    },
    {
      q: 'Why WebP instead of PNG when exporting from SVG?',
      a: 'WebP is typically 25–35% smaller than PNG at equivalent visual quality. Both formats support full alpha transparency. For icon sets or illustrations deployed on high-traffic pages, switching from PNG to WebP cuts bandwidth without any visible quality difference.',
    },
    {
      q: 'Does WebP support SVG transparency?',
      a: 'Yes. WebP supports full alpha transparency, just like PNG. The Transparent background toggle is on by default — your SVG backgrounds will be transparent in the output WebP. Turn it off if you need a solid fill.',
    },
    {
      q: 'What quality setting should I use for icons and logos?',
      a: 'Use 90 or above for sharp, clean edges on icons and logos. Lossy WebP at quality 90 is visually indistinguishable from lossless for most icon content, while producing smaller files. Drop below 85 only for illustrative content where edge sharpness is less critical.',
    },
    {
      q: 'My SVG output looks blurry in the WebP — what happened?',
      a: 'The SVG was rasterised at too low a resolution. Increase the Scale multiplier (2× or 4×) or set a specific Custom Width. The WebP is then displayed at its natural CSS size and will be sharp on all screens.',
    },
  ],
  relatedTools: ['svg-to-png', 'svg-to-jpg', 'png-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'SVG to WebP Converter — ConvertYard',
    description: 'Convert SVG to WebP for better web performance. 25–35% smaller than PNG at equal quality. Batch convert locally — no uploads, no account.',
  },
}
