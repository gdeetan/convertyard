import { changeAudioSpeed } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'audio-speed',
  title: 'Audio Speed Changer',
  subtitle: 'Adjust playback speed from 0.25× to 4× — pitch stays constant. Drop a whole folder and process them all at once.',
  bestFor: 'Good for burning through a lecture backlog at 1.5× or 2×.',
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
  enablePresets: true,
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
      q: 'Does changing speed affect pitch?',
      a: "No. The tool uses ffmpeg's atempo filter, which time-stretches the audio while keeping pitch constant. Speech stays at normal pitch at 2× speed; slowed-down music stays in the original key.",
    },
    {
      q: 'What are the speed limits and why?',
      a: "ffmpeg's atempo filter supports 0.5× to 2× per pass. To hit 0.25× or 4×, the tool chains two atempo filters in sequence. The result sounds natural within reason — extreme values like 0.25× will make audio sound artificially sluggish.",
    },
    {
      q: 'Will the output quality be lower than the input?',
      a: 'Slightly. Speed adjustment requires re-encoding, which adds a small quality cost. For voice and podcasts this is inaudible. For high-fidelity music, choose WAV output to minimize codec losses.',
    },
    {
      q: 'Can I apply the same speed to 100 files at once?',
      a: 'Yes. Drop as many files as you need — all get the same speed multiplier. Results are packaged in a ZIP.',
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
