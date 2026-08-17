import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'rotate-pdf',
  title: 'Rotate PDF Pages',
  subtitle: 'Rotate individual pages or the whole PDF permanently. Preview thumbnails before saving. Nothing leaves your browser.',
  bestFor: 'Best for fixing sideways pages in a scanned document before sending or printing.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'Are my PDFs uploaded to a server during rotation?',
      a: 'Never. Rotation runs entirely in your browser using WebAssembly. Your PDF does not leave your device at any point.',
    },
    {
      q: 'Is the rotation saved permanently to the file?',
      a: 'Yes. The rotation is encoded directly into the PDF page specification using pdf-lib. When you open the output in any PDF viewer, the page will be correctly oriented. This is not a viewer preference — it is permanently written into the file.',
    },
    {
      q: 'Will rotation reduce the quality of my PDF?',
      a: 'No. Rotation is encoded as metadata in the page dictionary. The page content — text, images, vectors — is never re-rendered or re-encoded. The file size changes by less than 1 KB.',
    },
    {
      q: 'Can I rotate just one page without affecting the rest?',
      a: 'Yes. Click the rotate buttons on the individual page thumbnail. Other pages are left exactly as they are.',
    },
    {
      q: 'Can I rotate a password-protected PDF?',
      a: 'PDFs protected with an open password cannot be processed here. Remove the password first using the Unlock PDF tool. PDFs with copy or print restrictions but no open password can usually be rotated without issue.',
    },
    {
      q: 'What is the rotation increment?',
      a: 'Rotation is applied in 90° increments only — left (counter-clockwise) or right (clockwise). There is no support for arbitrary angles like 15° or 45°.',
    },
  ],

  relatedTools: ['reorder-pdf-pages', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Rotate PDF Pages — ConvertYard',
    description: 'Rotate PDF pages 90°, 180°, or 270° and save the result. All pages or selected ones. Preview first. Runs in your browser — nothing is uploaded. Kept after save.',
  },
}
