import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'table-image-to-text',
  title: 'Table Image to Text Converter',
  subtitle: 'Extract tables from images into CSV. Research papers, price grids, reports.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.csv',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'table-csv' }, onProgress),

  limitationNote: {
    summary: 'Works best on structured tables',
    body: 'Tables with consistent column alignment extract well. Merged cells and complex nested tables may need manual cleanup after export.',
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
      label: 'Language',
      hint: 'Choose the language of text in the table. Standard engine only — AI-Enhanced uses English.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'jpn', label: 'Japanese' },
      ],
      default: 'eng',
    },
  ],

  faq: [
    {
      q: 'What types of tables does it handle best?',
      a: 'Bordered tables (with visible grid lines) and borderless tables with consistent column spacing extract most reliably. Common sources: research paper tables, pricing grids, comparison charts, annual report data tables.',
    },
    {
      q: 'Should I use this or the Image to Excel tool?',
      a: 'Use this for CSV output (the universal format for data work). Use Image to Excel if you specifically need a .xlsx file you can open directly in Excel or Google Sheets.',
    },
    {
      q: 'Can I process multiple table images at once?',
      a: 'Yes. Drop as many images as you need — each produces its own .csv file, downloaded together as a ZIP. For tables spanning multiple images, combine the CSVs in your spreadsheet tool after export.',
    },
    {
      q: 'How accurate is the extracted table data?',
      a: 'Individual cell text is usually accurate, but the part worth checking is column alignment — specifically whether numbers stayed in the right column. Tables where values are close together or where the image has slight skew are the most likely to have a number drift one column left or right. Before you use the CSV in any analysis, spot-check a few rows against the original image. It takes 30 seconds and catches the kind of misalignment that would be annoying to find later.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your images never leave your device.',
    },
  ],

  relatedTools: ['image-to-excel', 'receipt-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Table Image to Text Converter — ConvertYard',
    description: 'Extract tables from images into CSV — research papers, reports, price lists. Browser-based OCR, no uploads, no account.',
  },
}
