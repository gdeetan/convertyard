import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-jpg',
  title: 'AVIF to JPG Converter',
  subtitle: 'Local-first AVIF to JPG conversion. Built for batches.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'jpg', opts, onProgress),

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
      q: 'Why would I convert AVIF back to JPG?',
      a: "AVIF has excellent browser coverage, but some older software, CMS platforms, email clients, and devices don't support it yet. Converting to JPG gives you the most universally compatible format. Common cases: uploading to a CMS that rejects AVIF, sending images via email, sharing with someone on an older device, or printing (most print workflows expect JPEG or TIFF).",
    },
    {
      q: 'Will I lose quality converting AVIF to JPG?',
      a: 'Some quality loss is unavoidable when converting between two lossy formats. At the default quality of 90, the result is visually excellent — differences are imperceptible in normal viewing. For maximum fidelity, use quality 95–100. Avoid converting AVIF→JPG→AVIF repeatedly; each round trip compounds the loss.',
    },
    {
      q: 'Is JPG still worth using in 2026?',
      a: "JPG remains the most universally compatible image format. It's supported in every browser, every OS, every printer, every CMS, and every image editor on earth. For final delivery to web audiences on modern browsers, AVIF or WebP are superior. For compatibility, archiving, or interoperability, JPG is still the right choice.",
    },
    {
      q: 'Can I batch convert hundreds of AVIF files at once?',
      a: 'Yes. Drop all your AVIF files in at once. ConvertYard processes them sequentially in your browser with a per-file progress indicator. When done, download all JPGs as a single ZIP file. No file size limits, no account required.',
    },
    {
      q: 'Does this tool support AVIF files created on iPhone?',
      a: "iPhones shoot in HEIC, not AVIF. If you're converting iPhone photos, use the HEIC to JPG tool instead. AVIF is a web format used by browsers and image editing tools, not a camera capture format.",
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: "Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images.",
    },
  ],

  relatedTools: ['jpg-to-avif', 'avif-to-png', 'webp-to-jpg'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'avif-browser-support', 'batch-convert-images'],

  meta: {
    title: 'AVIF to JPG Converter — ConvertYard',
    description:
      'Convert AVIF to JPG in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Adjustable quality with resize and metadata controls.',
  },
}
