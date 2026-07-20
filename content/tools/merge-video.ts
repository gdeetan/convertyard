import { mergeVideo } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 300 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'merge-video',
  title: 'Merge Video Files',
  subtitle: 'Join multiple video clips into one MP4 file. Local-first, stays in your browser.',
  bestFor: 'Best for stitching together screen recording segments, travel clips, or split-up video exports.',
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
  resultMode: 'combined-output',
  convertFn: mergeVideo,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files require re-encoding. A 300 MB video may take several minutes depending on your device.'
      : null
  },
  options: [
    {
      type: 'radio',
      name: 'quality',
      label: 'Output quality',
      choices: [
        { value: '18', label: 'High quality' },
        { value: '23', label: 'Balanced' },
        { value: '28', label: 'Small file' },
      ],
      default: '23',
    },
  ],
  faq: [
    {
      q: 'Do my video files leave my device when merging?',
      a: 'No. All processing runs in your browser using ffmpeg.wasm — a full media engine compiled to WebAssembly. Your videos never touch a server.',
    },
    {
      q: 'In what order are the videos joined?',
      a: 'Videos are joined in the order you drop them. If sequence matters, arrange the files before dropping — there is no reorder UI.',
    },
    {
      q: 'Can I merge videos of different resolutions or formats?',
      a: 'Yes. All inputs are re-encoded to a common H.264/AAC MP4 before joining. Resolution is normalized to the largest clip. Videos without an audio track get a silent track added automatically so the merge does not break.',
    },
    {
      q: 'Why is merging slow even for short videos?',
      a: 'All inputs must be re-encoded to a common codec and resolution before concatenation. ffmpeg.wasm runs in a single browser thread, so a 10-minute 1080p source can take several minutes on a typical laptop. Progress is shown per file.',
    },
    {
      q: 'What quality setting should I use?',
      a: '"Balanced" (CRF 23) is the right default for sharing and uploading. Use "High quality" if you plan to edit the merged file further. "Small file" (CRF 28) is fine for previews or low-bandwidth targets.',
    },
  ],
  relatedTools: ['compress-video', 'video-trimmer', 'video-muter', 'merge-audio'],
  relatedArticles: [],
  meta: {
    title: 'Merge Video Files — Join MP4, MOV, MKV and More — ConvertYard',
    description:
      'Combine multiple videos into one MP4 in your browser. Supports MP4, MOV, WebM, AVI, MKV. No uploads, no account. Batch-ready.',
  },
}
