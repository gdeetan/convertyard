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
      label: 'Open a PNG file you want converted',
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
      desc: 'Download files individual or all at once through a ZIP file.',
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
  ],

  faq: [
    {
      q: 'Are my PNG files uploaded to convert them?',
      a: 'No. Vectorisation runs entirely in your browser using JavaScript. Your PNGs never leave your device.',
    },
    {
      q: 'Is PNG-to-SVG conversion lossless?',
      a: 'No. This is raster-to-vector tracing, not a lossless conversion. The tool approximates the shapes in your PNG as SVG paths. Simple logos and icons trace accurately; photographs and complex illustrations produce messy SVGs with thousands of tiny paths that are not practical for web or print use.',
    },
    {
      q: 'Why does my vectorised logo have rough or jagged edges?',
      a: 'Anti-aliasing in the original PNG creates semi-transparent edge pixels that the tracer interprets as new colours, producing rough outlines. Increase the Line threshold slider to smooth curves, and reduce the Number of colours to force the tracer to treat near-edge pixels as either foreground or background.',
    },
    {
      q: 'Will it vectorise a photo?',
      a: 'It will try, but the result is not useful — photos produce thousands of tiny coloured paths approximating pixel colours, not clean scalable shapes. Use this tool on logos, icons, line art, QR codes, and scanned signatures only.',
    },
    {
      q: 'Is the output SVG editable in Inkscape or a vector editor?',
      a: 'Yes. The output is standard SVG path data. Open it in Inkscape, Figma, or any vector editor and manipulate the paths normally. Complex traces may have hundreds of overlapping paths, which can make editing tedious — simpler source images produce more workable SVGs.',
    },
  ],

  relatedTools: ['svg-to-png', 'png-to-jpg', 'favicon-generator'],
  relatedArticles: [],

  meta: {
    title: 'Convert PNG to SVG for Free',
    description: 'Transform your PNG files into a scalable SVG vector for free without uploading to a server. No signup, no paywall, no conversion limits.',
  },
}
