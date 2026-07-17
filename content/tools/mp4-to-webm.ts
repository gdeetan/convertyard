import { mp4ToWebm } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp4-to-webm',
  title: 'MP4 to WebM Converter',
  subtitle: 'Convert MP4 to WebM. Batch-ready, stays in your browser.',
  category: 'video-audio',
  accepts: ['video/mp4'],
  acceptsExt: ['.mp4'],
  outputExt: '.webm',
  convertFn: (files, opts, onProgress) => mp4ToWebm(files, opts, onProgress),

  options: [
    {
      type: 'dropdown',
      name: 'quality',
      label: 'Quality',
      choices: [
        { value: 'best',   label: 'Best (larger file)' },
        { value: 'better', label: 'Better (balanced)' },
        { value: 'good',   label: 'Good (smaller file)' },
      ],
      default: 'better',
      hint: 'VP9 encoding is slower than H.264. A 5-minute 1080p MP4 may take 2–5 minutes to convert.',
    },
  ],

  faq: [
    {
      q: 'Why convert MP4 to WebM?',
      a: 'WebM is the preferred video format for web delivery — it uses VP9 video and Opus audio, both open and patent-free. Chrome, Firefox, and most Android devices play WebM natively. If you\'re preparing video assets for a web application or need an open-format alternative to MP4, WebM is the target.',
    },
    {
      q: 'Why does this take longer than other conversions?',
      a: 'VP9 encoding (the video codec inside WebM) is computationally intensive — significantly slower than H.264 at equivalent quality. A 5-minute 1080p file can take 2–5 minutes in the browser. This is a VP9 limitation, not a tool limitation.',
    },
    {
      q: 'Will WebM play on iPhones?',
      a: 'No. Safari and iOS do not support WebM playback. If you need cross-device compatibility, stay with MP4. WebM is best for web applications where you control the browser environment or are targeting Chrome/Firefox users.',
    },
    {
      q: 'Can I convert multiple MP4 files at once?',
      a: 'Yes, but process them in smaller batches if the files are large — VP9 encoding is RAM-intensive and converting many large files simultaneously may exceed available memory.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly. Your files do not leave your device.',
    },
  ],

  relatedTools: ['webm-to-mp4', 'compress-video', 'mp4-to-mp3', 'video-to-gif'],
  relatedArticles: [],

  meta: {
    title: 'MP4 to WebM Converter — ConvertYard',
    description:
      'Convert MP4 to WebM in your browser. VP9 video, Opus audio — open format for web delivery. Batch convert MP4 files at once — no uploads, no account.',
  },
}
