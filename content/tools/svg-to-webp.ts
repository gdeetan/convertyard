import { svgConvert } from '@/lib/converters/svg-convert'
import { SvgToWebpConversionPreview } from '@/components/image/CompressionPreview'
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
  convertFn: (files, opts, onProgress, onResult) => svgConvert(files, 'webp', opts, onProgress, onResult),
  previewPanel: SvgToWebpConversionPreview,
  enablePresets: true,
  howItWorks: [
    { label: 'Drop your files', desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 1,000 files at once.' },
    { label: 'Choose settings', desc: 'Adjust scale, custom width, quality, and whether it should have a transparent background. Split type preview is available so you can see the potential savings and a before-and-after of the SVG file.' },
    { label: 'Click Convert', desc: 'The SVG files are converted to WebP in your browser via WebAssembly. Nothing is uploaded to a server.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],
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
      a: 'Nothing is uploaded. The conversion happens in your browser through the Canvas API.',
    },
    {
      q: 'Why WebP instead of PNG when exporting from SVG?',
      a: 'A huge reason is the size variance. An equivalent WebP file can be as much as 96% smaller than its PNG equivalent, with the same dimensions. If you’re deploying a huge icon set on a high-traffic website, this adds up; switching from PNG to WebP will make your site load faster and use less bandwidth and storage space, cutting web hosting costs.',
    },
    {
      q: 'Does WebP support SVG transparency?',
      a: 'Yes. WebP files support full alpha transparency like PNG. This feature is automatically toggled on when converting SVG to WebP files. If you need a solid background, then turn off this feature.',
    },
    {
      q: 'What quality setting should I use for icons and logos?',
      a: 'Using a setting of 90 or above for icons or logos with sharp edges. For lossless WebP images like photographs, you can move the slider down further to 80, even to 70, with minimal quality loss. The more important feature is the scale, which determines the sharpness of the final output. A higher setting produces a sharper graphic; anything below 3 can make it blurry. Play around with the settings and see how they affect the graphic in the preview panel and its size.',
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
    description: 'Convert SVG to WebP for smaller web images — typically 25–35% smaller than PNG at similar quality. Batch convert in your browser. Files never leave your device.',
  },
}
