import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'table-image-to-text',
  title: 'Table Image to Text Converter',
  subtitle: 'Extract tables from images into CSV. No upload, no model download, no wait.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.csv',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'table-csv' }, onProgress),

  limitationNote: {
    summary: 'Works best on structured tables with consistent alignment',
    body: 'Merged cells and complex nested tables may need manual cleanup. For tables where column spacing is very tight or irregular, spot-check the first few rows against the original image.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Language of text in the table. Tesseract supports all six languages natively.',
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
      q: 'What types of tables extract most accurately?',
      a: 'Bordered tables (visible grid lines) and borderless tables with consistent column spacing. Common sources that work well: research paper data tables, pricing grids, comparison charts, annual report figures. Tables with erratic spacing or hand-drawn borders are harder.',
    },
    {
      q: 'Should I use this or the Image to Excel tool?',
      a: 'Use this for CSV — the universal format for spreadsheets, Python/R scripts, and database imports. Use Image to Excel if you need a .xlsx file you can open directly in Excel or Google Sheets without an import step.',
    },
    {
      q: 'Can I convert multiple table images at once?',
      a: 'Yes — drop as many as you need. Each image produces its own .csv file, bundled into a ZIP. For a table that spans multiple pages, combine the resulting CSVs in your spreadsheet tool after export.',
    },
    {
      q: 'How accurate is the extracted data?',
      a: 'Cell text is usually accurate. The thing worth checking is column alignment: whether a number stayed in the column it belongs to. Tables with tight column spacing or slight image skew are most likely to produce drift. Before using the CSV in any analysis, scan a few rows against the original. It takes about 30 seconds and catches the kind of misalignment that would be annoying to find later.',
    },
    {
      q: 'Does it handle numbers accurately?',
      a: 'The tool applies digit-specific correction to columns it detects as numeric — substituting common OCR confusions like O for 0, l for 1, and S for 5. For columns with mixed text and numbers, check the original if precision matters.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. Everything runs in your browser via WebAssembly. Your images never leave your device.',
    },
  ],

  relatedTools: ['image-to-excel', 'receipt-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Table Image to Text Converter — ConvertYard',
    description: 'Extract tables from images into CSV — research papers, price lists, annual reports. Browser-based OCR, no uploads, no account required.',
  },
}
