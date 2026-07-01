import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-png',
  title: 'HEIC to PNG Converter',
  subtitle: 'iPhone HEIC photos to lossless PNG — full quality, transparency intact. No iCloud, no plugins needed.',
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
      q: 'Why convert HEIC to PNG instead of JPG?',
      a: 'PNG is lossless — every pixel from your iPhone photo is preserved exactly. JPG is lossy and introduces compression artifacts. Convert to PNG when you need to edit the images in a photo editor (to avoid re-compression degradation), when maximum quality matters, or when the destination requires lossless input. For sharing and web use where file size matters, JPG is usually the better choice.',
    },
    {
      q: 'Does HEIC to PNG lose any quality?',
      a: 'No. HEIC stores photos with high-quality compression. Converting to PNG unpacks that data into a lossless container — nothing is discarded. The output PNG contains every pixel of your original iPhone photo. PNG files will be larger than the source HEIC files because PNG\'s lossless compression is less efficient than HEIC\'s algorithm.',
    },
    {
      q: 'Can I open HEIC files on Windows without converting?',
      a: 'Windows can open HEIC files with the free "HEIF Image Extensions" from the Microsoft Store. However, most design and editing apps (older Photoshop, Lightroom pre-2018, most non-Adobe tools) can\'t read HEIC directly. PNG has universal support across every application and operating system.',
    },
    {
      q: 'Do iPhone photos have transparency in PNG format?',
      a: 'Standard iPhone photos do not have transparency — they are fully opaque RGB images. The PNG output will also be fully opaque. Transparency is only relevant if you\'ve made a specific edit (like removing the background in Photos) before converting. In that case, ConvertYard preserves the alpha channel.',
    },
    {
      q: 'Can I convert 1,000 HEIC files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server queue. PNG files are larger than HEIC, so your output ZIP will be bigger than the source files. Download everything as a single ZIP when done.',
    },
    {
      q: 'Are my photos uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your photos never leave your device — ConvertYard\'s servers only deliver the tool\'s code.',
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
