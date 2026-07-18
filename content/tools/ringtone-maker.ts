import { makeRingtone } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'ringtone-maker',
  title: 'Ringtone Maker',
  subtitle: 'Cut any song to an iPhone ringtone (.m4r). No uploads, no software.',
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
  ],
  acceptsExt: ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.mov'],
  outputExt: '.m4r',
  convertFn: makeRingtone,
  options: [
    {
      type: 'number',
      name: 'startTime',
      label: 'Start time (seconds)',
      min: 0,
      step: 0.1,
      default: 0,
      hint: 'Where in the song to start the ringtone.',
    },
    {
      type: 'number',
      name: 'endTime',
      label: 'End time (seconds)',
      min: 0,
      step: 0.1,
      default: 30,
      hint: 'Apple limits ringtones to 40 seconds. End time is capped at start + 40.',
    },
  ],
  faq: [
    {
      q: 'Are my files uploaded to a server?',
      a: "Never. All processing runs in your browser using ffmpeg.wasm. Your files never leave your device.",
    },
    {
      q: 'How do I get the .m4r file onto my iPhone?',
      a: 'AirDrop the .m4r file to your iPhone — iOS will offer to add it as a ringtone automatically. Alternatively, sync it via Finder (macOS) or iTunes (Windows): drag the file to your library, right-click → Get Info → set Media Kind to Ringtone, then sync.',
    },
    {
      q: 'Why is there a 40-second limit?',
      a: "Apple's iOS enforces a maximum ringtone length of 40 seconds. The tool automatically caps the duration even if you enter a longer end time.",
    },
    {
      q: 'What audio formats can I use as the source?',
      a: 'MP3, M4A, WAV, OGG, FLAC, AAC, and audio from MP4 or MOV video files. The output is always .m4r (AAC audio in an MP4 container).',
    },
    {
      q: 'Can I make ringtones from a video file?',
      a: 'Yes. Drop an MP4 or MOV file — the tool extracts the audio and converts it to .m4r. Only the audio track is used; the video is discarded.',
    },
  ],
  relatedTools: ['audio-trimmer', 'm4a-to-mp3', 'extract-audio', 'audio-speed'],
  relatedArticles: [],
  meta: {
    title: 'Ringtone Maker — Make iPhone Ringtones (.m4r) — ConvertYard',
    description:
      'Cut any MP3, M4A, or WAV to an iPhone ringtone (.m4r) in your browser. Set start and end times, download instantly — no uploads, no software.',
  },
}
