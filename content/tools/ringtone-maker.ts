import { makeRingtone } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'ringtone-maker',
  title: 'Ringtone Maker',
  subtitle: 'Cut any song to an iPhone ringtone (.m4r). No uploads, no software.',
  bestFor: 'Best for anyone who wants a custom ringtone from a song on their computer.',
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
  enablePresets: true,
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
      q: 'What makes an iPhone ringtone different from a regular audio file?',
      a: 'iPhone ringtones must be in the M4R format — AAC audio inside an MP4 container with the .m4r extension. iOS will not recognize a standard MP3 or M4A file as a ringtone. The file must also be 40 seconds or shorter. This tool outputs .m4r directly, sized and formatted for iOS.',
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
      q: 'What can go wrong when making a ringtone?',
      a: 'The .m4r file transfers to iPhone via AirDrop or Finder sync — it cannot be used by simply copying the file to a folder on iOS. If AirDrop doesn\'t offer to install it as a ringtone, make sure the file has the .m4r extension (not .m4a or .mp3). Also, third-party ringtone apps are not required — iOS handles .m4r natively if you use Finder or iTunes to sync.',
    },
    {
      q: 'Do my audio files leave my device when I use this tool?',
      a: 'No. Ringtone creation runs entirely in your browser using ffmpeg.wasm. Your audio files never leave your device.',
    },
  ],
  relatedTools: ['audio-trimmer', 'm4a-to-mp3', 'extract-audio', 'audio-speed'],
  relatedArticles: [],
  meta: {
    title: 'Make an iPhone Ringtone — ConvertYard',
    description:
      'Cut any MP3, M4A, or WAV to an iPhone ringtone (.m4r) in your browser. Set start and end times, download instantly — no uploads, no software.',
  },
}
