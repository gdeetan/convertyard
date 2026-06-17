import type { ToolConfig, ConversionResult } from '@/lib/types'

async function _stub(_files: File[]): Promise<ConversionResult[]> { return [] }

export const config: ToolConfig = {
  slug: 'protect-pdf',
  title: 'Protect PDF',
  subtitle: 'Password-protect PDFs with AES encryption. Set permissions. Browser-only.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: _stub,
  faq: [
    {
      q: 'What encryption is used?',
      a: 'AES-128 encryption, which is the standard supported by pdf-lib in the browser and widely supported by PDF readers.',
    },
    {
      q: 'What is the difference between user password and owner password?',
      a: "The user password is required to open the PDF. The owner password is required to change its permissions or remove protection. If you set only a user password, the owner password defaults to the same value.",
    },
    {
      q: 'What permissions can I set?',
      a: "You can restrict printing, copying text, and editing. When restrictions are set, users who only have the user password cannot perform those actions.",
    },
    {
      q: 'What if I forget the password?',
      a: "There is no way to recover a lost password. Store it in a password manager. The encryption is real — if the password is lost, the file contents are inaccessible.",
    },
    {
      q: 'Is my password sent to your servers?',
      a: 'Never. Encryption runs entirely in your browser via WebAssembly. Your PDF and your password never leave your device.',
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
    description: 'Add password protection to your PDFs with AES encryption. Set open and permission passwords. Browser-only — your password never leaves your device.',
  },
}
