import { compressPDF } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'
import { CompressPdfExplainer } from '@/components/pdf/CompressPdfExplainer'

export const config: ToolConfig = {
  slug: 'compress-pdf',
  title: 'Compress PDF',
  subtitle: 'Hit exact size targets for email limits and government portals. Target-size mode finds the smallest file that meets your threshold.',
  bestFor: 'Best for PDFs too large to email or upload to a government form.',
  explainer: CompressPdfExplainer,
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  limitationNote: {
    summary: 'What compresses well?',
    body: 'PDFs heavy in metadata, structural overhead, or embedded JPEG images — scanned documents, exported reports — shrink the most. Text-only PDFs and vector-heavy files will see little change. Use Aggressive mode to guarantee a smaller file: it converts every page to an image.',
  },
  convertFn: compressPDF,

  optionsWarningFn: (_files, options) => {
    if (options.level === 'aggressive' && options.targetSizeMode !== true) {
      return 'Aggressive mode converts every page to an image. Text won\'t be selectable in the output.'
    }
    if (options.targetSizeMode === true) {
      return 'If your target size can\'t be met while keeping text, we\'ll ask before rasterizing. Rasterizing removes searchable text.'
    }
    return null
  },

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

  advancedDisabledFn: (options) => options.targetSizeMode === true,

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
      name: 'stripPrivateAppData',
      label: 'Strip private app data',
      hint: 'Removes vendor-specific metadata embedded by Photoshop, Illustrator, and other tools.',
      default: false,
    },
  ],

  faq: [
    {
      q: 'Does compression require uploading my PDF?',
      a: 'No. This runs in your browser using WebAssembly; the PDF file isn’t uploaded to an external server. Once the tool is loaded in the browser, you can actually compress PDF files even without an internet connection.',
    },
    {
      q: 'Will compressing make the PDF unsearchable?',
      a: 'No. PDF text is vector data (this includes lines, curves, and font data), and thus stays sharp and searchable regardless of how much compression is applied. Only embedded images are compressed. However, if you choose ‘aggressive’ mode, these layers are flattened and re-encoded as images, so text will no longer be searchable.',
    },
    {
      q: 'Why is my compressed PDF sometimes larger than the original?',
      a: 'This happens when the original file contains heavily compressed images or mostly text with few images. In such cases, there would be little to strip, and the added overhead of re-encoding would typically result in a larger output file than the original.',
    },
    {
      q: 'What does the compression level setting actually change?',
      a: 'Low cleans up the internal structure, or removes unnecessary data. Medium level strips metadata like author name and rebuilds the file into a more compact binary format. High resaves images at a lower quality, usually at 30% - you’ll see more pixelated photos using this preset.',
    },
    {
      q: 'Can I compress a password-protected PDF?',
      a: 'No. ConvertYard cannot read or write encrypted PDFs. You must first use the <a href="/unlock-pdf/">Unlock PDF tool</a> to remove the PDF password before you can use this tool to compress it.',
    },
    {
      q: 'How does target-size mode differ from the compression level slider?',
      a: 'Target-size mode will run the compression up to six passes automatically. It first runs the structural cleanup pass, then slowly lowers image quality from 80 to 30%, only stopping when the target size is met. Use this option if you have a hard limit (for example, an email attachment or a government portal).',
    },
  ],

  relatedTools: ['merge-pdf', 'extract-images', 'pdf-to-jpg'],
  relatedArticles: ['compress-pdf-without-uploading-privacy-guide', 'merge-pdf-without-uploading', 'convertyard-vs-adobe-acrobat-pro'],

  meta: {
    title: 'Compress PDF Files in Your Browser - Nothing Uploads',
    description:
      'Compress PDF files to an exact size: 100 KB, 500 KB, 5 MB. Compress between 1 and 1,000 files in your browser. Nothing uploads.',
  },
}
