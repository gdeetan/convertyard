import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'heic-to-text',
  title: 'HEIC to Text Converter',
  subtitle: 'Extract text from iPhone photos without converting first.',
  bestFor: 'Best for iPhone users who want to OCR HEIC photos without converting to JPG first.',
  category: 'image-to-text',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
  enablePresets: true,
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'HEIC decode adds processing time',
    body: 'HEIC files are decoded to PNG before OCR runs — this takes a few extra seconds per file compared to JPG input.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the photo.',
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
        text: 'One .txt file per HEIC photo.',
        combined: 'All photos merged into one .txt file.',
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
      q: 'Are my iPhone photos uploaded anywhere to run OCR?',
      a: 'No. HEIC decoding and OCR both run in your browser. Your photos never leave your device.',
    },
    {
      q: 'Why does my iPhone save photos as HEIC?',
      a: 'HEIC (High Efficiency Image Container) is Apple\'s default since iOS 11. It produces smaller files than JPG at similar quality. Most OCR tools require you to convert to JPG first — this tool accepts HEIC directly.',
    },
    {
      q: 'How accurate is text extraction from iPhone HEIC photos?',
      a: 'iPhone cameras are sharp enough that a well-framed, well-lit photo of a document typically reads at 94–98% accuracy on printed text. Accuracy drops when the page is at a steep angle, partly in shadow, or contains handwriting mixed with print. Check the review panel\'s amber highlights before using the text in anything important.',
    },
    {
      q: 'Why does HEIC take longer to process than JPG?',
      a: 'HEIC files must be decoded to PNG before OCR can run — this adds a few extra seconds per file compared to JPG. The quality of the output is the same once decoding is done.',
    },
    {
      q: 'Does this work on HEIF files too?',
      a: 'Yes. HEIC and HEIF are the same format with different extensions. Both are accepted.',
    },
  ],

  relatedTools: ['heic-to-jpg', 'photo-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'iPhone HEIC to Text Converter — ConvertYard',
    description: 'Extract text from iPhone HEIC photos without converting first. Browser-based OCR — no uploads, no account. 12 languages supported.',
  },
}
