import { libvipsConvert } from '@/lib/converters/libvips'
import { PngConversionPreview } from '@/components/image/CompressionPreview'
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
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'png', opts, onProgress, onResult),
  enablePresets: true,

  previewPanel: PngConversionPreview,

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
      a: "Nope, the AVIF to PNG conversion happens in your browser using WebAssembly, so nothing is uploaded to an unknown server. You can safely convert client assets without worrying of it falling into the wrong hands in case of a data breach. Converting files locally also increases the speed since you don’t need to wait for the upload to finish before the files will convert.",
    },
    {
      q: 'Why convert AVIF to PNG instead of JPG?',
      a: "The reason is that PNG is lossless, so it preserves every pixel even after you edit and resave. This format is excellent for graphic images like UI mockups, logos, icons, basically anything with lots of lines, sharp edges, line art, that kind of stuff.",
    },
    {
      q: 'Will the PNG be larger than the original AVIF?',
      a: 'Yes, converting an AVIF to a PNG file will result in a significantly larger file size, up to three to eight times larger because of its lossless format. The tradeoff of this is pixel-perfect quality even after resaving images repeatedly.',
    },
    {
      q: 'Is transparency preserved when converting AVIF to PNG?',
      a: 'Yes, converting AVIF to PNG will retain the transparency of the graphic, so if you need to convert your icons or logos in AVIF format to PNG, the transparency is retained.',
    },
    {
      q: 'What happens to HDR or wide-gamut AVIF files?',
      a: 'Most AVIF files with HDR or Display P3 color profiles are tone-mapped to standard sRGB during conversion. The result is a valid PNG but color-critical content may shift slightly. For professional color-managed work, verify the output in a color-managed application.',
    },
  ],

  relatedTools: ['png-to-avif', 'avif-to-jpg', 'avif-to-gif', 'webp-to-png'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'avif-browser-support', 'lossless-vs-lossy'],

  meta: {
    title: 'AVIF to PNG Converter',
    description:
      'Convert AVIF to a lossless PNG format to retain near pixel-perfect quality if you need to edit graphic images on editing software or need to send these assets to a print shop. Nothing is uploaded. No Signup. 100% Free.',
  },
}
