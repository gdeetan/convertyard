// This config is used for meta/FAQ/relatedTools only.
// The page uses a custom UI (not ToolShell) — see app/(tools)/transcription/page.tsx.
import type { ToolConfig } from '@/lib/types'

// Placeholder convertFn — never called (custom page handles inference directly)
const noop = async (): Promise<never[]> => []

export const config: ToolConfig = {
  slug: 'transcription',
  title: 'Transcribe Audio & Video',
  subtitle:
    'Powered by OpenAI Whisper, running entirely in your browser. 50+ languages.',
  category: 'ai',
  accepts: [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'audio/x-m4a',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ],
  acceptsExt: ['.mp3', '.mp4', '.wav', '.ogg', '.flac', '.m4a', '.webm', '.mov'],
  outputExt: '.txt',
  convertFn: noop,

  faq: [
    {
      q: 'What languages does it support?',
      a: 'Whisper supports 50+ languages including English, Spanish, French, German, Japanese, Portuguese, Arabic, and Hindi. Select a language or leave it on Auto-detect.',
    },
    {
      q: 'How accurate is it?',
      a: 'Balanced mode (Whisper-base) achieves ~90%+ word accuracy on clear English audio. Accurate mode (Whisper-small) is noticeably better on accented speech and technical vocabulary.',
    },
    {
      q: 'Can it transcribe video files?',
      a: 'Yes. Upload MP4, WebM, or MOV files — the tool extracts the audio track automatically before transcribing.',
    },
    {
      q: 'What is the maximum file length?',
      a: 'Files up to 30 minutes are supported. For longer recordings, split them first using an audio editor.',
    },
    {
      q: 'What is the difference between TXT and SRT output?',
      a: 'TXT is plain text — the full transcript as one block. SRT is a subtitle format with timestamps, suitable for adding captions to video in any editor.',
    },
    {
      q: 'Does it work offline?',
      a: 'Yes, after the first model download. The model is cached in your browser and subsequent uses work completely offline.',
    },
  ],

  relatedTools: ['alt-text-generator', 'image-description', 'mp4-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'Transcribe Audio & Video — Free, In-Browser, No Upload — ConvertYard',
    description:
      'Browser-based Whisper transcription. MP3, MP4, WAV, and more. 50+ languages. No upload, no account. Export TXT or SRT captions.',
  },
}
