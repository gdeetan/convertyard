import { editPdfMetadata } from '@/lib/converters/pdf-tier3'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'edit-metadata',
  title: 'Edit PDF Metadata',
  subtitle: 'Local-first PDF metadata editor. Built for batches.',
  bestFor: 'Best for setting document titles, authors, and keywords before sharing PDFs or archiving them.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: editPdfMetadata,
  enablePresets: true,
  options: [
    {
      type: 'dropdown' as const,
      name: 'title',
      label: 'Title',
      choices: [
        { value: '', label: '(clear)' },
      ],
      default: '',
      hint: 'Document title shown in PDF readers.',
    },
    {
      type: 'dropdown' as const,
      name: 'author',
      label: 'Author',
      choices: [
        { value: '', label: '(clear)' },
      ],
      default: '',
    },
    {
      type: 'dropdown' as const,
      name: 'subject',
      label: 'Subject',
      choices: [
        { value: '', label: '(clear)' },
      ],
      default: '',
    },
    {
      type: 'dropdown' as const,
      name: 'keywords',
      label: 'Keywords',
      choices: [
        { value: '', label: '(clear)' },
      ],
      default: '',
      hint: 'Semicolon-separated keywords, e.g. "report; finance; 2026".',
    },
    {
      type: 'dropdown' as const,
      name: 'creator',
      label: 'Creator application',
      choices: [
        { value: '',               label: '(clear)' },
        { value: 'ConvertYard',    label: 'ConvertYard' },
        { value: 'Microsoft Word', label: 'Microsoft Word' },
        { value: 'Adobe Acrobat', label: 'Adobe Acrobat' },
      ],
      default: '',
    },
  ],
  faq: [
    {
      q: 'Are my PDFs uploaded to a server?',
      a: 'Never. Metadata editing runs entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'What is PDF metadata used for?',
      a: 'PDF metadata (title, author, subject, keywords) is read by PDF viewers, search engines, and document management systems. Setting it correctly improves discoverability and professionalism.',
    },
    {
      q: 'How do I clear a metadata field?',
      a: 'Select "(clear)" from the dropdown for any field you want to remove.',
    },
    {
      q: 'Does the same metadata get applied to all files in a batch?',
      a: 'Yes. The same values are applied to every PDF in the batch. If you need different metadata per file, process them one at a time.',
    },
    {
      q: 'Will editing metadata change the visible content of my PDF?',
      a: 'No. Metadata is stored separately from page content. Your text, images, and layout are completely unaffected.',
    },
  ],
  relatedTools: ['flatten-pdf', 'compress-pdf', 'watermark-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Edit PDF Metadata — ConvertYard',
    description: 'Edit PDF metadata — title, author, subject, keywords — in your browser. Batch 1,000 files at once. No uploads, no account, entirely local.',
  },
}
