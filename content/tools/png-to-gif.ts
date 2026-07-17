import { gifConvert } from '@/lib/converters/gif-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-gif',
  title: 'PNG to GIF Converter',
  subtitle: 'Animate PNG sequences or convert single PNGs to GIF.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.gif',
  resultMode: 'combined-output',
  convertFn: (files, opts, onProgress) => gifConvert(files, opts, onProgress),
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
      q: 'Does GIF support transparency from PNG?',
      a: 'GIF supports binary transparency only — pixels are either fully transparent or fully opaque. PNG\'s semi-transparent edges are thresholded. Clean logos on white backgrounds convert well.',
    },
    {
      q: 'Can I create an animated GIF from multiple PNGs?',
      a: 'Yes — drop multiple PNGs and they animate in the order shown. Each file becomes one frame at the specified frame rate.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion uses ffmpeg.wasm in your browser. Your files never leave your device.',
    },
  ],
  relatedTools: ['jpg-to-gif', 'webp-to-gif', 'png-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'PNG to GIF Converter — ConvertYard',
    description: 'Convert PNG to GIF or animate PNG sequences. Binary transparency handled. Two-pass palette for better colours. Batch convert locally — no uploads.',
  },
}
