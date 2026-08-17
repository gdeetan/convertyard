import { gifConvert } from '@/lib/converters/gif-convert'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'jpg-to-gif',
  title: 'JPG to GIF Converter',
  subtitle: 'Turn a sequence of JPGs into an animated GIF. Set frame rate, size, and loop count in your browser.',
  bestFor: 'Best for turning a sequence of JPG frames into a simple animated GIF for embedding on the web.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.gif',
  convertFn: (files, opts, onProgress, onResult) => gifConvert(files, opts, onProgress, onResult),
  enablePresets: true,
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
      q: 'Are my JPG files uploaded to convert them?',
      a: 'No. Conversion uses ffmpeg.wasm entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'Why do my GIF colors look wrong after converting from JPG?',
      a: 'GIF is hard-limited to 256 colors per frame. JPG photos typically contain millions of distinct colors — converting to GIF quantizes them down to the closest 256, causing visible banding and color shifts in gradients and skin tones. This is inherent to the GIF format, not a conversion error. If color fidelity matters, use WebP or MP4 instead.',
    },
    {
      q: 'How do I control the animation speed?',
      a: 'Use the frame rate slider. 10fps is typical for simple web animations. 24fps matches standard video. Higher fps means faster animation and a larger file. Lower fps creates a more slideshow-like effect with a smaller file.',
    },
    {
      q: 'Can I make a GIF that plays once and stops?',
      a: 'Yes — set the loop count to 1. The default (0) loops infinitely. You can also set exact loop counts for situations where you want the animation to play a specific number of times before freezing.',
    },
    {
      q: 'Should I use JPG to GIF or JPG to WebP for animations?',
      a: 'If you need broad compatibility (old email clients, Slack, older social platforms), GIF is still the safest choice. If you are publishing to a modern web page, animated WebP is 25–40% smaller and supports full color. GIF is the universal fallback; WebP is the modern upgrade.',
    },
  ],
  relatedTools: ['png-to-gif', 'webp-to-gif', 'jpg-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'JPG to GIF — Animate a Sequence — ConvertYard',
    description: 'Convert JPG images to animated GIF. Set frame rate, output size, and loop count. Two-pass palette for better colour quality. No uploads.',
  },
}
