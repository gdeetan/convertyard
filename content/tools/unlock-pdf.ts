import type { ToolConfig, ConversionResult } from '@/lib/types'

async function _stub(_files: File[]): Promise<ConversionResult[]> { return [] }

export const config: ToolConfig = {
  slug: 'unlock-pdf',
  title: 'Unlock PDF',
  subtitle: 'Remove the password from your own PDF files. Your password never leaves your device.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: _stub,
  faq: [
    {
      q: 'Can this tool crack or guess a PDF password?',
      a: "No. This tool only removes password protection when you provide the correct password yourself. We do not attempt to crack, brute-force, or guess passwords. If you don't know the password, we cannot help.",
    },
    {
      q: 'Is it legal to unlock a PDF?',
      a: "It is legal to remove password protection from a file you own and have the password for. Removing protection from someone else's file without permission may violate copyright law in your jurisdiction.",
    },
    {
      q: 'Is my password sent to your servers?',
      a: 'Never. The decryption happens entirely inside your browser using WebAssembly. Your file and your password never leave your device.',
    },
    {
      q: 'What if I have multiple PDFs with different passwords?',
      a: 'Enter each file\'s password individually in the list. Files where the password is wrong are skipped with an error — the other files are still processed.',
    },
    {
      q: 'What if the PDF is not password-protected?',
      a: 'Unprotected PDFs are returned as-is. No changes are made.',
    },
    {
      q: 'What if I forgot the password?',
      a: 'We cannot recover forgotten passwords. This tool only decrypts PDFs when you provide the correct password.',
    },
  ],
  relatedTools: ['protect-pdf', 'compress-pdf', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Unlock PDF — Remove PDF Password — ConvertYard',
    description: 'Remove the password from your own PDF files. Browser-only — your password never leaves your device. Batch unlock up to 1,000 PDFs with the correct password.',
  },
}
