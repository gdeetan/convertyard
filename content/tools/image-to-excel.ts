import { imageToExcelVlm } from '@/lib/converters/image-to-excel-vlm'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-to-excel',
  title: 'Image to Excel Converter',
  subtitle: 'Extract tables from images into .xlsx spreadsheets. No retyping.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.xlsx',
  convertFn: imageToExcelVlm,

  limitationNote: {
    summary: 'Uses a local AI model (~2.4 GB download on first use)',
    body: 'Qwen2-VL-2B runs entirely in your browser. First use downloads ~2.4 GB which is then cached — subsequent conversions start immediately. Handles complex multi-column tables, merged headers, and N/A values accurately. Extremely dense nested tables may still need minor cleanup.',
  },

  options: [],

  faq: [
    {
      q: 'How does this work?',
      a: 'It uses Qwen2-VL-2B-Instruct, a 2-billion parameter vision language model that runs entirely in your browser. The model reads the image the same way a person would — understanding headers, merged cells, and N/A values — then outputs the table as a spreadsheet.',
    },
    {
      q: 'Why does the first conversion take so long?',
      a: 'The model (~2.4 GB) downloads to your browser on first use. After that it is cached, so subsequent conversions start immediately. This is a one-time cost — once cached, the tool loads instantly.',
    },
    {
      q: 'Can I open the output directly in Excel or Google Sheets?',
      a: 'Yes. The output is a standard .xlsx file — open it directly in Excel, Google Sheets, or LibreOffice Calc.',
    },
    {
      q: 'What types of tables does it handle best?',
      a: 'Standard bordered and borderless tables with consistent column spacing extract accurately. The AI understands merged header cells, percentage values, and N/A entries. Extremely complex nested tables or handwritten tables may need minor manual cleanup.',
    },
    {
      q: 'Does it work on invoice or receipt images?',
      a: 'For structured receipts with line items, yes. For receipts where you need vendor, date, and total extracted into specific fields, use the Receipt to Text tool instead.',
    },
    {
      q: 'Should I verify the spreadsheet before using it in calculations?',
      a: 'Yes — especially numbers. Scan a few rows to confirm column alignment, and for tables with totals, spot-check those against the original image before building formulas on top of the data.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. The AI model runs locally in your browser. Your images never leave your device.',
    },
  ],

  relatedTools: ['receipt-to-text', 'table-image-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Image to Excel Converter — ConvertYard',
    description: 'Extract tables from images into .xlsx spreadsheets using local AI. No retyping — screenshot or photo a table, get an Excel file back. Runs locally, no uploads.',
  },
}
