import type { ToolConfig, ConversionResult } from '@/lib/types'

// Page uses a custom UI with password inputs and permission toggles that calls
// protectPdf() from mupdf-client directly — ToolShell's convertFn is not invoked.
async function _noopForToolShell(_files: File[]): Promise<ConversionResult[]> { return [] }

export const config: ToolConfig = {
  slug: 'protect-pdf',
  title: 'Protect PDF',
  subtitle: 'Password-protect PDFs with AES encryption. Set permissions. Browser-only.',
  bestFor: 'Best for locking a confidential PDF before sharing it with specific recipients.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: _noopForToolShell,
  faq: [
    {
      q: 'Does my password get sent to your servers?',
      a: 'Never. Encryption runs entirely in your browser using WebAssembly. Your PDF and your password never leave your device.',
    },
    {
      q: 'What is the difference between user password and owner password?',
      a: 'The user password is required to open the PDF. The owner password is required to change permissions or remove protection. If you set only a user password, the owner password defaults to the same value. Most use cases only need a user password.',
    },
    {
      q: 'What permissions can I restrict?',
      a: 'You can restrict printing, copying text, editing content, and filling forms. Users who only have the user password cannot perform those actions. The owner password bypasses all restrictions.',
    },
    {
      q: 'Will AES-256 protection prevent someone from printing the PDF?',
      a: 'Yes — PDF readers that follow the specification will honour print restrictions. However, screen capture is always possible regardless of permissions, and some third-party PDF tools ignore permission flags. Restrictions are a deterrent, not a technical lock.',
    },
    {
      q: 'What if I forget the password?',
      a: 'There is no recovery. Store it in a password manager before protecting the file. The AES encryption is real — a lost password means the file contents are permanently inaccessible.',
    },
  ],
  relatedTools: ['unlock-pdf', 'redact-pdf', 'compress-pdf', 'watermark-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Protect PDF — Password Protect PDF — ConvertYard',
    description: 'Add password protection to your PDFs with AES-256 encryption. Set open and permission passwords. Browser-only — your password never leaves your device.',
  },
}
