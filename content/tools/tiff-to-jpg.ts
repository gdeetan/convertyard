import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-jpg',
  title: 'TIFF to JPG Converter',
  subtitle: 'TIFF files can be 100× larger than JPG. Convert 1,000+ at once and cut file sizes by 90%. No upload.',
  bestFor: 'Best for scanning workflows where TIFFs need to be shared, emailed, or uploaded as JPGs.',
  category: 'images',
  accepts: ['image/tiff', 'image/x-tiff'],
  acceptsExt: ['.tif', '.tiff'],
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
      default: 85,
      hint: '85 gives excellent quality — TIFF files from scanners are often 10–100x larger than the resulting JPG',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'Used if the TIFF has transparency — fills transparent areas in the output JPG',
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
      hint: 'Removes EXIF, IPTC, and XMP metadata from the output JPG',
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
      q: 'What is TIFF format and why are the files so large?',
      a: 'TIFF (Tagged Image File Format) is an uncompressed or losslessly-compressed image format used by scanners, cameras, and print workflows. A single 300 DPI scan of an A4 page can be 25–100MB as TIFF. Converting to JPG at quality 85 typically produces a file 10–50x smaller with no perceptible quality difference for most uses.',
    },
    {
      q: 'Does converting TIFF to JPG reduce quality?',
      a: 'JPG is a lossy format, so some pixel data is discarded during compression. At quality 85 the difference is imperceptible for photographs and scanned documents. If you need pixel-perfect lossless output, use the TIFF to PNG tool instead.',
    },
    {
      q: 'How much smaller will my JPG files be?',
      a: 'TIFF files from scanners and cameras are large — a typical 300 DPI scanned page converts from 25MB TIFF to 500KB–2MB JPG at quality 85. That is a 10–50x reduction. ConvertYard shows exact byte savings per file in your results.',
    },
    {
      q: 'Can I convert 1,000 TIFF files at once?',
      a: 'Yes. Drop all your files and ConvertYard processes them in your browser — no uploads, no server. TIFF files can be very large in memory, so 1,000 high-resolution TIFFs may take several minutes. All results download as a single ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['tiff-to-png', 'tiff-to-webp', 'jpg-to-png', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'exif-data-whats-hiding-in-your-photo'],

  meta: {
    title: 'TIFF to JPG Converter — Scans & Photos — ConvertYard',
    description:
      'Convert TIFF scans and photos to JPG in your browser. Shrink large scanner files with a quality slider. Batch up to 1,000 files — nothing is uploaded.',
  },
}
