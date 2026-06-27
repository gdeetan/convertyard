import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-webp',
  title: 'AVIF to WebP Converter',
  subtitle: 'Local-first AVIF to WebP conversion. Built for batches.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
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
      hint: '80 gives excellent quality — AVIF and WebP are close in efficiency',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Pixel-perfect output — larger files, ignores the quality slider',
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
      hint: 'Fixes rotation using EXIF data if present',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and camera data from the output WebP',
    },
  ],

  faq: [
    {
      q: 'Why convert AVIF to WebP?',
      a: 'AVIF is the newer format with slightly better compression, but WebP has broader software support — particularly in image editing apps, CMS platforms, and older CDNs. Convert to WebP when a service accepts WebP but not AVIF, or when you need a format with more universal tooling support while still being smaller than JPG.',
    },
    {
      q: 'Will I lose quality converting AVIF to WebP?',
      a: 'At quality 80, the visual difference is imperceptible for most images. Both formats use advanced perceptual compression. The conversion does involve re-encoding (AVIF decode → WebP encode), so there is a small generation loss — enable lossless mode to avoid any quality reduction.',
    },
    {
      q: 'Which format is better for web use?',
      a: 'AVIF achieves 10–20% better compression than WebP at equal quality, but WebP is supported more broadly in older browsers and tools. For new web projects targeting modern browsers (Chrome 85+, Firefox 93+, Safari 16+), AVIF is the better choice. For maximum compatibility, WebP is the safer default.',
    },
    {
      q: 'Can I convert 1,000 AVIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser. No uploads, no server queue. Download all results as a single ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly and the Canvas API. Your files never leave your device.',
    },
  ],

  relatedTools: ['webp-to-avif', 'avif-to-jpg', 'avif-to-png', 'png-to-webp'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'batch-convert-images'],

  meta: {
    title: 'AVIF to WebP Converter — ConvertYard',
    description:
      'Convert AVIF to WebP in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Handles quality, lossless mode, and resize.',
  },
}
