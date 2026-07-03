import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-tiff',
  title: 'PNG to TIFF Converter',
  subtitle: 'Convert PNG to TIFF for print handoffs. Transparency preserved.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
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
      hint: 'LZW is the standard for design-to-print TIFF files',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and colour profile data',
    },
  ],
  faq: [
    {
      q: 'Does it preserve PNG transparency in the TIFF?',
      a: 'Yes. TIFF supports alpha channels. Your transparent PNG will have a transparent layer in the TIFF output.',
    },
    {
      q: 'Should I use 8-bit or 16-bit TIFF?',
      a: 'This tool outputs 8-bit TIFF, which is standard for most print use. For fine-art or HDR workflows requiring 16-bit depth, you will need a desktop application such as Photoshop or GIMP.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion runs in your browser via WebAssembly. Your files never leave your device.',
    },
  ],
  relatedTools: ['tiff-to-png', 'png-to-jpg', 'tiff-to-pdf'],
  relatedArticles: [],
  meta: {
    title: 'PNG to TIFF Converter — ConvertYard',
    description:
      'Convert PNG to TIFF for print workflows — alpha transparency preserved. LZW or ZIP compression. Batch convert locally in your browser.',
  },
}
