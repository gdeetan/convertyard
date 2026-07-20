import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'photo-to-text',
  title: 'Photo to Text Converter',
  subtitle: 'Extract text from clear photos of documents. Straight-on shot, decent light.',
  bestFor: 'Best for pulling text from phone photos of paper documents, signs, and printed pages.',
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
      q: 'Are my photos uploaded anywhere to run OCR?',
      a: 'No. OCR runs entirely in your browser. Nothing leaves your device.',
    },
    {
      q: 'What kind of photos give the best results?',
      a: 'A printed page photographed flat under consistent overhead light, with the camera held directly above. Avoid shadows from your hand or a nearby lamp. The page should fill most of the frame.',
    },
    {
      q: 'My photo came out blurry or at an angle — can the tool fix it?',
      a: 'Blur cannot be recovered by any OCR setting — retake the photo with more light and a steady hand. Moderate angle can be corrected automatically, but steep angles (more than about 20°) will reduce multi-line accuracy. Take the photo from directly above for best results.',
    },
    {
      q: 'What about photos of books with page curvature?',
      a: 'Moderate curvature works. Heavy curvature warps the text line geometry enough to hurt accuracy on longer lines. Flatten the page as much as possible, or use a dedicated book scanning app for dense content.',
    },
    {
      q: 'Does it handle HEIC photos from iPhone?',
      a: 'Yes. HEIC files are decoded automatically before recognition runs — no need to convert to JPG first.',
    },
  ],

  relatedTools: ['screenshot-to-text', 'jpg-to-text', 'handwriting-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Photo to Text Converter — ConvertYard',
    description: 'Extract text from photos of documents and printed pages. HEIC supported. Batch convert locally — no uploads, no account.',
  },
}
