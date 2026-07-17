import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'photo-to-text',
  title: 'Photo to Text Converter',
  subtitle: 'Extract text from clear photos of documents. Straight-on shot, decent light.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, preprocessingMode: 'screenshot' }, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'Works best on flat, well-lit photos taken straight on',
    body: 'Blur, shadows, and extreme angles reduce accuracy more than any setting can compensate for. A clearer photo is always the better fix.',
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
        text: 'One .txt file per photo.',
        markdown: 'One .md file per photo with the filename as heading.',
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
      q: 'What kind of photos work best?',
      a: 'A printed page or document photographed flat under consistent overhead light, with the camera held directly above. Avoid shadows from your hand or lamp.',
    },
    {
      q: 'My photo came out blurry — can the tool fix it?',
      a: 'No. Blur reduces accuracy below the level any OCR setting can recover. Retake the photo with more light and a steady hand — the result will be better than any software correction.',
    },
    {
      q: 'Does it handle HEIC from iPhone?',
      a: 'Yes. HEIC files are decoded automatically before recognition.',
    },
    {
      q: 'What about photos of books with page curvature?',
      a: 'Moderate curvature works. Heavy curvature warps the text line geometry enough to hurt multi-line accuracy. Flatten the page or use a book scanner cradle for dense content.',
    },
    {
      q: 'Can I review and fix the extracted text?',
      a: 'Yes. The review panel shows each word flagged with low recognition confidence. Click any word to correct it, or toggle auto-correct to fix common OCR errors automatically.',
    },
    {
      q: 'Are files uploaded anywhere?',
      a: 'No. OCR runs in your browser. Nothing leaves your device.',
    },
  ],

  relatedTools: ['screenshot-to-text', 'jpg-to-text', 'handwriting-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Photo to Text Converter — ConvertYard',
    description: 'Extract text from photos of documents and printed pages. HEIC supported. Batch convert locally — no uploads, no account.',
  },
}
