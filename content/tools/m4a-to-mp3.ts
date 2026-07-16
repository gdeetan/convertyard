import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'm4a-to-mp3',
  title: 'M4A to MP3 Converter',
  subtitle: 'Convert M4A voice memos and audio files to MP3. No uploads, no software.',
  category: 'video-audio',
  accepts: ['audio/mp4', 'audio/x-m4a'],
  acceptsExt: ['.m4a'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'bitrate',
      label: 'Bitrate',
      choices: [
        { value: '128', label: '128 kbps (standard)' },
        { value: '192', label: '192 kbps (good)' },
        { value: '256', label: '256 kbps (high)' },
        { value: '320', label: '320 kbps (maximum)' },
      ],
      default: '128',
      hint: '128 kbps is transparent for voice. Use 192+ kbps for music.',
    },
    {
      type: 'radio',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
      ],
      default: '44100',
      hint: '44,100 Hz is standard for music and voice memos.',
    },
  ],
  faq: [
    {
      q: 'What is M4A and why won\'t it play everywhere?',
      a: 'M4A is Apple\'s audio format — it\'s an AAC audio track inside an MPEG-4 container. It plays natively on Apple devices (iPhone, Mac, iPad) and in most modern media players, but older Android apps, car stereos, and some podcast platforms expect MP3. Converting to MP3 makes the file universally compatible.',
    },
    {
      q: 'Does converting M4A to MP3 lose quality?',
      a: 'Yes, slightly — both M4A (AAC) and MP3 are lossy formats, and converting between them is a lossy-to-lossy transcode. At 192 kbps or higher, the quality difference is inaudible for most listeners. For voice memos, 128 kbps is transparent. Keep your original M4A files if you ever need to re-edit.',
    },
    {
      q: 'Can I convert iPhone voice memos?',
      a: 'Yes. iPhone voice memos are saved as M4A files. Export them to your Mac or PC (via AirDrop, iCloud, or a USB cable), drop them into this tool, and download the MP3s. The conversion runs entirely in your browser — nothing is uploaded.',
    },
    {
      q: 'What bitrate should I use for voice memos vs music?',
      a: 'For voice memos, recordings, and podcasts: 128 kbps is transparent — you won\'t hear a difference from the original. For music: use 192–256 kbps. Use 320 kbps only if you plan to re-edit the MP3 later, since re-encoding a lossy file degrades quality further.',
    },
    {
      q: 'Can I batch convert M4A files?',
      a: 'Yes. Drop as many M4A files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['mp4-to-mp3', 'extract-audio', 'audio-trimmer', 'mp3-to-mp4'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'M4A to MP3 Converter — ConvertYard',
    description:
      'Convert M4A to MP3 in your browser. Batch convert iPhone voice memos and M4A audio files — choose bitrate up to 320 kbps, no uploads, no account.',
  },
}
