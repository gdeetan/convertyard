import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-avif',
  title: 'HEIC to AVIF Converter',
  subtitle: 'Convert iPhone HEIC photos to AVIF — best-in-class compression, up to 50% smaller than JPG. No iCloud needed.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'avif', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 70,
      hint: '70 is the sweet spot for AVIF — visually identical to HEIC at roughly half the file size',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Compression effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: '0 = fastest (larger file), 9 = smallest file (much slower)',
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
      hint: 'Fixes rotation on phone photos using EXIF data',
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
      q: 'Why convert HEIC to AVIF instead of JPG?',
      a: 'AVIF achieves 40–50% better compression than JPG at the same visual quality, and 20–30% better than WebP. If you are converting iPhone photos for web use, AVIF gives you the smallest files. Browser support covers Chrome, Edge, Firefox, and Safari 16+.',
    },
    {
      q: 'Does this preserve image quality from HEIC?',
      a: 'At quality 70, AVIF output is visually indistinguishable from the original HEIC for most photos. AVIF uses AV1 compression that retains fine detail better than older formats at low file sizes.',
    },
    {
      q: 'Does AVIF work in all browsers?',
      a: 'AVIF is supported in Chrome (since 85), Edge (since 121), Firefox (since 93), and Safari (since 16). That covers over 90% of global web traffic. For broader compatibility, use WebP or JPG instead.',
    },
    {
      q: 'Can I convert 1,000 HEIC files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them one at a time in your browser — no uploads, no server queue. HEIC decoding happens locally via WebAssembly. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my photos uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser. Your photos never leave your device.',
    },
  ],

  relatedTools: ['heic-to-jpg', 'heic-to-png', 'heic-to-webp', 'jpg-to-avif'],
  relatedArticles: ['what-is-heic', 'avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'HEIC to AVIF Converter — ConvertYard',
    description:
      'Convert iPhone HEIC photos to AVIF in your browser. Up to 50% smaller than JPG. Batch convert up to 1,000 files — no uploads, no account.',
  },
}
