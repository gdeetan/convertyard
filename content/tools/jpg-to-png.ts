import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-png',
  title: 'JPG to PNG Converter',
  subtitle: 'JPG to lossless PNG — no generation loss, every pixel preserved. Batch 1,000 files in your browser.',
  bestFor: 'Best for converting JPGs to an editable lossless format before compositing, masking, or further processing.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'png', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 85,
      hint: 'PNG is lossless — this controls internal compression, not pixel quality. Higher = smaller file, slightly slower encode.',
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
      hint: 'Removes EXIF, GPS, and camera data from the output PNG',
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
      q: 'Are my JPG files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Why convert JPG to PNG?',
      a: 'PNG is lossless — once you have a PNG, no further re-encoding will degrade quality. Convert to PNG when you need to edit an image repeatedly, composite it with other elements, add transparency later, or submit to a platform that requires PNG. It is also the right format for screenshots, UI assets, and anything with text or hard edges.',
    },
    {
      q: 'Will converting JPG to PNG add a transparent background?',
      a: 'No. JPG has no transparency data, and converting to PNG does not create any. The output PNG will be a fully opaque image. Transparency must be added manually in an image editor after conversion.',
    },
    {
      q: 'Will converting JPG to PNG improve quality?',
      a: 'No. Converting to PNG stops further lossy degradation, but it cannot recover data already lost when the JPG was first saved. If your JPG has compression artifacts, the PNG will have the same artifacts — preserved losslessly. To get a better image, start from the original uncompressed source.',
    },
    {
      q: 'How much larger will the PNG be compared to the JPG?',
      a: 'For photographs, PNG files are typically 3–8x larger than equivalent JPGs. PNG\'s lossless compression is much less efficient than JPG\'s lossy compression for continuous-tone images. This is the tradeoff: PNG preserves every pixel, JPG trades some pixel accuracy for dramatically smaller files.',
    },
  ],

  relatedTools: ['image-upscaler', 'png-to-jpg', 'jpg-to-webp', 'jpg-to-avif', 'compress-image'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'batch-convert-images'],

  meta: {
    title: 'JPG to PNG Converter — ConvertYard',
    description:
      'Convert JPG to PNG in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Lossless output with resize and metadata controls.',
  },
}
