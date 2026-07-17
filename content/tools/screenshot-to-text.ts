import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'screenshot-to-text',
  title: 'Screenshot to Text Converter',
  subtitle: 'Extract text from screenshots — up to 500 at once, no uploads.',
  category: 'image-to-text',
  accepts: ['image/png', 'image/jpeg', 'image/webp'],
  acceptsExt: ['.png', '.jpg', '.jpeg', '.webp'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, preprocessingMode: 'screenshot' }, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'Tuned for clear, sharp screenshots',
    body: 'Accuracy drops on blurry captures, very small text (<12px), and low-contrast colours. A sharper source image fixes this faster than any setting.',
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
    {
      type: 'toggle' as const,
      name: 'autoCorrect',
      label: 'Fix common OCR errors',
      hint: 'Fixes classic OCR mistakes (rn→m, O→0, etc.) using a dictionary. Only touches low-confidence words — revertible in the review panel.',
      default: true,
      dependsOn: { name: 'language', value: 'eng' },
    },
  ],

  faq: [
    {
      q: 'What kinds of screenshots work best?',
      a: 'Clear screenshots of UI text — error messages, Slack or Discord posts, settings screens, article paragraphs. Anything you can read comfortably on screen will read cleanly here.',
    },
    {
      q: 'Does it work on dark-mode screenshots?',
      a: 'Yes. Dark backgrounds are automatically detected and inverted before recognition runs, so light text on dark reads the same as dark text on light.',
    },
    {
      q: 'Can I extract text from a screenshot of a PDF?',
      a: 'Yes. For actual .pdf files, the OCR PDF tool is faster. If you have a screenshot of a PDF page, this is the right tool.',
    },
    {
      q: 'What about multi-column layouts?',
      a: 'Works for most cases. Dense layouts sometimes merge adjacent columns. Crop to a single column first if that happens.',
    },
    {
      q: 'What trips it up?',
      a: 'Small labels under 12px, light-grey placeholder text, monospace code with ambiguous characters (0/O, 1/l/I), and unusual fonts. For most standard UI screenshots you\'ll find little or nothing to fix.',
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
