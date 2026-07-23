import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-tiff',
  title: 'PNG to TIFF Converter',
  subtitle: 'Convert PNG to TIFF for print handoffs — alpha transparency preserved, LZW or ZIP compression.',
  bestFor: 'Best for designers handing off print-ready files to prepress workflows that require TIFF.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.tiff',
  convertFn: (files, opts, onProgress) => libvipsConvert(files, 'tiff', opts, onProgress),
  enablePresets: true,
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
      q: 'Are my PNG files uploaded to convert them?',
      a: 'No. Conversion runs via WebAssembly entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'Why would I convert PNG to TIFF instead of keeping it as PNG?',
      a: 'Most print shops, prepress workflows, and desktop publishing applications (InDesign, QuarkXPress, offset printing RIPs) expect TIFF rather than PNG. PNG is fine for web; TIFF is the standard for print. If your printer or client asks for TIFF, this tool converts your PNGs in bulk without requiring a desktop image editor.',
    },
    {
      q: 'Does it preserve PNG transparency in the TIFF?',
      a: 'Yes. TIFF supports alpha channels. Transparent areas in your PNG are preserved as an alpha layer in the TIFF output. Check with your print shop whether their workflow supports transparent TIFFs — some prepress tools expect a flattened TIFF with a solid background.',
    },
    {
      q: 'Which compression should I use — LZW, ZIP, or None?',
      a: 'LZW is the right default. It is lossless, widely supported by print applications, and reduces file size meaningfully for most images. ZIP (Deflate) compresses slightly more but is not supported by all older prepress tools. Use None only if a specific application rejects LZW or ZIP compressed TIFFs.',
    },
    {
      q: 'Does this tool output 8-bit or 16-bit TIFF?',
      a: 'This tool outputs 8-bit TIFF, which is standard for most print workflows. If your PNG source is 8-bit (which is typical), no data is lost. For fine-art or HDR workflows that require 16-bit depth, you will need a desktop application.',
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
