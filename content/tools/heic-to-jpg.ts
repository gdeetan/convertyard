import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-jpg',
  title: 'HEIC to JPG Converter',
  subtitle: 'Convert iPhone’s HEIC format to a universally readable JPG format in your browser. No paywall. Nothing uploads to a server. Everything is converted locally in your browser.',
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
      a: 'No files are uploaded. The image conversion happens in your browser using WebAssembly. Your HEIC files don’t leave your device since our servers only load the tool’s code in the browser. No one will see your images, filenames, or GPS data.',
    },
    {
      q: 'Why can\'t Windows open HEIC files?',
      a: 'HEIC uses Apple\'s HEIF implementation, which is licensed. Windows does not include the required HEIF codec by default. HEIF Image Extensions for Windows 10/11 is available as a free app from the Microsoft Store. However, other Windows-based apps and browsers won’t be able to read or load them. All apps can open HEIC images after you convert them to JPG.',
    },
    {
      q: 'My converted JPG has a greenish or purplish cast. Why?',
      a: 'HDR or wide-gamut HEIC photos taken with new iPhones may experience this issue. HEIC photos are encoded in the Display P3 color space. However, when these images are converted on non-Apple devices, the encoded image may be misinterpreted. The issue affects only a small number of images. The most affected are very bright images shot outdoors and images that have been edited with Smart HDR.',
    },
    {
      q: 'Does converting HEIC to JPG reduce quality?',
      a: 'Converting an image at quality 90 looks nearly indistinguishable from the original. As with any re-encoding of an image, there are some minor degradation points, but you’d have to look very closely at the image to see it. For future editing, it’s better to encode at 95–100, but for sharing the images or putting them up on websites, 85–90 is perfectly fine.',
    },
    {
      q: 'Why is my iPhone photo sideways after converting?',
      a: 'iPhones take photos in upright orientation and store the rotation information in the EXIF data. Most apps honor the rotation information in the EXIF data, but some do not. The option Auto-orient (enabled by default) reads the rotation information from the EXIF data and aligns the pixels accordingly for the output JPG file. This ensures the photo displays correctly in all apps.',
    },
    {
      q: 'Will Live Photos convert correctly?',
      a: 'Yes, but only the still frame is converted. The motion element of a ‘live photo’ is stored separately in another video file, so it’s not included in the HEIC. The image is available, but not the video loop.',
    },
  ],

  relatedTools: ['heic-to-avif', 'heic-to-png', 'heic-to-webp', 'jpg-to-webp'],
  relatedArticles: ['what-is-heic', 'heic-to-jpg-on-windows', 'batch-convert-images'],

  meta: {
    title: 'Convert iPhone HEIC to JPG - Unlimited Convertions, Nothing Uploads',
    description:
      "Convert iPhone HEIC files to JPG file in your browser to view the photo on non-IOS devices. Convert batches up to 1,000 files for free. Nothing uploads and there's no paywall. Auto-orient, resize, and adjust quality filters are included.",
  },
}
