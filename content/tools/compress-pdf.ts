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

  advancedOptions: [
    { type: 'section-header' as const, label: 'Images' },
    {
      type: 'toggle' as const,
      name: 'dpiMode',
      label: 'Custom DPI',
      hint: 'Override the automatic DPI choice with a specific target.',
      default: false,
    },
    {
      type: 'slider' as const,
      name: 'targetDpi',
      label: 'Target DPI',
      hint: '72 = smallest, 300 = near-print. 150 is a good default for screen viewing.',
      min: 72,
      max: 300,
      step: 1,
      default: 150,
      dependsOn: { name: 'dpiMode', value: 'true' },
    },
    {
      type: 'slider' as const,
      name: 'jpegQuality',
      label: 'JPEG quality',
      hint: 'Quality for embedded JPEG images. 70 is a good balance; below 50 becomes visibly lossy.',
      min: 10,
      max: 95,
      step: 5,
      default: 70,
    },
    {
      type: 'toggle' as const,
      name: 'grayscale',
      label: 'Convert to grayscale',
      hint: 'Removes all colour information. Cuts image size ~60%. Text stays crisp.',
      default: false,
    },
    { type: 'section-header' as const, label: 'Strip' },
    {
      type: 'toggle' as const,
      name: 'stripMetadata',
      label: 'Metadata',
      hint: 'Removes title, author, subject, keywords, producer, and creator fields.',
      default: true,
    },
    {
      type: 'toggle' as const,
      name: 'stripAnnotations',
      label: 'Annotations',
      hint: 'Removes comments, highlights, and other annotation objects.',
      default: false,
    },
    {
      type: 'toggle' as const,
      name: 'stripBookmarks',
      label: 'Bookmarks',
      hint: 'Removes the document outline (navigation bookmarks in sidebar).',
      default: false,
    },
    {
      type: 'toggle' as const,
      name: 'stripEmbedded',
      label: 'Embedded files',
      hint: 'Removes files attached to the PDF (e.g., original Word source). Page content is unaffected.',
      default: false,
    },
    {
      type: 'toggle' as const,
      name: 'stripJS',
      label: 'JavaScript',
      hint: 'Removes embedded JavaScript actions. Recommended for any PDF received externally.',
      default: false,
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
    {
      q: 'What if my PDF is already smaller than my target?',
      a: 'We return your original file unchanged. There is no point re-encoding something that is already within your limit — doing so would only degrade quality or strip metadata for no benefit. You will see a message confirming that no compression was needed.',
    },
    {
      q: 'What does DPI mean for PDFs and when should I change it?',
      a: 'DPI (dots per inch) controls how finely images are rendered inside the PDF. A 300 DPI scan has four times the data of a 150 DPI equivalent image of the same size. If your PDF is mainly images — scanned pages, exported slides — lowering DPI from 300 to 150 typically cuts image data by 75%. Text and vector elements are unaffected by DPI changes.',
    },
    {
      q: 'Will converting to grayscale affect text readability?',
      a: 'No. Text rendered in black is already grayscale — it will look identical. The grayscale conversion only removes colour data from embedded images. If your PDF contains colour charts, photos, or branded graphics that need to stay in colour, leave this option off.',
    },
    {
      q: 'Can I strip embedded files without affecting the PDF content?',
      a: 'Yes. Embedded files are attachments stored inside the PDF — like an original Word document or a spreadsheet that was attached by the author. Stripping them removes those attachments but leaves all visible page content (text, images, drawings) completely intact.',
    },
    {
      q: 'How does the visual preview work if files never leave my browser?',
      a: 'The preview is rendered entirely in your browser using MuPDF, a PDF rendering engine compiled to WebAssembly. When you drop a file, the first page is rendered to an image locally. After compression completes, the compressed file is rendered the same way. No data leaves your device at any point — the rendering, comparison, and download all happen on your machine.',
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
