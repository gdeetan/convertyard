import { mergeAudio } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'merge-audio',
  title: 'Merge Audio Files',
  subtitle: 'Combine MP3, WAV, M4A, OGG, and FLAC into one file. Drop them in order — they join with no gaps.',
  bestFor: 'Good for stitching together an interview that was recorded in two halves.',
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
      q: 'In what order are the files joined?',
      a: 'Files are joined in the order you drop them. If the order matters, arrange them before dropping. There is no reorder UI — drop the files in the correct sequence.',
    },
    {
      q: 'Can I merge files of different formats?',
      a: 'Yes. Drop MP3, WAV, M4A, OGG, FLAC, and AAC files together. All inputs are re-encoded to your chosen output format, so mixed formats work fine.',
    },
    {
      q: 'Will there be a click or gap between joined tracks?',
      a: 'Typically no — ffmpeg concatenates the audio samples directly with no padding. If your source files have natural silence at their starts or ends, that silence is preserved. To remove intro/outro silence before merging, trim each file first with the Audio Trimmer.',
    },
    {
      q: 'What output format should I choose?',
      a: 'MP3 is the most compatible choice for podcasts, sharing, and music. WAV and FLAC are lossless — use them if you plan to edit the merged file further.',
    },
  ],
  relatedTools: ['audio-trimmer', 'audio-speed', 'extract-audio', 'merge-video'],
  relatedArticles: [],
  meta: {
    title: 'Merge Audio Files — ConvertYard',
    description:
      'Combine multiple audio files into one in your browser. Supports MP3, WAV, M4A, OGG, FLAC. No uploads, no account. Batch-ready.',
  },
}
