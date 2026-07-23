import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-webp',
  title: 'PNG to WebP Converter',
  subtitle: 'PNG to WebP with full transparency support. Lossy or lossless — typically 60–80% smaller than the original PNG.',
  bestFor: 'Best for web developers replacing PNG assets with WebP to cut page weight while keeping transparency.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) =>
      libvipsConvert(files, 'webp', opts, onProgress),
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
      hint: '80 is the sweet spot — visually identical to PNG at a fraction of the size. Ignored in lossless mode.',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Pixel-perfect quality with full transparency preserved — larger files than lossy',
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
      hint: 'Removes EXIF and color profile data — smaller files',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass after conversion',
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
  ],

  faq: [
    {
      q: 'Does PNG to WebP preserve transparency?',
      a: 'Yes. Both lossy and lossless WebP support full alpha transparency. A PNG with a transparent background converts to WebP with the same transparency intact. The only edge case is partially-transparent pixels — lossy WebP at low quality settings can introduce slight artifacts around soft alpha edges. Use lossless mode if pixel-perfect transparency is required.',
    },
    {
      q: 'How much smaller will my WebP files be compared to PNG?',
      a: 'Lossy WebP (default) is typically 60–80% smaller than an equivalent PNG. Lossless WebP is 25–35% smaller than PNG using the same image data. The savings are largest on photos and complex gradients; simpler images with flat colors or sharp edges see smaller gains. ConvertYard shows the exact byte savings per file so you can see the difference immediately.',
    },
    {
      q: 'When should I use lossless mode?',
      a: 'Use lossless mode for logos, icons, UI screenshots, or any image you plan to edit again. Lossless WebP preserves every pixel exactly and is still 25–35% smaller than PNG. Use lossy mode (the default) for photos, illustrations, and images destined for the web where a small quality trade-off is acceptable in exchange for much smaller file sizes.',
    },
    {
      q: 'Will WebP work everywhere PNG does?',
      a: 'WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari since version 14 (2020). It covers over 97% of web traffic. Some older design tools, image editors, and CMS platforms still expect PNG. If you\'re delivering web assets, WebP is the right default. If you need to share files with colleagues using older software, PNG may be safer.',
    },
    {
      q: 'Can I convert 1,000 PNGs at once?',
      a: 'Yes. Drop them all in and ConvertYard converts them entirely in your browser — no uploads, no server. Speed depends on file sizes and your device. Large PNGs (3000px+) take longer than small ones. Download everything as a ZIP when done.',
    },
  ],

  relatedTools: ['jpg-to-webp', 'webp-to-png', 'png-to-avif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'PNG to WebP Converter — ConvertYard',
    description:
      'Convert PNG to WebP with transparency support. Batch up to 1,000 files in your browser — no uploads, no account. Lossless mode, quality control, resize included.',
  },
}
