import { gifToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-mp4',
  title: 'GIF to MP4 Converter',
  subtitle: 'Convert GIF animations to H.264 MP4 — up to 95% smaller, smoother playback. Drop 1,000 at once.',
  category: 'video-audio',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.mp4',
  convertFn: (files, opts, onProgress) =>
    gifToMp4(files, opts, onProgress),

  options: [
    {
      type: 'dropdown',
      name: 'resolution',
      label: 'Output resolution',
      choices: [
        { value: 'original', label: 'Original (keep GIF size)' },
        { value: '480p',     label: '480p' },
        { value: '720p',     label: '720p' },
        { value: '1080p',    label: '1080p' },
      ],
      default: 'original',
      hint: 'Scales the output video. Original keeps the GIF dimensions (always produces even pixel counts for H.264).',
    },
    {
      type: 'dropdown',
      name: 'loop',
      label: 'Loop',
      choices: [
        { value: '1x',       label: 'Play once' },
        { value: '2x',       label: 'Play twice' },
        { value: 'infinite', label: 'Loop (30 seconds)' },
      ],
      default: '1x',
      hint: '"Loop (30 seconds)" repeats the GIF until the video reaches 30 s — useful for looping background videos.',
    },
  ],

  faq: [
    {
      q: 'Why convert GIF to MP4?',
      a: 'MP4 files are dramatically smaller than GIFs — typically 70–95% smaller. A 5 MB GIF might become a 300 KB MP4. MP4 also supports smooth playback at any frame rate, while GIF is limited and often jerky. For web use, replace the img tag with a video tag using autoplay, loop, muted, and playsinline attributes.',
    },
    {
      q: 'Does this keep the animation?',
      a: 'Yes. The full GIF animation is encoded as a video track in the MP4. Every frame is preserved.',
    },
    {
      q: 'What does the loop option do?',
      a: 'Play once produces a video that plays through and stops. Play twice duplicates the animation so it runs through two complete cycles. Loop (30 seconds) repeats the GIF until the video reaches 30 seconds — useful for background videos and screensavers.',
    },
    {
      q: 'Is there audio in the output?',
      a: 'No. GIF files contain no audio, so the MP4 output is a silent video with no audio track.',
    },
    {
      q: 'Can I convert 1,000 GIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each in your browser using ffmpeg.wasm — no uploads, no server. Each GIF produces one MP4. Download all results as a single ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser. Your files never leave your device.',
    },
  ],

  relatedTools: ['gif-to-webp', 'gif-to-jpg', 'gif-to-png', 'mp4-to-mp3'],
  relatedArticles: ['batch-convert-images'],

  meta: {
    title: 'GIF to MP4 Converter — ConvertYard',
    description:
      'Convert GIFs to H.264 MP4 in your browser. Up to 95% smaller files, animation preserved. Batch convert 1,000 GIFs at once — no uploads, no account.',
  },
}
