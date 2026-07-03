import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-text',
  title: 'PNG to Text Converter',
  subtitle: 'Extract text from PNG images. Transparent backgrounds handled automatically.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),

  limitationNote: {
    summary: 'OCR is CPU-intensive',
    body: 'Text recognition runs on your device. Expect a few seconds per image.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the PNG.',
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
        text: 'One .txt file per PNG.',
        markdown: 'One .md file per PNG with the filename as heading.',
        combined: 'All PNGs merged into a single .txt file.',
      },
    },
  ],

  faq: [
    {
      q: 'Does it handle PNGs with transparent backgrounds?',
      a: 'Yes. The tool composites your image onto a white background before running OCR, so text on transparent or semi-transparent layers extracts correctly.',
    },
    {
      q: 'Can I extract text from PNG screenshots of code?',
      a: 'Yes. Syntax-highlighted code extracts well — you get the raw text without the colour formatting. Good for pulling code snippets from tutorial screenshots.',
    },
    {
      q: 'What about PNG images with text overlays, like infographics?',
      a: 'Text overlaid on solid or near-solid backgrounds extracts reliably. Very low-contrast overlays (white text on light background) may produce more errors.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser using Tesseract.js. Your files never leave your device.',
    },
  ],

  relatedTools: ['jpg-to-text', 'screenshot-to-text', 'png-to-jpg'],
  relatedArticles: [],

  meta: {
    title: 'PNG to Text Converter — ConvertYard',
    description: 'Extract text from PNG images — transparent backgrounds handled automatically. Batch convert locally in your browser. No uploads, no account.',
  },
}
