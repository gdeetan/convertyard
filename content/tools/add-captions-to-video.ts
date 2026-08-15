import type { FAQItem } from '@/lib/types'

export const slug = 'add-captions-to-video'

export const faq: FAQItem[] = [
  {
    q: 'Does this upload my video to a server?',
    a: 'No. Every step runs entirely in your browser. The Whisper transcription model downloads once to your device and runs locally. The ffmpeg caption burn happens in-browser via WebAssembly. Your video never leaves your computer.',
  },
  {
    q: 'How accurate is the auto-transcription?',
    a: 'Set the spoken language before transcribing — that is the biggest accuracy win. Fast uses Whisper Tiny (~40 MB), Balanced uses Base (~74 MB), and Accurate uses Small (~244 MB). All three still stumble on names, jargon, accents, and noise. Review the transcript, or import an SRT/VTT you already trust.',
  },
  {
    q: 'Can I import or export SRT and VTT?',
    a: 'Yes. After you drop a video you can import an existing SRT or VTT and skip Whisper entirely. After editing you can download SRT or VTT without burning captions into the file — useful for YouTube and players that read sidecar subtitles.',
  },
  {
    q: 'What is the Mr. Beast caption style?',
    a: 'The Mr. Beast style shows one word at a time, centered on screen, in large bold text. Each word appears exactly when it is spoken and disappears when the next word starts. This style is popular on YouTube Shorts and TikTok for high-energy, easy-to-read captions.',
  },
  {
    q: 'Can I use my own font?',
    a: 'Yes — two ways. You can upload a .ttf or .otf font file, or on Chrome and Edge you can click "Your computer" to browse your installed fonts. The selected font is used for both the preview and the burned-in output.',
  },
  {
    q: 'What video formats are supported?',
    a: 'Input: MP4, MOV, WebM, AVI, MKV. Output is always MP4. The burned-in captions are permanently part of the video — no separate subtitle file needed.',
  },
  {
    q: 'How long does captioning take?',
    a: 'Two steps: transcription (typically 2–5× real-time, so a 2-minute video takes ~1 minute) and burning (1–4× real-time depending on your device). Longer videos and slower devices take more time. Keep the tab open while processing.',
  },
  {
    q: 'Can I edit the transcript before burning?',
    a: 'Yes. After transcription, every word appears in the transcript panel. Click any word to edit it inline. Delete a word by clearing its text. The video preview updates in real time as you make changes.',
  },
  {
    q: 'What is the difference between karaoke and classic styles?',
    a: 'Classic shows 1–2 lines of text at a time, white with a black shadow, in the style of traditional subtitles. Karaoke shows the full current line and highlights the word being spoken in a different color as it plays — similar to sing-along captions.',
  },
]

export const relatedTools = ['compress-video', 'mp4-to-mp3', 'video-to-gif', 'merge-video']
export const relatedArticles: string[] = []

export const meta = {
  title: 'Add Captions to Video — ConvertYard',
  description:
    'Auto-transcribe your video with Whisper AI and burn in styled captions — Mr. Beast, TikTok, Netflix, or classic. Runs entirely in your browser. No uploads.',
}
