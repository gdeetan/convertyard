import { mp4ToWebm } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'mp4-to-webm',
  title: 'MP4 to WebM Converter',
  subtitle: 'Convert MP4 to open-format WebM for HTML5 video and web apps.',
  bestFor: 'Best for web developers embedding video that needs to avoid H.264 licensing.',
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
      q: 'MP4 to WebM vs staying with MP4 — when does WebM win?',
      a: 'WebM wins when you need a patent-free format for an HTML5 `<video>` tag, when you\'re deploying to a Linux environment that avoids H.264 licensing, or when you want to pair VP9\'s compression efficiency with Opus audio for web streaming. If your audience includes iOS Safari users, serve MP4 as a fallback.',
    },
    {
      q: 'What can go wrong when converting MP4 to WebM?',
      a: 'The conversion requires full VP9 re-encoding, so large or long files can take many minutes and are RAM-intensive in the browser. Converting very large batches simultaneously may cause the browser tab to crash. Process 3–5 large files at a time to stay within memory limits.',
    },
    {
      q: 'Do my MP4 files leave my device during conversion?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm. Your video files never leave your device — the server only delivers the tool code.',
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
