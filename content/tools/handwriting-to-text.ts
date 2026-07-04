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
    summary: 'Accuracy depends on handwriting clarity',
    body: 'Tesseract OCR is optimised for printed text. Neat, printed-style handwriting extracts well. Cursive and highly personal scripts will produce lower accuracy. For messy handwriting, expect to correct errors in the output.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Choose the language of the handwriting.',
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
      q: 'Does it work on cursive handwriting?',
      a: 'Cursive is supported but accuracy is lower than for printed handwriting. Very stylised or personal shorthand will produce significant errors. Use the output as a starting point and correct manually.',
    },
    {
      q: 'Can it handle filled-in paper forms?',
      a: 'Yes. Printed form labels extract cleanly. Handwritten answers in the blanks extract with variable accuracy depending on the writer\'s clarity.',
    },
    {
      q: 'My handwriting is messy — should I bother?',
      a: 'Try it. Even imperfect output is often faster to correct than typing from scratch. The longer the document, the more time you save.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your files never leave your device.',
    },
  ],

  relatedTools: ['photo-to-text', 'scan-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Handwriting to Text Converter — ConvertYard',
    description: 'Transcribe handwritten notes, forms, and letters into digital text. Browser-based OCR — no uploads. Works on printed-style and cursive handwriting.',
  },
}
