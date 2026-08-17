import type { ToolConfig, ConversionResult } from '@/lib/types'

// Page uses a custom UI with per-file password inputs and calls unlockPdf() from
// mupdf-client directly — ToolShell's convertFn is not invoked by this page.
async function _noopForToolShell(_files: File[]): Promise<ConversionResult[]> { return [] }

export const config: ToolConfig = {
  slug: 'unlock-pdf',
  title: 'Unlock PDF',
  subtitle: 'Remove the password from your own PDF files. Your password never leaves your device.',
  bestFor: 'Best for removing the open password from a PDF you own before editing or compressing it.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: _noopForToolShell,
  faq: [
    {
      q: 'Does my password get sent to your servers when unlocking?',
      a: 'Never. The decryption happens entirely inside your browser using WebAssembly. Your file and your password never leave your device.',
    },
    {
      q: 'Can this tool crack or guess a PDF password?',
      a: 'No. This tool only removes password protection when you provide the correct password yourself. There is no brute-force or guessing. If you do not know the password, this tool cannot help.',
    },
    {
      q: 'Is it legal to unlock a PDF?',
      a: 'It is legal to remove password protection from a file you own and have the password for. Removing protection from someone else\'s file without permission may violate copyright law in your jurisdiction.',
    },
    {
      q: 'What is the difference between an open password and a permissions password?',
      a: 'An open password prevents the file from being opened at all without the correct password. A permissions password restricts actions like printing or copying but does not prevent opening. This tool removes the open password — permissions restrictions on files with no open password are not stripped.',
    },
    {
      q: 'What if I have multiple PDFs with different passwords?',
      a: 'Enter each file\'s password individually in the list. Files where the password is wrong are skipped with an error — the other files are still processed and available for download.',
    },
    {
      q: 'What if I forgot the password?',
      a: 'This tool cannot recover forgotten passwords. It only decrypts PDFs when you provide the correct password.',
    },
  ],
  relatedTools: ['protect-pdf', 'compress-pdf', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Unlock PDF — Remove Password — ConvertYard',
    description: 'Remove the password from your own PDF files. Browser-only — your password never leaves your device. Batch unlock up to 1,000 PDFs with the correct password.',
  },
}
