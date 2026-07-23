import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-webp',
  title: 'AVIF to WebP Converter',
  subtitle: 'Both modern formats, both smaller than JPG. Convert your AVIF files to WebP without uploading anything.',
  bestFor: 'Best for switching to WebP when a CMS, CDN, or tool accepts WebP but not AVIF.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) =>
  enablePresets: true,
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
      q: 'Are my AVIF files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Why convert AVIF to WebP?',
      a: 'AVIF is the newer format with slightly better compression, but WebP has broader software support — particularly in image editing apps, CMS platforms, and CDNs that predate 2022. Convert to WebP when a service accepts WebP but not AVIF.',
    },
    {
      q: 'What is the actual difference between AVIF and WebP?',
      a: 'AVIF achieves 10–20% better compression than WebP at equal quality, supports HDR and wide color gamut, and is based on AV1. WebP is faster to encode, has wider tool support, and has been around since 2010. For browser delivery both are excellent; for software compatibility WebP wins.',
    },
    {
      q: 'Will I lose quality converting AVIF to WebP?',
      a: 'At quality 80, the visual difference is imperceptible for most images. The conversion does involve re-encoding (AVIF decode → WebP encode), which introduces a small generation loss. Enable lossless mode to avoid any quality reduction — the output will be larger but pixel-perfect.',
    },
    {
      q: 'Can AVIF transparency be preserved in WebP?',
      a: 'Yes. WebP supports alpha transparency, so any transparent areas in your AVIF are carried through to the WebP output. No background fill is applied.',
    },
  ],

  relatedTools: ['webp-to-avif', 'avif-to-jpg', 'avif-to-png', 'png-to-webp'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'AVIF to WebP Converter — ConvertYard',
    description:
      'Convert AVIF to WebP in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Handles quality, lossless mode, and resize.',
  },
}
