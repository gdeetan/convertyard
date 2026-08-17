import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'digital-sign-pdf',
  title: 'Sign PDF Online',
  subtitle: 'Draw or type your signature and embed it in a PDF — all in your browser.',
  bestFor: 'Best for adding a personal signature to contracts, forms, and letters before sending.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: () => Promise.resolve([]),
  options: [],
  faq: [
    {
      q: 'Are my PDFs uploaded to a server?',
      a: 'Never. Signature embedding happens entirely in your browser. Your PDF and signature never leave your device.',
    },
    {
      q: 'Is this a legally binding digital signature?',
      a: 'No. This tool embeds a signature image into the PDF. It is not a cryptographic digital signature (like those produced by DocuSign or Adobe Sign) and does not create a legally binding signature under most electronic signature laws.',
    },
    {
      q: 'Can I sign multiple pages?',
      a: 'Yes. After placing your signature, choose "All pages" or "Select pages" to sign more than one page. When you click "Position on each page →", a step-through wizard opens so you can drag the signature to a different spot on each page individually before the PDF is saved.',
    },
    {
      q: 'Can I place the signature in a different position on each page?',
      a: 'Yes. When signing multiple pages, the tool enters a positioning wizard that shows each page one at a time. Drag the signature where you want it on that page, then click "Next" to move to the next page. Each page remembers its own position independently.',
    },
    {
      q: 'What is the difference between draw and type?',
      a: 'Draw lets you use your mouse or trackpad to write your actual signature. Type renders your name in a script-style font as a typed signature alternative.',
    },
    {
      q: 'Can I reposition the signature after placing it?',
      a: 'Yes. Drag the signature to your preferred position on the page preview before clicking Apply Signature.',
    },
  ],
  relatedTools: ['flatten-pdf', 'watermark-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Sign a PDF — ConvertYard',
    description: 'Add your signature to a PDF in your browser. Draw or type your signature, drag to position, and download. No uploads, no account, entirely local.',
  },
}
