import { rotateVideo } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 300 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'rotate-video',
  title: 'Rotate Video',
  subtitle: 'Fix sideways or upside-down videos. No uploads, batch-ready.',
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
  convertFn: rotateVideo,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files take longer — rotation requires re-encoding the video track. A 300 MB video may take 2–5 minutes depending on your device.'
      : null
  },
  options: [
    {
      type: 'radio',
      name: 'rotation',
      label: 'Rotation',
      choices: [
        { value: '90cw',   label: '90° clockwise' },
        { value: '90ccw',  label: '90° counter-clockwise' },
        { value: '180',    label: '180° (upside down)' },
        { value: 'flip-h', label: 'Flip horizontal (mirror)' },
        { value: 'flip-v', label: 'Flip vertical' },
      ],
      default: '90cw',
    },
  ],
  faq: [
    {
      q: 'Are my files uploaded to a server?',
      a: "Never. All rotation runs in your browser using ffmpeg.wasm. Your files never leave your device.",
    },
    {
      q: 'Why does rotation take longer than muting or trimming?',
      a: 'Rotation requires re-encoding the video — every frame needs to be decoded, rotated, and re-encoded. This is CPU-intensive. Stream copy cannot be used because the pixel data itself changes.',
    },
    {
      q: 'What is the difference between rotating and flipping?',
      a: 'Rotating turns the video 90° or 180° around the centre. Flipping mirrors it along an axis — horizontal flip produces a mirror image (left becomes right), vertical flip turns it upside down along the horizontal axis.',
    },
    {
      q: 'Can I rotate multiple videos at once?',
      a: 'Yes. All videos get the same rotation applied. Results are packaged in a single ZIP.',
    },
    {
      q: 'My phone recorded video sideways — which option do I use?',
      a: "Most sideways phone recordings need 90° clockwise. If that produces an upside-down result, try 90° counter-clockwise instead.",
    },
  ],
  relatedTools: ['video-trimmer', 'compress-video', 'video-muter', 'extract-audio'],
  relatedArticles: [],
  meta: {
    title: 'Rotate Video — Fix Sideways & Upside-Down Videos — ConvertYard',
    description:
      'Rotate MP4, MOV, MKV, AVI, and WebM videos in your browser. Fix sideways phone recordings — 90°, 180°, or flip. No uploads, batch up to 1,000 files.',
  },
}
