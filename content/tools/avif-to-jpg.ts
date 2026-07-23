import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-jpg',
  title: 'AVIF to JPG Converter',
  subtitle: 'AVIF is great for the web, but JPG plays everywhere. Convert 1,000+ files without a server or plugin.',
  bestFor: 'Best for making AVIF web images compatible with older software, email clients, and print workflows.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress) =>
      libvipsConvert(files, 'jpg', opts, onProgress),
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 90,
      hint: '90 preserves the visual fidelity of your AVIF source with minimal JPG overhead',
    },
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
      hint: 'Removes EXIF, GPS, and camera data — smaller files, more privacy',
    },
  ],

  faq: [
    {
      q: 'Are my AVIF files uploaded to convert them?',
      a: "No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images.",
    },
    {
      q: 'Why would I convert AVIF back to JPG?',
      a: "AVIF has excellent browser support but older software, CMS platforms, email clients, and print workflows often reject it. JPG is the most universally accepted image format. Common cases: uploading to a CMS that rejects AVIF, sending via email, sharing with someone on an older device, or submitting to a print lab.",
    },
    {
      q: 'What do I lose going from AVIF to JPG?',
      a: 'AVIF supports HDR, wide color gamut (Display P3), and transparency — none of these survive in JPG. HDR content gets tone-mapped to standard range, transparency is filled with white, and wide-gamut colors are clipped to sRGB. For standard sRGB web images, the output is visually identical at quality 90.',
    },
    {
      q: 'Will converting AVIF to JPG lose quality?',
      a: 'Some quality loss is unavoidable when converting between two lossy formats. At quality 90, the result is visually excellent. Avoid converting AVIF→JPG→AVIF repeatedly; each round trip compounds the loss.',
    },
    {
      q: 'Does this work with AVIF files created on iPhone?',
      a: "iPhones capture in HEIC, not AVIF. If you're converting iPhone photos, use the HEIC to JPG tool instead. AVIF is a web-delivery format produced by browsers and image editing tools, not a camera capture format.",
    },
  ],

  relatedTools: ['jpg-to-avif', 'avif-to-png', 'webp-to-jpg'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'avif-browser-support', 'batch-convert-images'],

  meta: {
    title: 'AVIF to JPG Converter — ConvertYard',
    description:
      'Convert AVIF to JPG in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Adjustable quality with resize and metadata controls.',
  },
}
