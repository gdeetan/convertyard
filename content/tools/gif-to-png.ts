import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-png',
  title: 'GIF to PNG Converter',
  subtitle: 'Local-first GIF to PNG conversion. Built for batches.',
  category: 'images',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'png', opts, onProgress),

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
      hint: 'Removes any embedded metadata from the output PNG',
    },
  ],

  faq: [
    {
      q: 'Does this tool convert the whole GIF animation or just one frame?',
      a: 'This tool extracts the first frame of the GIF and saves it as a static PNG. The animation is not preserved. PNG is a single-image format; use this when you need a still thumbnail or preview from a GIF, not a moving image.',
    },
    {
      q: 'Why convert a GIF to PNG instead of JPG?',
      a: 'PNG is lossless and preserves transparency. If your GIF has a transparent background and you need that transparency kept in the output, PNG is the right choice. JPG fills transparent areas with a solid color and applies lossy compression. For pixel-perfect or transparent-background output, use PNG.',
    },
    {
      q: 'Is the conversion lossless?',
      a: 'Yes. PNG is a lossless format. Every pixel from the first frame of the GIF is reproduced exactly in the output. The compression level setting only affects file size and encoding speed — not image quality.',
    },
    {
      q: 'Can I convert 1,000 GIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server. Each GIF produces one PNG from its first frame. PNG files are larger than JPG so high-resolution batches may take a moment. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['gif-to-jpg', 'png-to-jpg', 'png-to-webp', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'how-browser-based-file-conversion-works'],

  meta: {
    title: 'GIF to PNG Converter — ConvertYard',
    description:
      'Convert GIF to PNG in your browser. Extracts the first frame as a lossless PNG. Batch convert 1,000 GIFs at once — no uploads, no account needed.',
  },
}
