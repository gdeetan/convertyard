import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'png-to-text',
  title: 'PNG to Text Converter',
  subtitle: 'Extract text from PNG screenshots. Transparent backgrounds handled automatically.',
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
      q: 'What PNG images work best?',
      a: 'UI captures, cropped screenshots, diagram labels, and any clean export from a design tool. PNGs are lossless so character detail is preserved exactly — great for precise extraction.',
    },
    {
      q: 'What happens with transparent backgrounds?',
      a: 'Composited onto white before recognition runs. A transparent PNG with dark text reads the same as a white-background image.',
    },
    {
      q: 'Can it read text in code screenshots?',
      a: 'Yes, though monospace fonts with ambiguous characters (0/O, 1/l/I) are the most error-prone part. The review panel lets you catch and fix those quickly.',
    },
    {
      q: 'What about screenshots with coloured text or highlights?',
      a: 'Converted to greyscale before recognition. Colour itself doesn\'t affect accuracy — contrast between text and background does. Dark text on a light background reads cleanly regardless of the specific colours.',
    },
    {
      q: 'Are files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Files never leave your device.',
    },
  ],

  relatedTools: ['jpg-to-text', 'screenshot-to-text', 'png-to-jpg'],
  relatedArticles: [],

  meta: {
    title: 'PNG to Text Converter — ConvertYard',
    description: 'Extract text from PNG images — UI captures, diagram labels, transparent-background exports. Batch up to 1,000 files locally. No uploads, no account.',
  },
}
