import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'm4a-to-mp3',
  title: 'M4A to MP3 Converter',
  subtitle: 'Convert M4A voice memos and audio files to MP3. No uploads, no software.',
  bestFor: 'Best for sharing iPhone voice memos with people on Android, Windows, or older devices that reject M4A.',
  category: 'video-audio',
  accepts: ['audio/mp4', 'audio/x-m4a'],
  acceptsExt: ['.m4a'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  enablePresets: true,
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
      a: 'M4A is an Apple audio format that\'s an AAC audio track sitting inside an MPEG-4 container. This format will play on Apple devices like iPhone, Mac, or iPad and most newer media players, but it\'s not compatible with older Android apps and car audio equipment. If you record a podcast in this format, converting it to MP3 would allow you to upload it to podcast platforms, and it is the more universally accepted format for audio files.',
    },
    {
      q: 'Does converting M4A to MP3 lose quality?',
      a: 'There will be slight degradation since both M4A (AAC) and MP3 are lossy formats, and converting between them requires a lossy-to-lossy transcode. If you choose a bitrate of 192 kbps or higher, the difference isn\'t noticeable for most people. For voice memos, 128 kbps will be sufficient. Regardless, you still need to keep the original M4A files in case you need the best possible audio copy.',
    },
    {
      q: 'What bitrate should I use for voice memos vs music?',
      a: 'Choose 128 kbps for most use cases: recordings, podcasts, or voice memos. There isn\'t much difference in the audio output between the original M4A file and the MP3 equivalent. But if you\'re converting a music file, use a bitrate between 192 and 256 kbps. Only use 320 kbps if you plan to reuse the MP3 for another project because re-encoding a lossy file will degrade quality further.',
    },
    {
      q: 'Can I batch convert M4A files?',
      a: 'Yes, you can convert up to 1,000 M4A files in a batch, and ConvertYard will process each file individually in the browser and combine them into a ZIP for download.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['compress-mp3', 'mp4-to-mp3', 'extract-audio', 'audio-trimmer', 'mp3-to-mp4'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'M4A to MP3 Converter - Nothing Uploads, Convert Files on Your Browser',
    description:
      "Convert Apple's native audio format M4A to an MP3 format that has better compatibility across different devices on Android and iOS. Free, no paywall or signups.",
  },
}
