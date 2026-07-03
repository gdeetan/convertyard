import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-tiff',
  title: 'JPG to TIFF Converter',
  subtitle: 'Convert JPGs to TIFF for print workflows and archival.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.tiff',
  convertFn: (files, opts, onProgress) => libvipsConvert(files, 'tiff', opts, onProgress),
  options: [
    {
      type: 'dropdown',
      name: 'tiffCompression',
      label: 'Compression',
      choices: [
        { value: 'lzw', label: 'LZW (lossless, most compatible)' },
        { value: 'deflate', label: 'ZIP/Deflate (lossless, smaller)' },
        { value: 'none', label: 'None (largest, maximum compatibility)' },
      ],
      default: 'lzw',
      hint: 'LZW is the safest choice for cross-application compatibility',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF data from the output TIFF',
    },
  ],
  faq: [
    {
      q: 'Does converting JPG to TIFF improve quality?',
      a: 'No. JPG compression is lossy — quality lost when the JPG was saved is permanently gone. Converting to TIFF makes the file lossless going forward but does not recover lost detail.',
    },
    {
      q: 'What compression should I use for TIFF?',
      a: 'LZW is the most universally compatible lossless compression — works with all TIFF readers including Photoshop, Lightroom, and printing software.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your files never leave your device.',
    },
  ],
  relatedTools: ['tiff-to-jpg', 'jpg-to-png', 'tiff-to-pdf'],
  relatedArticles: [],
  meta: {
    title: 'JPG to TIFF Converter — ConvertYard',
    description:
      'Convert JPG to TIFF for print workflows and archival. Choose LZW, ZIP, or uncompressed output. Batch convert locally — no uploads.',
  },
}
