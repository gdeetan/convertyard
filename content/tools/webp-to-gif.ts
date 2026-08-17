import { gifConvert } from '@/lib/converters/gif-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'webp-to-gif',
  title: 'WebP to GIF Converter',
  subtitle: 'Convert animated WebP to GIF for email clients and platforms that don\'t support WebP yet.',
  bestFor: 'Best for converting animated WebP stickers or banners into GIF for email or legacy CMS platforms.',
  category: 'images',
  accepts: ['image/webp'],
  acceptsExt: ['.webp'],
  outputExt: '.gif',
  convertFn: (files, opts, onProgress, onResult) => gifConvert(files, opts, onProgress, onResult),
  enablePresets: true,
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
      q: 'Are my WebP files uploaded to convert them?',
      a: 'No. Conversion uses ffmpeg.wasm running in your browser. Your files never leave your device.',
    },
    {
      q: 'What happens to WebP colours when converting to GIF?',
      a: 'GIF supports a maximum of 256 colours per frame, while WebP can represent millions. The converter builds the best 256-colour palette it can and applies dithering to approximate the remaining colours. Smooth gradients will show visible banding; flat-colour graphics and simple animations convert with less visible degradation.',
    },
    {
      q: 'Why is the GIF so much larger than the original WebP?',
      a: 'GIF is a significantly less efficient format than WebP — especially for animations. An animated WebP typically becomes 2–5× larger as a GIF because GIF can only store 256 colours per frame and uses a simpler compression algorithm. To reduce GIF file size, lower the frame rate or shrink the output width.',
    },
    {
      q: 'Does it handle both animated and static WebP?',
      a: 'Yes. Animated WebPs become animated GIFs. Static WebPs become single-frame static GIFs.',
    },
    {
      q: 'Which platforms still need GIF instead of WebP?',
      a: 'As of 2026, most email clients (Outlook, Apple Mail, Gmail on mobile) do not support animated WebP but do support animated GIF. Some legacy CMS platforms and social media embeds also default to GIF for animated content. GIF is the safe fallback when you cannot control what the viewer\'s platform supports.',
    },
  ],
  relatedTools: ['gif-to-webp', 'jpg-to-gif', 'png-to-gif', 'webp-to-jpg'],
  relatedArticles: [],
  meta: {
    title: 'WebP to GIF Converter — ConvertYard',
    description: 'Convert animated WebP to GIF for email and older tools that still need GIF. Two-pass palette. Runs in your browser — files stay on your device. Broader support.',
  },
}
