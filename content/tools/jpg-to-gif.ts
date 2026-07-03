import { gifConvert } from '@/lib/converters/gif-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-gif',
  title: 'JPG to GIF Converter',
  subtitle: 'Convert JPG images into GIF. Set frame rate and loop count.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.gif',
  convertFn: (files, opts, onProgress) => gifConvert(files, opts, onProgress),
  limitationNote: {
    summary: 'GIF is limited to 256 colours per frame',
    body: 'Photos with many colours will show banding in GIF output. Use high-quality source JPGs for the best result.',
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
      hint: '10fps is typical for simple animations. Lower = smaller file.',
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
      hint: '0 = infinite loop. 1 = play once.',
    },
  ],
  faq: [
    {
      q: 'How do I control the animation speed?',
      a: 'Use the frame rate slider. 10fps is typical for simple animations. Higher fps = faster animation but larger file.',
    },
    {
      q: 'Can I make a GIF that plays once and stops?',
      a: 'Yes — set loop count to 1. Default is infinite loop (0).',
    },
    {
      q: 'The colours in my GIF look wrong — why?',
      a: 'GIF is limited to 256 colours per frame. Photos with gradients and many colours will show banding. This is inherent to the GIF format.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion uses ffmpeg.wasm in your browser. Your files never leave your device.',
    },
  ],
  relatedTools: ['png-to-gif', 'webp-to-gif', 'jpg-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'JPG to GIF Converter — ConvertYard',
    description: 'Convert JPG images to animated GIF. Set frame rate, output size, and loop count. Two-pass palette for better colour quality. No uploads.',
  },
}
