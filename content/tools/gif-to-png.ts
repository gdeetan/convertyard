import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-png',
  title: 'GIF to PNG Converter',
  subtitle: 'Convert GIF to lossless PNG — transparency preserved. Handles animated and static GIFs. No upload required.',
  bestFor: 'Best for extracting a GIF frame as a transparent PNG to use in design tools or image editors.',
  category: 'images',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'png', opts, onProgress, onResult),
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
      hint: 'Removes any embedded metadata from the output PNG',
    },
  ],

  faq: [
    {
      q: 'Are my GIF files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly — your GIFs never leave your device. ConvertYard\'s servers only deliver the tool\'s code; they never see your files.',
    },
    {
      q: 'What happens to animated GIFs? Will my animation be preserved?',
      a: 'No — only the first frame is extracted as a PNG. The animation is not preserved. If you drop in an animated GIF expecting a moving image, you will get a single static PNG of frame one. To keep the animation, use the GIF to WebP tool, which preserves all frames as an animated WebP.',
    },
    {
      q: 'Why choose PNG over JPG for a GIF conversion?',
      a: 'PNG is lossless and preserves transparency. If your GIF has a transparent background and you need that transparency in the output, PNG is the right choice. JPG fills transparent areas with a solid background color and applies lossy compression. For pixel-perfect or transparency-preserving output, PNG wins.',
    },
    {
      q: 'Is GIF to PNG truly lossless?',
      a: 'Yes. PNG is a lossless format — every pixel from the first GIF frame is reproduced exactly. Note that GIF itself was already limited to 256 colors, so the PNG faithfully captures those 256-color pixels. Any color banding already in the GIF will be present in the PNG.',
    },
    {
      q: 'Can I convert 1,000 GIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server. Each GIF produces one PNG. PNG files are larger than JPG so high-resolution batches may take a moment. Download all results as a single ZIP.',
    },
  ],

  relatedTools: ['gif-to-webp', 'gif-to-mp4', 'gif-to-jpg', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'how-browser-based-file-conversion-works'],

  meta: {
    title: 'GIF to PNG Converter — ConvertYard',
    description:
      'Convert GIF to PNG in your browser. Extracts the first frame as a lossless PNG. Batch convert 1,000 GIFs at once — no uploads, no account needed.',
  },
}
