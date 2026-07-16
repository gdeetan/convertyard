import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'heic-to-text',
  title: 'HEIC to Text Converter',
  subtitle: 'Extract text from iPhone photos without converting first.',
  category: 'image-to-text',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
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
      q: 'Why does my iPhone save photos as HEIC?',
      a: 'HEIC (High Efficiency Image Container) is Apple\'s default since iOS 11. It produces smaller files than JPG at similar quality. Most OCR tools make you convert to JPG first — this tool accepts HEIC directly.',
    },
    {
      q: 'Does this work on HEIF files too?',
      a: 'Yes. HEIC and HEIF are essentially the same format. Both are accepted.',
    },
    {
      q: 'Can I just change my iPhone to save as JPG instead?',
      a: 'Yes — Settings > Camera > Formats > Most Compatible switches to JPG. But if you already have HEIC photos you want to extract text from, drop them here without converting.',
    },
    {
      q: 'How accurate is the text extraction from iPhone photos?',
      a: 'iPhone cameras are good enough that a well-framed photo of a document in decent light will come out pretty clean — typically 94–98% accurate on printed text. The weak spots are the same ones that fool your eye: text at a steep angle, a page half in shadow, or handwriting mixed with print. Before you use the extracted text for anything that matters (a form, a quote, a medical document), scan through the review panel\'s amber highlights. It won\'t take long and it catches the things you\'d otherwise miss.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. HEIC decode and OCR both run in your browser. Your photos never leave your device.',
    },
  ],

  relatedTools: ['heic-to-jpg', 'photo-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'HEIC to Text Converter — ConvertYard',
    description: 'Extract text from iPhone HEIC photos without converting first. Browser-based OCR — no uploads, no account. 12 languages supported.',
  },
}
