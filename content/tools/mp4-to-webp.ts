import { mp4ToWebp } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 250 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'mp4-to-webp',
  title: 'MP4 to WebP Converter',
  subtitle: 'Turn short MP4 clips into animated WebP for websites, docs, and UI demos. Trim, resize, and loop — no uploads.',
  bestFor: 'Best for product teams embedding short UI demos or feature loops on web pages.',
  category: 'video-audio',
  accepts: ['video/mp4', 'video/webm', 'video/quicktime'],
  acceptsExt: ['.mp4', '.webm', '.mov'],
  outputExt: '.webp',
  convertFn: mp4ToWebp,
  enablePresets: true,
  limitationNote: {
    summary: 'Video clips only',
    body: 'Audio-only MP4 or M4A files are not supported. This tool converts video tracks into animated WebP, so files with sound but no picture will fail immediately with a clear message.',
  },
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large videos are slow in the browser. For best results, clip short sections and keep files under 250 MB.'
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
      hint: 'Trim off the beginning before converting. Use short clips for the smallest WebP files.',
    },
    {
      type: 'number',
      name: 'endTime',
      label: 'End time (s)',
      min: 0,
      max: 600,
      step: 0.1,
      default: 0,
      hint: '0 = use the rest of the video. Set an end time for short looping moments.',
    },
    {
      type: 'slider',
      name: 'fps',
      label: 'Frame rate',
      min: 1,
      max: 30,
      step: 1,
      default: 12,
      hint: 'Lower FPS makes smaller files. 10–15 FPS is usually enough for UI demos and product loops.',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 1920,
      step: 1,
      default: 640,
      hint: 'Scales the longer edge down. 0 = keep original size. Never upscales.',
    },
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: 'Higher quality looks cleaner but grows fast. 70–80 is the usual sweet spot.',
    },
    {
      type: 'dropdown',
      name: 'cropPreset',
      label: 'Crop',
      choices: [
        { value: 'original', label: 'Original frame' },
        { value: 'square', label: 'Square 1:1' },
        { value: '16:9', label: 'Widescreen 16:9' },
        { value: '4:3', label: 'Classic 4:3' },
      ],
      default: 'original',
      hint: 'Center-crops the frame before resizing — useful for thumbnails, docs, and product callouts.',
    },
    {
      type: 'number',
      name: 'loopCount',
      label: 'Loop count',
      min: 0,
      max: 100,
      step: 1,
      default: 0,
      hint: '0 = loop forever. Use 1–3 loops for changelogs or product walkthroughs.',
    },
  ],
  faq: [
    {
      q: 'Why convert MP4 to WebP instead of GIF?',
      a: 'Animated WebP is usually much smaller than GIF at the same visible quality, and it supports full color plus alpha transparency. For short, silent loops on websites or in product docs, WebP is the better format. Use GIF only when you specifically need old-platform compatibility.',
    },
    {
      q: 'When should I use animated WebP instead of MP4?',
      a: 'Use animated WebP for short, lightweight loops that should behave like images: product UI demos, changelog snippets, feature callouts, and inline documentation. Use MP4 for longer clips, clips with audio, or anything that needs video controls and streaming behavior.',
    },
    {
      q: 'Why is my output file still large?',
      a: 'Animated WebP is best for short clips. Long durations, high frame rates, and large dimensions all increase size quickly. To shrink the file, trim to a shorter moment, lower the FPS to 10–12, reduce max dimension, or drop quality slightly.',
    },
    {
      q: 'Can I convert full videos to WebP?',
      a: 'Technically yes, but it is usually the wrong format for long footage. Animated WebP is designed for short, silent loops. For anything over a few seconds, MP4 will be smaller, faster, and more compatible.',
    },
    {
      q: 'What can go wrong when converting MP4 to animated WebP?',
      a: 'Audio-only MP4 files (M4A renamed as MP4) will fail immediately — this tool requires a video track. Long clips produce very large WebP files that can exceed browser memory limits; keep clips under 10 seconds for best results. If the output looks washed out or blurry, lower the quality setting and check the max dimension — upscaling is disabled, but a very small max dimension causes aggressive downscaling.',
    },
    {
      q: 'Does this upload my video anywhere?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm. Your MP4 files stay on your device the whole time — nothing is uploaded.',
    },
  ],
  relatedTools: ['gif-to-webp', 'gif-to-mp4', 'mp4-to-mp3', 'webp-to-gif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'how-browser-based-file-conversion-works', 'batch-convert-images'],
  meta: {
    title: 'MP4 to WebP Converter — ConvertYard',
    description:
      'Convert MP4 to animated WebP in your browser. Trim, resize, crop, set FPS and loop count. Built for short web animations — no uploads.',
  },
}
