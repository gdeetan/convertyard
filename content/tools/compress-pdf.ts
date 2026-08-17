import { compressPDF } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-pdf',
  title: 'Compress PDF',
  subtitle: 'Hit exact size targets for email limits and government portals. Target-size mode finds the smallest file that meets your threshold.',
  bestFor: 'Best for PDFs too large to email or upload to a government form.',
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

  enablePresets: true,

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
    { type: 'section-header' as const, label: 'Fonts' },
    {
      type: 'toggle' as const,
      name: 'subsetFonts',
      label: 'Subset embedded fonts',
      hint: 'Improves savings estimate for documents with unsubsetted fonts. Full glyph-level subsetting requires a native PDF tool.',
      default: true,
    },
    {
      type: 'toggle' as const,
      name: 'removeUnusedFonts',
      label: 'Remove unused fonts',
      hint: 'Deletes font resources that are embedded but never referenced by any page content.',
      default: false,
    },
    { type: 'section-header' as const, label: 'Form fields' },
    {
      type: 'toggle' as const,
      name: 'stripFormFields',
      label: 'Remove form fields',
      hint: 'Flattens or removes interactive form elements. Choose strategy below.',
      default: false,
    },
    {
      type: 'dropdown' as const,
      name: 'formFieldStrategy',
      label: 'Form field strategy',
      choices: [
        { value: 'flatten', label: 'Flatten (keep visual appearance)' },
        { value: 'remove', label: 'Remove entirely' },
      ],
      default: 'flatten',
      dependsOn: { name: 'stripFormFields', value: 'true' },
    },
    { type: 'section-header' as const, label: 'Structure' },
    {
      type: 'toggle' as const,
      name: 'linearize',
      label: 'Linearize for fast web view',
      hint: 'Reorganizes the PDF so page 1 loads immediately when opened in a browser before the full file downloads.',
      default: false,
    },
    {
      type: 'toggle' as const,
      name: 'stripPrivateAppData',
      label: 'Strip private app data',
      hint: 'Removes vendor-specific metadata embedded by Photoshop, Illustrator, and other tools.',
      default: false,
    },
  ],

  faq: [
    {
      q: 'Does compression require uploading my PDF?',
      a: 'No. Compression runs entirely in your browser using WebAssembly. Your PDF is never sent to a server — ConvertYard only delivers the tool code.',
    },
    {
      q: 'Will compressing make the PDF unsearchable?',
      a: 'No. Text in PDFs is stored as vector data, not pixels, so it stays sharp and fully searchable regardless of compression level. Only embedded images are recompressed. The exception is Aggressive mode, which converts every page to an image — that does make text unselectable.',
    },
    {
      q: 'Why is my compressed PDF sometimes larger than the original?',
      a: 'This happens when the original already has heavily compressed images or contains mostly text with few images. There is little left to remove, and re-encoding can add overhead. The tool will return whichever version is smaller.',
    },
    {
      q: 'What does the compression level setting actually change?',
      a: 'Low cleans up internal structure only. Medium strips metadata and rewrites cross-reference streams. High re-encodes embedded JPEG images at 30% quality in addition to metadata removal. Text and vector graphics are unaffected by any setting except Aggressive.',
    },
    {
      q: 'Can I compress a password-protected PDF?',
      a: 'No. The tool cannot read encrypted PDFs. Remove the password first using the Unlock PDF tool, then compress.',
    },
    {
      q: 'How does target-size mode differ from the compression level slider?',
      a: 'Target-size mode runs up to six compression passes automatically — structural cleanup, then progressively lower JPEG quality (80 → 60 → 40 → 30%) — stopping as soon as your size target is met. The slider applies a single fixed pass. Use target-size mode when you have a hard limit (email attachment ceiling, government portal cap).',
    },
  ],

  relatedTools: ['merge-pdf', 'extract-images', 'pdf-to-jpg'],
  relatedArticles: ['compress-pdf-without-uploading-privacy-guide', 'merge-pdf-without-uploading', 'convertyard-vs-adobe-acrobat-pro'],

  meta: {
    title: 'PDF Compressor — ConvertYard',
    description:
      'Compress PDF files for email and sharing in your browser. Batch up to 1,000 files — no uploads, no account. Choose Low, Medium, or High compression.',
  },
}
