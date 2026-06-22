import type { Metadata } from 'next'
import Link from 'next/link'
import { verticals } from '@/content/vertical-registry'

export const metadata: Metadata = {
  title: 'Upload Kits for Exams & Forms — ConvertYard',
  description:
    'One-click preparation for UPSC, SSC CGL, NEET, JEE Main, IBPS PO, and more. Correct sizes, formats, and dimensions — all in your browser.',
}

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Upload kits for exams &amp; forms
        </h1>
        <p className="mt-4 text-lg text-fg-muted">
          Exact photo and signature specs for Indian competitive exams and government forms.
          Crop, compress, and download — all in your browser. No uploads, no accounts.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2" role="list">
        {verticals.map(v => (
          <li key={v.slug}>
            <Link
              href={`/for/${v.slug}/`}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-5 transition-colors hover:border-primary hover:bg-bg-muted"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-base font-semibold text-fg">{v.name}</span>
                <span className="shrink-0 text-xs text-fg-subtle capitalize">{v.category}</span>
              </div>
              <p className="text-sm text-fg-muted line-clamp-2">{v.subhead}</p>
              <span className="mt-1 text-xs font-medium text-primary group-hover:underline">
                View upload kit →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
