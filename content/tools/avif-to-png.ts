import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-png',
  title: 'AVIF to PNG Converter',
  subtitle: 'AVIF to lossless PNG — transparency preserved. Batch 1,000+ files entirely in your browser.',
  bestFor: 'Best for designers who need to edit AVIF images in software that does not yet support the format.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) =>
  enablePresets: true,
    libvipsConvert(files, 'png', opts, onProgress),

  options: [
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: 'Downscales the longer edge. 0 = keep original size. Never upscales.',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Corrects rotation using EXIF orientation data',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and color profile metadata',
    },
  ],

  faq: [
    {
      q: 'Are my AVIF files uploaded to convert them?',
      a: "No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images.",
    },
    {
      q: 'Why convert AVIF to PNG instead of JPG?',
      a: "PNG is lossless — every pixel is preserved exactly. Convert to PNG when you need to edit the image further (to avoid re-compression degradation), when the destination requires lossless input, or when the AVIF has transparency you want to keep. For sharing or web use where file size matters, JPG is usually smaller.",
    },
    {
      q: 'Will the PNG be larger than the original AVIF?',
      a: 'Yes — significantly. AVIF is a lossy format with very efficient compression; PNG is lossless. Expect PNG files to be 3–8x larger than their AVIF source for photographs. This is the tradeoff for getting a pixel-perfect, editable file.',
    },
    {
      q: 'Is transparency preserved when converting AVIF to PNG?',
      a: 'Yes. If your AVIF has an alpha channel (transparent areas), those are preserved in the output PNG. PNG has full alpha transparency support, so nothing is lost in that aspect of the conversion.',
    },
    {
      q: 'What happens to HDR or wide-gamut AVIF files?',
      a: 'Most AVIF files with HDR or Display P3 color profiles are tone-mapped to standard sRGB during conversion. The result is a valid PNG but color-critical content may shift slightly. For professional color-managed work, verify the output in a color-managed application.',
    },
  ],

  relatedTools: ['png-to-avif', 'avif-to-jpg', 'webp-to-png'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'avif-browser-support', 'lossless-vs-lossy'],

  meta: {
    title: 'AVIF to PNG Converter — ConvertYard',
    description:
      'Convert AVIF to PNG in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Lossless output with resize and metadata controls.',
  },
}
