import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-avif',
  title: 'HEIC to AVIF Converter',
  subtitle: 'Convert iPhone HEIC photos to AVIF — best-in-class compression, up to 50% smaller than JPG. No iCloud needed.',
  bestFor: 'Best for web publishers converting iPhone photo libraries to the smallest possible web-ready format.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress) =>
  enablePresets: true,
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
      hint: '0 = fastest encode (larger file), 9 = smallest file (slower). AVIF encoding is thorough — larger files may take a few seconds.',
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
      q: 'Are my iPhone photos uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser. Your HEIC files never leave your device.',
    },
    {
      q: 'Why convert HEIC to AVIF instead of JPG?',
      a: 'AVIF achieves 40–50% better compression than JPG at the same visual quality, and 20–30% better than WebP. If you are converting iPhone photos for web use, AVIF gives the smallest files. Browser support covers Chrome, Edge, Firefox, and Safari 16+.',
    },
    {
      q: 'What is the difference between HEIC and AVIF?',
      a: 'Both are based on modern video codec compression — HEIC uses HEVC (H.265), AVIF uses AV1. AVIF achieves slightly better compression than HEIC at equivalent quality. The key difference is ecosystem: HEIC is Apple\'s camera format, locked to Apple devices. AVIF is an open web standard supported by all major browsers. Converting from one to the other loses no meaningful quality.',
    },
    {
      q: 'Can I get a green or pink cast after converting HEIC to AVIF?',
      a: 'Yes, this can happen with HDR or wide-gamut HEIC photos taken on newer iPhones. The HEIC is encoded in Display P3 color space, which can be misinterpreted during conversion. AVIF supports wide color gamut too, but the mapping between the two is not always perfect. It affects a small percentage of photos, particularly those shot in bright light or with Smart HDR enabled.',
    },
    {
      q: 'Does AVIF work in all browsers?',
      a: 'AVIF is supported in Chrome (since 85), Edge (since 121), Firefox (since 93), and Safari (since 16.4). That covers over 93% of global web traffic. For broader compatibility with older Safari or software, convert to WebP or JPG instead.',
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
