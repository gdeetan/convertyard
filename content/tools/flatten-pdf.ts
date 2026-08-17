import { flattenPdf } from '@/lib/converters/pdf-tier3'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'flatten-pdf',
  title: 'Flatten PDF',
  subtitle: 'Local-first PDF form flattening. Built for batches.',
  bestFor: 'Best for locking filled PDF forms before sending — prevents recipients from editing your answers.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: flattenPdf,
  enablePresets: false,
  options: [],
  faq: [
    {
      q: 'Are my PDFs uploaded to a server?',
      a: 'Never. Flattening happens in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'What does flattening actually do?',
      a: 'Flattening converts interactive form fields (text boxes, checkboxes, dropdowns) into static page content. After flattening, the values are visible as text but the fields can no longer be edited.',
    },
    {
      q: 'What happens if my PDF has no form fields?',
      a: 'Nothing changes. The tool processes the file and returns it unchanged — it will not throw an error or modify the content.',
    },
    {
      q: 'Will annotations (sticky notes, highlights) be flattened too?',
      a: 'Yes. PDF annotations are included in the flatten operation and become part of the static page content.',
    },
    {
      q: 'Can I flatten multiple PDFs at once?',
      a: 'Yes. Drop as many PDFs as you like — each is flattened independently and downloaded as a ZIP.',
    },
  ],
  relatedTools: ['compress-pdf', 'watermark-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Flatten a PDF — ConvertYard',
    description: 'Flatten PDF form fields and annotations into static content in your browser. Lock filled forms before sharing. Batch 1,000 files — no uploads.',
  },
}
