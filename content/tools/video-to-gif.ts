import { videoToGif } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 250 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'video-to-gif',
  title: 'Video to GIF Converter',
  subtitle: 'Turn short video clips into shareable GIFs. Trim, resize, and lower frame rate to keep files manageable — no uploads.',
  category: 'video-audio',
  accepts: ['video/mp4', 'video/webm', 'video/quicktime'],
  acceptsExt: ['.mp4', '.webm', '.mov'],
  outputExt: '.gif',
  convertFn: videoToGif,
  limitationNote: {
    summary: 'Best for short clips',
    body: 'GIF is much less efficient than MP4 or WebP. Keep clips short and reduce frame rate or width if the output gets too large.',
  },
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large videos are slow in the browser and GIFs get big quickly. For best results, trim short clips and keep files under 250 MB.'
      : null
  },
  options: [
    {
      type: 'number',
      name: 'startTime',
      label: 'Start time (s)',
      min: 0,
      max: 600,
      step: 0.1,
      default: 0,
      hint: 'Trim off the beginning before converting.',
    },
    {
      type: 'number',
      name: 'endTime',
      label: 'End time (s)',
      min: 0,
      max: 600,
      step: 0.1,
      default: 0,
      hint: '0 = use the rest of the video.',
    },
    {
      type: 'slider',
      name: 'fps',
      label: 'Frame rate',
      min: 5,
      max: 30,
      step: 1,
      default: 12,
      hint: 'Lower frame rate makes smaller GIFs. 10–15 FPS is usually enough.',
    },
    {
      type: 'number',
      name: 'outputWidth',
      label: 'Output width (px)',
      min: 0,
      max: 1920,
      step: 1,
      default: 480,
      hint: '0 = keep original width. Smaller widths reduce GIF size fast.',
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
      q: 'Why is GIF larger than the source video?',
      a: 'GIF is an old format with limited compression. A short MP4 clip can become much larger as a GIF, especially at high frame rates or large dimensions. Reduce the width, trim the duration, or lower the frame rate to keep the output manageable.',
    },
    {
      q: 'When should I use GIF instead of MP4 or WebP?',
      a: 'Use GIF when you need maximum compatibility for chat apps, older platforms, or places that still treat video badly. For websites and product docs, animated WebP or MP4 is usually smaller and better.',
    },
    {
      q: 'Can I turn an audio-only MP4 into a GIF?',
      a: 'No. This tool needs a video track. Audio-only MP4 or M4A files are rejected before conversion starts.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Conversion runs in your browser using ffmpeg.wasm. Your files stay on your device.',
    },
  ],
  relatedTools: ['mp4-to-webp', 'gif-to-mp4', 'webp-to-gif', 'mp4-to-mp3'],
  relatedArticles: ['how-browser-based-file-conversion-works', 'batch-convert-images'],
  meta: {
    title: 'Video to GIF Converter — ConvertYard',
    description:
      'Convert video to GIF in your browser. Trim clips, lower frame rate, resize, and set loop count. Built for short shareable GIFs — no uploads.',
  },
}
