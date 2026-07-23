import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'webp-to-jpg',
  title: 'WebP to JPG Converter',
  subtitle: 'WebP to universal JPG — compatible with every app, OS, and platform. Batch 1,000+ files at once.',
  bestFor: 'Best for making WebP images openable in apps, email clients, and tools that don\'t support WebP.',
  category: 'images',
  accepts: ['image/webp'],
  acceptsExt: ['.webp'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress) =>
  enablePresets: true,
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
      hint: '90 produces excellent quality JPGs compatible with every app and service',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation using EXIF data',
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
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and color profile data — smaller files, more privacy',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful if JPG looks softer than the source WebP',
    },
  ],

  faq: [
    {
      q: 'Why would I convert WebP to JPG?',
      a: 'WebP has near-universal browser support but many non-browser apps still can\'t open it: older versions of Photoshop, Lightroom, Windows Photo Viewer, most email clients, and many printing services expect JPG. Converting to JPG makes your images universally openable without any plugins or extra steps.',
    },
    {
      q: 'Does Safari support WebP now?',
      a: 'Yes. Safari added WebP support in version 14 (September 2020), which means virtually all modern Apple devices support it. However, older iPhones and Macs that can\'t update past Safari 13 will still fail to display WebP. If you\'re targeting the broadest possible audience including older devices, JPG is still the safe choice.',
    },
    {
      q: 'Does converting WebP to JPG lose quality?',
      a: 'It depends on the source. If the original WebP was lossless, converting to JPG at quality 90 introduces minimal but technically measurable loss — imperceptible in practice. If the original WebP was lossy, you\'re re-compressing already-compressed data, which can introduce minor additional artifacts. For files where quality is critical, use quality 95+ to minimize the second compression pass.',
    },
    {
      q: 'Can I convert 1,000 WebP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server queue. Download everything as a ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool\'s code; they never see your images.',
    },
  ],

  relatedTools: ['webp-to-png', 'jpg-to-webp', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'WebP to JPG Converter — ConvertYard',
    description:
      'Convert WebP to JPG for universal compatibility. Batch up to 1,000 files locally in your browser — no uploads, no account. Quality control and resize included.',
  },
}
