import { libvipsConvert } from '@/lib/converters/libvips'
import { PngConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-png',
  title: 'HEIC to PNG Converter',
  subtitle: 'Convert HEIC photos from your iPhone to a lossless PNG format while retaining quality and transparency. No iCloud or plugins needed for this.',
  bestFor: 'Best for photographers who need to edit iPhone photos in apps that accept PNG but not HEIC.',
  category: 'images',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'png', opts, onProgress, onResult),
  previewPanel: PngConversionPreview,
  enablePresets: true,

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
      a: 'Nope. The HEIC to PNG conversion will run in your browser using WebAssembly. Your HEIC files aren’t uploaded to a server and don’t leave your device.',
    },
    {
      q: 'Why convert HEIC to PNG instead of JPG?',
      a: 'One reason is that PNG is lossless, meaning it preserves every pixel from your iPhone photo as-is, with no quality degradation. JPG is lossy, meaning a small percentage of the image is degraded during encoding, so each time you save the image, the quality gets worse. PNG is lossless, so if you plan to edit the image repeatedly in a photo editor or need a high-quality printout, converting to PNG will produce better results. For posting images on the web, JPG is the better size-to-quality alternative.',
    },
    {
      q: 'Does HEIC to PNG lose any quality?',
      a: 'Nope. Converting to PNG will unpack HEIC data into a lossless format so every pixel is preserved. The resulting PNG output will contain every pixel of your original iPhone photograph. But a few notes. PNG files will be larger than HEIC because of PNG’s lossless compression, and one still of the “Live” photo will be saved because PNG doesn’t support animation.',
    },
    {
      q: 'Can a green or pink cast appear in PNG output from HEIC?',
      a: 'Yes, it is possible with HDR HEIC photographs from newer iPhone models. Since HEIC is encoded in the “Display P3” color space, which can be misinterpreted during conversion, it may result in a slight color shift. This is most evident in photographs taken under bright sunlight or with Smart HDR enabled.',
    },
    {
      q: 'Will the output PNG be larger than the source HEIC?',
      a: 'Yes, PNG files are typically three to six times larger than HEIC because HEIC uses efficient lossy compression, while PNG is lossless and stores the full decoded pixel data. Not good for storage space, but if you want the highest print quality, it might be the better option.',
    },
  ],

  relatedTools: ['heic-to-jpg', 'png-to-webp', 'compress-image'],
  relatedArticles: ['what-is-heic', 'heic-to-jpg-on-windows', 'batch-convert-images'],

  meta: {
    title: 'Convert iPhone HEIC to PNG — ConvertYard',
    description:
      'Convert iPhone HEIC photos to PNG. Lossless quality, batch up to 1,000 files locally in your browser — no uploads, no account. Auto-orient and resize included.',
  },
}
