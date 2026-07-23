import { pngToSvgConvert } from '@/lib/converters/png-to-svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-svg',
  title: 'PNG to SVG Converter',
  subtitle: 'Trace PNG logos and icons into scalable SVG paths. Works on simple, high-contrast art.',
  bestFor: 'Best for designers who need an SVG version of a simple logo or icon they only have as a PNG.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.svg',
  convertFn: (files, opts, onProgress) => pngToSvgConvert(files, opts, onProgress),
  enablePresets: true,

  limitationNote: {
    summary: 'Best on simple, high-contrast images',
    body: 'Vectorisation works well on logos, icons, line art, QR codes, and signatures. Photographs and complex illustrations produce high-complexity SVGs with many tiny paths — not suitable for web use. For clean results, use images with clear, distinct edges.',
  },

  options: [
    {
      type: 'slider',
      name: 'numberofcolors',
      label: 'Number of colours',
      min: 2,
      max: 32,
      step: 2,
      default: 16,
      hint: 'Fewer colours = simpler SVG. For logos, 4–8 is usually enough.',
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
    title: 'PNG to SVG Converter — ConvertYard',
    description: 'Vectorise PNG logos and icons into scalable SVG — no Illustrator needed. Works on logos, icons, line art, QR codes. Runs locally in your browser.',
  },
}
