import { mp4ToMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'mp4-to-mp3',
  title: 'MP4 to MP3 Converter',
  subtitle: 'Extract audio from MP4, WebM, or MOV. Format your video as MP3 in seconds — no software, no uploads.',
  category: 'video-audio',
  accepts: ['video/mp4', 'video/webm', 'video/quicktime'],
  acceptsExt: ['.mp4', '.webm', '.mov'],
  outputExt: '.mp3',
  convertFn: mp4ToMp3,
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
      q: 'Can I convert multiple videos at once?',
      a: 'Yes. Drop as many files as you need. ConvertYard processes them one at a time in your browser and packages all the MP3s into a single ZIP for download. There is no hard file count limit, though very large batches will take proportionally longer. Keep individual files under 500 MB for best results.',
    },
    {
      q: 'Are my video files uploaded to a server?',
      a: 'Never. Conversion runs entirely in your browser using WebAssembly — your video files never leave your device. ConvertYard\'s servers only deliver the tool\'s code. They never see your files, filenames, or audio content.',
    },
    {
      q: 'How do I switch an MP4 file to MP3?',
      a: 'Drop your MP4 into the tool above, choose a bitrate, and click Convert. The audio track is extracted and saved as an MP3 — the video is discarded. No software to install, no account needed. If you have multiple files, drop them all at once and download everything as a ZIP when done.',
    },
    {
      q: 'What does it mean to transform an MP4 into MP3?',
      a: 'Transforming an MP4 into an MP3 means stripping out the video and keeping only the audio track. MP4 is a video container — it holds both picture and sound. MP3 is audio-only. The result is a much smaller file: a 500 MB MP4 video might produce a 4 MB MP3. This tool does that extraction entirely in your browser, so nothing gets uploaded anywhere.',
    },
  ],

  relatedTools: ['video-compressor', 'extract-audio', 'trim-audio'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],

  meta: {
    title: 'MP4 to MP3 Converter — ConvertYard',
    description:
      'Convert MP4 to MP3 in your browser. Format or switch any MP4 to MP3 — choose bitrate up to 320 kbps, batch files, no uploads, no account.',
  },
}
