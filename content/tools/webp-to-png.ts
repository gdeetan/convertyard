import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'webp-to-png',
  title: 'WebP to PNG Converter',
  subtitle: 'Local-first WebP to PNG conversion. Built for batches.',
  category: 'images',
  accepts: ['image/webp'],
  acceptsExt: ['.webp'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'png', opts, onProgress),

  options: [
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
  ],

  faq: [
    {
      q: 'Why convert WebP to PNG?',
      a: 'PNG is lossless and universally supported — every image editor, design tool, and operating system can open it without plugins. Convert to PNG when you need to edit the image further (editing lossy formats introduces re-compression artifacts), when you need the most precise transparency possible, or when a target application simply doesn\'t accept WebP.',
    },
    {
      q: 'Is PNG lossless?',
      a: 'Yes. PNG uses lossless compression — it reduces file size without discarding any pixel data. Every pixel in the output is identical to the input. This makes PNG the right format for screenshots, logos, UI assets, and any image you plan to edit again. The trade-off is file size: PNGs are typically larger than lossy WebP or JPG at equivalent perceptual quality.',
    },
    {
      q: 'Does WebP to PNG preserve transparency?',
      a: 'Yes. Both WebP and PNG support full alpha transparency, and ConvertYard preserves it through the conversion. A WebP with a transparent background outputs a PNG with the same transparency. No white fill, no color substitution — the alpha channel transfers exactly.',
    },
    {
      q: 'Will the PNG be larger than the WebP?',
      a: 'Usually yes. PNG uses lossless compression, while most WebP files use lossy compression. Converting lossy WebP to lossless PNG locks in the already-compressed pixels at full size, making the output larger than the source. If file size matters, consider staying in WebP. If you need maximum compatibility or lossless quality, PNG is the right call.',
    },
    {
      q: 'Can I convert 1,000 WebP files at once?',
      a: 'Yes. Drop them all in and ConvertYard converts them entirely in your browser — no uploads, no server. Large images take more memory, so if you\'re converting very large WebPs (8000px+), keep batches under 100 files to avoid browser memory limits. Download everything as a ZIP when done.',
    },
  ],

  relatedTools: ['webp-to-jpg', 'png-to-webp', 'compress-image'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'batch-convert-images', 'best-webp-quality'],

  meta: {
    title: 'WebP to PNG Converter — ConvertYard',
    description:
      'Convert WebP to PNG for lossless quality. Batch up to 1,000 files in your browser — no uploads, no account. Full transparency support included.',
  },
}
