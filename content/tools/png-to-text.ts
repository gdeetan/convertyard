import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'png-to-text',
  title: 'PNG to Text Converter',
  subtitle: 'Extract text from PNG screenshots. Transparent backgrounds handled automatically.',
  bestFor: 'Best for extracting text from PNG screenshots, UI exports, and diagram labels.',
  category: 'image-to-text',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, preprocessingMode: 'screenshot' }, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'Tuned for PNG screenshots and clean exports',
    body: 'Transparent backgrounds are composited onto white automatically. Accuracy drops on low-res or blurry sources — not a PNG problem specifically, just a sharpness one.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the image.',
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
      q: 'Are my PNG files uploaded anywhere to run OCR?',
      a: 'No. OCR runs entirely in your browser. Files never leave your device.',
    },
    {
      q: 'What PNG images give the best results?',
      a: 'UI screenshots, cropped captures, diagram labels, and clean exports from design tools. PNG is lossless, so character detail is preserved exactly — OCR on sharp, high-contrast PNGs is very accurate.',
    },
    {
      q: 'What happens with transparent backgrounds?',
      a: 'Transparent areas are composited onto white before recognition runs. A transparent PNG with dark text reads the same as a white-background image.',
    },
    {
      q: 'Can it read text from code screenshots?',
      a: 'Yes, but monospace fonts with visually similar characters (0/O, 1/l/I) are the most error-prone. The review panel flags low-confidence words so you can catch and fix these quickly.',
    },
    {
      q: 'What about dark-mode screenshots or coloured text?',
      a: 'Converted to greyscale before recognition. Colour does not affect accuracy directly — contrast between text and background is what matters. Dark text on a light background reads cleanly regardless of the specific colours involved.',
    },
  ],

  relatedTools: ['jpg-to-text', 'screenshot-to-text', 'png-to-jpg'],
  relatedArticles: [],

  meta: {
    title: 'PNG to Text Converter — ConvertYard',
    description: 'Extract text from PNG images — UI captures, diagram labels, transparent-background exports. Batch up to 1,000 files locally. No uploads, no account.',
  },
}
