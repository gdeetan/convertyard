import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-webp',
  title: 'HEIC to WebP Converter',
  subtitle: 'Convert iPhone HEIC photos to modern WebP — smaller than JPG, wider support than HEIC. No iCloud needed.',
  bestFor: 'Best for converting iPhone photos to a web-ready format that is smaller than JPG and works in all modern browsers.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'webp', opts, onProgress, onResult),
  enablePresets: true,

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
      q: 'Are my iPhone photos uploaded to convert them?',
      a: "No. Conversion runs entirely in your browser. Your HEIC files never leave your device. ConvertYard's servers only deliver the tool's code.",
    },
    {
      q: 'Why convert HEIC to WebP instead of JPG?',
      a: 'WebP is typically 25–35% smaller than JPG at the same quality, and it is supported in all modern browsers. If you are converting iPhone photos for web use, WebP gives better quality-per-byte than JPG while being universally supported. For compatibility with older software or services that still reject WebP, convert to JPG instead.',
    },
    {
      q: 'What is the difference between HEIC and WebP?',
      a: 'HEIC is Apple\'s camera format — great compression, but limited to Apple devices without special software. WebP is Google\'s open web standard, supported in all major browsers since 2020. Converting HEIC to WebP trades a small amount of Apple-ecosystem efficiency for universal browser compatibility.',
    },
    {
      q: 'Can I get a green or pink cast after converting HEIC to WebP?',
      a: 'Yes, occasionally. HDR or Display P3 HEIC photos from newer iPhones can have a slight color shift when decoded on non-Apple systems. It affects a small percentage of photos taken in bright light or with Smart HDR. The lossless mode does not prevent this — it is a color space mapping issue, not a compression issue.',
    },
    {
      q: 'Does WebP work in all browsers?',
      a: 'WebP is supported in Chrome, Edge, Firefox, and Safari (since version 14, 2020). That covers over 97% of global web traffic. For desktop software or services that predate 2020, convert to JPG instead.',
    },
  ],

  relatedTools: ['heic-to-avif', 'heic-to-jpg', 'heic-to-png', 'jpg-to-webp'],
  relatedArticles: ['what-is-heic', 'avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'HEIC to WebP Converter — ConvertYard',
    description:
      'Convert iPhone HEIC photos to WebP in your browser. Smaller than JPG at similar quality. Batch up to 1,000 files — nothing is uploaded, no account needed.',
  },
}
