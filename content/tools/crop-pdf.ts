import { cropPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'crop-pdf',
  title: 'Crop PDF Pages',
  subtitle: 'Trim margins off every page. Batch-friendly — all processing happens in your browser.',
  bestFor: 'Best for removing excessive whitespace from scanned documents or reducing margins before printing.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: cropPdf,
  enablePresets: true,

  options: [
    {
      type: 'radio',
      name: 'preset',
      label: 'Crop amount',
      choices: [
        { value: '5mm',    label: '5 mm — light trim' },
        { value: '10mm',   label: '10 mm — standard' },
        { value: '15mm',   label: '15 mm — generous' },
        { value: '20mm',   label: '20 mm — aggressive' },
        { value: 'custom', label: 'Custom margins' },
      ],
      default: '10mm',
      conditionalHints: {
        '5mm':    'Removes 5 mm from all four edges.',
        '10mm':   'Removes 10 mm from all four edges. Good default for most documents.',
        '15mm':   'Removes 15 mm from all four edges.',
        '20mm':   'Removes 20 mm from all four edges.',
        'custom': 'Set each margin individually in mm.',
      },
    },
    {
      type: 'number',
      name: 'topMm',
      label: 'Top (mm)',
      min: 0,
      max: 200,
      default: 10,
      hint: 'Crop removed from the top edge of each page',
      dependsOn: { name: 'preset', value: 'custom' },
    },
    {
      type: 'number',
      name: 'rightMm',
      label: 'Right (mm)',
      min: 0,
      max: 200,
      default: 10,
      hint: 'Crop removed from the right edge of each page',
      dependsOn: { name: 'preset', value: 'custom' },
    },
    {
      type: 'number',
      name: 'bottomMm',
      label: 'Bottom (mm)',
      min: 0,
      max: 200,
      default: 10,
      hint: 'Crop removed from the bottom edge of each page',
      dependsOn: { name: 'preset', value: 'custom' },
    },
    {
      type: 'number',
      name: 'leftMm',
      label: 'Left (mm)',
      min: 0,
      max: 200,
      default: 10,
      hint: 'Crop removed from the left edge of each page',
      dependsOn: { name: 'preset', value: 'custom' },
    },
  ],

  faq: [
    {
      q: 'Does cropping upload my PDF to your servers?',
      a: 'No. Cropping runs in your browser using WebAssembly. Your PDF never leaves your device.',
    },
    {
      q: 'What does "crop" actually do to the PDF?',
      a: 'It sets a crop box on each page that tells PDF viewers to display only the inner portion. The original page data is untouched — the crop box is a mask. This is lossless and reversible in a PDF editor.',
    },
    {
      q: 'Will all PDF viewers honour the crop box?',
      a: 'Yes. The crop box is a standard PDF feature supported by Adobe Reader, Chrome, Firefox, Safari, and virtually all modern PDF viewers.',
    },
    {
      q: 'Can I crop different amounts from each edge?',
      a: 'Yes. Choose "Custom margins" and set top, right, bottom, and left independently in millimetres.',
    },
    {
      q: 'Can I crop multiple PDFs at once?',
      a: 'Yes. Drop multiple PDFs and the same crop settings are applied to each file.',
    },
    {
      q: 'What happens if my margins are too large?',
      a: 'If the margins exceed the page dimensions, the tool returns an error for that file. Use smaller values and try again.',
    },
  ],

  relatedTools: ['compress-pdf', 'extract-pages', 'page-numbers', 'delete-pages'],
  relatedArticles: [],

  meta: {
    title: 'Crop PDF Pages — ConvertYard',
    description:
      'Crop margins from PDF pages in your browser. Choose a preset or set custom margins in mm. Batch 1,000 files — no uploads, no account.',
  },
}
