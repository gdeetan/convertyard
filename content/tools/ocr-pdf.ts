// content/tools/ocr-pdf.ts
import { ocrPdf } from '@/lib/converters/ocr-pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'ocr-pdf',
  title: 'OCR PDF — Make Scanned PDFs Searchable',
  subtitle: 'Make scanned PDFs searchable and selectable. Runs entirely in your browser.',
  bestFor: 'Best for scanned contracts or archived documents you need to search or copy text from.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: ocrPdf,
  enablePresets: true,

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
      q: 'Does my PDF leave my device during OCR?',
      a: 'No. OCR runs entirely in your browser using Tesseract.js and WebAssembly. Your PDF never leaves your device. Language model files (~10–15 MB per language) are downloaded from a public CDN on first use and cached — that is the only network request during processing.',
    },
    {
      q: 'What kinds of PDFs does this work on?',
      a: 'PDFs made from scans — pages that are images with no selectable text. Common sources: documents photographed and exported to PDF, fax-to-PDF output, or PDFs exported from a scanner. If you can already select text in your PDF, it does not need OCR.',
    },
    {
      q: 'Will the PDF look different after OCR?',
      a: 'No. In Searchable PDF mode, the original scan is preserved exactly. An invisible text layer is added underneath — you cannot see it, but Ctrl+F, screen readers, and copy-paste can find the text.',
    },
    {
      q: 'Why does the recognised text look garbled in places?',
      a: 'Three common causes: wrong language selected (fix this first), low scan resolution (below 150 DPI accuracy drops sharply), or unusual fonts and handwriting. Tesseract is trained on printed text — handwriting is not supported.',
    },
    {
      q: 'What is the difference between Searchable PDF and Extract text?',
      a: 'Searchable PDF keeps the original scan layout and adds a hidden text layer on top. Extract text outputs just the recognised words in a plain .txt file with no images. Use Extract text when you only care about the content, not the layout.',
    },
    {
      q: 'Why is OCR slower than other ConvertYard tools?',
      a: 'OCR runs on your device\'s CPU rather than a server — the tradeoff is that your document never leaves your browser. A few seconds per page is normal; a 20-page document may take a minute on a mid-range laptop.',
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
