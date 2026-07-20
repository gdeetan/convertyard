import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-tiff',
  title: 'JPG to TIFF Converter',
  subtitle: 'Convert JPGs to lossless TIFF for print labs, prepress workflows, and archival storage.',
  bestFor: 'Best for photographers and print designers submitting images to labs or prepress workflows that require TIFF.',
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
      q: 'Are my JPG files uploaded to convert them?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Does converting JPG to TIFF improve quality?',
      a: 'No. JPG compression is lossy — quality lost when the JPG was first saved is permanently gone. Converting to TIFF makes the file lossless going forward (no further degradation on re-save) but does not recover lost detail. The TIFF is a pixel-perfect copy of whatever the JPG contained.',
    },
    {
      q: 'Will the TIFF be 16-bit?',
      a: 'No. JPG is an 8-bit format. Converting to TIFF produces an 8-bit TIFF — the container supports 16-bit, but the source data is 8-bit so there is no meaningful difference. To get a true 16-bit TIFF, start from a RAW file or a 16-bit source in an image editor.',
    },
    {
      q: 'What compression should I use for TIFF?',
      a: 'LZW is the safest default — lossless, universally supported by print software, and compatible with Lightroom, and most RIP software. ZIP/Deflate compresses slightly better but is not supported by all TIFF readers. Uncompressed TIFF is the largest option, used when absolute compatibility is required with very old prepress tools.',
    },
    {
      q: 'Why do print labs ask for TIFF instead of JPG?',
      a: 'TIFF guarantees lossless delivery — the print lab receives exactly the pixels you send, with no risk of additional JPG compression being applied during upload or file handling. Print workflows also often do color adjustments and file transforms that cause further degradation with JPG. TIFF sidesteps those issues.',
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
