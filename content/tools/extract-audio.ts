import { extractAudio } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'extract-audio',
  title: 'Extract Audio from Video',
  subtitle: 'Local-first audio extraction. Built for batches.',
  category: 'video-audio',
  accepts: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-ms-wmv',
    'video/mp2t',
  ],
  acceptsExt: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.wmv', '.ts'],
  outputExt: '',
  convertFn: extractAudio,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'dropdown',
      name: 'format',
      label: 'Output format',
      choices: [
        { value: 'mp3',  label: 'MP3 — Most compatible' },
        { value: 'aac',  label: 'AAC / M4A — Apple & modern players' },
        { value: 'wav',  label: 'WAV — Lossless, large files' },
        { value: 'ogg',  label: 'OGG Vorbis — Open source' },
        { value: 'flac', label: 'FLAC — Lossless, compressed' },
      ],
      default: 'mp3',
      hint: 'MP3 plays everywhere. AAC/M4A is the default on Apple devices. WAV and FLAC are lossless — no quality loss, but larger files.',
    },
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
      default: '192',
      hint: 'Applies to MP3, AAC, and OGG. WAV and FLAC are lossless and ignore this setting.',
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
      q: 'Are my video files uploaded to a server?',
      a: "Never. All processing runs in your browser using ffmpeg.wasm — a full media processing engine compiled to WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool code — they never see your files.",
    },
    {
      q: 'Which video formats are supported?',
      a: 'MP4, MOV, WebM, AVI, MKV, WMV, and TS. These cover the vast majority of video files you will encounter. If your format is not listed, try renaming it to .mp4 — most common containers work.',
    },
    {
      q: 'Which audio formats can I extract to?',
      a: 'MP3, AAC/M4A, WAV, OGG Vorbis, and FLAC. MP3 plays on every device and is the default. AAC/M4A is the native format on Apple devices and sounds better than MP3 at the same bitrate. WAV and FLAC are lossless — they preserve every detail but produce larger files.',
    },
    {
      q: 'What is the difference between lossless and lossy audio?',
      a: 'Lossy formats (MP3, AAC, OGG) discard audio data the ear typically cannot hear, producing smaller files. Lossless formats (WAV, FLAC) keep every sample exactly as recorded. For listening, 192 kbps MP3 or AAC is transparent to most ears. Use WAV or FLAC when you need to re-edit or archive the audio without any generation loss.',
    },
    {
      q: 'Can I extract audio from multiple videos at once?',
      a: 'Yes. Drop as many files as you need — there is no hard file count limit, though very large batches will take proportionally longer. ConvertYard processes them one at a time in your browser and packages the results in a single ZIP file.',
    },
    {
      q: 'I got an error saying "no audio track." What does that mean?',
      a: 'Some video files — screen recordings, silent clips, or certain converted files — contain a video track but no audio track. Extract Audio cannot produce audio from a file that has none. Open the original video in a media player: if there is no sound when you play it, there is nothing to extract.',
    },
  ],
  relatedTools: ['mp4-to-mp3', 'compress-video', 'mp3-to-mp4', 'video-to-gif'],
  relatedArticles: ['extract-audio-from-mp4', 'audio-bitrate-explained', 'browser-video-editing-2026'],
  meta: {
    title: 'Extract Audio from Video — ConvertYard',
    description:
      'Extract audio from MP4, MOV, MKV, AVI, and more in your browser. Batch convert up to 1,000 videos to MP3, AAC, WAV, OGG, or FLAC — no uploads.',
  },
}
