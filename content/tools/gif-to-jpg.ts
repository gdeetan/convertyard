import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-jpg',
  title: 'GIF to JPG Converter',
  subtitle: 'Extracts the first frame of animated GIFs or converts static GIFs to JPG. Drop 1,000 at once.',
  bestFor: 'Best for pulling a static thumbnail from an animated GIF to use as a preview or social share image.',
  category: 'images',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress) =>
      libvipsConvert(files, 'jpg', opts, onProgress),
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
      hint: '85 gives excellent quality — GIF first frames typically produce JPGs 5–20x smaller than the source GIF',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'GIF transparency is filled with this color in the output JPG',
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
  ],

  faq: [
    {
      q: 'Are my GIF files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Does this convert the whole animation or just one frame?',
      a: 'This tool extracts the first frame of the GIF and saves it as a static JPG. The animation is not preserved — all subsequent frames are discarded. If you need to keep the animation, use the GIF to WebP tool instead.',
    },
    {
      q: 'What happens to GIF transparency in the JPG output?',
      a: 'JPG does not support transparency. Any transparent areas in the GIF are filled with the background color you choose in the options — white by default. If your GIF has a transparent background, set the color that matches your use case before converting.',
    },
    {
      q: 'Why do GIF photos look worse than the original?',
      a: 'GIF is limited to 256 colors per frame. Photographs that start as GIFs already have significant color banding built in. Converting that first frame to JPG captures exactly what was in the GIF — including that banding. If the source GIF looks poor, the JPG will too.',
    },
    {
      q: 'Can I convert 1,000 GIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server. Each GIF produces one JPG from its first frame. Download all results as a single ZIP.',
    },
  ],

  relatedTools: ['gif-to-webp', 'gif-to-mp4', 'gif-to-png', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'exif-data-whats-hiding-in-your-photo'],

  meta: {
    title: 'GIF to JPG Converter — ConvertYard',
    description:
      'Convert GIF to JPG in your browser. Extracts the first frame as a static image. Batch convert 1,000 GIFs at once — no uploads, no account needed.',
  },
}
