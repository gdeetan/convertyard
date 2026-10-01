import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'
import { Mp4ToMp3Explainer } from '@/components/mp4-to-mp3/explainer'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'mp4-to-mp3',
  title: 'MP4 to MP3 Converter',
  subtitle: 'Extract audio from MP4, WebM, or MOV. Choose bitrate up to 320 kbps — no uploads.',
  bestFor: 'Best for extracting a podcast, lecture, or music track from a video file.',
  category: 'video-audio',
  accepts: ['video/mp4', 'video/webm', 'video/quicktime'],
  acceptsExt: ['.mp4', '.webm', '.mov'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
  explainer: Mp4ToMp3Explainer,
  enablePresets: true,
  howItWorks: [
    {
      label: 'Drop your files',
      desc: 'Click to browse, drag and drop, or paste from clipboard. Process up to 1,000 files per batch. For larger files, convert batches of up to 50 only.',
    },
    {
      label: 'Choose settings',
      desc: 'Adjust bitrate and Sample rate. If you’re not sure what to choose, the default setting is enough for most applications.',
    },
    {
      label: 'Click Convert',
      desc: 'Everything runs in your browser via WebAssembly. MP4 to MP3 Converter happens locally — no server involved.',
    },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500MB.'
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
      hint: '128 kbps is transparent for most listening. Use 320 kbps for archiving.',
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
      hint: 'Use 44,100 Hz for music; 48,000 Hz matches video production standards.',
    },
  ],

  faq: [
    {
      q: 'Does the audio quality change when converting MP4 to MP3?',
      a: 'In most cases, there isn’t any noticeable difference in audio quality, especially if they listen on their smartphones or stock car stereos. MP3 files are a lossy format, so some audio degradation occurs when you convert. One workaround is to use a higher bitrate. 192 to 256 will work for most use cases, but if you want to edit the audio later, use the highest setting (320 kbps).',
    },
    {
      q: 'How large will the MP3 be compared to my MP4?',
      a: "MP3 files are much smaller than MP4 files because they're lossy and don't include a video track. Based on my tests, the difference is between 85 and 98%, depending on the setting you choose. For example, a 54-minute video that’s 767 MB can shrink to around 52.3 MB, more than a 95% drop.",
    },
    {
      q: 'Why does MP4 to MP3 take longer than image conversion?',
      a: 'Converting an MP4 file to MP3 requires decoding a video container, extracting the audio, and then re-encoding it as an MP3 using a media processing engine (or ffmpeg.wasm), so it takes longer per file. This processing engine is about 25 MB and takes a moment to load, but once it does, subsequent conversions will be faster.',
    },
    {
      q: 'Can I convert WebM or MOV files too?',
      a: 'Yes. The MP4 to MP3 tool also supports WebM and MOV files, along with MP4, two of the most common video formats.',
    },
    {
      q: 'What can go wrong when extracting audio from an MP4?',
      a: 'This tool will not convert an MP4 file that doesn’t have an audio track. You’ll see an error message if you try to convert such. Long videos close to 1 hour will take 3 to 8 minutes (this is approximate), but the actual time will depend on how fast your computer is; more specifically, how much memory it has. If your MP4 file is corrupt, this tool will either return an error message or a corrupt file.',
    },
    {
      q: 'Do my video files leave my device when I use this tool?',
      a: 'Nope. The MP4-to-MP3 conversion happens in your browser and is not uploaded to a server. So nothing leaves your device. So the ConvertYard server loads the code on your browser and the conversion happens inside the browser and not on a server.',
    },
  ],

  relatedTools: ['compress-mp3', 'mp3-to-mp4'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],

  meta: {
    title: 'MP4 to MP3 Converter — ConvertYard',
    description:
      'Convert MP4 format to MP3 if you need to transform video files into an audio-only format for podcasts, audio books, or music.',
  },
}
