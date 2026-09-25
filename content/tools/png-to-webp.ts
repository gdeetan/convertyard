import { libvipsConvert } from '@/lib/converters/libvips'
import { WebpConversionPreview } from '@/components/image/CompressionPreview'
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
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'webp', opts, onProgress, onResult),
  enablePresets: true,

  previewPanel: WebpConversionPreview,

  howItWorks: [
    { label: 'Drop your files', desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 1,000 files at once.' },
    { label: 'Choose settings', desc: 'Adjust the quality slider and check the quality in real time to see if the image quality is acceptable. Choose between lossy or lossless, set a custom dimension (optional), or strip metadata.' },
    { label: 'Click Convert', desc: 'Everything runs in your browser via WebAssembly. PNG to WebP Converter happens locally — no server involved.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],

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
      a: 'Yes. PNG supports lossy and lossless compression and full alpha transparency. A PNG file converted to WebP will retain the same transparent background but with a much smaller file size. However, for images with faded edges (e.g., shadows or smooth logo outlines), WebP files may leave a faint smudge or outline. One workaround is to turn on lossless mode, but it comes at the cost of a larger file size.',
    },
    {
      q: 'How much smaller will my WebP files be compared to PNG?',
      a: 'Lossy WebP, based on tests, can be between 35 and 70% smaller than a PNG file. With lossless WebP files, that can go up to 90% or more at 80% quality. Users will get the highest savings from photographs like landscape shots with lots of detail. Simpler graphic files like logos won’t gain as much savings. With ConvertYard, you’ll see the exact byte savings before you compress the file.',
    },
    {
      q: 'When should I use lossless mode?',
      a: 'Use lossless mode for logos, icons, UI screenshots, or any image you plan to edit again. Lossless WebP preserves every pixel exactly and is still 25–35% smaller than PNG. Use lossy mode (the default) for photos, illustrations, and images destined for the web where a small quality trade-off is acceptable in exchange for much smaller file sizes.',
    },
    {
      q: 'Will WebP work everywhere PNG does?',
      a: 'Yes. Most modern browsers like Chrome, Edge, Safari (after 2020), and Firefox support WebP. So that’s around 97% of web traffic. However, some image editors and CMS platforms don’t support WebP, only PNG or other legacy formats like JPG; check the manual if you’re not sure. If you’re uploading these images on a modern CMS like WordPress, it will support WebP, but if you’re sending files to colleagues who may be using legacy software, using the PNG format will be safer.',
    },
    {
      q: 'Can I convert 1,000 PNGs at once?',
      a: 'Yes. You can convert batches up to 1,000 files. One limiting factor will be your computer’s memory. If you’re using an older laptop, you can want to limit it to batches of 100 to 200. If you’re converting large files, then limit them to batches of 25 to 50 so your computer doesn’t stall. The preview slider will only appear on the first four images as a safeguard to prevent the computer from locking up.',
    },
  ],

  relatedTools: ['jpg-to-webp', 'webp-to-png', 'png-to-avif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'PNG to WebP Converter in Your Browser — ConvertYard',
    description:
      'Convert PNG to WebP with transparency support. Batch up to 1,000 files in your browser — no uploads, no account. Lossless mode, quality control, resize included.',
  },
}
