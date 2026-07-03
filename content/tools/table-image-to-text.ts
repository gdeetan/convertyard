import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'table-image-to-text',
  title: 'Table Image to Text Converter',
  subtitle: 'Extract tables from images into CSV. Research papers, price grids, reports.',
  category: 'images',
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
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Choose the language of text in the table.',
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
