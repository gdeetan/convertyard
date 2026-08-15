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
    q: 'What is the One Word caption style?',
    a: 'One Word shows a single bold word at a time, centered on screen. Each word appears when it is spoken and disappears when the next word starts. Outline is the same timing with all-caps and a heavier stroke. Bar uses a dark background behind full lines. Follow keeps the line on screen and changes the color of the spoken word.',
  },
  {
    q: 'Can I add captions without re-encoding the video?',
    a: 'Yes. After you have a transcript, use “Soft captions” to mux an SRT track into the MP4. The video and audio are stream-copied — usually a few seconds — and players like YouTube, VLC, and QuickTime can turn the track on or off. Burn-in is still required for most social apps.',
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
    a: 'Yes. Click a word to jump the preview. Double-click to edit text. Select a word to split, merge, insert, or nudge its start and end times. The preview updates as you edit.',
  },
  {
    q: 'What is the difference between Follow and Classic?',
    a: 'Classic shows 1–2 lines of white text with a black shadow, like traditional subtitles. Follow keeps the current line on screen and changes the color of the word being spoken.',
  },
]

export const relatedTools = ['transcription', 'compress-video', 'mp4-to-mp3', 'video-to-gif']
export const relatedArticles: string[] = []

export const meta = {
  title: 'Add Captions to Video — ConvertYard',
  description:
    'Auto-transcribe your video with Whisper and add captions — burn them in or mux a soft subtitle track. Runs in your browser. No uploads.',
}
