import { mp3ToMp4 } from '@/lib/converters/ffmpeg'
import { Mp3ToMp4Explainer } from '@/components/mp3-to-mp4/explainer'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 200 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'mp3-to-mp4',
  title: 'MP3 to MP4 Converter',
  subtitle: 'Convert an MP3 file (or .WAV, .OGG, .FLAC) to an MP4 so you can upload it on platforms like YouTube, Instagram, or TikTok. Choose a cover image, add a waveform, or add captions as visual aids. Everything runs in your browser, and nothing is uploaded to a server.',
  bestFor: 'Best for uploading podcast episodes, music tracks, audiobooks, and short-form video (Shorts/Reels/TikTok) to YouTube, Instagram, or any platform that only accepts video files.',
  explainer: Mp3ToMp4Explainer,
  category: 'video-audio',
  accepts: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'],
  acceptsExt: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
  outputExt: '.mp4',
  convertFn: mp3ToMp4,
  enablePresets: true,

  howItWorks: [
    { label: 'Drop your files', desc: 'Drop/drop or click to browse to open MP3 files. Convert up to 1,000 files per batch. But if you’re working with larger files, cut that down to batches of 50 or less. It will work better on desktops, smartphones, or tablets with more available memory.' },
    { label: 'Choose settings', desc: 'Adjust quality, format, and other options to match your needs.' },
    { label: 'Click Convert', desc: 'Everything runs in your browser via WebAssembly. MP3 to MP4 Converter happens locally — no server involved.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],

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
      a: 'One reason is compatibility. If you’re uploading a podcast, webinar, audiobook, or music in MP3 format, platforms like YouTube, TikTok, and Facebook will not accept it since these websites require files in MP4 format. This is where this converter comes into play. You cannot only convert the format, but also add captions, a cover image, and waveforms.',
    },
    {
      q: 'Can I add captions to my MP3?',
      a: 'Yes, you can add captions but turning on the “Burn in auto captions” which tells the tool to transcribe the audio locally using the “Whisper tiny.en speech model.” It’s around 40 MB and has to load in the browser to work, but once it does, it stays there, and subsequent conversions will be faster. Take note that turning this feature on lengthens the time it takes to convert the file.',
    },
    {
      q: 'How accurate are the captions?',
      a: 'The “Whisper tiny.en” engine is capable of handling clear talking head videos like podcasts and voiceovers. However, the accuracy will drop if the speaker has a heavy accent or the video has loud background music or other audio noise. Always check the output of the downloaded file before uploading.',
    },
    {
      q: 'Which aspect ratios does this support?',
      a: 'This converter supports 16:9 (for YouTube), 9:16 (for YouTube Shorts, Reels, and TikTok), and 1:1 (for Instagram feed), and 4:5 (for Instagram portrait mode). You can also choose between 720p and 1080p.',
    },
    {
      q: 'Can I trim the audio before converting?',
      a: 'Yes, you can set the start and end trim in hh:mm:ss format. Leaving it at 00:00:00 means nothing will be trimmed from the video. If you enter anything on this field, it will be applied to all the MP3 files on the batch. So if you need trim points at the start or end of the video, you’ll need to convert them separately.',
    },
    {
      q: 'What does the video track look like?',
      a: 'There are several options. The default is a solid black screen that outputs the smallest file. Another option is choosing a custom color or a static JPG/PNG file if you’d like to upload a graphic cover. There’s also an option to add an animated waveform over these backgrounds.',
    },
    {
      q: 'How large will the output MP4 be?',
      a: 'That would depend on what options you select. An MP4 file with a custom background, captions, or waveforms will be around 10 to 20% larger than a plain MP4 file with a black background and nothing else.',
    },
    {
      q: 'Does audio quality change during conversion?',
      a: 'The audio is re-encoded from MP3 to AAC at 192 kbps, and for most use cases, listeners won’t be able to distinguish it from the original MP3 on normal speakers or headphones.',
    },
    {
      q: 'Are my files uploaded to any server?',
      a: 'Nope. The MP3 to MP4 conversion is done in your browser using a combination of ffmpeg.wasm and Whisper via @huggingface/transformers for captions. The audio files don’t leave your computer.',
    },
    {
      q: 'Can I convert multiple audio files at once?',
      a: 'Technically, you can convert batches of up to 1,000, but for long-form podcasts you should reduce that to around 30 to 50 per batch. If you turn on the captions or waveforms, the conversion will take longer, so I’d say do one or two per batch just so your computer doesn’t freeze.',
    },
    {
      q: 'How do I use my own album art or thumbnail?',
      a: 'You can add a custom background by setting the background setting to “Upload image,” then choosing a JPG, PNG, or WebP cover image. The image is then scaled to fit the aspect ratio you selected, but if the image doesn’t fit the aspect ratio, the gap will be filled by a blurred version of the cover image. If that makes sense.',
    },
    {
      q: 'What are the waveform options and when should I use them?',
      a: 'A bar waveform shows amplitude peaks as bars, something common in music visualizers, while a line waveform draws the audio waveform as a continuous line, a more subtle look (better for talking head videos). If you add captions, the waveform moves above them so the captions stay at the bottom.',
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
