import { heicToPdf } from '@/lib/converters/heic-to-pdf'
import { HeicPdfPageList } from '@/components/tool-shell/heic-pdf-page-list'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'heic-to-pdf',
  title: 'HEIC to PDF Converter',
  subtitle: 'Local-first HEIC to PDF. Built for batches.',
  bestFor: 'Best for turning iPhone photo batches into a single shareable PDF or individual PDFs.',
  category: 'pdf',
  accepts: ['image/heic', 'image/heif'],
  acceptsExt: ['.heic', '.heif', '.hif'],
  outputExt: '.pdf',
  convertFn: heicToPdf,
  enablePresets: true,
  interactivePanel: HeicPdfPageList,
  howItWorks: [
    { label: 'Drop your HEIC files', desc: 'Drag in iPhone photos, or a whole folder. Up to 1,000 files. Nothing is uploaded.' },
    { label: 'Set order and layout', desc: 'Drag to reorder, rotate sideways shots, pick page size, margins, and quality.' },
    { label: 'Click Convert', desc: 'HEIC decoding and PDF creation run in your browser. Your photos never leave this device.' },
    { label: 'Download', desc: 'Get one combined PDF or one PDF per photo. Batches download as a ZIP.' },
  ],
  options: [
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output',
      choices: [
        { value: 'all-in-one', label: 'All images in one PDF' },
        { value: 'one-per-image', label: 'One PDF per image' },
      ],
      default: 'all-in-one',
      conditionalHints: {
        'all-in-one': 'Combine all photos into a single multi-page PDF. Drag rows to set page order.',
        'one-per-image': 'Each HEIC becomes its own PDF file.',
      },
    },
    {
      type: 'radio',
      name: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'a4', label: 'A4' },
        { value: 'letter', label: 'US Letter' },
        { value: 'legal', label: 'Legal' },
        { value: 'fit-to-image', label: 'Fit to image' },
      ],
      default: 'a4',
      conditionalHints: {
        a4: 'Images are scaled to fit A4 with the margin you choose.',
        letter: 'Images are scaled to fit US Letter with the margin you choose.',
        legal: 'US Legal (8.5 × 14 in). Use for longer printouts.',
        'fit-to-image': 'Each page matches the image dimensions. Best for screen viewing, not print.',
      },
    },
    {
      type: 'radio',
      name: 'orientation',
      label: 'Orientation',
      choices: [
        { value: 'auto', label: 'Auto' },
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
      default: 'auto',
      hint: 'Auto matches each photo. Only applies to A4, Letter, and Legal.',
    },
    {
      type: 'radio',
      name: 'margin',
      label: 'Margin',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'small', label: 'Small' },
        { value: 'large', label: 'Large' },
      ],
      default: 'small',
      hint: 'Ignored when page size is Fit to image.',
    },
    {
      type: 'radio',
      name: 'qualityPreset',
      label: 'Quality',
      choices: [
        { value: 'print', label: 'Print' },
        { value: 'share', label: 'Share' },
        { value: 'portal', label: 'Portal' },
      ],
      default: 'share',
      conditionalHints: {
        print: 'Highest JPEG quality, original resolution. Large files.',
        share: 'Email-friendly. Long edge capped at 2048 px.',
        portal: 'Smaller files for upload forms. Long edge capped at 1600 px.',
      },
    },
    {
      type: 'number-with-chips',
      name: 'maxSizeKb',
      label: 'Max PDF size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'MB',
      chips: [
        { label: '2 MB', valueKB: 2048 },
        { label: '5 MB', valueKB: 5120 },
        { label: '10 MB', valueKB: 10240 },
      ],
      min: 0,
      default: 0,
      hint: '0 = no limit. Quality and resolution drop until the PDF fits.',
    },
    {
      type: 'radio',
      name: 'captions',
      label: 'Caption',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'filename', label: 'Filename' },
        { value: 'date', label: 'Date taken' },
      ],
      default: 'none',
    },
  ],
  advancedOptions: [
    {
      type: 'toggle',
      name: 'stripGps',
      label: 'Strip GPS',
      default: true,
      hint: 'On by default. Photos are re-encoded without location, and GPS is not written into the PDF.',
    },
    {
      type: 'radio',
      name: 'livePhoto',
      label: 'Live Photo / burst',
      choices: [
        { value: 'still', label: 'Key still only' },
        { value: 'all-stills', label: 'All stills as pages' },
      ],
      default: 'still',
      hint: 'Live Photos and bursts can contain more than one still. Extra stills become extra PDF pages.',
    },
  ],
  faq: [
    {
      q: 'Are my HEIC photos uploaded to a server?',
      a: 'Never. HEIC decoding and PDF creation both run in your browser. Your photos never leave your device.',
    },
    {
      q: 'What is the difference between the output modes?',
      a: 'All images in one PDF combines your photos into a single multi-page document. One PDF per image creates a separate PDF for each HEIC. Drag the list to set page order before converting.',
    },
    {
      q: 'Will the image quality be preserved?',
      a: 'Photos are re-encoded as JPEG inside the PDF. Print keeps near-original resolution. Share (the default) caps the long edge at 2048 px so a batch of iPhone photos still emails. Portal is smaller still, for upload forms.',
    },
    {
      q: 'Can I convert HEIF files as well as HEIC?',
      a: 'Yes. .heic, .heif, and .hif files are supported — they use the same underlying format.',
    },
    {
      q: 'What does "Fit to image" page size mean?',
      a: 'The PDF page is sized to the image. Use A4, Letter, or Legal when you need a standard paper size for printing.',
    },
    {
      q: 'How do I keep the PDF under a size limit?',
      a: 'Pick Share or Portal, or set Max PDF size (2 MB, 5 MB, or 10 MB). The converter lowers quality and resolution until the file fits.',
    },
    {
      q: 'Is GPS location copied into the PDF?',
      a: 'No, not by default. Strip GPS is on, so location is not written into the PDF metadata. Turn it off only if you need the coordinates kept.',
    },
  ],
  optionsWarningFn: (files, options) => {
    if (options.qualityPreset === 'print' && files.length >= 20) {
      return 'Print quality keeps full resolution. 20+ iPhone photos can make a very large PDF. Use Share if you need to email it.'
    }
    return null
  },
  relatedTools: ['heic-to-jpg', 'heic-to-png', 'jpg-to-pdf', 'compress-pdf'],
  relatedArticles: ['what-is-heic', 'heic-to-jpg-on-windows'],
  meta: {
    title: 'HEIC to PDF Converter - Nothing Uploads, No Paywall',
    description: 'Convert iPhone HEIC files to PDF in your browser. Batch up to 1,000 photos, combine into one PDF, set page size and quality. 100% free. Nothing uploads.',
  },
}
