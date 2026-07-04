import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-jpg',
  title: 'GIF to JPG Converter',
  subtitle: 'Extracts the first frame of animated GIFs or converts static GIFs to JPG. Drop 1,000 at once.',
  category: 'images',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'jpg', opts, onProgress),

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
      q: 'Does this tool convert the whole GIF animation or just one frame?',
      a: 'This tool extracts the first frame of the GIF and saves it as a static JPG. The animation is not preserved. If you need a static thumbnail or preview image from a GIF, this is the right tool. If you need video output from an animation, look for a GIF-to-video converter instead.',
    },
    {
      q: 'Why would I convert a GIF frame to JPG?',
      a: 'Common reasons: creating a static thumbnail for a GIF, extracting a preview image for social sharing, reducing file size when the animation is unnecessary, or making the image compatible with tools and systems that do not support GIF. JPG is universally supported and far smaller than GIF for photographic content.',
    },
    {
      q: 'What happens to transparent areas in the GIF?',
      a: 'JPG does not support transparency. Any transparent areas in the GIF are filled with the background color you choose in the options — white by default. If your GIF has a transparent background, pick a color that matches your use case.',
    },
    {
      q: 'Can I convert 1,000 GIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server. Each GIF produces one JPG from its first frame. Download all results as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
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
