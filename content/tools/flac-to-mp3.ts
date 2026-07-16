import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'flac-to-mp3',
  title: 'FLAC to MP3 Converter',
  subtitle: 'Convert FLAC to MP3 in your browser. No uploads, batch ready.',
  category: 'video-audio',
  accepts: ['audio/flac'],
  acceptsExt: ['.flac'],
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
      hint: 'For FLAC source material, 192–256 kbps captures everything most listeners can hear.',
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
      hint: '44,100 Hz is standard for music. Use 48,000 Hz if your FLAC was recorded at that rate.',
    },
  ],
  faq: [
    {
      q: 'Why convert FLAC to MP3?',
      a: 'FLAC is a lossless format — it preserves every audio sample exactly. That\'s great for archiving, but FLAC files are large (typically 20–40 MB for a 4-minute song) and many devices and streaming platforms don\'t support them. Converting to MP3 makes the files playable on any device, much smaller, and compatible with every music platform and media player.',
    },
    {
      q: 'Do I lose quality converting FLAC to MP3?',
      a: 'Yes. FLAC is lossless; MP3 is lossy. Converting introduces compression artifacts. At 256 kbps or higher, the difference is inaudible to most listeners on typical headphones and speakers — including in blind tests. At 128 kbps, differences may be audible on good equipment with certain music (cymbals, complex orchestral passages). Use 192–256 kbps for a safe balance of quality and size.',
    },
    {
      q: 'Should I keep the original FLAC?',
      a: 'Yes, always. FLAC is your archive — the file you re-encode from in the future. The MP3 is for listening, sharing, and uploading to platforms. Once you convert FLAC to MP3, you can\'t recover the lost quality. Keep the original FLAC on a hard drive or cloud backup.',
    },
    {
      q: 'What bitrate should I use for FLAC source material?',
      a: '192 kbps is a good default — transparent on most equipment. Use 256 kbps if you want to be certain there\'s no audible difference. Use 320 kbps only if you plan to edit the MP3 later, since re-encoding a lossy file degrades quality further.',
    },
    {
      q: 'Can I batch convert FLAC files?',
      a: 'Yes. Drop as many FLAC files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['wav-to-mp3', 'audio-trimmer', 'extract-audio', 'mp4-to-mp3'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'FLAC to MP3 Converter — ConvertYard',
    description:
      'Convert FLAC to MP3 in your browser. Shrink lossless audio files for phones and streaming — choose bitrate up to 320 kbps, batch convert, no uploads.',
  },
}
