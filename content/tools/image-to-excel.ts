import { imageOcrConvert } from '@/lib/converters/image-ocr'
import { imageToExcelVlm } from '@/lib/converters/image-to-excel-vlm'
import { loadTransformersModel, getVlmDevice } from '@/lib/converters/transformers-client'
import type { ConversionResult, ToolConfig, ToolOptions } from '@/lib/types'

async function convertWithAiMode(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  await loadTransformersModel('table-vlm', pct => onProgress?.(0, Math.round(pct * 0.3)))
  if (getVlmDevice() !== 'webgpu') {
    // WebGPU unavailable — run deterministic OCR; signal via filename so user
    // knows which engine ran (cannot return both a File and a warning message).
    const results = await imageOcrConvert(files, { ...opts, outputMode: 'excel' }, onProgress)
    return results.map(r => {
      if (r instanceof File) {
        return new File(
          [r],
          r.name.replace(/\.xlsx$/, ' (OCR — AI mode needs GPU).xlsx'),
          { type: r.type },
        )
      }
      return r
    })
  }
  return imageToExcelVlm(files, opts, onProgress)
}

export const config: ToolConfig = {
  slug: 'image-to-excel',
  title: 'Image to Excel Converter',
  subtitle: 'Extract tables from images into .xlsx spreadsheets. No retyping.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.xlsx',
  convertFn: (files: File[], opts: ToolOptions, onProgress) =>
    opts.aiMode
      ? convertWithAiMode(files, opts, onProgress)
      : imageOcrConvert(files, { ...opts, outputMode: 'excel' }, onProgress),

  limitationNote: {
    summary: 'OCR by default — AI mode is opt-in and GPU-only',
    body: 'Standard mode uses Tesseract OCR with column detection. Tables with consistent column alignment extract accurately — the thing to spot-check is whether numbers stayed in the right column on tightly-spaced or slightly skewed images. AI mode (toggle below) uses a local vision model and may handle messier layouts, but can misread numbers — always verify. AI mode requires Chrome or Edge with a GPU and downloads ~1.8 GB on first use.',
  },

  options: [
    {
      type: 'toggle',
      name: 'aiMode',
      label: 'AI mode (beta)',
      hint: 'Uses a local vision AI instead of OCR. Better on messy or borderless tables, but may misread numbers — verify output. Requires a GPU-capable browser (Chrome or Edge). Downloads ~1.8 GB on first use.',
      default: false,
    },
  ],

  faq: [
    {
      q: 'How does this work?',
      a: 'By default the tool uses Tesseract OCR with pixel-level column detection to reconstruct the table grid from the image. Words are assigned to cells based on their horizontal position, and the result is written to .xlsx. This approach cannot invent data — it can only misread a character, never fabricate a row or shuffle a value between columns. AI mode (optional) uses Qwen2.5-VL running locally in your browser — better on messy or handwritten layouts, but generative models can misread numbers, so verify before using in calculations.',
    },
    {
      q: 'Why does the first AI-mode conversion take so long?',
      a: 'When AI mode is enabled, the Qwen2.5-VL model (~1.8 GB) downloads to your browser on first use. After that it is cached, so subsequent conversions start immediately. Standard mode downloads only Tesseract language data (a few MB, shared with other OCR tools).',
    },
    {
      q: 'Can I open the output directly in Excel or Google Sheets?',
      a: 'Yes. The output is a standard .xlsx file — open it directly in Excel, Google Sheets, or LibreOffice Calc.',
    },
    {
      q: 'What types of tables does it handle best?',
      a: 'Bordered tables (with visible grid lines) and borderless tables with consistent column spacing extract most reliably. If column values are very close together or the image has slight skew, spot-check the column alignment after export.',
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
      a: 'No. Both OCR and AI mode run entirely in your browser. Your images never leave your device.',
    },
  ],

  relatedTools: ['receipt-to-text', 'table-image-to-text', 'jpg-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Image to Excel Converter — ConvertYard',
    description: 'Extract tables from images into .xlsx spreadsheets. Browser-based OCR — no uploads, no account. Batch convert screenshots and photos to Excel in seconds.',
  },
}
