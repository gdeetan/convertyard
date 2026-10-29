import { libvipsConvert } from '@/lib/converters/libvips'
import { PngConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'tiff-to-png',
  title: 'TIFF to PNG Converter',
  subtitle:
    'Convert your TIFF images to lossless PNG. Preserve transparency, choose bit depth, and convert multi-page scans into single PNG images. Convert up to 1,000 TIFF files in your browser. Nothing uploads to an unknown server.',
  bestFor:
    'Best for sharing print-quality scans, printed assets, or archival images on the web, in chat, or anywhere TIFFs cannot be opened.',
  limitationNote: {
    summary: 'TIFFs do not open in most browsers or chat apps',
    body: 'TIFF is designed for print, scanning, and archival — not the web. Chrome and Safari will not open TIFF files (unlike PNG or GIF). Slack and Discord will not either. That is why we recommend saving TIFF files as PNG for anything you plan to share online.',
  },
  category: 'images',
  accepts: ['image/tiff', 'image/x-tiff'],
  acceptsExt: ['.tif', '.tiff'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'png', opts, onProgress, onResult),
  previewPanel: PngConversionPreview,
  enablePresets: true,

  options: [
    {
      type: 'slider',
      name: 'compressionLevel',
      label: 'Compression level',
      min: 0,
      max: 9,
      step: 1,
      default: 6,
      hint: 'PNG compression is lossless — higher levels shrink the file more but take longer. Quality is identical at all levels.',
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
      hint: 'Removes EXIF, IPTC, and XMP metadata from the output PNG',
    },
  ],

  faq: [
    {
      q: 'What is TIFF format and why convert to PNG?',
      a: 'TIFF is an uncompressed or losslessly-compressed format used by scanners, cameras, and professional print workflows. PNG is also lossless and much more widely supported — browsers, design tools, and image editors all open PNG natively. Converting TIFF to PNG preserves every pixel while producing a file that works everywhere.',
    },
    {
      q: 'Is TIFF to PNG conversion lossless?',
      a: 'Yes. Both TIFF and PNG are lossless formats. Every pixel in your TIFF is reproduced exactly in the output PNG, regardless of the compression level you choose. Compression level only affects file size and encoding speed — not image quality.',
    },
    {
      q: 'How much smaller will my PNG files be compared to TIFF?',
      a: 'It depends on the content. A 300 DPI scanned document might go from 25MB TIFF to 5–10MB PNG. Photographs with fine detail compress less than documents with large flat-color areas. PNG will always be smaller than uncompressed TIFF, but larger than JPG — the tradeoff is pixel-perfect quality.',
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

  relatedTools: ['tiff-to-jpg', 'tiff-to-webp', 'png-to-jpg', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'exif-data-whats-hiding-in-your-photo'],

  meta: {
    title: 'TIFF to PNG — Keep Every Pixel — ConvertYard',
    description:
      'Convert TIFF to PNG in your browser. Lossless — every pixel preserved. Batch up to 1,000 files, no uploads, no account. Files never leave your device.',
  },
}
