import type { Metadata } from 'next'
import Link from 'next/link'
import { verticals } from '@/content/vertical-registry'

export const metadata: Metadata = {
  title: 'Application Upload Kits for Exams & Visas — ConvertYard',
  description:
    'Pre-configured photo, signature, and PDF tools for 17 exams, visas, and applications — UPSC, IBPS, SBI, NDA, US DS-160, Common App, and more. Runs in your browser.',
}

const groups = [
  {
    label: 'India — Civil Services',
    slugs: ['upsc', 'uppsc', 'bpsc', 'mpsc', 'tnpsc', 'kpsc'],
  },
  {
    label: 'India — Staff Selection',
    slugs: ['ssc-cgl'],
  },
  {
    label: 'India — Banking & Finance',
    slugs: ['ibps-po', 'sbi', 'rbi-grade-b', 'insurance-exams'],
  },
  {
    label: 'India — Defence & Paramilitary',
    slugs: ['nda-cds', 'capf-ssc-gd'],
  },
  {
    label: 'India — Education',
    slugs: ['neet', 'jee-main'],
  },
  {
    label: 'International — Visa',
    slugs: ['us-ds-160-visa'],
  },
  {
    label: 'International — Education',
    slugs: ['us-college-application'],
  },
]

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Upload kits for exams &amp; applications
        </h1>
        <p className="mt-4 text-lg text-fg-muted">
          Exact photo, signature, and document specs for competitive exams, visas, and
          college applications. Crop, compress, and download — all in your browser.
          No uploads, no accounts.
        </p>
      </div>

      <div className="space-y-10">
        {groups.map(group => {
          const groupVerticals = group.slugs
            .map(slug => verticals.find(v => v.slug === slug))
            .filter(Boolean)
          if (groupVerticals.length === 0) return null
          return (
            <section key={group.label}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                {group.label}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2" role="list">
                {groupVerticals.map(v => (
                  <li key={v!.slug}>
                    <Link
                      href={`/for/${v!.slug}/`}
                      className="group flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-5 transition-colors hover:border-primary hover:bg-bg-muted"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-base font-semibold text-fg">{v!.name}</span>
                        <span className="shrink-0 text-xs text-fg-subtle capitalize">
                          {v!.category}
                        </span>
                      </div>
                      <p className="text-sm text-fg-muted line-clamp-2">{v!.subhead}</p>
                      <span className="mt-1 text-xs font-medium text-primary group-hover:underline">
                        View upload kit →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <div className="mt-16 rounded-xl border border-border bg-bg-elevated p-6 text-center">
        <p className="text-sm text-fg-muted">
          Don&apos;t see your exam or application?{' '}
          <a
            href="mailto:convertyard@gmail.com"
            className="font-medium text-primary hover:underline"
          >
            Email us and we&apos;ll add it.
          </a>
        </p>
      </div>
    </div>
  )
}
