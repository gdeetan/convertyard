import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-png',
  title: 'AVIF to PNG Converter',
  subtitle: 'AVIF to lossless PNG — transparency preserved. Batch 1,000+ files entirely in your browser.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) =>
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
      q: 'Why convert AVIF to PNG?',
      a: "PNG is the most universally supported lossless format. Convert AVIF to PNG when you need to: edit the image in software that doesn't support AVIF (Photoshop, older GIMP versions, Microsoft Office), use it in a print workflow, upload to a platform that doesn't accept AVIF, or preserve every pixel for further editing. PNG will be larger than AVIF, but supports editing without re-encoding loss.",
    },
    {
      q: 'Will the PNG be larger than the original AVIF?',
      a: 'Yes, significantly. PNG is a lossless format and AVIF is lossy by default. The PNG output will faithfully capture the decoded pixels of the AVIF, but PNG cannot match the compression efficiency of AVIF. Expect PNG files to be 3–8x larger than their AVIF counterparts for photographs.',
    },
    {
      q: 'Is transparency preserved when converting AVIF to PNG?',
      a: "Yes. If your AVIF has an alpha channel (transparent areas), those will be preserved in the output PNG. PNG has full alpha transparency support, so no data is lost in the conversion.",
    },
    {
      q: 'Can I batch convert hundreds of AVIF files at once?',
      a: 'Yes. Drop all your AVIF files in at once. ConvertYard processes them in your browser with per-file progress. When done, download all PNGs as a single ZIP file.',
    },
    {
      q: 'Does this work with AVIF files that have HDR or wide color gamut?',
      a: 'wasm-vips handles color space conversion during decode. Most AVIF files with HDR or P3 color profiles will be tone-mapped to sRGB PNG correctly. For professional color-critical work, verify the output in a color-managed application.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: "Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images.",
    },
  ],

  relatedTools: ['png-to-avif', 'avif-to-jpg', 'webp-to-png'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'avif-browser-support', 'lossless-vs-lossy'],

  meta: {
    title: 'AVIF to PNG Converter — ConvertYard',
    description:
      'Convert AVIF to PNG in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Lossless output with resize and metadata controls.',
  },
}
