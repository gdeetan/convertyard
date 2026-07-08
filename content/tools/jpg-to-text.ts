import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'jpg-to-text',
  title: 'JPG to Text Converter',
  subtitle: 'Extract text from JPG images. Runs in your browser, no uploads.',
  category: 'image-to-text',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'OCR is CPU-intensive',
    body: 'Text recognition runs on your device. Expect a few seconds per image. Speed depends on your device and image resolution.',
  },

  options: [
    {
      type: 'radio',
      name: 'recognitionEngine',
      label: 'Recognition engine',
      choices: [
        { value: 'standard', label: 'Standard — all languages, no download' },
        { value: 'ai-enhanced', label: 'AI-Enhanced — English only, ~262MB (may be cached)' },
      ],
      default: 'standard',
      conditionalHints: {
        standard: 'Tesseract OCR with image preprocessing. Works with all languages. Best for clean, printed text.',
        'ai-enhanced': 'Florence-2 + TrOCR: processes the full page at once without line segmentation, then falls back to TrOCR for lines Florence-2 misses. Downloads ~262MB on first use — shared with the Image Description tool so may already be cached. English only.',
      },
    },
    {
      type: 'dropdown',
      name: 'language',
      label: 'Document language',
      hint: 'Choose the language in your image. Standard engine only — AI-Enhanced uses English.',
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
      hint: 'English only. Fixes classic OCR mistakes (rn→m, O→0, etc.) using a dictionary. Only touches low-confidence words — everything is revertible in the review panel.',
      default: true,
      dependsOn: { name: 'language', value: 'eng' },
    },
  ],

  faq: [
    {
      q: 'What\'s the difference between this and a PDF OCR tool?',
      a: 'This tool extracts text from JPG image files. If your document is a .pdf containing scanned images (not selectable text), use the OCR PDF tool. If you\'ve exported a PDF page as a JPG, this tool handles it.',
    },
    {
      q: 'Can I extract text from a JPG containing a table?',
      a: 'Yes. For plain text tables, the standard output works well. For tables you want as a spreadsheet, use the Image to Excel tool instead.',
    },
    {
      q: 'Does JPEG work the same as JPG?',
      a: 'Yes — .jpeg and .jpg are the same format. Both are accepted by this tool.',
    },
    {
      q: 'How many files can I process at once?',
      a: 'There is no hard limit. For large batches (50+ files), processing continues in the background — keep the tab open until it finishes.',
    },
    {
      q: 'Should I check the output before using it?',
      a: 'Yes, at least briefly. A clean, high-resolution scan of a typed document can hit 99% accuracy, but a heavily compressed or low-res JPG (common with old scans or attachments that were emailed multiple times) will have noticeably more errors. The most common mistakes are o/0 swaps, rn reading as m, and stray characters near image edges. The review panel underlines uncertain words in amber — that\'s the quickest way to spot the places that need a second look.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser using Tesseract.js and WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['photo-to-text', 'png-to-text', 'jpeg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'JPG to Text Converter — ConvertYard',
    description: 'Extract text from JPG images with free browser-based OCR. Batch up to 1,000 files locally — no uploads, no account. 14 languages supported.',
  },
}
