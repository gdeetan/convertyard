import { compressPDF } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-pdf',
  title: 'Compress PDF',
  subtitle: 'Reduce PDF file size for email and sharing. Built for batches.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  limitationNote: {
    summary: 'What compresses well?',
    body: 'PDFs heavy in metadata, structural overhead, or embedded JPEG images — scanned documents, exported reports — shrink the most. Text-only PDFs and vector-heavy files will see little change. Use Aggressive mode to guarantee a smaller file: it converts every page to an image.',
  },
  convertFn: compressPDF,

  options: [
    {
      type: 'toggle',
      name: 'targetSizeMode',
      label: 'Target size mode',
      hint: 'Set an exact size target. The tool applies up to six compression passes — structural, then image quality reduction — until your target is met.',
      default: false,
    },
    {
      type: 'radio',
      name: 'level',
      label: 'Compression level',
      choices: [
        { value: 'low',        label: 'Low (better quality)' },
        { value: 'medium',     label: 'Medium' },
        { value: 'high',       label: 'High (smallest files)' },
        { value: 'aggressive', label: 'Aggressive (convert to images)' },
      ],
      default: 'medium',
      dependsOn: { name: 'targetSizeMode', value: 'false' },
      conditionalHints: {
        low:        'Cleans up internal structure. Text and images untouched.',
        medium:     'Strips metadata + optimises structure.',
        high:       'Maximum metadata removal + JPEG re-encoding at 30%.',
        aggressive: 'Converts every page to an image. Text won\'t be selectable. Best for scanned documents.',
      },
    },
    {
      type: 'number-with-chips',
      name: 'targetKB',
      label: 'Target size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'KB',
      chips: [
        { label: '100 KB', valueKB: 100 },
        { label: '200 KB', valueKB: 200 },
        { label: '500 KB', valueKB: 500 },
        { label: '1 MB',   valueKB: 1024 },
        { label: '2 MB',   valueKB: 2048 },
        { label: '5 MB',   valueKB: 5120 },
        { label: '10 MB',  valueKB: 10240 },
      ],
      min: 1,
      default: 500,
      dependsOn: { name: 'targetSizeMode', value: 'true' },
    },
  ],

  faq: [
    {
      q: 'What gets removed or changed during compression?',
      a: 'At Medium and High levels, document metadata is stripped — title, author, subject, keywords, producer, and creator fields. The internal object structure is also rewritten using more efficient cross-reference streams. At Low level, only the structure is optimised; metadata is kept.',
    },
    {
      q: 'Will text and images inside my PDF look different after compression?',
      a: 'Text is never affected — it is lossless. In Quick mode, images are not re-compressed either, so quality is preserved exactly. In Target size mode, embedded JPEG images may be re-encoded at lower quality to reach your target.',
    },
    {
      q: 'How much smaller will my PDF get?',
      a: 'Results vary by document. PDFs heavy in structural overhead (many small objects, rich metadata) can shrink 10–30%. PDFs that are mostly scanned images may see little or no reduction because the image data itself is already compressed. For maximum compression of any PDF, switch to Aggressive mode — it converts each page to an image, guaranteeing a smaller file at the cost of text selectability.',
    },
    {
      q: 'What is the email attachment size limit I should target?',
      a: 'Most email providers accept attachments up to 10MB (Gmail, Outlook) or 25MB (some others). If your PDF is still too large after compression, try splitting it into smaller sections first using Split PDF.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Compression runs entirely in your browser. Your PDFs never leave your device.',
    },
    {
      q: 'Can I compress a batch of PDFs at once?',
      a: 'Yes. Drop multiple PDFs at once and they are all compressed using the same settings. Each compressed PDF downloads individually or you can grab all of them as a ZIP.',
    },
    {
      q: 'How does target-size compression work?',
      a: 'Enable Target size mode and enter your target. The tool runs up to six passes: first it strips metadata and rewrites the internal structure, then it re-encodes embedded JPEG images at progressively lower quality (80 → 60 → 40 → 30%). Each pass only keeps the result if it made the file smaller. Processing stops as soon as the target is met.',
    },
    {
      q: "What if my file can't reach my target size?",
      a: "If the PDF is already highly compressed — for example, a scanned document whose images are already low-quality JPEG — there may be nothing left to remove. The tool will return the smallest version it could produce and show you what was achieved versus your target. The file will not be broken; it simply cannot get any smaller without discarding content.",
    },
  ],

  relatedTools: ['merge-pdf', 'pdf-to-jpg'],
  relatedArticles: ['merge-pdf-without-uploading'],

  meta: {
    title: 'Compress PDF — ConvertYard',
    description:
      'Compress PDF files for email and sharing in your browser. Batch up to 1,000 files — no uploads, no account. Choose Low, Medium, or High compression.',
  },
}
