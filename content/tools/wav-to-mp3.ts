import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'wav-to-mp3',
  title: 'WAV to MP3 Converter',
  subtitle: 'Shrink WAV recordings to MP3 in your browser. No uploads, batch ready.',
  category: 'video-audio',
  accepts: ['audio/wav', 'audio/x-wav'],
  acceptsExt: ['.wav'],
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
      hint: '128 kbps is transparent for most listening. Use 192+ kbps for music.',
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
      hint: 'Match your WAV sample rate if you know it; 44,100 Hz covers most recordings.',
    },
  ],
  faq: [
    {
      q: 'Why convert WAV to MP3?',
      a: 'WAV is an uncompressed audio format — every sample is stored exactly as recorded. That makes WAV files huge: a 3-minute song at CD quality is about 30 MB as WAV. MP3 compresses the same audio to roughly 3–4 MB by removing frequencies the ear typically cannot hear. Convert to MP3 when you need to share files, upload to a platform, or fit audio on a device with limited storage.',
    },
    {
      q: 'How much smaller will the MP3 be?',
      a: 'Approximately 10× smaller at 128 kbps. A 30 MB WAV file becomes roughly 3 MB as a 128 kbps MP3. At 320 kbps the MP3 is about 4× smaller than WAV. The exact ratio depends on the length and the bitrate you choose.',
    },
    {
      q: 'Will I lose audio quality?',
      a: 'WAV is lossless — converting to MP3 introduces compression artifacts. At 128 kbps, the difference is inaudible for most listeners on most speakers and headphones. At 192–256 kbps, even careful listeners rarely hear a difference. Use 320 kbps if you plan to edit the MP3 after converting. Keep the original WAV if you need lossless quality long-term.',
    },
    {
      q: 'What bitrate should I choose for podcasts, music, or archiving?',
      a: 'For podcasts and speech: 128 kbps is transparent and keeps file sizes small. For music: 192 kbps is a good default; 256 kbps is preferred by audiophiles. For archiving: keep your WAV file — MP3 is lossy. If you must archive as MP3, use 320 kbps.',
    },
    {
      q: 'Can I batch convert WAV files?',
      a: 'Yes. Drop as many WAV files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['mp4-to-mp3', 'audio-trimmer', 'extract-audio', 'flac-to-mp3'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'WAV to MP3 Converter — ConvertYard',
    description:
      'Convert WAV to MP3 in your browser. Shrink raw recordings and WAV files — choose bitrate up to 320 kbps, batch convert up to 1,000 files, no uploads.',
  },
}
