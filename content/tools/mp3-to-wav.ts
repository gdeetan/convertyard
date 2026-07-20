import { mp3ToWav } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp3-to-wav',
  title: 'MP3 to WAV Converter',
  subtitle: 'Convert MP3 to uncompressed WAV for DAWs and audio editors. No uploads.',
  bestFor: 'Best for producers importing audio into GarageBand, Ableton, or Audacity.',
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/mp3'],
  acceptsExt: ['.mp3'],
  outputExt: '.wav',
  convertFn: (files, opts, onProgress) => mp3ToWav(files, opts, onProgress),

  options: [],

  faq: [
    {
      q: 'Why convert MP3 to WAV?',
      a: 'WAV is an uncompressed audio format required by many DAWs, audio editors, and professional recording tools. If you\'re importing audio into GarageBand, Logic, Ableton, Audacity, or a video editor that requires uncompressed source material, WAV is the right format.',
    },
    {
      q: 'Does converting MP3 to WAV improve quality?',
      a: 'No. MP3 is a lossy format — the quality reduction from the original MP3 encoding is permanent. Converting to WAV produces an uncompressed file of the same audio quality as the MP3 source, not the original recording. The file will be much larger, but not higher quality.',
    },
    {
      q: 'How much larger will the WAV file be?',
      a: 'Significantly larger. A typical 4-minute MP3 at 128 kbps is around 4 MB. The same audio as a 44.1 kHz 16-bit WAV is around 40 MB — roughly 10× larger. Make sure you have enough disk space before converting large batches.',
    },
    {
      q: 'When should I use MP3 to WAV instead of just keeping the MP3?',
      a: 'Convert to WAV when the software you\'re importing into requires uncompressed audio. Some older DAW plugins, hardware samplers, and broadcast automation systems only accept WAV or AIFF. If your target software accepts MP3, there is no benefit to converting — you just get a bigger file of identical quality.',
    },
    {
      q: 'What can go wrong when converting MP3 to WAV?',
      a: 'The WAV file will be much larger than expected — a 128 kbps MP3 becomes roughly 10× bigger as WAV. Some DAWs also expect a specific sample rate (usually 44,100 Hz or 48,000 Hz); importing the wrong rate can cause pitch or timing issues. This tool outputs at 44.1 kHz by default, which matches most music software.',
    },
    {
      q: 'Do my MP3 files leave my device during conversion?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm. Your MP3 files never leave your device — the server only delivers the tool code.',
    },
  ],

  relatedTools: ['mp4-to-mp3', 'extract-audio', 'audio-trimmer', 'aac-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'MP3 to WAV Converter — ConvertYard',
    description:
      'Convert MP3 to WAV in your browser. Uncompressed audio for DAWs and audio editors. Batch convert multiple MP3 files at once — no uploads, no account.',
  },
}
