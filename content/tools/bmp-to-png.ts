import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-png',
  title: 'BMP to PNG Converter',
  subtitle: 'Local-first BMP to PNG conversion. Built for batches.',
  category: 'images',
  accepts: ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  acceptsExt: ['.bmp'],
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
      q: 'Why convert BMP to PNG instead of JPG?',
      a: 'PNG is lossless — every pixel is preserved exactly. This makes it the right choice for screenshots, diagrams, logos, UI mockups, and any image with text or hard edges. JPG\'s compression creates visible artifacts on sharp edges and flat-color areas, which look bad for these use cases. For photographs where you need maximum compatibility and can accept minor quality loss, convert to JPG instead.',
    },
    {
      q: 'Will the PNG be smaller than the BMP?',
      a: 'Always. PNG uses lossless compression, while BMP stores every pixel uncompressed. For screenshots and diagrams with large flat-color areas, PNG can be 5–10x smaller than BMP. For photographs with complex color gradients, PNG may only be 20–40% smaller (since there\'s less redundancy to compress). For photos needing small files, JPG is more efficient.',
    },
    {
      q: 'Does conversion change my image in any way?',
      a: 'No — BMP to PNG is lossless end to end. Every pixel in the output PNG is identical to the input BMP. The only differences are file size (smaller) and format container.',
    },
    {
      q: 'Can I convert 1,000 BMP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
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
