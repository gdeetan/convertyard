import { changeVideoSpeed } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 300 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'video-speed',
  title: 'Video Speed Changer',
  subtitle: 'Speed up or slow down any video. Pitch-corrected audio. No uploads.',
  bestFor: 'Best for creating timelapse-style clips or slow-motion moments from any video.',
  category: 'video-audio',
  accepts: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-ms-wmv',
  ],
  acceptsExt: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.wmv'],
  outputExt: '.mp4',
  convertFn: changeVideoSpeed,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files require full re-encoding. A 300 MB video may take 5–10 minutes depending on your device.'
      : null
  },
  options: [
    {
      type: 'radio',
      name: 'speed',
      label: 'Speed',
      choices: [
        { value: '0.25', label: '0.25× — slow motion' },
        { value: '0.5',  label: '0.5× — half speed' },
        { value: '0.75', label: '0.75×' },
        { value: '1.5',  label: '1.5×' },
        { value: '2',    label: '2× — double speed' },
        { value: '4',    label: '4× — fast forward' },
      ],
      default: '2',
    },
  ],
  faq: [
    {
      q: 'Does changing speed affect audio pitch?',
      a: "No. The tool uses ffmpeg's atempo filter, which adjusts playback speed without changing pitch. At 2× speed the audio sounds the same pitch as the original, just faster.",
    },
    {
      q: 'Why does speed change take a while?',
      a: 'Changing speed requires re-encoding every frame of the video. This is CPU-intensive and takes proportionally longer than the original duration at slower speeds. A 5-minute 1080p video at 0.5× speed (now 10 minutes of output) may take 5–10 minutes to process.',
    },
    {
      q: 'Can I use a custom speed not listed?',
      a: "Not currently — use one of the preset values. Slow motion (0.25×, 0.5×) and fast forward (2×, 4×) cover the most common use cases.",
    },
    {
      q: 'What can go wrong when changing video speed?',
      a: 'The atempo filter for audio pitch correction only works in the 0.5×–2× range per pass. Speeds of 0.25× and 4× require chaining two atempo filters — this works correctly in this tool, but very extreme slow-motion (0.25×) may produce choppy results if the source video has a low frame rate (under 24 fps). Also, very large files at slow speeds produce correspondingly large output files.',
    },
    {
      q: 'Can I change the speed of multiple videos at once?',
      a: 'Yes. All files get the same speed applied. Results are packaged in a single ZIP.',
    },
    {
      q: 'Do my video files leave my device when I change their speed?',
      a: 'No. Speed processing runs entirely in your browser using ffmpeg.wasm. Your files never leave your device.',
    },
  ],
  relatedTools: ['audio-speed', 'video-trimmer', 'compress-video', 'video-muter'],
  relatedArticles: [],
  meta: {
    title: 'Video Speed Changer — Speed Up or Slow Down Videos — ConvertYard',
    description:
      'Speed up or slow down MP4, MOV, MKV, and WebM videos in your browser. Presets from 0.25× to 4×. No uploads, batch up to 1,000 files.',
  },
}
