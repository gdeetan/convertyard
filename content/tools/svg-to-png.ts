import { svgConvert } from '@/lib/converters/svg-convert'
import { SvgToPngConversionPreview } from '@/components/image/CompressionPreview'
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
  previewPanel: SvgToPngConversionPreview,
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
      a: 'Conversion uses only the <strong>browser&rsquo;s native Canvas API</strong> and runs <strong>entirely on your device</strong>. The SVG is rendered within the canvas element, and the resulting PNG is <strong>generated in memory on your device</strong>. As the tool is provided by servers of ConvertYard, they <strong>only host the code</strong> for the tool. <strong>Your files will not be sent to any server</strong>.',
    },
    {
      q: 'SVG is scalable — what resolution does the PNG come out at?',
      a: 'The <strong>PNG resolution can be set with the scale multiplier or with a custom width</strong>. A <strong>24×24px SVG set to 2× will render a 48×48px PNG</strong>. Note that this is different from a <strong>raster-to-raster conversion</strong>. Unlike such a conversion, <strong>SVG-to-PNG never results in any blur or interpolation artifacts</strong>. The vector is rendered at <strong>pixel-perfect sharpness at any size</strong>.',
    },
    {
      q: 'What scale should I use for web icons?',
      a: '<strong>2× is the standard for high-resolution, i.e., retina screens, as well as high-DPI monitors</strong>. So if your SVG has a size of 24×24px, 2× will, for example, result in <strong>48×48px</strong>, which will then be displayed by the browser at the correct resolution of 24×24px. For <strong>app store submissions</strong>, you can then use the <strong>Custom Width field</strong> to enter the exact required size (e.g. <strong>1024px for the Apple App Store</strong>).',
    },
    {
      q: 'My SVG uses an external font — will it render correctly?',
      a: 'SVGs that use <strong>external fonts</strong> (like <strong>Google Fonts or system fonts by name</strong>) may <strong>fail to render text in Canvas</strong>. To get around this, <strong>embed your fonts in the SVG as base64 data</strong> or <strong>convert the text to outlines</strong> in your design application before exporting the SVG.',
    },
  ],
  relatedTools: ['png-to-svg', 'svg-to-jpg', 'svg-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'Convert SVG to PNG for Free - Nothing Uploads',
    description: 'Transform SVG files into high-resolution PNG for print. Customize scale, custom width, and transparent background. Nothing is uploaded.',
  },
}
