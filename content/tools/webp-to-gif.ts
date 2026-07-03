import { gifConvert } from '@/lib/converters/gif-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'webp-to-gif',
  title: 'WebP to GIF Converter',
  subtitle: 'Convert animated WebP to GIF for platforms that don\'t support WebP yet.',
  category: 'images',
  accepts: ['image/webp'],
  acceptsExt: ['.webp'],
  outputExt: '.gif',
  convertFn: (files, opts, onProgress) => gifConvert(files, opts, onProgress),
  limitationNote: {
    summary: 'GIF is larger than WebP',
    body: 'GIF is a less efficient format than WebP — an animated WebP typically becomes 2–5× larger as a GIF. Reduce the frame rate or output width to keep file sizes manageable.',
  },
  options: [
    {
      type: 'slider',
      name: 'framerate',
      label: 'Frame rate (fps)',
      min: 5,
      max: 30,
      step: 1,
      default: 15,
      hint: '15fps is a good default. Lower = smaller file.',
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
      q: 'Does it handle both animated and static WebP?',
      a: 'Yes. Animated WebPs become animated GIFs. Static WebPs become static GIFs.',
    },
    {
      q: 'Why is the GIF larger than the WebP?',
      a: 'GIF is a less efficient format than WebP — especially for animations. A WebP animation typically becomes 2–5× larger as a GIF. Reduce the frame rate or resize to shrink the output.',
    },
    {
      q: 'What platforms still need GIF instead of WebP?',
      a: 'As of 2026, some email clients, legacy CMSes, and certain social platforms still don\'t reliably support animated WebP. GIF is the universal animated image fallback.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion uses ffmpeg.wasm running in your browser. Your files never leave your device.',
    },
  ],
  relatedTools: ['jpg-to-gif', 'png-to-gif', 'webp-to-jpg'],
  relatedArticles: [],
  meta: {
    title: 'WebP to GIF Converter — ConvertYard',
    description: 'Convert animated WebP to GIF for email, legacy platforms, and anywhere WebP isn\'t supported. Two-pass palette GIF. Runs locally — no uploads.',
  },
}
