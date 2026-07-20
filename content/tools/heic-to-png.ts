import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-png',
  title: 'HEIC to PNG Converter',
  subtitle: 'iPhone HEIC photos to lossless PNG — full quality, transparency intact. No iCloud, no plugins needed.',
  bestFor: 'Best for photographers who need to edit iPhone photos in apps that accept PNG but not HEIC.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'png', opts, onProgress),

  options: [
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation on phone photos using EXIF data',
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
      hint: 'Removes EXIF, GPS, and camera data — smaller files, more privacy',
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
      q: 'Are my iPhone photos uploaded to convert them?',
      a: "No. Conversion runs entirely in your browser using WebAssembly. Your HEIC files never leave your device — ConvertYard's servers only deliver the tool's code.",
    },
    {
      q: 'Why convert HEIC to PNG instead of JPG?',
      a: 'PNG is lossless — every pixel from your iPhone photo is preserved exactly. JPG is lossy and introduces compression artifacts. Convert to PNG when you need to edit the images repeatedly in a photo editor (to avoid re-compression degradation each time), or when the destination requires lossless input. For sharing and web use, JPG is a better size-to-quality tradeoff.',
    },
    {
      q: 'Does HEIC to PNG lose any quality?',
      a: 'No. Converting to PNG unpacks the HEIC data into a lossless container — nothing is discarded. The output PNG contains every pixel of your original iPhone photo. PNG files will be larger than the HEIC sources because PNG\'s lossless compression is less efficient than HEIC\'s algorithm.',
    },
    {
      q: 'Can a green or pink cast appear in PNG output from HEIC?',
      a: 'Yes, this can happen with HDR HEIC photos from newer iPhones. The HEIC is encoded in Display P3 color space, which can be misinterpreted during conversion. The result is a slight color shift in a small percentage of photos — mostly those taken in bright sunlight or with Smart HDR enabled.',
    },
    {
      q: 'Will the output PNG be larger than the source HEIC?',
      a: 'Yes — typically 3–6x larger. HEIC uses very efficient lossy compression. PNG is lossless, so it stores the full decoded pixel data. This is expected: PNG gives you a pixel-perfect editable file, but at the cost of file size.',
    },
  ],

  relatedTools: ['heic-to-jpg', 'png-to-webp', 'compress-image'],
  relatedArticles: ['what-is-heic', 'heic-to-jpg-on-windows', 'batch-convert-images'],

  meta: {
    title: 'HEIC to PNG Converter — ConvertYard',
    description:
      'Convert iPhone HEIC photos to PNG. Lossless quality, batch up to 1,000 files locally in your browser — no uploads, no account. Auto-orient and resize included.',
  },
}
