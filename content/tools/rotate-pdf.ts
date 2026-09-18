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
      a: 'Your PDF files aren’t uploaded to a server. Everything runs locally in your browser, so you can rotate documents containing your personal information.',
    },
    {
      q: 'Is the rotation saved permanently to the file?',
      a: 'Yes. The rotation will be encoded into the PDF document at the browser level first using PDF-lib. But it won’t be applied directly to the original document, so you can keep the original and rotated PDF (if that is your preference), or overwrite the existing file (or save in the same directory using the same file name).',
    },
    {
      q: 'Will rotation reduce the quality of my PDF?',
      a: 'Nope, quality won’t be affected since the rotation is encoded as metadata. Everything else: text, images, other parts of the file aren’t re-rendered or re-encoded. There’s very little change to the file size, less than 1 KB.',
    },
    {
      q: 'Can I rotate just one page without affecting the rest?',
      a: 'Yes, you can rotate one (or a specific page) or all the pages simultaneously.',
    },
    {
      q: 'Can I rotate a password-protected PDF?',
      a: 'Unfortunately, password-protected PDFs cannot be rotated. You’ll need to remove the password using the <a href="/unlock-pdf/">Unlock PDF Tool</a> before rotating it, then reapply the password (if needed).',
    },
    {
      q: 'What is the rotation increment?',
      a: 'Right now, rotation can be done in 90° increments in both directions: left (or counter-clockwise) or right (clockwise). If you need a special angle or wish to add angles like 15° or 45°, <a href="/contact/">email me</a> to send that request.',
    },
  ],

  relatedTools: ['reorder-pdf-pages', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Rotate PDF Files in Your Browser for Free',
    description: 'This tool rotates your PDF files with a preview so you don\'t have to guess what rotate left right looks like. Rotate per page or the whole document. Nothing uploads.',
  },
}
