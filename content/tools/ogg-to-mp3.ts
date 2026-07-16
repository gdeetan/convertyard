import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'ogg-to-mp3',
  title: 'OGG to MP3 Converter',
  subtitle: 'Convert OGG audio files to MP3. Runs in your browser, no uploads.',
  category: 'video-audio',
  accepts: ['audio/ogg'],
  acceptsExt: ['.ogg'],
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
      hint: '44,100 Hz is standard for music and voice recordings.',
    },
  ],
  faq: [
    {
      q: 'What is OGG?',
      a: 'OGG is an open-source container format developed by the Xiph.Org Foundation. It most commonly contains Vorbis-encoded audio (OGG Vorbis), though it can also hold Opus, FLAC, or Speex audio. OGG files are popular in open-source software, Linux audio, and some games. The format is royalty-free, which makes it a common default in software that avoids MP3 licensing.',
    },
    {
      q: 'Where do OGG files come from?',
      a: 'Common sources: Discord (audio messages on some platforms), Telegram (voice notes on certain versions), games built with open-source audio engines, Linux desktop applications, and media players like VLC that default to OGG when recording. Some older versions of Audacity also export OGG by default.',
    },
    {
      q: 'Does converting OGG to MP3 lose quality?',
      a: 'Yes — both OGG Vorbis and MP3 are lossy formats, so transcoding between them causes a small additional quality loss. At 192 kbps or higher, the difference is inaudible for most listeners. If you have the original source (WAV, FLAC), convert from that instead of from OGG to avoid generation loss.',
    },
    {
      q: 'What about .ogg files from WhatsApp?',
      a: 'Modern WhatsApp voice notes use the Opus codec inside an OGG container. This tool handles OGG Vorbis well, but Opus-in-OGG may not always work as expected here. If your WhatsApp OGG files don\'t convert correctly, try the OPUS to MP3 tool instead — it\'s specifically designed for that format.',
    },
    {
      q: 'Can I batch convert OGG files?',
      a: 'Yes. Drop as many OGG files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['opus-to-mp3', 'amr-to-mp3', 'audio-trimmer', 'extract-audio'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'OGG to MP3 Converter — ConvertYard',
    description:
      'Convert OGG to MP3 in your browser. Convert Discord and Telegram voice notes, OGG Vorbis audio files — batch convert up to 1,000 files, no uploads.',
  },
}
