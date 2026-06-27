import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'bmp-to-jpg',
  title: 'BMP to JPG Converter',
  subtitle: 'Local-first BMP to JPG conversion. Built for batches.',
  category: 'images',
  accepts: ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  acceptsExt: ['.bmp'],
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
      default: 85,
      hint: '85 gives excellent quality — BMP files are often 10–50x larger than the resulting JPG',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'Used if the BMP has an alpha channel — rare, but handled correctly',
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
      hint: 'Removes any embedded metadata from the output JPG',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful for screenshots or diagrams',
    },
  ],

  faq: [
    {
      q: 'What is BMP format and why are the files so large?',
      a: 'BMP (Bitmap) is an uncompressed image format native to Windows. Every pixel is stored individually with no compression, which means a 1920×1080 BMP at 24-bit color is exactly 5.93MB — always, regardless of content. JPG applies lossy compression, so a photo that is 6MB as BMP typically becomes 300–600KB as JPG at quality 85, with no visible difference.',
    },
    {
      q: 'Does converting BMP to JPG reduce quality?',
      a: 'At quality 85, the difference between a BMP and its JPG equivalent is imperceptible for photographs and most graphics. JPG compression is "lossy" — it discards some pixel data — but at 85 this is invisible to the human eye. If you need pixel-perfect output, convert to PNG instead (lossless).',
    },
    {
      q: 'How much smaller will my JPG files be?',
      a: 'Dramatically smaller. A typical BMP photo becomes 5–20x smaller as a JPG. A 6MB BMP photograph typically produces a 300–600KB JPG at quality 85. Screenshots and diagrams with large flat-color areas may compress even more aggressively. ConvertYard shows you the exact byte savings per file in your results.',
    },
    {
      q: 'Can I convert 1,000 BMP files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes them in your browser — no uploads, no server. BMP files are uncompressed so they can be large in memory; 1,000 BMP files may take more time than other formats. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['bmp-to-png', 'bmp-to-webp', 'jpg-to-png', 'compress-image'],
  relatedArticles: ['batch-convert-images'],

  meta: {
    title: 'BMP to JPG Converter — ConvertYard',
    description:
      'Convert BMP to JPG in your browser. Batch up to 1,000 files — no uploads, no account, no watermarks. Shrink Windows BMP files by 10–50x with no visible quality loss.',
  },
}
