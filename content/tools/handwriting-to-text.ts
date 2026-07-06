import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'handwriting-to-text',
  title: 'Handwriting to Text Converter',
  subtitle: 'Transcribe handwritten notes and forms into digital text.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),

  limitationNote: {
    summary: 'AI-Enhanced mode significantly improves cursive accuracy',
    body: 'Standard mode uses Tesseract OCR with image preprocessing (contrast, deskew, binarization) — best for printed-style handwriting in all 12 languages. AI-Enhanced mode uses TrOCR (a transformer model trained on handwriting) for much higher accuracy on cursive and mixed styles — English only, downloads up to ~320MB once and caches in your browser. Quality mode (default) uses beam search for higher accuracy; Fast mode is quicker at ~1–2 seconds per line.',
  },

  options: [
    {
      type: 'radio',
      name: 'recognitionEngine',
      label: 'Recognition engine',
      choices: [
        { value: 'standard', label: 'Standard — all languages, no download' },
        { value: 'ai-enhanced', label: 'AI-Enhanced — English only, up to ~320MB download' },
      ],
      default: 'standard',
      conditionalHints: {
        standard: 'Tesseract OCR with image preprocessing. Works with all 12 languages. Best for printed-style or neat handwriting.',
        'ai-enhanced': 'TrOCR transformer model trained on handwriting. Much higher accuracy on cursive and mixed styles. Downloads up to ~320MB on first use — cached in your browser permanently. Quality mode uses beam search for best accuracy; Fast mode is quicker.',
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
  ],

  faq: [
    {
      q: 'What is the difference between Standard and AI-Enhanced mode?',
      a: 'Standard mode uses Tesseract OCR — it works for all 12 languages and starts immediately, but was originally designed for printed text. AI-Enhanced mode uses TrOCR, a transformer model trained specifically on handwritten text — it handles cursive and mixed styles much better, but only supports English and downloads up to ~320MB on first use (stored in your browser permanently after that).',
    },
    {
      q: 'Does it work on cursive handwriting?',
      a: 'With Standard mode, accuracy on cursive is lower and you should expect to correct errors. With AI-Enhanced mode (English), cursive accuracy improves significantly — transformer models understand joined strokes in a way traditional OCR cannot.',
    },
    {
      q: 'Why is AI-Enhanced Quality mode slower?',
      a: 'Quality mode uses beam search — it evaluates 4 candidate readings per token and picks the most likely sequence. This catches ambiguous letter pairs that greedy decoding misses (a/o, l/1, u/n), but takes roughly 3× longer per line. For a 10-line page: Quality takes ~20–30s, Fast takes ~5–10s. Switch to Fast mode if speed matters more than accuracy.',
    },
    {
      q: 'Why is AI-Enhanced mode English-only?',
      a: 'The TrOCR model used is trained on English handwriting datasets. Multilingual handwriting models are available but require 500MB+ downloads, which is impractical for browser use.',
    },
    {
      q: 'Can it handle angled or skewed photos?',
      a: 'Yes. The preprocessing pipeline automatically detects the document boundary and corrects perspective warp (the trapezoid effect from phone photos taken at an angle). It also corrects rotation up to ±20°.',
    },
    {
      q: 'What is the JSON output format?',
      a: 'JSON mode outputs per-line text with a quality flag. Lines that are empty or very short — likely missed by the OCR engine — are flagged for review. Available in both Standard and AI-Enhanced modes.',
    },
    {
      q: 'Can it handle filled-in paper forms?',
      a: 'Yes. Printed form labels extract cleanly in both modes. Handwritten answers in the blanks extract with variable accuracy — AI-Enhanced mode improves the handwritten portions.',
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
