import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'scan-to-text',
  title: 'Scan to Text Converter',
  subtitle: 'Convert scanned document images into editable text. TIFF, JPG, PNG, BMP.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, preprocessingMode: 'screenshot' }, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'Reads cleanest from 200+ DPI scans with good contrast',
    body: 'Faded ink, bleed-through, and sub-200 DPI scans reduce accuracy. Most flatbed scans at default settings read well.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the scanned document.',
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
      hint: 'Fixes classic OCR mistakes (rn→m, O→0, etc.) using a dictionary. Only touches low-confidence words — revertible in the review panel.',
      default: true,
      dependsOn: { name: 'language', value: 'eng' },
    },
  ],

  faq: [
    {
      q: 'What scan quality do I need?',
      a: '200 DPI or above at good ink contrast. Most flatbed scanner defaults (300 DPI, black and white or greyscale) produce near-perfect results.',
    },
    {
      q: 'Does it support TIFF?',
      a: 'Yes. TIFF, JPG, PNG, and BMP are all accepted. TIFF is common from document scanners and is handled the same as any other format.',
    },
    {
      q: 'What about two-sided documents?',
      a: 'Scan each side separately and drop both files in. Use "Combined" output mode to merge them into one file in filename order.',
    },
    {
      q: 'Can it read faded or old documents?',
      a: 'Light fading often still reads — the tool handles moderate contrast loss. Heavy fading, water damage, or bleed-through from the reverse side reduces accuracy significantly. No software fix compensates for genuinely unreadable ink.',
    },
    {
      q: 'Are files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Nothing is sent to any server.',
    },
  ],

  relatedTools: ['photo-to-text', 'jpg-to-text', 'ocr-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Scan to Text Converter — ConvertYard',
    description: 'Convert scanned document images (TIFF, JPG, PNG, BMP) to editable text. Batch up to 1,000 files locally. No uploads. 14 languages supported.',
  },
}
