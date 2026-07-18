import { mergeAudio } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'merge-audio',
  title: 'Merge Audio Files',
  subtitle: 'Join multiple audio files into one. Local-first. Built for batches.',
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
  resultMode: 'combined-output',
  convertFn: mergeAudio,
  options: [
    {
      type: 'dropdown',
      name: 'format',
      label: 'Output format',
      choices: [
        { value: 'mp3',  label: 'MP3' },
        { value: 'wav',  label: 'WAV' },
        { value: 'm4a',  label: 'AAC / M4A' },
        { value: 'ogg',  label: 'OGG' },
        { value: 'flac', label: 'FLAC' },
      ],
      default: 'mp3',
    },
  ],
  faq: [
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. All processing runs in your browser using ffmpeg.wasm. Your files never leave your device.',
    },
    {
      q: 'In what order are files joined?',
      a: 'Files are joined in the order you drop them. Reorder before dropping to control the sequence.',
    },
    {
      q: 'Can I merge files of different formats?',
      a: 'Yes. Drop MP3, WAV, M4A, OGG, FLAC, and AAC files together. All inputs are re-encoded to the chosen output format.',
    },
    {
      q: 'What output format should I choose?',
      a: 'MP3 is the most compatible choice for music and podcasts. WAV gives lossless quality at a larger file size. FLAC is lossless and compressed.',
    },
    {
      q: 'Is there a limit on how many files I can merge?',
      a: 'No hard limit. The tool handles large batches in your browser. Very long combined audio may take extra time depending on your device.',
    },
  ],
  relatedTools: ['audio-trimmer', 'audio-speed', 'extract-audio', 'merge-video'],
  relatedArticles: [],
  meta: {
    title: 'Merge Audio Files — Join MP3, WAV, M4A and More — ConvertYard',
    description:
      'Combine multiple audio files into one in your browser. Supports MP3, WAV, M4A, OGG, FLAC. No uploads, no account. Batch-ready.',
  },
}
