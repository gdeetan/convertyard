import { changeAudioSpeed } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'audio-speed',
  title: 'Audio Speed Changer',
  subtitle: 'Speed up or slow down audio files. Local-first. Built for batches.',
  category: 'video-audio',
  accepts: [
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
  ],
  acceptsExt: ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac'],
  outputExt: '.mp3',
  convertFn: changeAudioSpeed,
  options: [
    {
      type: 'radio',
      name: 'speed',
      label: 'Speed',
      choices: [
        { value: '0.25', label: '0.25× — slow motion' },
        { value: '0.5',  label: '0.5× — half speed' },
        { value: '0.75', label: '0.75×' },
        { value: '1.5',  label: '1.5×' },
        { value: '2',    label: '2× — double speed' },
        { value: '4',    label: '4× — fast forward' },
      ],
      default: '2',
    },
    {
      type: 'dropdown',
      name: 'format',
      label: 'Output format',
      choices: [
        { value: 'original', label: 'Keep original' },
        { value: 'mp3',      label: 'MP3' },
        { value: 'wav',      label: 'WAV' },
        { value: 'aac',      label: 'AAC' },
        { value: 'ogg',      label: 'OGG' },
      ],
      default: 'original',
    },
  ],
  faq: [
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. All processing runs in your browser using ffmpeg.wasm. Your files never leave your device.',
    },
    {
      q: 'Does changing speed affect audio pitch?',
      a: "No. The tool uses ffmpeg's atempo filter, which adjusts playback speed without changing pitch.",
    },
    {
      q: 'Which output format should I choose?',
      a: '"Keep original" re-encodes to the same format as the input. Choose MP3 for maximum compatibility or WAV for lossless quality.',
    },
    {
      q: 'Can I change the speed of multiple files at once?',
      a: 'Yes. All files get the same speed applied. Results are packaged in a single ZIP.',
    },
    {
      q: 'What are the speed limits?',
      a: 'The tool supports 0.25× to 4×. Extreme values (0.25× and 4×) chain multiple atempo filters internally to stay within ffmpeg limits.',
    },
  ],
  relatedTools: ['video-speed', 'audio-trimmer', 'extract-audio', 'ringtone-maker'],
  relatedArticles: [],
  meta: {
    title: 'Audio Speed Changer — Speed Up or Slow Down Audio — ConvertYard',
    description:
      'Speed up or slow down MP3, WAV, M4A, OGG, and FLAC audio in your browser. Presets from 0.25× to 4×. No uploads, batch up to 1,000 files.',
  },
}
