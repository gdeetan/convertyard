import { svgConvert } from '@/lib/converters/svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'svg-to-png',
  title: 'SVG to PNG Converter',
  subtitle: 'Rasterise SVG files at any resolution. Batch-ready, no uploads.',
  category: 'images',
  accepts: ['image/svg+xml'],
  acceptsExt: ['.svg'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) => svgConvert(files, 'png', opts, onProgress),
  options: [
    {
      type: 'slider',
      name: 'scale',
      label: 'Scale',
      min: 1,
      max: 8,
      step: 1,
      default: 2,
      hint: '2× outputs at double the SVG\'s native size — sharp on retina screens',
    },
    {
      type: 'number',
      name: 'outputWidth',
      label: 'Custom width (px)',
      min: 0,
      max: 8192,
      step: 1,
      default: 0,
      hint: 'Overrides scale. 0 = use scale multiplier instead.',
    },
    {
      type: 'toggle',
      name: 'transparent',
      label: 'Transparent background',
      default: true,
      hint: 'Keep the SVG background transparent in the PNG output',
    },
  ],
  faq: [
    {
      q: 'What resolution should I use for web icons?',
      a: '2× is the standard for retina screens. If your SVG is 24×24px, 2× outputs 48×48px — sharp on all screens. For app store icons, use the Custom Width field to set the exact pixel dimensions required.',
    },
    {
      q: 'Will the background be transparent?',
      a: 'Yes, by default. Toggle "Transparent background" off if you need a solid fill.',
    },
    {
      q: 'Can I convert SVGs that use embedded fonts?',
      a: 'SVGs with embedded base64 fonts convert correctly. SVGs that reference external font files may render with fallback fonts — embed the font in the SVG file before converting for reliable output.',
    },
    {
      q: 'Can I batch-convert an icon set at one resolution?',
      a: 'Yes — set your scale or custom width once, drop all SVGs, and download a ZIP of PNGs at the specified size.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion uses your browser\'s Canvas API — your SVGs never leave your device.',
    },
  ],
  relatedTools: ['png-to-svg', 'svg-to-jpg', 'svg-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'SVG to PNG Converter — ConvertYard',
    description: 'Convert SVG to PNG at any resolution — 1×, 2×, 4× or custom px. Batch convert icon sets locally in your browser. No uploads, no account.',
  },
}
