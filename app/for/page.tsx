import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Upload Kits for Exams & Forms — ConvertYard',
  description:
    'One-click preparation for UPSC, SSC CGL, NEET, JEE Main, IBPS PO, and more. Correct sizes, formats, and dimensions — all in your browser.',
}

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        Upload kits for exams &amp; forms
      </h1>
      <p className="mt-4 text-lg text-fg-muted">
        One-click preparation for UPSC, SSC CGL, NEET, JEE Main, IBPS PO, and more.
        Correct sizes, correct formats, correct dimensions — all in your browser.
      </p>
      <p className="mt-8 text-sm text-fg-subtle">
        Upload kits coming soon. Check back after the next release.
      </p>
      <div className="mt-6">
        <Link
          href="/tools"
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-fg-muted hover:text-fg hover:border-primary transition-colors"
        >
          Browse all tools →
        </Link>
      </div>
    </div>
  )
}
