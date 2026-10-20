import { libvipsConvert } from '@/lib/converters/libvips'
import { WebpConversionPreview } from '@/components/image/CompressionPreview'
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

  previewPanel: WebpConversionPreview,

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
      a: `<strong>Nope.</strong> The conversion happens <strong>inside your browser</strong>. Your HEIC files aren&rsquo;t uploaded to an unknown server; it just delivers the code to your browser.`,
    },
    {
      q: 'Why convert HEIC to WebP instead of JPG?',
      a: `We find that WebP can be <strong>35-70% smaller</strong> than an equivalent quality JPG. So for using photos taken by iPhone on the web, it&rsquo;s often better than JPG in terms of <strong>quality per byte</strong>. As WebP is now <strong>universally supported on the web</strong> (Chromium-based browsers, FF, Edge, Safari since 2020), you may want to use JPG though if you&rsquo;re uploading photos to some older software or service that doesn&rsquo;t support WebP yet.`,
    },
    {
      q: 'What is the difference between HEIC and WebP?',
      a: `HEIC is <strong>Apple&rsquo;s camera file type</strong>. Apple HEIC files are highly compressed. WebP, on the other hand, is <strong>Google&rsquo;s open web standard</strong>. For example, if you need to display iPhone camera photos on the web, you can convert HEIC files to WebP. WebP is supported in <strong>all major web browsers since 2020</strong>.`,
    },
    {
      q: 'Can I get a green or pink cast after converting HEIC to WebP?',
      a: `<strong>Yes, occasionally.</strong> This color shift affects a <strong>small percentage</strong> of the photos shot in bright conditions (outdoors) with iPhone cameras using <strong>Smart HDR</strong>, or when taking HDR/Display P3 HEIC photos. It is not a problem caused by lossless mode, but rather a <strong>color space mapping issue</strong>.`,
    },
    {
      q: 'Does WebP work in all browsers?',
      a: `Support for WebP has been available in <strong>Chrome, Edge, Firefox, and Safari</strong> (since version 14 from 2020) on the desktop for <strong>over 97% of all users on the web</strong>. If your software or web service does not support WebP from before 2020, then you should export your images as JPEG instead.`,
    },
  ],

  relatedTools: ['heic-to-avif', 'heic-to-jpg', 'heic-to-png', 'jpg-to-webp'],
  relatedArticles: ['what-is-heic', 'avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'HEIC to WebP Converter — ConvertYard',
    description:
      'Convert iPhone HEIC photos to WebP in your browser. 25–35% smaller than JPG at the same quality, works in every modern browser. Batch up to 1,000 files — nothing is uploaded.',
  },
}
