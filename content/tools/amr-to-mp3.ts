import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'amr-to-mp3',
  title: 'AMR to MP3 Converter',
  subtitle: 'Convert AMR voice recordings to MP3. Runs in your browser, no uploads.',
  bestFor: 'Best for opening voice notes from old Android phones or Nokia devices on any modern player.',
  category: 'video-audio',
  accepts: ['audio/amr', 'audio/3gpp'],
  acceptsExt: ['.amr', '.3gp'],
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
      hint: 'AMR recordings are already low quality — 128 kbps MP3 captures everything the source has.',
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
      hint: '44,100 Hz is standard for voice recordings.',
    },
  ],
  faq: [
    {
      q: 'What is AMR?',
      a: 'AMR stands for Adaptive Multi-Rate — a compressed audio format designed for phone calls and voice recordings. It was the default voice note format on Nokia and older Android phones, and is still used by some feature phones. AMR files are tiny (a few KB per second) but the audio quality is noticeably lower than MP3 — designed for speech clarity over phones, not music.',
    },
    {
      q: 'Why can\'t I open AMR files on my computer?',
      a: 'AMR is a telecom format — most desktop media players and web browsers don\'t support it by default. VLC and ffmpeg can play AMR, but converting to MP3 is the easier path. Once converted, the file plays everywhere: Windows Media Player, QuickTime, your phone, your car stereo.',
    },
    {
      q: 'Do AMR files come from WhatsApp?',
      a: 'Older versions of WhatsApp (pre-2017) saved voice messages as AMR files on Android. Modern WhatsApp uses Opus (.opus) instead. If your voice notes end in .amr, use this tool. If they end in .opus or .ogg, use the OPUS to MP3 tool instead.',
    },
    {
      q: 'Will the quality be good after converting?',
      a: 'The MP3 quality is limited by the source AMR file. AMR is a low-bitrate voice codec — it captures speech clearly but has a narrow frequency range and audible compression. Converting to MP3 will not recover lost quality. What you\'ll get is an MP3 that sounds exactly like the AMR, but plays everywhere.',
    },
    {
      q: 'Can I batch convert AMR files?',
      a: 'Yes. Drop as many AMR or 3GP files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard\'s servers only deliver the tool code — they never see your files.',
    },
  ],
  relatedTools: ['ogg-to-mp3', 'opus-to-mp3', 'm4a-to-mp3', 'audio-trimmer'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],
  meta: {
    title: 'AMR to MP3 Converter — ConvertYard',
    description:
      'Convert AMR voice recordings to MP3 in your browser. Open AMR files from Android phones and older voice messages — batch convert, no uploads, no account.',
  },
}
