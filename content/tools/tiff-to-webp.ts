import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-webp',
  title: 'TIFF to WebP Converter',
  subtitle: 'TIFF to modern WebP — up to 60× smaller than the source TIFF, same visual quality. Batch 1,000 at once.',
  bestFor: 'Best for converting scanner or camera TIFFs into web-ready WebP files for publishing online.',
  category: 'images',
  accepts: ['image/tiff', 'image/x-tiff'],
  acceptsExt: ['.tif', '.tiff'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) =>
  enablePresets: true,
    libvipsConvert(files, 'webp', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 85,
      hint: '85 gives excellent quality — WebP files are typically 25–35% smaller than equivalent JPGs from the same TIFF',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'Used if the TIFF has transparency — fills transparent areas if you need an opaque WebP',
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
      hint: 'Removes EXIF, IPTC, and XMP metadata from the output WebP',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful for scanned documents and diagrams',
    },
  ],

  faq: [
    {
      q: 'What is TIFF format and why convert to WebP?',
      a: 'TIFF is an uncompressed or losslessly-compressed format used by scanners, cameras, and print workflows. Files are large — a single 300 DPI scan can be 25–100MB. WebP is a modern web image format that delivers excellent quality at dramatically smaller file sizes, making TIFF-sourced images practical to use on the web.',
    },
    {
      q: 'Does converting TIFF to WebP reduce quality?',
      a: 'At quality 85, the difference between the TIFF original and the WebP output is imperceptible for photographs and scanned content. WebP uses lossy compression by default in this tool, which is ideal for web use. If you need pixel-perfect lossless output, use the TIFF to PNG tool instead.',
    },
    {
      q: 'How much smaller will my WebP files be?',
      a: 'WebP typically produces files 25–35% smaller than JPG at equivalent quality. Starting from a TIFF, you can expect files 15–60x smaller. A 50MB TIFF scan might become 800KB–2MB as WebP at quality 85. ConvertYard shows exact byte savings per file.',
    },
    {
      q: 'Can I convert 1,000 TIFF files at once?',
      a: 'Yes. Drop all your files and ConvertYard processes them in your browser — no uploads, no server. High-resolution TIFF files are large in memory, so 1,000 files may take several minutes. All results download as a single ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['tiff-to-jpg', 'tiff-to-png', 'jpg-to-webp', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'avif-vs-webp-vs-jpeg-2026'],

  meta: {
    title: 'TIFF to WebP Converter — ConvertYard',
    description:
      'Convert TIFF to WebP in your browser. Batch up to 1,000 TIFFs — no uploads, no account. Get web-ready WebP files up to 60x smaller than the original.',
  },
}
