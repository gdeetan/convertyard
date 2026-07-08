import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'screenshot-to-text',
  title: 'Screenshot to Text Converter',
  subtitle: 'Extract text from screenshots. Drop up to 500 at once, no uploads.',
  category: 'image-to-text',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  acceptsExt: ['.png', '.jpg', '.jpeg', '.webp'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'OCR is CPU-intensive',
    body: 'Text recognition runs on your device. Expect a few seconds per screenshot. Speed depends on your device and image resolution.',
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
        standard: 'Tesseract OCR with image preprocessing. Works with all languages. Best for clean, printed text.',
        'ai-enhanced': 'Florence-2 + TrOCR: processes the full page at once without line segmentation, then falls back to TrOCR for lines Florence-2 misses. Downloads ~262MB on first use — shared with the Image Description tool so may already be cached. English only.',
      },
    },
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the screenshots. Standard engine only — AI-Enhanced uses English.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'hin', label: 'Hindi' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'chi_tra', label: 'Chinese (Traditional)' },
        { value: 'ara', label: 'Arabic' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
        { value: 'rus', label: 'Russian' },
        { value: 'ita', label: 'Italian' },
        { value: 'nld', label: 'Dutch' },
      ],
      default: 'eng',
    },
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output format',
      choices: [
        { value: 'text', label: 'Plain text (.txt)' },
        { value: 'markdown', label: 'Markdown (.md)' },
        { value: 'combined', label: 'Combined single file' },
      ],
      default: 'text',
      conditionalHints: {
        text: 'One .txt file per screenshot.',
        markdown: 'One .md file per screenshot with the filename as heading.',
        combined: 'All screenshots merged into a single .txt with --- separators.',
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
      q: 'Does it work on dark-mode screenshots?',
      a: 'Yes. The converter pre-processes PNGs to ensure text on dark backgrounds extracts cleanly before OCR runs.',
    },
    {
      q: 'Can I extract text from a screenshot of a PDF?',
      a: 'Yes — if you have a screenshot of a PDF page rather than the PDF file itself, drop it here. For actual .pdf files, use the OCR PDF tool.',
    },
    {
      q: 'What languages are supported?',
      a: '14 languages are available in the dropdown including English, French, German, Spanish, Chinese (Simplified and Traditional), Japanese, Korean, Arabic, Hindi, and Russian.',
    },
    {
      q: 'Can I extract text from a screenshot with multiple columns?',
      a: 'Yes, though multi-column layouts sometimes read across columns rather than down each one. For complex layouts, cropping to a single column before dropping gives cleaner results.',
    },
    {
      q: 'Are my screenshots uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser using Tesseract.js and WebAssembly. Nothing is sent to any server.',
    },
  ],

  relatedTools: ['jpg-to-text', 'png-to-text', 'ocr-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Screenshot to Text Converter — ConvertYard',
    description: 'Extract text from screenshots — error messages, UI strings, chat logs. Batch up to 500 files locally in your browser. No uploads, no account.',
  },
}
