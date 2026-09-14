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
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, recognitionEngine: 'ai-enhanced' }, onProgress),
  enablePresets: true,
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'English handwriting model, ~262MB on first use',
    body: 'Uses Florence-2 (full-page) then TrOCR (line-by-line) for cursive and mixed handwriting. English only — other languages use a print-oriented fallback. Downloads ~262MB once (shared with the Image Description tool, cached after that). On iPhone Safari the model is skipped to avoid a tab crash and the fallback engine runs instead. For English output, "Fix common OCR errors" applies a dictionary pass to catch classic mistakes like rn→m or O→0 — only low-confidence words are touched, shown in the review panel so you can revert before downloading.',
  },

  options: [
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
      conditionalHints: {
        quality: 'Evaluates 4 candidate readings per word — catches ambiguous letter pairs (a/o, l/1, u/n, m/n). Adds ~3× processing time per line.',
        fast: 'Single greedy pass — 1–2s per line. Use when speed matters more than accuracy.',
      },
    },
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'English uses the handwriting model. Other languages use a print-oriented fallback.',
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
      a: 'No. The handwriting model runs entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'Why is the first run slow?',
      a: 'The first conversion downloads a ~262MB handwriting model (Florence-2 + TrOCR), then caches it in your browser. Later conversions skip the download. The model is shared with the Image Description tool, so it may already be cached.',
    },
    {
      q: 'Does it work on cursive handwriting?',
      a: 'Yes, for English. The model is trained on handwritten input, including joined strokes. Messy or doctor-style scrawl will still produce errors — treat the output as a first draft.',
    },
    {
      q: 'How accurate should I expect the output to be?',
      a: 'Handwriting is the hardest input for OCR. Neat, upright print on a white background can reach 90–95% accuracy. Casual cursive, mixed styles, or anything on a coloured or patterned background will be lower. The review panel underlines low-confidence words in amber so you can focus corrections quickly.',
    },
    {
      q: 'Can it handle filled-in paper forms?',
      a: 'Yes. Printed form labels extract cleanly. Handwritten answers in the blanks extract with variable accuracy — review those fields before downloading.',
    },
    {
      q: 'Can I edit the extracted text before downloading?',
      a: 'Yes. After conversion, a review panel shows words flagged with low OCR confidence underlined in amber. Auto-corrected words have a blue dotted underline — click to see the original and revert. Click "Apply changes" to lock edits before downloading.',
    },
  ],

  relatedTools: ['photo-to-text', 'scan-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Convert Handwriting to Text - Documents or Letters in an Editable Format',
    description: 'Convert screenshots or handwritten notes to an editable text format, cursive or printed notes using this tool using this web-based tool. 100% Free. Nothing uploads.',
  },
}
