import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'scan-to-text',
  title: 'Scan to Text Converter',
  subtitle: 'Convert scanned document images into editable text. Accepts TIFF, JPG, PNG.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'OCR is CPU-intensive',
    body: 'Text recognition runs on your device. For large batches of scanned pages, keep the tab open and allow extra time.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Choose the language in the scanned document.',
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
        { value: 'text', label: 'Plain text (.txt) — one per scan' },
        { value: 'combined', label: 'Combined single file (sorted by filename)' },
      ],
      default: 'text',
      conditionalHints: {
        text: 'One .txt file per scanned page.',
        combined: 'All pages merged into one .txt in filename order. Name files 001.tiff, 002.tiff, etc. for correct page order.',
      },
    },
    {
      type: 'toggle' as const,
      name: 'autoCorrect',
      label: 'Fix common OCR errors',
      hint: 'English only. Fixes classic OCR mistakes (rn→m, O→0, etc.) using a dictionary. Only touches low-confidence words — everything is revertible in the review panel.',
      default: true,
      dependsOn: { name: 'language', value: 'eng' },
    },
  ],

  faq: [
    {
      q: 'My scanner outputs TIFFs — can I use those directly?',
      a: 'Yes. TIFF is accepted alongside JPG, PNG, and BMP. You don\'t need to convert scanner output before dropping it here.',
    },
    {
      q: 'What about two-sided documents?',
      a: 'Each scanned page is a separate file. Drop them all at once and use "Combined single file" mode — pages are merged in filename order. Name files 001.tiff, 002.tiff, etc.',
    },
    {
      q: 'Does it handle faded or old documents?',
      a: 'Faded documents can reduce accuracy. For best results, scan at 300 DPI or higher with good contrast settings on your scanner.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your scans never leave your device.',
    },
  ],

  relatedTools: ['photo-to-text', 'jpg-to-text', 'ocr-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Scan to Text Converter — ConvertYard',
    description: 'Convert scanned document images (TIFF, JPG, PNG, BMP) to editable text. Batch convert locally — no uploads. 14 languages supported.',
  },
}
