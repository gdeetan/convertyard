import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-webp',
  title: 'HEIC to WebP Converter',
  subtitle: 'Convert iPhone HEIC photos to modern WebP — smaller than JPG, wider support than HEIC. No iCloud needed.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'webp', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 is the sweet spot — visually identical to HEIC at a fraction of the size',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Larger files, pixel-perfect quality — ignores the quality slider',
    },
    {
      type: 'slider',
      name: 'method',
      label: 'Compression effort',
      min: 0,
      max: 6,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 6 = smallest file (slower)',
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
      q: 'Why convert HEIC to WebP instead of JPG?',
      a: 'WebP is typically 25–35% smaller than JPG at the same quality, and it\'s supported in all modern browsers (Chrome, Edge, Firefox, Safari 14+). If you\'re converting iPhone photos for use on the web, WebP gives you better quality-per-byte than JPG. For maximum compatibility with older software or services, convert to JPG instead.',
    },
    {
      q: 'Does this preserve image quality from HEIC?',
      a: 'At quality 80, WebP output is visually indistinguishable from the original HEIC for most photos. Both formats use perceptual compression, and WebP at 80 is roughly equivalent to HEIC at its default quality. Enable lossless mode for pixel-perfect output.',
    },
    {
      q: 'Does WebP work in all browsers?',
      a: 'WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari (since version 14, released 2020). That covers over 97% of global web traffic. For iOS apps or software that predates 2020, convert to JPG instead.',
    },
    {
      q: 'Can I convert 1,000 HEIC files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them one at a time in your browser — no uploads, no server queue. HEIC decoding happens locally via WebAssembly. On a modern laptop, 1,000 average iPhone photos typically finishes in 15–25 minutes. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my photos uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser. Your photos never leave your device. ConvertYard\'s servers only deliver the tool\'s code.',
    },
  ],

  relatedTools: ['heic-to-jpg', 'heic-to-png', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['what-is-heic', 'webp-vs-avif-vs-jpeg', 'batch-convert-images'],

  meta: {
    title: 'HEIC to WebP Converter — ConvertYard',
    description:
      'Convert iPhone HEIC photos to WebP in your browser. Batch up to 1,000 files — no uploads, no account. Smaller than JPG with excellent quality.',
  },
}
