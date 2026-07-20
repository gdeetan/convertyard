import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'jpg-to-text',
  title: 'JPG to Text Converter',
  subtitle: 'Extract text from JPG screenshots and exported slides. No uploads.',
  bestFor: 'Best for pulling text out of JPG screenshots, exported slide decks, and saved chat images.',
  category: 'image-to-text',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, preprocessingMode: 'screenshot' }, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'Tuned for JPG screenshots and clean exports',
    body: 'Heavily compressed JPGs lose fine character detail — export at higher quality if accuracy matters. Blurry or low-res sources reduce results regardless of settings.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Document language',
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
        text: 'One .txt file per image.',
        markdown: 'One .md file per image with the filename as a heading.',
        combined: 'All images merged into a single .txt file with --- separators.',
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
      q: 'Are my JPG files uploaded anywhere to run OCR?',
      a: 'No. Everything runs in your browser with WebAssembly. Files never leave your device.',
    },
    {
      q: 'What JPG images work best?',
      a: 'Exported slides, screenshots of articles or emails, and chat images saved as JPG. Image quality matters more than resolution — a high-quality 800×600 JPG reads better than a heavily compressed 2000×1500.',
    },
    {
      q: 'Does JPEG compression affect OCR accuracy?',
      a: 'At moderate quality (70%+) the effect is small. Heavy compression creates ringing artefacts around letter edges that confuse character recognition — thin serifs and small punctuation are the first casualties. Export at 80%+ quality when you have a choice.',
    },
    {
      q: 'Can I batch-convert a folder of JPG screenshots?',
      a: 'Yes. Drop up to 1,000 files at once. Each produces a separate .txt, or choose "Combined" to merge everything into one file sorted by filename.',
    },
    {
      q: 'What languages are supported?',
      a: '14 languages: English, French, German, Spanish, Chinese (Simplified and Traditional), Japanese, Korean, Arabic, Hindi, Russian, Portuguese, Italian, and Dutch.',
    },
  ],

  relatedTools: ['photo-to-text', 'png-to-text', 'jpeg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'JPG to Text Converter — ConvertYard',
    description: 'Extract text from JPG images locally — exported slides, chat screenshots, JPG exports. Batch up to 1,000 files in your browser. No uploads, no account.',
  },
}
