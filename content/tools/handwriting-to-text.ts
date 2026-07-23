import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'handwriting-to-text',
  title: 'Handwriting to Text Converter',
  subtitle: 'Transcribe handwritten notes and forms into digital text.',
  bestFor: 'Best for digitizing handwritten notes, filled forms, and letters you need to search or edit.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
  enablePresets: true,
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'AI-Enhanced mode significantly improves cursive accuracy',
    body: 'Standard mode uses Tesseract OCR with image preprocessing — best for printed-style handwriting in all 12 languages. AI-Enhanced mode uses Florence-2 (full-page) then falls back to TrOCR (line-by-line) for higher accuracy on cursive and decorated backgrounds — English only, downloads ~262MB once (shared with the Image Description tool). For English output, "Fix common OCR errors" applies a dictionary pass to catch classic mistakes like rn→m or O→0 — only low-confidence words are touched, shown in the review panel so you can revert before downloading.',
  },

  options: [
    {
      type: 'radio',
      name: 'recognitionEngine',
      label: 'Recognition engine',
      choices: [
        { value: 'standard', label: 'Standard — all languages, no download' },
        { value: 'ai-enhanced', label: 'AI-Enhanced — English only, ~262MB (may be cached)' },
      ],
      default: 'standard',
      conditionalHints: {
        standard: 'Tesseract OCR with image preprocessing. Works with all 12 languages. Best for printed-style or neat handwriting.',
        'ai-enhanced': 'Florence-2 + TrOCR: processes the full page at once (no line segmentation), handling decorated backgrounds and complex layouts. Falls back to TrOCR line-by-line for images Florence-2 misses. Downloads ~262MB on first use — shared with the Image Description tool so may already be cached.',
      },
    },
    {
      type: 'radio',
      name: 'handwritingStyle',
      label: 'Handwriting style',
      choices: [
        { value: 'mixed', label: 'Mixed / unknown' },
        { value: 'print', label: 'Print / block letters' },
        { value: 'cursive', label: 'Cursive / joined script' },
      ],
      default: 'mixed',
      conditionalHints: {
        mixed: 'Auto-detects layout. Best default choice for most documents.',
        print: 'Optimises segmentation for separate, upright letters.',
        cursive: 'Optimises segmentation for flowing, joined script.',
      },
    },
    {
      type: 'radio',
      name: 'qualityMode',
      label: 'AI accuracy mode',
      choices: [
        { value: 'quality', label: 'Quality — beam search, slower' },
        { value: 'fast', label: 'Fast — greedy, quicker' },
      ],
      default: 'quality',
      dependsOn: { name: 'recognitionEngine', value: 'ai-enhanced' },
      conditionalHints: {
        quality: 'Evaluates 4 candidate readings per word — catches ambiguous letter pairs (a/o, l/1, u/n, m/n). Adds ~3× processing time per line. AI-Enhanced mode only.',
        fast: 'Single greedy pass — 1–2s per line. Use when speed matters more than accuracy. AI-Enhanced mode only.',
      },
    },
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Choose the language of the handwriting. Standard engine only — AI-Enhanced uses English.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'hin', label: 'Hindi' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'ara', label: 'Arabic' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
        { value: 'rus', label: 'Russian' },
        { value: 'ita', label: 'Italian' },
      ],
      default: 'eng',
    },
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output format',
      choices: [
        { value: 'text', label: 'Plain text (.txt)' },
        { value: 'json', label: 'JSON with confidence (.json)' },
        { value: 'combined', label: 'Combined single file' },
      ],
      default: 'text',
      conditionalHints: {
        text: 'One .txt file per image.',
        json: 'JSON output with per-line text and a quality flag. Short or empty lines are automatically flagged for review.',
        combined: 'All images merged into one .txt file.',
      },
    },
    {
      type: 'toggle' as const,
      name: 'autoCorrect',
      label: 'Fix common OCR errors',
      hint: 'English only. Fixes classic OCR mistakes (rn→m, O→0, etc.) using a dictionary. Only touches low-confidence words — everything is revertible in the review panel.',
      default: true,
      dependsOn: { name: 'language', value: 'eng' },
    },
  ],

  faq: [
    {
      q: 'Are my handwritten notes uploaded anywhere to run OCR?',
      a: 'No. All OCR — including the AI-Enhanced model — runs entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'What is the difference between Standard and AI-Enhanced mode?',
      a: 'Standard mode uses Tesseract OCR — works for all 12 languages and starts immediately, but was trained on printed text. AI-Enhanced mode uses Florence-2 and TrOCR, models trained specifically on handwritten input — handles cursive and mixed styles better, but supports English only and downloads ~262MB on first use (cached in your browser after that).',
    },
    {
      q: 'Does it work on cursive handwriting?',
      a: 'With Standard mode, accuracy on cursive is lower and you should expect to correct errors. AI-Enhanced mode (English) handles cursive noticeably better — transformer models understand joined strokes in a way traditional OCR cannot. Messy or doctor-style scrawl will still produce errors in both modes.',
    },
    {
      q: 'How accurate should I expect the output to be?',
      a: 'Handwriting is the hardest input for OCR. Neat, upright print on a white background with AI-Enhanced mode can reach 90–95% accuracy. Casual cursive, mixed styles, or anything on a coloured or patterned background will be lower. Treat the output as a first draft — the review panel underlines low-confidence words in amber so you can focus corrections quickly.',
    },
    {
      q: 'Can it handle filled-in paper forms?',
      a: 'Yes. Printed form labels extract cleanly in both modes. Handwritten answers in the blanks extract with variable accuracy — AI-Enhanced mode improves the handwritten portions.',
    },
    {
      q: 'Can I edit the extracted text before downloading?',
      a: 'Yes. After conversion, a review panel shows words flagged with low OCR confidence underlined in amber. Auto-corrected words have a blue dotted underline — click to see the original and revert. Click "Apply changes" to lock edits before downloading.',
    },
  ],

  relatedTools: ['photo-to-text', 'scan-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Handwriting to Text Converter — ConvertYard',
    description: 'Transcribe handwritten notes, forms, and letters into digital text. AI-Enhanced mode handles cursive and mixed styles. Browser-based — no uploads.',
  },
}
