import { trimVideo } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'video-trimmer',
  title: 'Video Trimmer',
  subtitle: 'Trim any video clip. Fast mode is instant — no re-encode, no upload.',
  bestFor: 'Best for cutting intros and outros off recordings without installing software.',
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
  outputExt: '',
  convertFn: trimVideo,
  enablePresets: true,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes in Precise mode. Fast mode is instant for any file size.'
      : null
  },
  options: [
    {
      type: 'number',
      name: 'startTime',
      label: 'Start time (seconds)',
      min: 0,
      step: 0.1,
      default: 0,
      hint: '0 = beginning of file.',
    },
    {
      type: 'number',
      name: 'endTime',
      label: 'End time (seconds)',
      min: 0,
      step: 0.1,
      default: 0,
      hint: '0 = end of file (keep everything after start time).',
    },
    {
      type: 'toggle',
      name: 'precise',
      label: 'Precise mode (frame-accurate cuts, slower)',
      default: false,
      hint: 'Fast mode uses stream copy — instant but cuts at the nearest keyframe, which may be off by up to a second. Precise mode re-encodes for exact start and end points.',
    },
  ],
  faq: [
    {
      q: 'What is the difference between Fast and Precise mode?',
      a: 'Fast mode copies the video without re-encoding — trimming a 1 GB file takes seconds and produces no quality loss. Cuts land at the nearest keyframe, which may be off by up to a second. Precise mode re-encodes from the exact start point, giving frame-accurate cuts at the cost of longer processing time.',
    },
    {
      q: 'Why do the first few frames look black in Fast mode?',
      a: 'Fast mode cuts at the nearest keyframe before your chosen start time. If the cut lands between keyframes, the video decoder may produce black or corrupt frames until the next keyframe. This is a known limitation of keyframe-based seeking in stream copy mode. Switch to Precise mode to get clean output starting exactly at your chosen point.',
    },
    {
      q: 'Can I trim multiple videos at once?',
      a: 'Yes. Drop as many files as you need. ConvertYard applies the same start and end times to every file and packages the results in a single ZIP.',
    },
    {
      q: 'Which formats are supported?',
      a: 'MP4, MOV, WebM, AVI, MKV, and WMV. Fast mode preserves the original container. Precise mode re-encodes the video track to H.264 and copies the audio.',
    },
    {
      q: 'What does leaving End time at 0 do?',
      a: 'A zero End time means "keep everything after the Start time" — it trims the beginning only. Set both Start and End to trim a middle section.',
    },
    {
      q: 'Do my video files leave my device when I trim them?',
      a: 'No. All trimming runs in your browser using ffmpeg.wasm. Your files never leave your device.',
    },
  ],
  relatedTools: ['audio-trimmer', 'compress-video', 'extract-audio', 'video-muter'],
  relatedArticles: [],
  meta: {
    title: 'Video Trimmer — ConvertYard',
    description:
      'Trim MP4, MOV, MKV, WebM, and AVI clips in your browser. Fast mode is instant — no re-encode, no upload. Batch trim up to 1,000 videos.',
  },
}
