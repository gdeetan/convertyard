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
  bestFor: 'Best for transcribing interviews, meeting recordings, or video captions without uploading audio to a cloud service.',
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
      q: 'Is my audio uploaded to transcribe it?',
      a: 'No. Whisper runs locally in your browser via transformers.js — your audio files are never sent to a server. The model downloads once on first use and is cached in your browser for all future sessions.',
    },
    {
      q: 'How accurate is the transcription?',
      a: 'Balanced mode (Whisper-base) achieves ~90%+ word accuracy on clear, accent-neutral English speech. Accurate mode (Whisper-small) is noticeably better for accented speech and technical vocabulary. List names and jargon in Names & terms to lock those spellings. Both models still struggle with heavy background noise and overlapping speakers.',
    },
    {
      q: 'Can I lock names and technical terms?',
      a: 'Yes. Add them in Names & terms before you transcribe — comma or new line. The list stays in your browser. It hints Whisper while decoding and then corrects leftover misspellings in the finished text. It cannot invent words that were never spoken.',
    },
    {
      q: 'What languages does it support?',
      a: 'Whisper supports 50+ languages including English, Spanish, French, German, Japanese, Portuguese, Arabic, and Hindi. Select a language manually or leave it on Auto-detect for automatic language identification.',
    },
    {
      q: 'Can it transcribe video files?',
      a: 'Yes. Upload MP4, WebM, or MOV files — the tool extracts the audio track in-browser before transcribing. The video itself is never sent anywhere.',
    },
    {
      q: 'What is the difference between TXT and SRT output?',
      a: 'TXT is plain text — the full transcript as one continuous block. SRT is a subtitle format with timestamps for each segment, suitable for adding captions to video in any editor (DaVinci Resolve, Premiere, CapCut, etc.).',
    },
    {
      q: 'What is the maximum recording length?',
      a: 'Files up to 30 minutes are supported. For longer recordings, split them into segments first using an audio or video editor, then transcribe each segment.',
    },
  ],

  relatedTools: ['alt-text-generator', 'image-description', 'mp4-to-mp3'],
  relatedArticles: [],

  meta: {
    title: 'Transcribe Audio and Video — ConvertYard',
    description:
      'Browser-based Whisper transcription. MP3, MP4, WAV, and more. 50+ languages. No upload, no account. Export TXT or SRT captions.',
  },
}
