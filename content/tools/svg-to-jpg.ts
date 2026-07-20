import { svgConvert } from '@/lib/converters/svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'svg-to-jpg',
  title: 'SVG to JPG Converter',
  subtitle: 'Export SVG illustrations as JPG thumbnails. Set background colour and quality.',
  bestFor: 'Best for exporting SVG illustrations as JPG thumbnails for blog posts and social media previews.',
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
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background colour',
      default: '#ffffff',
      hint: 'JPG has no transparency — choose what fills the background',
    },
  ],
  faq: [
    {
      q: 'Are my SVG files uploaded to convert them?',
      a: 'No. Conversion uses your browser\'s Canvas API. Your SVGs never leave your device.',
    },
    {
      q: 'What resolution does the JPG come out at?',
      a: 'The output resolution depends on the scale multiplier or custom width you set. At 2× scale, a 500×500px SVG produces a 1000×1000px JPG. SVGs are vector — they can be rasterised at any resolution without loss. Set the Custom Width field to a specific pixel dimension if you need an exact output size for social media or a template.',
    },
    {
      q: 'Why JPG instead of PNG when exporting from SVG?',
      a: 'JPG produces smaller files for large rasterised illustrations, which makes it better for blog thumbnails and social previews where every kilobyte affects page load. Use PNG instead if you need a transparent background — JPG does not support transparency.',
    },
    {
      q: 'What colour fills the SVG background in the JPG?',
      a: 'White (#ffffff) by default. You can change this with the Background colour picker. If your SVG is designed for a dark page, set the background to match so the thumbnail looks correct when displayed in isolation.',
    },
    {
      q: 'My SVG uses web fonts — will they render correctly in the JPG?',
      a: 'Only if the fonts are embedded in the SVG as base64 data. SVGs that reference external font files (Google Fonts, CDN fonts) typically render with a browser fallback font instead. Embed the font in the SVG before converting, or convert text to outlines in your design tool.',
    },
  ],
  relatedTools: ['svg-to-png', 'svg-to-webp', 'jpg-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'SVG to JPG Converter — ConvertYard',
    description: 'Convert SVG to JPG for blog thumbnails and social media. Set scale, quality, and background colour. Batch convert locally — no uploads.',
  },
}
