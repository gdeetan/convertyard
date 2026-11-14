import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'flac-to-mp3',
  title: 'FLAC to MP3 Converter',
  subtitle: 'Convert FLAC to MP3 in your browser. No uploads, batch ready.',
  bestFor: 'Best for making lossless music files small enough to upload to streaming platforms or sync to your phone.',
  category: 'video-audio',
  accepts: ['audio/flac'],
  acceptsExt: ['.flac'],
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
      a: 'By saving FLACs, we save the original recorded music in <strong>full quality</strong>, but the files are very large (typically <strong>20-40MB per 4-minute track</strong>). Most devices and many online music services do not support FLACs. In order to be able to use your archived music on your iPod, on your PC, on streaming services, etc., we need to convert the files to MP3s. MP3s are <strong>much smaller</strong> than their parent files and are <strong>compatible with absolutely every music service and every media player</strong> on the planet.',
    },
    {
      q: 'Do I lose quality converting FLAC to MP3?',
      a: 'FLAC is <strong>lossless</strong> while MP3 is <a href="/blog/lossless-vs-lossy/">lossy</a>. When converting between formats, you will hear the effects of compression as <strong>artifacts</strong>. Most people cannot hear the difference between FLAC and MP3 at <a href="/blog/audio-bitrate-explained/"><strong>256 kbps</strong></a> and higher on average headphones and speakers. Blind tests cannot tell the difference. At <strong>128 kbps</strong>, some differences can be heard on good equipment playing back certain sorts of music (cymbals, complex sections of large orchestral pieces), but it\'s generally safe to go with <strong>192-256 kbps</strong>.',
    },
    {
      q: 'Should I keep the original FLAC?',
      a: 'It\'s always best to save your <strong>archive</strong> as FLAC, the file you encode from in the future. The MP3 you\'re encoding to now is just for <strong>listening, sharing, and uploading</strong> to sites. If you convert FLAC to MP3, you <strong>cannot get back the quality you lost</strong>. This file should be kept on your <strong>hard drive or in cloud backup</strong>.',
    },
    {
      q: 'Can I batch convert FLAC files?',
      a: 'You can upload <strong>as many FLAC files as you like</strong>. ConvertYard converts <strong>one file at a time in your browser</strong>. All the converted MP3 files will be packaged in a <strong>single ZIP file</strong>, which you can download from your browser. While there is <strong>no upper limit</strong> for the number of files, very large numbers of files will take increasingly longer to process in proportion.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'No, because the conversion runs <strong>entirely in your browser</strong> using <strong>ffmpeg.wasm</strong> — a full media processing engine compiled to <strong>WebAssembly</strong>. Your files <strong>never leave your device</strong>. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['compress-mp3', 'wav-to-mp3', 'audio-trimmer', 'extract-audio', 'mp4-to-mp3'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'Convert FLAC to MP3 for Free',
    description:
      'Convert lossless FLAC audio files to a more efficient MP3 format and save storage space. Convert up to 1,000 files per batch for free.',
  },
}
