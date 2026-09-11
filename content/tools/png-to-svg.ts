import { pngToSvgConvert } from '@/lib/converters/png-to-svg-convert'
import { PngToSvgPresetBar } from '@/components/png-to-svg/png-to-svg-presets'
import { PngToSvgPreview } from '@/components/png-to-svg/png-to-svg-preview'
import { PngToSvgReviewPanel } from '@/components/png-to-svg/png-to-svg-review'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-svg',
  title: 'PNG to SVG Converter',
  subtitle: 'Trace PNG logos and icons into scalable SVG paths. Works on simple, high-contrast art.',
  bestFor: 'Best for graphic artists who need to convert their PNG logo to a scalable SVG format.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.svg',
  convertFn: (files, opts, onProgress, onResult) => pngToSvgConvert(files, opts, onProgress, onResult),
  enablePresets: true,
  interactivePanel: PngToSvgPresetBar,
  previewPanel: PngToSvgPreview,
  reviewPanel: PngToSvgReviewPanel,

  limitationNote: {
    summary: 'Best on simple, high-contrast images',
    body: 'Vectorisation works well on logos, icons, line art, QR codes, and signatures. Photographs and complex illustrations produce high-complexity SVGs with many tiny paths — not suitable for web use. For clean results, use images with clear, distinct edges.',
  },

  howItWorks: [
    {
      label: 'Open the PNG file you want to convert',
      desc: 'You can open multiple files, but keep it to 5 files max so your computer doesn’t bog down.',
    },
    {
      label: 'Choose a preset',
      desc: 'Adjust the number of colors, minimum path size, line threshold, and blur before trace options.',
    },
    {
      label: 'Click ‘convert’',
      desc: 'Transform the PNG to an SVG file. You can still edit the converted file after clicking ‘convert’ until you’re happy with the result.',
    },
    {
      label: 'Download',
      desc: 'Download files individually or all at once through a ZIP file.',
    },
  ],


  options: [
    {
      type: 'slider',
      name: 'numberofcolors',
      label: 'Number of colours',
      min: 2,
      max: 64,
      step: 2,
      default: 16,
      hint: 'Fewer colours = simpler SVG. Logos: 4–8. Illustrations: up to 64. Higher is slower and makes larger files.',
    },
    {
      type: 'slider',
      name: 'pathomit',
      label: 'Minimum path size',
      min: 1,
      max: 32,
      step: 1,
      default: 8,
      hint: 'Ignores paths smaller than this pixel area. Higher = cleaner output, fewer details.',
    },
    {
      type: 'slider',
      name: 'ltres',
      label: 'Line threshold',
      min: 0.1,
      max: 5,
      step: 0.1,
      default: 1,
      hint: 'Higher = straighter lines, fewer nodes. Lower = more accurate curves.',
    },
    {
      type: 'radio',
      name: 'blurradius',
      label: 'Blur before trace',
      default: 'off',
      choices: [
        { value: 'off', label: 'Off' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
      ],
      conditionalHints: {
        off: 'Best for already-clean logos.',
        low: 'Softens anti-aliased edges a little.',
        medium: 'Stronger cleanup on noisy or compressed PNGs.',
      },
    },
    {
      type: 'radio',
      name: 'edgesmoothing',
      label: 'Edge smoothing',
      default: 'off',
      choices: [
        { value: 'off', label: 'Off' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      conditionalHints: {
        off: 'No smoothing — traces the PNG at native resolution.',
        low: 'Snaps edge pixels, filters noise, and optimizes the SVG output. Same size.',
        medium: 'Also runs a median filter and 2× resolution trace for smoother curves.',
        high: 'Aggressive edge snap, 2× resolution, and stronger curve fitting. Best for jagged logos.',
      },
    },
  ],

  faq: [
    {
      q: 'Are my PNG files uploaded so I can convert them?',
      a: 'No. The Vectorization script runs entirely in your browser using JavaScript. Nothing leaves the browser, so you can safely convert client files.',
    },
    {
      q: 'Is PNG-to-SVG conversion lossless?',
      a: 'No. This is a form of raster-to-vector tracing. It attempts to reproduce the PNG as SVG paths. Simple logos and icons trace very well. But photographs and other complex, finely detailed illustrations tend to produce terrible, messy SVGs with thousands of tiny paths, which aren\'t useful for most web or print work.',
    },
    {
      q: 'Why does my vectorized logo have rough or jagged edges?',
      a: 'Anti-aliasing in the original PNG image makes edge pixels near-transparent, leading to rough outlines. Turn on the Edge smoothing option — it snaps those partial-alpha edge pixels to fully opaque or fully transparent so the tracer sees a clean boundary. Medium and High also trace at 2× resolution for smoother curves. You can further tune the result by increasing the Line threshold slider and decreasing the Number of colors.',
    },
    {
      q: 'Will it vectorize a photo?',
      a: 'We test this on a range of images, including logos, icons, line artwork, QR codes, and scanned signatures. Photos will attempt to trace the images, but they will produce thousands of tiny colored paths trying to approximate the image\'s pixels. Such traced images are not very useful and generally not scalable.',
    },
    {
      q: 'Is the output SVG editable in Inkscape or a vector editor?',
      a: 'Yes. The output is standard SVG path data that you can open in any vector editor (e.g., Inkscape, Figma). However, a complex trace with thousands of small colored lines can create thousands of tiny paths, which can be tedious to edit. Simplifying the input image before tracing it will generally produce easier-to-edit SVGs with fewer paths.',
    },
  ],


  relatedTools: ['svg-to-png', 'png-to-jpg', 'favicon-generator'],
  relatedArticles: [],

  meta: {
    title: 'Convert PNG to SVG for Free',
    description: 'Transform your PNG files into a scalable SVG vector for free without uploading to a server. No signup, no paywall, no conversion limits.',
  },
}
