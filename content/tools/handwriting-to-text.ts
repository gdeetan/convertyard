import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'handwriting-to-text',
  title: 'Handwriting to Text Converter',
  subtitle: 'Transcribe handwritten notes and forms into digital text.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),

  limitationNote: {
    summary: 'AI-Enhanced mode significantly improves cursive accuracy',
    body: 'Standard mode uses Tesseract OCR with image preprocessing (contrast, deskew, binarization) — best for printed-style handwriting in all 12 languages. AI-Enhanced mode uses TrOCR (a transformer model trained on handwriting) for much higher accuracy on cursive and mixed styles — English only, downloads ~77MB once and caches in your browser.',
  },

  options: [
    {
      type: 'radio',
      name: 'recognitionEngine',
      label: 'Recognition engine',
      choices: [
        { value: 'standard', label: 'Standard — all languages, no download' },
        { value: 'ai-enhanced', label: 'AI-Enhanced — English only, ~77MB download' },
      ],
      default: 'standard',
      conditionalHints: {
        standard: 'Tesseract OCR with image preprocessing. Works with all 12 languages. Best for printed-style or neat handwriting.',
        'ai-enhanced': 'TrOCR transformer model trained on handwriting. Much higher accuracy on cursive and mixed styles. Downloads ~77MB on first use — stored in your browser, not re-downloaded.',
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
        { value: 'combined', label: 'Combined single file' },
      ],
      default: 'text',
      conditionalHints: {
        text: 'One .txt file per image.',
        combined: 'All images merged into one .txt file.',
      },
    },
  ],

  faq: [
    {
      q: 'What is the difference between Standard and AI-Enhanced mode?',
      a: 'Standard mode uses Tesseract OCR — it works for all 12 languages and starts immediately, but was originally designed for printed text. AI-Enhanced mode uses TrOCR, a transformer model trained specifically on handwritten text — it handles cursive and mixed styles much better, but only supports English and downloads a ~77MB model on first use (stored in your browser permanently after that).',
    },
    {
      q: 'Does it work on cursive handwriting?',
      a: 'With Standard mode, accuracy on cursive is lower and you should expect to correct errors. With AI-Enhanced mode (English), cursive accuracy improves significantly — transformer models understand joined strokes in a way traditional OCR cannot.',
    },
    {
      q: 'Why is AI-Enhanced mode English-only?',
      a: 'The TrOCR model used is trained on English handwriting datasets. Multilingual handwriting models are available but require 500MB+ downloads, which is impractical for browser use.',
    },
    {
      q: 'Can it handle filled-in paper forms?',
      a: 'Yes. Printed form labels extract cleanly in both modes. Handwritten answers in the blanks extract with variable accuracy — AI-Enhanced mode improves the handwritten portions.',
    },
    {
      q: 'My handwriting is messy — should I bother?',
      a: 'Try AI-Enhanced mode. Even imperfect output is often faster to correct than typing from scratch. The longer the document, the more time you save.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. All OCR — including the AI model — runs entirely in your browser. Your files and the model never leave your device.',
    },
  ],

  relatedTools: ['photo-to-text', 'scan-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Handwriting to Text Converter — ConvertYard',
    description: 'Transcribe handwritten notes, forms, and letters into digital text. AI-Enhanced mode handles cursive and mixed styles. Browser-based — no uploads.',
  },
}
