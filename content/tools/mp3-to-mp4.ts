import { mp3ToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 200 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'mp3-to-mp4',
  title: 'MP3 to MP4 Converter',
  subtitle: 'Wrap audio in an MP4 with album art or waveform. Ready for YouTube. Stays in your browser.',
  bestFor: 'Best for uploading podcast episodes, music tracks, or audiobooks to YouTube or platforms that only accept video files.',
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'],
  acceptsExt: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
  outputExt: '.mp4',
  convertFn: mp3ToMp4,
  enablePresets: true,

  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large audio files may take several minutes to process. For best results, use files under 200MB.'
      : null
  },

  options: [
    {
      type: 'radio',
      name: 'bgType',
      label: 'Background',
      choices: [
        { value: 'black', label: 'Black screen' },
        { value: 'color', label: 'Custom color' },
        { value: 'image', label: 'Upload image' },
      ],
      default: 'black',
      hint: 'Choose what fills the video frame. Upload album art or a thumbnail for best results.',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#1a1a2e',
      dependsOn: { name: 'bgType', value: 'color' },
    },
    {
      type: 'image-upload',
      name: 'bgImage',
      label: 'Background image',
      default: null,
      hint: 'JPG, PNG, or WebP. Will be scaled to fit the selected resolution.',
      dependsOn: { name: 'bgType', value: 'image' },
    },
    {
      type: 'radio',
      name: 'waveform',
      label: 'Waveform',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'bar', label: 'Bar waveform' },
        { value: 'line', label: 'Line waveform' },
      ],
      default: 'none',
      hint: 'Animated white waveform overlaid on the background. "None" produces a static video.',
    },
    {
      type: 'radio',
      name: 'resolution',
      label: 'Resolution',
      choices: [
        { value: '720p', label: '720p (1280×720)' },
        { value: '1080p', label: '1080p (1920×1080)' },
      ],
      default: '720p',
    },
  ],

  faq: [
    {
      q: 'Why would I convert an MP3 to MP4?',
      a: 'Many platforms — YouTube, Instagram, TikTok, Facebook — require a video file for uploads. An MP4 with a static image and your audio track satisfies their requirements without any visible change to the listening experience. It\'s the standard approach for uploading podcast episodes, music tracks, and audiobooks to video platforms.',
    },
    {
      q: 'What does the video track look like?',
      a: 'Your choice: a solid black screen (default, smallest file), a custom color, or a static JPG/PNG image you upload — like album art or a thumbnail. You can also add an animated white waveform over any of these backgrounds. For music and podcasts on YouTube, a static image with no waveform is the most common approach.',
    },
    {
      q: 'How large will the output MP4 be?',
      a: 'Static-background MP4s are very small. A 1-hour MP3 with a black background at 720p is typically 80–100 MB. The audio track (AAC at 192 kbps) makes up almost all of the file size — the static video track compresses to almost nothing with libx264. Waveform animations will produce larger files since the video content changes every frame.',
    },
    {
      q: 'Does audio quality change during conversion?',
      a: 'The audio is re-encoded from MP3 to AAC at 192 kbps. AAC at 192 kbps is perceptually transparent — most listeners cannot distinguish it from the MP3 original on normal speakers or headphones. If your source is already high quality (256+ kbps MP3), the output will sound indistinguishable.',
    },
    {
      q: 'Are my files uploaded to any server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm — a full port of FFmpeg compiled to WebAssembly. Your audio and image files never leave your device. ConvertYard\'s servers only deliver the page\'s code and the ~25 MB WASM engine on first load.',
    },
    {
      q: 'Can I convert multiple audio files at once?',
      a: 'Yes. Drop as many files as you need. Each one is converted in sequence using the same background and waveform settings, and all outputs are bundled into a single ZIP for download. There is no hard file count limit.',
    },
    {
      q: 'How do I use my own album art or thumbnail?',
      a: 'Set Background to "Upload image," then pick your JPG or PNG. The image is scaled to fill the selected resolution (720p or 1080p). Use a square image for music (standard album art) or a 16:9 image for YouTube thumbnails — the converter will scale and letterbox if dimensions don\'t match exactly.',
    },
    {
      q: 'What are the waveform options and when should I use them?',
      a: 'Bar waveform (mode=p2p) shows amplitude peaks as bars — a clean, energetic look common in music visualizers. Line waveform draws the raw audio waveform as a continuous line — subtler, better for spoken word or podcasts. Both are animated in sync with the audio. For most YouTube uploads, a static background with no waveform loads faster and looks just as professional.',
    },
  ],

  relatedTools: ['mp4-to-mp3'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4'],

  meta: {
    title: 'MP3 to MP4 Converter — ConvertYard',
    description:
      'Convert MP3 to MP4 in your browser — add a black screen, custom color, or album art. Batch convert audio files, no uploads, no account needed.',
  },
}
