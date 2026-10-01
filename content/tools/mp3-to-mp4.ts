import { mp3ToMp4 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 200 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'mp3-to-mp4',
  title: 'MP3 to MP4 Converter',
  subtitle: 'Wrap audio in an MP4 with captions, album art, or waveform. Ready for YouTube, Shorts, Reels, TikTok. Stays in your browser.',
  bestFor: 'Best for uploading podcast episodes, music tracks, audiobooks, and short-form video (Shorts/Reels/TikTok) to YouTube, Instagram, or any platform that only accepts video files.',
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'],
  acceptsExt: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
  outputExt: '.mp4',
  convertFn: mp3ToMp4,
  enablePresets: true,

  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large audio files may take several minutes to process. For best results, use files under 200MB. If captions are on, generation is slower on files longer than ~30 min.'
      : null
  },

  options: [
    {
      type: 'radio',
      name: 'aspect',
      label: 'Aspect ratio',
      choices: [
        { value: '16:9', label: '16:9 (YouTube)' },
        { value: '9:16', label: '9:16 (Shorts, Reels, TikTok)' },
        { value: '1:1',  label: '1:1 (Instagram feed)' },
        { value: '4:5',  label: '4:5 (Instagram portrait)' },
      ],
      default: '16:9',
    },
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
      hint: "Choose what fills the video frame. Upload album art or a thumbnail for best results. When your image's aspect ratio doesn't match the output, a blurred fill is added behind it.",
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
      hint: 'JPG, PNG, or WebP. Scaled to fit the selected aspect ratio with a blur backdrop when needed.',
      dependsOn: { name: 'bgType', value: 'image' },
    },
    {
      type: 'radio',
      name: 'waveform',
      label: 'Waveform',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'bar',  label: 'Bar waveform' },
        { value: 'line', label: 'Line waveform' },
      ],
      default: 'none',
      hint: 'Animated white waveform overlaid on the background. With captions on, the waveform anchors to the top so captions have room at the bottom.',
    },
    {
      type: 'radio',
      name: 'resolution',
      label: 'Resolution',
      choices: [
        { value: '720p',  label: '720p' },
        { value: '1080p', label: '1080p' },
      ],
      default: '720p',
      hint: 'Dimensions are derived from the aspect ratio (e.g. 9:16 at 1080p = 1080×1920).',
    },
    {
      type: 'time',
      name: 'trimStart',
      label: 'Trim start',
      default: '00:00:00',
      hint: 'hh:mm:ss. Leave at 00:00:00 to start at the beginning.',
    },
    {
      type: 'time',
      name: 'trimEnd',
      label: 'Trim end',
      default: '00:00:00',
      hint: 'hh:mm:ss. Leave at 00:00:00 to use the full file length.',
    },
    {
      type: 'toggle',
      name: 'captions',
      label: 'Burn in auto captions (English)',
      default: false,
      hint: 'Generates captions locally with Whisper tiny.en. One-time ~40 MB model download on first use. Nothing is uploaded.',
    },
  ],

  faq: [
    {
      q: 'Why would I convert an MP3 to MP4?',
      a: 'Many platforms — YouTube, Instagram, TikTok, Facebook — require a video file for uploads. An MP4 with a static image and your audio track satisfies their requirements without any visible change to the listening experience. It\'s the standard approach for uploading podcast episodes, music tracks, and audiobooks to video platforms.',
    },
    {
      q: 'Can I add captions to my MP3?',
      a: 'Yes. Toggle "Burn in auto captions" and the tool transcribes your audio locally using Whisper tiny.en — a ~40 MB English speech model that downloads once and caches in your browser. Nothing is uploaded. Captions are rendered in a clean white-on-black style and burned into the video so they display on every platform.',
    },
    {
      q: 'How accurate are the captions?',
      a: 'Whisper tiny.en is strong for clear speech such as podcasts and voiceovers. Accuracy drops with heavy accents, background music, or overlapping speakers. Review the output before publishing. For higher accuracy, our dedicated captions tool offers larger models.',
    },
    {
      q: 'Which aspect ratios does this support?',
      a: '16:9 for YouTube, 9:16 for Shorts, Reels, and TikTok, 1:1 for Instagram feed, and 4:5 for Instagram portrait. Pick one and the resolution dropdown gives you 720p or 1080p dimensions sized to that aspect.',
    },
    {
      q: 'Can I trim the audio before converting?',
      a: 'Yes. Set a trim start and trim end in hh:mm:ss and only that range becomes the MP4. Leaving a field at 00:00:00 means "no trim" on that side. The same trim applies to every file in a batch.',
    },
    {
      q: 'What does the video track look like?',
      a: 'Your choice: a solid black screen (default, smallest file), a custom color, or a static JPG/PNG image you upload — like album art or a thumbnail. You can also add an animated white waveform over any of these backgrounds. If your image doesn\'t match the output aspect ratio, the empty area is filled with a blurred version of the image for a modern Reels/TikTok look.',
    },
    {
      q: 'How large will the output MP4 be?',
      a: 'Static-background MP4s are very small. A 1-hour MP3 with a black background at 720p is typically 80–100 MB. The audio track (AAC at 192 kbps) makes up almost all of the file size. Waveform animations and burned-in captions produce larger files since the video content changes every frame.',
    },
    {
      q: 'Does audio quality change during conversion?',
      a: 'The audio is re-encoded from MP3 to AAC at 192 kbps. AAC at 192 kbps is perceptually transparent — most listeners cannot distinguish it from the MP3 original on normal speakers or headphones.',
    },
    {
      q: 'Are my files uploaded to any server?',
      a: 'Never. Conversion runs entirely in your browser using ffmpeg.wasm and (for captions) Whisper via @huggingface/transformers. Your audio and image files never leave your device. ConvertYard\'s servers only deliver the page\'s code and the ~25 MB ffmpeg engine plus the one-time ~40 MB captions model on first use.',
    },
    {
      q: 'Can I convert multiple audio files at once?',
      a: 'Yes. Drop as many files as you need. Each one is converted in sequence using the same aspect, background, waveform, trim, and captions settings, and all outputs are bundled into a single ZIP for download.',
    },
    {
      q: 'How do I use my own album art or thumbnail?',
      a: 'Set Background to "Upload image," then pick your JPG, PNG, or WebP. The image is scaled to fit the chosen aspect ratio. If the image doesn\'t match that aspect, a blurred version fills the empty space behind it.',
    },
    {
      q: 'What are the waveform options and when should I use them?',
      a: 'Bar waveform (mode=p2p) shows amplitude peaks as bars — a clean, energetic look common in music visualizers. Line waveform draws the raw audio waveform as a continuous line — subtler, better for spoken word. Both are animated in sync with the audio. With captions on, the waveform moves to the top of the frame so captions sit cleanly at the bottom.',
    },
  ],

  relatedTools: ['compress-mp3', 'mp4-to-mp3'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4'],

  meta: {
    title: 'MP3 to MP4 — Captions, Aspect Ratios, Trim — ConvertYard',
    description:
      'Turn MP3 into MP4 with auto captions, trim, and aspect ratios for YouTube, Shorts, Reels, TikTok. Batch convert in your browser — files never leave your device.',
  },
}
