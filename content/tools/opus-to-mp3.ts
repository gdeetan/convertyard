import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'opus-to-mp3',
  title: 'OPUS to MP3 Converter',
  subtitle: 'Convert Opus voice notes to MP3. Works on WhatsApp voice messages. No uploads.',
  bestFor: 'Best for converting exported WhatsApp voice notes to play on any device.',
  category: 'video-audio',
  accepts: ['audio/opus', 'audio/ogg'],
  acceptsExt: ['.opus', '.ogg'],
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
      hint: 'Voice notes: 128 kbps is transparent. Music: use 192+ kbps.',
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
      hint: '44,100 Hz is standard. Opus files from WhatsApp are typically 48,000 Hz internally.',
    },
  ],
  faq: [
    {
      q: 'What is Opus?',
      a: 'Opus is a modern, open-source audio codec developed by the IETF. It\'s designed for internet audio — voice calls, video conferencing, and streaming. It\'s used by WhatsApp for voice messages, Discord for voice channels, and WebRTC-based apps like Google Meet and Zoom. Opus files typically use the .opus extension or are stored inside an OGG container (.ogg).',
    },
    {
      q: 'Do WhatsApp voice notes use Opus?',
      a: 'Yes. Modern WhatsApp (Android and iOS) saves voice messages as Opus audio inside an OGG container — the files often have a .opus or .ogg extension depending on the platform and WhatsApp version. This tool handles both. If you exported voice notes from WhatsApp and they won\'t play on your computer, drop them here to convert to MP3.',
    },
    {
      q: 'What\'s the difference between OGG and Opus?',
      a: 'OGG is a container format — like a ZIP file that holds audio data. Opus is a codec — the algorithm that compresses and encodes the audio. An OGG file can contain Vorbis audio, Opus audio, FLAC audio, or others. When someone says "OGG file," they usually mean OGG Vorbis. WhatsApp voice notes are OGG Opus — the OGG container with Opus audio inside. This tool handles both.',
    },
    {
      q: 'Why can\'t I play .opus files on Windows or iPhone?',
      a: 'The Opus codec is not natively supported by Windows Media Player, older versions of QuickTime, or the iPhone\'s built-in Files app. Modern browsers (Chrome, Firefox, Edge) can play .opus files, but standalone media players often cannot. Converting to MP3 makes the file play on every device and player without any additional software.',
    },
    {
      q: 'What can go wrong when converting Opus to MP3?',
      a: 'WhatsApp voice notes are encoded at 16 kHz or 24 kHz — that is lower than CD quality, so the resulting MP3 will sound like a voice note, not studio audio. That\'s the source quality, not the converter. Occasionally, very old WhatsApp exports have malformed headers; if a file fails, try converting it individually rather than in a batch. The output is always mono for voice notes, since the source is mono.',
    },
    {
      q: 'Do my voice note files leave my device when I convert them?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm. Your Opus files never leave your device — ConvertYard\'s servers only deliver the tool code.',
    },
  ],
  relatedTools: ['ogg-to-mp3', 'amr-to-mp3', 'm4a-to-mp3', 'audio-trimmer'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'OPUS to MP3 Converter — ConvertYard',
    description:
      'Convert Opus voice notes to MP3 in your browser. Open WhatsApp voice messages and .opus files on any device — batch convert up to 1,000 files, no uploads.',
  },
}
