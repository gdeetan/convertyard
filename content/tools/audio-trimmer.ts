import { trimAudio } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 500 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'audio-trimmer',
  title: 'Audio Trimmer',
  subtitle: 'Trim MP3, WAV, M4A, and more with no re-encoding — cuts are instant and lossless for audio files.',
  bestFor: 'Good for removing the rambling intro off a voice memo before sending it.',
  category: 'video-audio',
  accepts: [
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-ms-wmv',
    'video/mp2t',
  ],
  acceptsExt: [
    '.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac',
    '.mp4', '.mov', '.webm', '.avi', '.mkv', '.wmv', '.ts',
  ],
  outputExt: '',
  convertFn: trimAudio,
  enablePresets: true,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files may take several minutes to process in your browser. For best results, use files under 500 MB.'
      : null
  },
  options: [
    {
      type: 'number',
      name: 'startTime',
      label: 'Start time (seconds)',
      min: 0,
      step: 1,
      default: 0,
      hint: '0 = beginning of file.',
    },
    {
      type: 'number',
      name: 'endTime',
      label: 'End time (seconds)',
      min: 0,
      step: 1,
      default: 0,
      hint: '0 = end of file. Set to trim from the start only.',
    },
    {
      type: 'dropdown',
      name: 'format',
      label: 'Output format',
      choices: [
        { value: 'keep', label: 'Keep original format' },
        { value: 'mp3',  label: 'MP3' },
        { value: 'aac',  label: 'AAC / M4A' },
        { value: 'wav',  label: 'WAV — Lossless' },
        { value: 'ogg',  label: 'OGG Vorbis' },
        { value: 'flac', label: 'FLAC — Lossless' },
      ],
      default: 'keep',
      hint: 'Keep original uses stream copy for audio files — fast and lossless. Video inputs always re-encode to AAC.',
    },
  ],
  faq: [
    {
      q: 'Can I trim multiple files at once?',
      a: 'Yes. Drop as many files as you need — there is no hard file count limit, though very large batches will take proportionally longer. ConvertYard applies the same start and end times to every file and packages the results in a single ZIP.',
    },
    {
      q: 'What does "Keep original format" do?',
      a: 'For audio files (MP3, WAV, M4A, etc.), Keep original uses stream copy — the audio data is cut without re-encoding, so there is no quality loss and trimming is near-instant. For video files (MP4, MOV, etc.), the audio track is extracted and saved as AAC, since the original video container cannot be kept when outputting audio only.',
    },
    {
      q: 'How precise are the cuts?',
      a: 'With Keep original (stream copy), cuts are made at the nearest audio frame boundary. For most formats this is within a few milliseconds. MP3 frames are about 26ms each, so MP3 stream-copy cuts may be off by up to one frame. If you need sample-accurate cuts, choose WAV or FLAC output — re-encoding gives exact start and end times.',
    },
    {
      q: 'What audio and video formats are supported?',
      a: 'Audio: MP3, M4A, WAV, OGG, FLAC, AAC. Video: MP4, MOV, WebM, AVI, MKV, WMV, TS. For video files the audio track is extracted and trimmed; the video is discarded.',
    },
    {
      q: 'What does "0 = end of file" mean for End time?',
      a: 'Leaving End time at 0 tells the trimmer to keep everything after the Start time — it trims from the start only. For example, Start = 10, End = 0 removes the first 10 seconds and keeps the rest. To cut from both ends, set both Start and End to non-zero values.',
    },
  ],
  relatedTools: ['extract-audio', 'mp4-to-mp3', 'compress-video', 'mp3-to-mp4'],
  relatedArticles: ['extract-audio-from-mp4', 'audio-bitrate-explained', 'browser-video-editing-2026'],
  meta: {
    title: 'Audio Trimmer — No Upload — ConvertYard',
    description:
      'Trim MP3, WAV, M4A, OGG, and FLAC in your browser. Set start and end times, batch trim up to 1,000 files — no uploads, no quality loss on lossless cuts.',
  },
}
