import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-to-excel',
  title: 'Image to Excel Converter',
  subtitle: 'Extract tables from images into .xlsx spreadsheets. No retyping.',
  category: 'images',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.xlsx',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'excel' }, onProgress),

  limitationNote: {
    summary: 'Works best on clearly structured tables',
    body: 'Bordered tables and borderless tables with consistent column spacing extract well. Merged cells and complex nested tables may not preserve their structure.',
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
        { value: 'por', label: 'Portuguese' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
      ],
      default: 'eng',
    },
  ],

  faq: [
    {
      q: 'What types of tables does it handle best?',
      a: 'Bordered tables with visible grid lines extract most accurately. Borderless tables with consistent column spacing also work well. Complex nested tables or tables with merged cells may need manual cleanup.',
    },
    {
      q: 'Can I open the output directly in Excel or Google Sheets?',
      a: 'Yes. The output is a standard .xlsx file — open it directly in Excel, Google Sheets, or LibreOffice Calc.',
    },
    {
      q: 'Does it work on invoice images?',
      a: 'Yes — invoices with line-item tables extract cleanly. Use the Receipt to Text tool if you specifically need structured vendor, date, and total fields in CSV format.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR and spreadsheet creation both run in your browser. Your files never leave your device.',
    },
  ],

  relatedTools: ['receipt-to-text', 'table-image-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Image to Excel Converter — ConvertYard',
    description: 'Extract tables from images into .xlsx spreadsheets. No retyping — screenshot or photo a table, get an Excel file back. Runs locally, no uploads.',
  },
}
