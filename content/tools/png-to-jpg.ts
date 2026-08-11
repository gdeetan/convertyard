import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-jpg',
  title: 'PNG to JPG Converter',
  subtitle: 'PNG to JPG — set your own quality level, strip transparency cleanly. Batch 1,000 files at once.',
  bestFor: 'Best for shrinking screenshots and PNG exports before emailing or uploading to web.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'jpg', opts, onProgress, onResult),
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 85,
      hint: '85 gives excellent quality with significant file size reduction',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'Transparent PNG areas are filled with this color (JPG has no transparency)',
    },
    {
      type: 'toggle',
      name: 'progressive',
      label: 'Progressive JPEG',
      default: false,
      hint: 'Loads blurry-to-sharp in browsers — slightly larger file, better perceived performance',
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
      hint: 'Removes EXIF, GPS, and camera data — smaller files, more privacy',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful if JPG looks softer than your PNG',
    },
  ],

  faq: [
    {
      q: 'Does converting PNG to JPG reduce quality?',
      a: 'Yes — JPG is a lossy format. At the default quality of 85, the difference is imperceptible to most viewers. You would only notice degradation at very low settings (below 50). If you need pixel-perfect fidelity, keep the PNG; if you need a smaller file for web or email, JPG at 80–90 is the right call.',
    },
    {
      q: 'What happens to transparent areas in my PNG?',
      a: 'JPG has no transparency support. Any transparent pixels in your PNG are filled with the background color you choose — white by default. Use the color picker to set a different fill color if your image is designed for a dark or colored background.',
    },
    {
      q: 'Why would I convert PNG to JPG?',
      a: 'PNGs are lossless and often 3–10x larger than equivalent JPGs. For photographs and complex images without text or hard edges, JPG gives excellent visual quality at a fraction of the size. Use PNG when you need lossless quality, transparency, or sharp text/logos. Use JPG for photos you\'re sharing, uploading to social media, or embedding in web pages.',
    },
    {
      q: 'Can I convert 1,000 PNGs at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them one at a time in your browser — no uploads, no server queue. Speed depends on your device and image dimensions. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my PNG files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly — your PNGs never leave your device. ConvertYard\'s servers only deliver the tool\'s code; they never see your images.',
    },
  ],

  relatedTools: ['jpg-to-png', 'png-to-webp', 'png-to-avif', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'PNG to JPG Converter — ConvertYard',
    description:
      'Convert PNG to JPG in your browser. Batch up to 1,000 files — no uploads, no account. Handles transparency, quality, resize, and metadata stripping.',
  },
}
