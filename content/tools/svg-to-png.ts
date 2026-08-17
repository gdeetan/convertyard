import { svgConvert } from '@/lib/converters/svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'svg-to-png',
  title: 'SVG to PNG Converter',
  subtitle: 'Rasterise SVG files at any resolution — 1×, 2×, 4× or custom px. Batch-ready, no uploads.',
  bestFor: 'Best for designers exporting icon sets or SVG assets as PNG for apps, documents, or platforms that reject SVG.',
  category: 'images',
  accepts: ['image/svg+xml'],
  acceptsExt: ['.svg'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) => svgConvert(files, 'png', opts, onProgress, onResult),
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
      q: 'Are my SVG files uploaded to convert them?',
      a: 'No. Conversion uses your browser\'s built-in Canvas API entirely on your device — no data is sent to any server. The SVG is rendered locally inside a canvas element, and the resulting PNG is generated in memory in your browser. ConvertYard\'s servers only deliver the tool\'s code; they never see your files.',
    },
    {
      q: 'SVG is scalable — what resolution does the PNG come out at?',
      a: 'The PNG resolution is determined by the scale multiplier or the custom width you set. A 24×24px SVG at 2× scale outputs a 48×48px PNG. Unlike raster-to-raster conversions, SVG-to-PNG never introduces blur or interpolation artifacts — the vector renders at pixel-perfect sharpness at whatever size you choose.',
    },
    {
      q: 'What scale should I use for web icons?',
      a: '2× is the standard for retina and high-DPI screens. If your SVG is 24×24px, 2× outputs 48×48px — displayed at 24×24px in the browser, it looks sharp on all screens. For app store submissions, use the Custom Width field to hit exact required dimensions (e.g. 1024px for Apple App Store).',
    },
    {
      q: 'Will the background be transparent?',
      a: 'Yes, by default. PNG supports alpha transparency, and the Transparent background toggle is on by default. Turn it off and specify a fill colour if you need a solid-background PNG.',
    },
    {
      q: 'My SVG uses an external font — will it render correctly?',
      a: 'SVGs referencing external fonts (Google Fonts, system fonts by name) may fall back to a different font in the Canvas rendering environment. For reliable text rendering, embed the font in the SVG as base64 data, or convert text to outlines in your design tool before exporting.',
    },
  ],
  relatedTools: ['png-to-svg', 'svg-to-jpg', 'svg-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'SVG to PNG Converter — ConvertYard',
    description: 'Rasterise SVG to PNG at 1×, 2×, 4×, or any custom pixel size. Batch convert icon sets in your browser. Transparency kept. Files stay on your device. No blur.',
  },
}
