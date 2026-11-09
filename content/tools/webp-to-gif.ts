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
      a: 'GIF only supports 256 colors per frame, whereas WebP can have millions of colors. When converting, the GIF colors are chosen by the conversion tool, and then the tool attempts to mix these colors (dithering) to try and create the missing colors. Images with lots of colors, such as photos and smooth gradients, look banded or speckled. However, flat images, such as logos and simple animations, generally convert well, and you won&rsquo;t notice much of a difference.',
    },
    {
      q: 'Why is the GIF so much larger than the original WebP?',
      a: 'For animations, GIFs are typically much larger than their WebP counterparts, even when saving the same source clip. A GIF can be 2-5 times the size of the same animation saved as a WebP because a GIF can only contain 256 colors per frame and uses a less efficient frame-compression scheme than WebP. Reducing a GIF&rsquo;s frame rate or output width can quickly reduce file size.',
    },
    {
      q: 'Does it handle both animated and static WebP?',
      a: 'Yes. Animated WebPs become animated GIFs. Static WebPs become single-frame static GIFs.',
    },
    {
      q: 'Which platforms still need GIF instead of WebP?',
      a: 'Animated WebP is not compatible with most email clients in 2026, such as Outlook, Apple Mail, and Gmail on mobile, which display the image broken or show only the first frame. All email clients play back animated GIFs, however. Some older CMS systems, as well as social media embeds, may also not display animated WebPs. GIF is the safer choice when you have no idea what email client the recipient is using.',
    },
  ],
  relatedTools: ['gif-to-webp', 'avif-to-gif', 'jpg-to-gif', 'png-to-gif', 'webp-to-jpg'],
  relatedArticles: [],
  meta: {
    title: 'WebP to GIF Converter — ConvertYard',
    description: 'Convert animated WebP to GIF for email and older tools that still need GIF. Two-pass palette. Runs in your browser — files stay on your device. Broader support.',
  },
}
