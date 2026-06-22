import type { ToolConfig, ConversionResult } from '@/lib/types'

// Page uses a custom UI with password inputs and permission toggles that calls
// protectPdf() from mupdf-client directly — ToolShell's convertFn is not invoked.
async function _noopForToolShell(_files: File[]): Promise<ConversionResult[]> { return [] }

export const config: ToolConfig = {
  slug: 'protect-pdf',
  title: 'Protect PDF',
  subtitle: 'Password-protect PDFs with AES encryption. Set permissions. Browser-only.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: _noopForToolShell,
  faq: [
    {
      q: 'What encryption is used?',
      a: 'AES-256 by default — the strongest encryption supported by all modern PDF readers. AES-128 is available for compatibility with older software.',
    },
    {
      q: 'What is the difference between user password and owner password?',
      a: "The user password is required to open the PDF. The owner password is required to change its permissions or remove protection. If you set only a user password, the owner password defaults to the same value.",
    },
    {
      q: 'What permissions can I set?',
      a: "You can restrict printing, copying text, editing, and filling forms. When restrictions are set, users who only have the user password cannot perform those actions. The owner password bypasses all restrictions.",
    },
    {
      q: 'What if I forget the password?',
      a: "There is no way to recover a lost password. Store it in a password manager. The encryption is real — if the password is lost, the file contents are inaccessible.",
    },
    {
      q: 'Is my password sent to your servers?',
      a: 'Never. Encryption runs entirely in your browser using WebAssembly. Your PDF and your password never leave your device.',
    },
    {
      q: 'Can I batch-protect multiple PDFs with the same password?',
      a: 'Yes. Set the password once and all dropped PDFs are protected with that password.',
    },
  ],
  relatedTools: ['unlock-pdf', 'redact-pdf', 'compress-pdf', 'watermark-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Protect PDF — Password Protect PDF — ConvertYard',
    description: 'Add password protection to your PDFs with AES-256 encryption. Set open and permission passwords. Browser-only — your password never leaves your device.',
  },
}
