import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-jpg',
  title: 'HEIC to JPG Converter',
  subtitle: 'iPhone photos to universal JPGs in your browser. Drop 1,000 at once — no iCloud, no Lightroom needed.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress) =>
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
      hint: '90 gives excellent quality at a fraction of the HEIC file size',
    },
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
      q: 'What is HEIC format and why do iPhones use it?',
      a: 'HEIC (High Efficiency Image Container) is Apple\'s default photo format since iOS 11. It uses the HEIF compression standard, which produces files roughly half the size of equivalent JPGs at the same perceived quality. Apple chose it to save storage on your iPhone — a 4MB JPG typically becomes a 2MB HEIC file. The trade-off is compatibility: Windows, most Android apps, and many web services still expect JPG.',
    },
    {
      q: 'Can I open HEIC files on Windows without converting?',
      a: 'Windows 10 and 11 can open HEIC files if you install the free "HEIF Image Extensions" from the Microsoft Store. However, most apps (Photoshop pre-2018, older Lightroom, most email clients) still cannot read HEIC. Converting to JPG is the reliable choice for any file you need to share, edit in non-Apple software, or upload to a service.',
    },
    {
      q: 'Does converting HEIC to JPG reduce quality?',
      a: 'At the default quality setting of 90, the difference is imperceptible. JPG at 90 is an excellent format — the re-encoding introduces minimal degradation that is invisible in normal viewing. If you\'re planning to edit the images further, convert at 95–100 to preserve maximum data. For sharing and web use, 85–90 is the sweet spot.',
    },
    {
      q: 'Why is my iPhone photo sideways after converting?',
      a: 'iPhones store the photo upright but embed the rotation in EXIF metadata rather than rotating the pixels. Some apps respect this metadata; others ignore it and display the raw pixel orientation. ConvertYard\'s Auto-orient option (enabled by default) reads the EXIF rotation and bakes it into the output pixels, so the JPG displays correctly everywhere.',
    },
    {
      q: 'Can I convert 1,000 HEIC files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them one at a time in your browser — no uploads, no server queue. Speed depends on your device and image dimensions. On a modern laptop, 1,000 average iPhone photos typically finishes in 10–20 minutes. Download them all as a single ZIP when done.',
    },
    {
      q: 'Are my photos uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your photos never leave your device. ConvertYard\'s servers only deliver the tool\'s code; they never see your images, filenames, or GPS data.',
    },
  ],

  relatedTools: ['heic-to-avif', 'heic-to-png', 'heic-to-webp', 'jpg-to-webp'],
  relatedArticles: ['what-is-heic', 'heic-to-jpg-on-windows', 'batch-convert-images'],

  meta: {
    title: 'HEIC to JPG Converter — ConvertYard',
    description:
      'Convert iPhone HEIC photos to JPG in your browser. Batch up to 1,000 files — no uploads, no account. Auto-orient, quality control, and resize included.',
  },
}
