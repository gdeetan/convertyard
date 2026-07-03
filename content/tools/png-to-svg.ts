import { pngToSvgConvert } from '@/lib/converters/png-to-svg-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-svg',
  title: 'PNG to SVG Converter',
  subtitle: 'Vectorise PNG logos and icons into scalable SVG. No Illustrator needed.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.svg',
  convertFn: (files, opts, onProgress) => pngToSvgConvert(files, opts, onProgress),

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
      q: 'Will it vectorise a photo?',
      a: 'It will attempt it, but photos produce complex SVGs full of tiny coloured shapes — not useful for web or print. Vectorisation works best on simple, high-contrast images: logos, icons, line drawings, QR codes.',
    },
    {
      q: 'Why does my vectorised logo have rough edges?',
      a: 'Increase the Line threshold slider. Higher values smooth curves more aggressively — useful for logos that had anti-aliasing in the original PNG.',
    },
    {
      q: 'Can I vectorise a scanned signature?',
      a: 'Yes. A clean scan on white paper with dark ink vectorises well. Set Number of colours to 2 (black and white) for the cleanest result.',
    },
    {
      q: 'Is the output SVG editable in Illustrator or Inkscape?',
      a: 'Yes. The output is standard SVG path data — open it in any vector editor and manipulate paths normally.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Vectorisation runs entirely in your browser using JavaScript. Your PNGs stay on your device.',
    },
  ],

  relatedTools: ['svg-to-png', 'png-to-jpg', 'favicon-generator'],
  relatedArticles: [],

  meta: {
    title: 'PNG to SVG Converter — ConvertYard',
    description: 'Vectorise PNG logos and icons into scalable SVG — no Illustrator needed. Works on logos, icons, line art, QR codes. Runs locally in your browser.',
  },
}
