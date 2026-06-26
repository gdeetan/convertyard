// content/tools/ocr-pdf.ts
import { ocrPdf } from '@/lib/converters/ocr-pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'ocr-pdf',
  title: 'OCR PDF — Make Scanned PDFs Searchable',
  subtitle: 'Make scanned PDFs searchable and selectable. Runs entirely in your browser.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: ocrPdf,

  limitationNote: {
    summary: 'OCR is CPU-intensive',
    body: 'Recognition runs on your device — not a server. Expect a few seconds per page. For large batches, process in smaller groups. Speed depends on your device.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Document language',
      hint: 'Choose the primary language in the scanned document. More languages can be added — these cover the most common cases.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'hin', label: 'Hindi' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'ara', label: 'Arabic' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
      ],
      default: 'eng',
    },
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output format',
      choices: [
        { value: 'searchable-pdf', label: 'Searchable PDF' },
        { value: 'text-only', label: 'Extract text (.txt)' },
      ],
      default: 'searchable-pdf',
      conditionalHints: {
        'searchable-pdf':
          'Adds an invisible text layer to the original scan — the layout stays the same, but text becomes selectable and Ctrl+F works.',
        'text-only':
          'Extracts the recognized text into a plain .txt file. Faster than searchable PDF mode.',
      },
    },
  ],

  faq: [
    {
      q: 'What kinds of PDFs does this work on?',
      a: "PDFs made from scans — where the pages are images with no selectable text. Common sources: documents photographed and exported to PDF, fax-to-PDF output, or PDFs exported from a scanner. If you can already select text in your PDF, it doesn't need OCR.",
    },
    {
      q: 'How accurate is the text recognition?',
      a: 'Clean, high-contrast printed text on a white background: very high accuracy (95%+). Handwriting: not supported — Tesseract is designed for printed text only. Faded, skewed, or low-resolution scans: accuracy drops. The tool works best with 300 DPI or higher scans.',
    },
    {
      q: 'Why is this slower than other ConvertYard tools?',
      a: "OCR runs on your device's CPU rather than a server. The tradeoff is that your document never leaves your browser. Most tools here are instant because they use optimised WASM libraries. OCR is computationally heavier — a few seconds per page is normal.",
    },
    {
      q: 'Will the PDF look different after OCR?',
      a: "No. In Searchable PDF mode, the original scan is preserved exactly. An invisible text layer is added — you can't see it, but search tools and screen readers can find the text.",
    },
    {
      q: 'What\'s the difference between "Searchable PDF" and "Extract text"?',
      a: 'Searchable PDF keeps the original document layout and adds a hidden text layer. Extract text strips the PDF entirely and outputs just the recognised words in a plain .txt file. Use "Extract text" when you only care about the content, not the layout.',
    },
    {
      q: 'Can I OCR a PDF that\'s already partially searchable?',
      a: 'Yes. The tool adds an OCR text layer regardless of whether the PDF already has text. Pages with existing text will have a duplicate layer — this is harmless but unnecessary. For mixed PDFs (some pages scanned, some already text), the result is still usable.',
    },
    {
      q: 'Does the language setting affect accuracy a lot?',
      a: 'Yes. Always select the language that matches your document. The wrong language model will produce garbled output even on a clean scan. For a document that mixes two languages, pick the dominant one.',
    },
    {
      q: 'Is my document uploaded anywhere?',
      a: "No. OCR runs entirely in your browser using Tesseract.js and WebAssembly. Your PDF never leaves your device. Language model files (~10–15 MB per language) are downloaded from a public CDN on first use and cached — this is the only network request during processing.",
    },
  ],

  relatedTools: ['pdf-to-text', 'pdf-to-word', 'compress-pdf', 'pdf-to-excel'],
  relatedArticles: [
    'compress-pdf-without-uploading-privacy-guide',
    'how-browser-based-file-conversion-works',
    'word-to-pdf-and-back-what-survives',
  ],

  meta: {
    title: 'OCR PDF — Make Scanned PDFs Searchable — ConvertYard',
    description:
      'Make scanned PDFs searchable and selectable with free browser-based OCR. Supports English, Hindi, and 8 more languages. Files never uploaded.',
  },
}
