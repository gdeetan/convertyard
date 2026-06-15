import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'rotate-pdf',
  title: 'Rotate PDF Pages',
  subtitle: 'Rotate pages permanently. Preview thumbnails before saving. Built for batches.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'Is the rotation saved permanently to the file?',
      a: 'Yes. We use pdf-lib to encode the rotation directly into the PDF page specification. When you open the output file in Adobe Reader, Preview, or any other PDF viewer, the page will be rotated. This is not a view preference — it is permanently written into the file.',
    },
    {
      q: 'Can I rotate just one page?',
      a: 'Yes. Click the rotate buttons directly on the page thumbnail you want to change. Other pages are left untouched.',
    },
    {
      q: 'Can I rotate all pages at once?',
      a: 'Yes. Use the "Rotate all left" or "Rotate all right" buttons above the grid to apply 90° rotation to every page in one click.',
    },
    {
      q: 'Will rotation reduce the quality of my PDF?',
      a: 'No. Rotation is encoded as metadata in the page dictionary. The page content — text, images, vectors — is never re-rendered or re-encoded. File size changes by less than 1KB.',
    },
    {
      q: 'Can I rotate a password-protected PDF?',
      a: 'If the PDF has a read password, your browser may prompt you to enter it. If it is copy-protected without a password prompt, rotation will still work — we open the file with encryption ignored for read-only operations.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Rotation runs entirely in your browser using WebAssembly. Your PDF does not leave your device at any point.',
    },
  ],

  relatedTools: ['reorder-pdf-pages', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Rotate PDF Pages — ConvertYard',
    description: 'Rotate PDF pages permanently in your browser. Rotate all pages or individual ones. Preview thumbnails before saving. Files never leave your device.',
  },
}
