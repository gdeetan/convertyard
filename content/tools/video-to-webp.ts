import { mp4ToWebp } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 250 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'video-to-webp',
  title: 'Video to WebP Converter',
  subtitle: 'Turn any video clip into an animated WebP — smaller than GIF, full color, designed for the web.',
  bestFor: 'Good for embedding a looping UI demo in a product changelog or README.',
  category: 'video-audio',
  accepts: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-flv',
  ],
  acceptsExt: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'],
  outputExt: '.webp',
  convertFn: mp4ToWebp,
  enablePresets: true,
  limitationNote: {
    summary: 'Best for short clips',
    body: 'Animated WebP is designed for short, silent loops. Long clips produce very large files that can exceed browser memory limits. Keep clips under 10 seconds for best results.',
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
      q: 'Why use WebP instead of GIF for video clips?',
      a: 'Animated WebP is typically 25–35% smaller than GIF at equivalent quality and supports full color (not just 256 colors). Use WebP for websites, product docs, and UI demos. Use GIF only for platforms that do not yet support WebP — older Slack clients, GitHub READMEs, some email clients.',
    },
    {
      q: 'When should I use animated WebP instead of MP4?',
      a: 'Use animated WebP for short, silent loops that behave like images: product UI demos, feature callouts, inline documentation. Use MP4 for longer clips, clips with audio, or anything needing video controls and streaming behavior.',
    },
    {
      q: 'Why is my output file still large?',
      a: 'Long durations, high frame rates, and large dimensions all inflate animated WebP size quickly. Trim to a shorter moment, lower FPS to 10–12, reduce max dimension, or drop quality slightly.',
    },
    {
      q: 'Can I convert AVI or MKV files, not just MP4?',
      a: 'Yes. This tool accepts MP4, WebM, MOV, AVI, MKV, and FLV. The output is always animated WebP regardless of the input format.',
    },
    {
      q: 'What can go wrong when converting video to animated WebP?',
      a: 'Audio-only files will fail immediately — this tool requires a video track. Long clips can exceed browser memory; keep clips under 10 seconds. If output looks washed out or blurry, lower the quality setting and check the max dimension.',
    },
  ],
  relatedTools: ['mp4-to-webp', 'video-to-gif', 'gif-to-webp', 'compress-video'],
  relatedArticles: [
    'avif-vs-webp-vs-jpeg-2026',
    'how-browser-based-file-conversion-works',
    'batch-convert-images',
  ],
  meta: {
    title: 'Video to WebP Converter — ConvertYard',
    description:
      'Convert MP4, MOV, AVI, MKV, FLV, and WebM to animated WebP in your browser. Trim, crop, resize, and set loop count. Batch-ready, no uploads.',
  },
}
