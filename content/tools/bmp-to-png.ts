import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-png',
  title: 'BMP to PNG Converter',
  subtitle: 'Convert BMP to lossless PNG without quality loss. Drop 1,000+ files — no upload, no server.',
  bestFor: 'Best for converting BMP screenshots or UI assets to a portable lossless format editors can open.',
  category: 'images',
  accepts: ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  acceptsExt: ['.bmp'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) =>
      libvipsConvert(files, 'png', opts, onProgress),
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
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes any embedded metadata from the output PNG',
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
      q: 'Are my BMP files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Why convert BMP to PNG instead of JPG?',
      a: 'PNG is lossless — every pixel is preserved exactly. This is the right choice for screenshots, diagrams, logos, and anything with text or hard edges. JPG compression creates visible artifacts on sharp edges and flat-color areas. For photographs where file size matters more than pixel perfection, JPG is the better choice.',
    },
    {
      q: 'Is BMP to PNG truly lossless?',
      a: 'Yes — every pixel in the output PNG is identical to the input BMP. The only differences are the file size (PNG is smaller thanks to lossless compression) and the format container. No pixel data is altered.',
    },
    {
      q: 'Will the PNG always be smaller than the BMP?',
      a: 'Yes, always. PNG uses lossless compression while BMP stores every pixel raw. For screenshots and diagrams with large flat-color areas, PNG can be 5–10x smaller. For photographs with complex color gradients, PNG may only be 20–40% smaller. If you need very small files from photographic BMPs, JPG is more efficient.',
    },
    {
      q: 'Can I convert 1,000 BMP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server. BMP files are large in memory, so 1,000 large BMPs may take more RAM than other formats. Download all results as a single ZIP.',
    },
  ],

  relatedTools: ['bmp-to-jpg', 'bmp-to-webp', 'png-to-jpg', 'compress-image'],
  relatedArticles: ['batch-convert-images'],

  meta: {
    title: 'BMP to PNG Converter — ConvertYard',
    description:
      'Convert BMP to PNG in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Lossless conversion — every pixel preserved, smaller files.',
  },
}
