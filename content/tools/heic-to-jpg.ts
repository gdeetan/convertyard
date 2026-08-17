import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-jpg',
  title: 'HEIC to JPG Converter',
  subtitle: 'iPhone photos to universal JPGs in your browser. Drop 1,000 at once — no iCloud, no Lightroom needed.',
  bestFor: 'Best for making iPhone photos viewable on Windows PCs, Android devices, and apps that reject HEIC.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
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
      q: 'Are my iPhone photos uploaded to convert them?',
      a: "No. Conversion runs entirely in your browser using WebAssembly. Your HEIC files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images, filenames, or GPS data.",
    },
    {
      q: 'Why can\'t Windows open HEIC files?',
      a: 'HEIC uses Apple\'s implementation of the HEIF format, which requires a licensed codec not installed by default on Windows. Windows 10/11 can open HEIC files if you install the free "HEIF Image Extensions" from the Microsoft Store, but most other apps still cannot read them. Converting to JPG works universally.',
    },
    {
      q: 'My converted JPG has a greenish or purplish cast. Why?',
      a: 'This can happen with HDR or wide-gamut HEIC photos taken on newer iPhones. The HEIC is encoded in Display P3 color space, which can be misinterpreted during conversion on non-Apple systems. It affects a small percentage of photos, particularly those shot in bright outdoor light or with Smart HDR enabled.',
    },
    {
      q: 'Does converting HEIC to JPG reduce quality?',
      a: 'At quality 90, the difference is imperceptible. The re-encoding introduces minimal degradation that is invisible in normal viewing. If you plan to edit the images further, convert at 95–100 to preserve maximum data. For sharing and web use, 85–90 is the sweet spot.',
    },
    {
      q: 'Why is my iPhone photo sideways after converting?',
      a: 'iPhones store the photo upright but embed the rotation in EXIF metadata rather than rotating the pixels. Some apps respect this metadata; others ignore it. The Auto-orient option (enabled by default) reads the EXIF rotation and bakes it into the output pixels, so the JPG displays correctly everywhere.',
    },
    {
      q: 'Will Live Photos convert correctly?',
      a: 'Only the still frame converts. The motion component of a Live Photo is stored separately in a video file and is not included in the HEIC. You get the still image, not the video loop.',
    },
  ],

  relatedTools: ['heic-to-avif', 'heic-to-png', 'heic-to-webp', 'jpg-to-webp'],
  relatedArticles: ['what-is-heic', 'heic-to-jpg-on-windows', 'batch-convert-images'],

  meta: {
    title: 'Convert iPhone HEIC to JPG — ConvertYard',
    description:
      'Convert iPhone HEIC photos to JPG in your browser. Batch up to 1,000 files — no uploads, no account. Auto-orient, quality control, and resize included.',
  },
}
