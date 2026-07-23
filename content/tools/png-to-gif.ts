import { gifConvert } from '@/lib/converters/gif-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-gif',
  title: 'PNG to GIF Converter',
  subtitle: 'Animate PNG sequences or convert single PNGs to GIF. 256-colour palette with dithering.',
  bestFor: 'Best for animators assembling PNG frame sequences into a shareable GIF.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.gif',
  resultMode: 'combined-output',
  convertFn: (files, opts, onProgress) => gifConvert(files, opts, onProgress),
  enablePresets: true,
  limitationNote: {
    summary: 'PNG transparency becomes binary in GIF',
    body: 'PNG supports full alpha transparency; GIF supports only binary transparency. Semi-transparent edges from anti-aliasing will be thresholded — logos on solid backgrounds convert cleanly, but soft shadows will have hard edges.',
  },
  options: [
    {
      type: 'slider',
      name: 'framerate',
      label: 'Frame rate (fps)',
      min: 1,
      max: 30,
      step: 1,
      default: 10,
      hint: 'For animated GIFs from multiple PNGs.',
    },
    {
      type: 'number',
      name: 'outputWidth',
      label: 'Output width (px)',
      min: 0,
      max: 1920,
      step: 1,
      default: 0,
      hint: '0 = keep original size.',
    },
    {
      type: 'number',
      name: 'loop',
      label: 'Loop count',
      min: 0,
      max: 100,
      step: 1,
      default: 0,
      hint: '0 = infinite loop.',
    },
  ],
  faq: [
    {
      q: 'Are my PNG files uploaded to convert them?',
      a: 'No. Conversion runs via ffmpeg.wasm entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'What happens to PNG colours when converting to GIF?',
      a: 'GIF supports a maximum of 256 colours per frame. PNGs often contain millions of colours. The converter builds the best 256-colour palette it can from your image and applies dithering to approximate the lost colours. Photographs and gradients show visible banding; flat-colour graphics and icons convert cleanly.',
    },
    {
      q: 'Does GIF support transparency from PNG?',
      a: 'GIF supports binary transparency only — pixels are either fully transparent or fully opaque. PNG alpha channels are thresholded: semi-transparent edges from anti-aliasing become either fully transparent or fully opaque. Clean logos on solid backgrounds convert well; soft shadows will have hard edges.',
    },
    {
      q: 'Can I create an animated GIF from multiple PNGs?',
      a: 'Yes. Drop multiple PNGs and they animate in the order shown. Each file becomes one frame at the frame rate you set. File names are sorted alphabetically, so name them sequentially (frame-001.png, frame-002.png, etc.) to control the order.',
    },
    {
      q: 'Why is my GIF file larger than the original PNGs?',
      a: 'GIF uses an older LZW compression algorithm that is far less efficient than PNG compression, especially for images with smooth gradients. A high-colour PNG animation can become a very large GIF. Reduce the output width or frame rate to keep the GIF to a manageable size.',
    },
  ],
  relatedTools: ['jpg-to-gif', 'webp-to-gif', 'png-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'PNG to GIF Converter — ConvertYard',
    description: 'Convert PNG to GIF or animate PNG sequences. Binary transparency handled. Two-pass palette for better colours. Batch convert locally — no uploads.',
  },
}
