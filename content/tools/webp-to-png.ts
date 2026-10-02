import { libvipsConvert } from '@/lib/converters/libvips'
import { PngConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'webp-to-png',
  title: 'WebP to PNG Converter',
  subtitle: 'Convert WebP to a lossless PNG format with full transparency support. This tool converts up to 1,000 images per batch without uploading to a server.',
  bestFor: 'Best for converting WebP images to PNG before editing in tools that don\'t support WebP.',
  category: 'images',
  accepts: ['image/webp'],
  acceptsExt: ['.webp'],
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
      a: 'One reason is compatibility. PNG is a legacy format with universal support. That means that every image editor, design tool, smartphone, and operating system can open images in this format even without plugins. Convert WebP to PNG if you need to save the image in a lossless format for archiving, or if you need to submit an image for digital printing, since most printing companies accept legacy formats like TIFF, PNG, and JPG, but not WebP.',
    },
    {
      q: 'Is PNG lossless?',
      a: 'Yes, PNG is a lossless compression format, meaning it saves every encoded pixel without degradation. So every pixel in the output is the same as the source or input. This format is great for graphic images like UI, screenshots, logos, graphics or any image that has lots of sharp lines. However, the trade-off is size, since a PNG file is about two to five times larger than an equivalent WebP file.',
    },
    {
      q: 'Does WebP to PNG preserve transparency?',
      a: 'Yup. Both WebP and PNG formats support full alpha transparency, and converting a WebP to PNG using ConvertYard will preserve this. A WebP image supports a transparent background like PNG, but with a file size two to five times smaller.',
    },
    {
      q: 'Will the PNG be larger than the WebP?',
      a: 'In most cases, yes, since PNG uses only lossless compression, while WebP supports lossy compression, which boosts file-size savings without degrading images too much because of how WebP is encoded. If you need smaller image sizes to upload on a website, I’d recommend choosing the WebP format.',
    },
    {
      q: 'Can I convert 1,000 WebP files at once?',
      a: 'Technically, yes. But that would depend on the file size and how much memory your computer has. It’s possible to convert smaller PNG files (below 1 MB) in batches of 1,000, but for larger files over 5 MB, I’d keep the batch to around 50 to 100.',
    },
  ],

  relatedTools: ['webp-to-jpg', 'png-to-webp', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images', 'best-webp-quality'],

  meta: {
    title: 'WebP to PNG Converter - Nothing Uploads, Local Convertion',
    description:
      'Convert WebP files to PNG format so that you can edit photos in image editing tools that do not support WebP. Batch convert up to 1,000 files.',
  },
}
