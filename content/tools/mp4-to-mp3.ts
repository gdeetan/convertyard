import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

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
  enablePresets: true,
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
      a: 'Yes, but at 128 kbps and above, the difference is inaudible for most listeners on most speakers and headphones. MP3 is a lossy format — it discards audio data the ear typically cannot hear. At 128 kbps, speech and podcasts are indistinguishable from the original. For music, 192–256 kbps is where most people stop hearing a difference. Use 320 kbps if you plan to re-edit the audio later, since re-encoding a lossy file degrades quality.',
    },
    {
      q: 'How large will the MP3 be compared to my MP4?',
      a: 'MP3 files are almost always much smaller than the source MP4 — video makes up most of the file size. A rough estimate: a 128 kbps MP3 uses about 1 MB per minute of audio. So a 30-minute video that was 500 MB as an MP4 might produce a 4 MB MP3. Actual results depend on the bitrate you choose and the original audio track.',
    },
    {
      q: 'Why does MP4 to MP3 take longer than image conversion?',
      a: 'Video conversion requires decoding a video container, extracting the audio stream, and re-encoding it as MP3 — all using a full media-processing engine (ffmpeg.wasm) that runs in your browser. That engine is about 25 MB and takes a moment to load on first use. After that, it is cached and subsequent conversions start immediately. Audio extraction itself is real-time or faster for most files.',
    },
    {
      q: 'Can I convert WebM or MOV files too?',
      a: 'Yes. This tool accepts MP4, WebM, and MOV — the three most common video formats. Drop any of them and the audio track will be extracted and saved as MP3. The video stream is discarded entirely.',
    },
    {
      q: 'What can go wrong when extracting audio from an MP4?',
      a: 'If the video has no audio track (muted screen recording, silent clip), the conversion will produce an empty or near-empty MP3. Videos over 500 MB can also be slow to process in the browser — for very long files, expect several minutes of processing time. If you get a corrupt output, the source file may have an unusual audio codec that ffmpeg.wasm cannot decode.',
    },
    {
      q: 'Do my video files leave my device when I use this tool?',
      a: 'No. Conversion runs entirely in your browser using ffmpeg.wasm — your video files never leave your device. ConvertYard\'s servers only deliver the tool code. They never see your files, filenames, or audio content.',
    },
  ],

  relatedTools: ['compress-mp3', 'mp3-to-mp4'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],

  meta: {
    title: 'MP4 to MP3 Converter — ConvertYard',
    description:
      'Pull the audio from an MP4 and save it as MP3. Choose bitrate up to 320 kbps. Batch multiple videos in your browser — nothing is uploaded. Audio only.',
  },
}
