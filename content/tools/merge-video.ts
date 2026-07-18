import { mergeVideo } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 300 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'merge-video',
  title: 'Merge Video Files',
  subtitle: 'Join multiple videos into one. Local-first. Built for batches.',
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
      q: 'Are my files uploaded to a server?',
      a: 'Never. All processing runs in your browser using ffmpeg.wasm. Your files never leave your device.',
    },
    {
      q: 'In what order are videos joined?',
      a: 'Videos are joined in the order you drop them. Reorder before dropping to control the sequence.',
    },
    {
      q: 'Can I merge videos of different resolutions or formats?',
      a: 'Yes. The tool normalizes all inputs to a common resolution and H.264/AAC MP4 before joining. Videos without audio get a silent audio track added automatically.',
    },
    {
      q: 'What quality setting should I use?',
      a: '"Balanced" (CRF 23) is the best starting point. Choose "High quality" for archiving or further editing, and "Small file" when file size matters more than quality.',
    },
    {
      q: 'Is there a limit on how many videos I can merge?',
      a: 'No hard limit. Large files will take longer to process. The tool handles the work entirely in your browser.',
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
