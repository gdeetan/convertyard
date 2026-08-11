import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-webp',
  title: 'JPG to WebP Converter',
  subtitle: 'WebP files average 25–35% smaller than JPG. Batch convert 1,000 at once — see exact savings per file.',
  bestFor: 'Best for web developers cutting page weight by switching JPG assets to modern WebP.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
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
      hint: '80 is the sweet spot — visually identical to JPG at a fraction of the size',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Larger files, pixel-perfect quality — ignores the quality slider',
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
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful if WebP looks softer than your JPG',
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
      q: 'Does converting JPG to WebP reduce quality?',
      a: 'At the default quality of 80, the difference is invisible to most viewers — WebP is simply more efficient than JPG at the same perceptual quality. If you enable lossless mode, there is zero quality loss. The only scenario where you would notice degradation is at very low quality settings (below 50), which would look bad in any format.',
    },
    {
      q: 'How much smaller will my WebP files be?',
      a: 'On average, 25–35% smaller than the equivalent JPG. Results vary by content: photos with gradients and smooth tones compress best (30–40% savings), while images with sharp edges or text see smaller gains (10–20%). ConvertYard shows you the exact byte savings per file in your results so you can see the difference immediately.',
    },
    {
      q: 'Does WebP work in all browsers?',
      a: 'WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari (since version 14, released September 2020). That covers over 97% of global web traffic. If you need to support Safari 13 or Internet Explorer, stick with JPG. For any modern web project, WebP is the right default.',
    },
    {
      q: "What's the difference between lossy and lossless WebP?",
      a: 'Lossy WebP (the default) discards some pixel data to shrink file size — at quality 80 this is imperceptible. Lossless WebP preserves every pixel exactly, like a PNG, but uses smarter compression than PNG and is typically 25% smaller than an equivalent PNG. Lossless files are 10–30% larger than lossy equivalents. Use lossless for logos, screenshots, UI assets, or images you plan to edit again.',
    },
    {
      q: 'Can I convert 1,000 JPGs at once?',
      a: 'Yes. Drop them all in at once and ConvertYard processes them one at a time in your browser — no uploads, no queues, no server. Speed depends on your device, image dimensions, and the compression effort setting. On a modern laptop, 1,000 average-sized photos typically finishes in 5–15 minutes. Download them all as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: "Never. Conversion runs entirely in your browser using WebAssembly — the same technology behind browser-based tools like Figma. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images, filenames, or metadata.",
    },
  ],

  relatedTools: ['png-to-webp', 'jpg-to-avif', 'webp-to-jpg', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'JPG to WebP Converter — ConvertYard',
    description:
      'Convert JPG to WebP in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Includes quality, resize, and metadata controls.',
  },
}
