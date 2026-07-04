import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'screenshot-to-text',
  title: 'Screenshot to Text Converter',
  subtitle: 'Extract text from screenshots. Drop up to 500 at once, no uploads.',
  category: 'image-to-text',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  acceptsExt: ['.png', '.jpg', '.jpeg', '.webp'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),

  limitationNote: {
    summary: 'OCR is CPU-intensive',
    body: 'Text recognition runs on your device. Expect a few seconds per screenshot. Speed depends on your device and image resolution.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the screenshots.',
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
