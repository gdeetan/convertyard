import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ConvertYard vs ILovePDF — Which Is Better for You?',
  description:
    'ConvertYard converts PDFs in your browser — no upload, no account, no daily limits, free forever. ILovePDF uploads files to its servers and limits free users to smaller file sizes.',
  openGraph: {
    title: 'ConvertYard vs ILovePDF — Which Is Better for You?',
    description:
      'ConvertYard converts PDFs locally in your browser. ILovePDF uploads them to its servers. See how they compare on privacy, pricing, and PDF tool coverage.',
    url: 'https://convertyard.com/convertyard-vs-ilovepdf',
    siteName: 'ConvertYard',
    type: 'website',
  },
  alternates: {
    canonical: 'https://convertyard.com/convertyard-vs-ilovepdf',
  },
}

const TABLE = [
  { feature: 'Files uploaded to a server', convertyard: '✕ Never', ilovepdf: '✓ Yes' },
  { feature: 'Account required', convertyard: '✕ No', ilovepdf: 'Optional (required for premium)' },
  { feature: 'File size limit (free)', convertyard: 'None', ilovepdf: 'Limited on free tier' },
  { feature: 'Batch conversion', convertyard: '1,000+ files at once', ilovepdf: '1 file at a time (free)' },
  { feature: 'Works offline', convertyard: 'Yes (after first load)', ilovepdf: 'No — requires upload' },
  { feature: 'PDF tool count', convertyard: '15+ PDF tools', ilovepdf: '25+ PDF tools' },
  { feature: 'Mobile apps', convertyard: 'Not available', ilovepdf: 'iOS and Android' },
  { feature: 'Price', convertyard: 'Free', ilovepdf: 'Free / ~$4/month Pro' },
  { feature: 'BAA for HIPAA workflows', convertyard: 'Not required (no upload)', ilovepdf: 'Required if handling PHI' },
]

const FAQ = [
  {
    q: 'Does ILovePDF upload my files?',
    a: "Yes. ILovePDF processes files on its servers. Your PDF uploads, gets converted or processed, and is then deleted after a short retention period. The service is operated from Spain and is GDPR-compliant, but the upload is unavoidable. ConvertYard's approach is different: the entire conversion runs inside your browser, so nothing ever uploads.",
  },
  {
    q: 'Is ILovePDF really free?',
    a: "ILovePDF has a free tier with file size restrictions and processing that goes through its servers. Its Pro plan at ~$4/month is one of the more affordable options in the space, removing most limits. ConvertYard is genuinely free with no paid tier — every tool works for every user, unlimited, forever.",
  },
  {
    q: 'Does ConvertYard cover all the same PDF tools as ILovePDF?',
    a: 'ConvertYard covers the core PDF workflows: compress, merge, split, rotate, reorder pages, PDF to Word/JPG/PNG/Excel, Word to PDF, OCR, redact, protect, unlock, watermark, and fill forms. ILovePDF has a few additional tools around PDF repair and accessibility that ConvertYard doesn\'t have yet. For the most commonly used tools, the coverage is comparable.',
  },
  {
    q: 'Which is better for batch PDF processing?',
    a: "ConvertYard. On ILovePDF's free tier, you process one file at a time. ConvertYard accepts 1,000+ PDFs in a single drop and processes them all in your browser with per-file progress. Results download as a ZIP. For batch compression, splitting, or converting large numbers of PDFs, ConvertYard is significantly faster.",
  },
  {
    q: 'What is ILovePDF genuinely better at?',
    a: "ILovePDF has mobile apps for iOS and Android that ConvertYard doesn't offer. It also has some PDF repair tools and an OCR feature with more language support. If you work primarily on your phone or need mobile-friendly PDF editing, ILovePDF is the stronger choice.",
  },
]

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }),
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">

        {/* Hero */}
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
            Comparison
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            ConvertYard vs ILovePDF
          </h1>
          <p className="mb-4 text-xs text-fg-subtle">Published May 28, 2026</p>
          <p className="text-lg leading-relaxed text-fg-muted">
            Both are free PDF tools. The difference is where your files go — ILovePDF uploads them
            to servers; ConvertYard processes them entirely inside your browser.
          </p>
        </div>

        {/* 30-second summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">ConvertYard</p>
            <p className="text-sm font-semibold text-fg">Best for: desktop users who need privacy, batch PDF processing, no account</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Files never leave your browser</li>
              <li>✓ No account, no signup</li>
              <li>✓ No daily limits, no file size caps</li>
              <li>✓ Batch 1,000+ PDFs at once</li>
              <li>✓ Free forever</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">ILovePDF</p>
            <p className="text-sm font-semibold text-fg">Best for: mobile users, occasional PDF work, affordable Pro plan</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ iOS and Android apps</li>
              <li>✓ ~$4/month Pro — affordable paid tier</li>
              <li>✓ Some tools ConvertYard doesn't have yet</li>
              <li>✗ Files uploaded to servers</li>
              <li>✗ File size limits on free tier</li>
            </ul>
          </div>
        </div>

        {/* Feature table */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-fg">
            Feature comparison
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-muted">
                  <th className="px-4 py-3 text-left font-semibold text-fg">Feature</th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">ConvertYard</th>
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">ILovePDF</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg'}>
                    <td className="px-4 py-3 text-fg-muted">{row.feature}</td>
                    <td className="px-4 py-3 font-medium text-fg">{row.convertyard}</td>
                    <td className="px-4 py-3 text-fg-muted">{row.ilovepdf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Deep dives */}
        <section className="mb-12 space-y-8">
          <h2 className="text-xl font-bold tracking-tight text-fg">The details</h2>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Privacy</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              ILovePDF sends your files to its servers for processing. For most personal PDF tasks
              — compressing a presentation or splitting a form — this is acceptable. For sensitive
              documents like legal contracts, HR files, or medical records, any upload is a liability.
              ConvertYard eliminates that liability entirely: conversion runs in your browser via
              WebAssembly, and no upload request ever fires.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">PDF tool coverage</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              ILovePDF has about 25 PDF tools. ConvertYard has 15+ and is actively expanding. The
              core tools — compress, merge, split, rotate, reorder, convert to Word/Excel/JPG/PNG,
              OCR, protect, unlock, watermark, redact, fill forms — are covered on both. ILovePDF has
              a slight edge in total count, but for the tools most people use most of the time, the
              difference is minimal.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Batch processing</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              ILovePDF's free tier processes one file at a time. ConvertYard accepts 1,000+ files in
              a single operation. Drop 500 PDFs to compress, get a ZIP back. No daily limit. No
              per-file counting. If you're processing a document archive, a folder of scans, or a
              batch of reports, ConvertYard is meaningfully faster.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Mobile: ILovePDF wins</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              ILovePDF has native apps for iOS and Android that let you work with PDFs directly from
              your phone. ConvertYard is browser-based and works on mobile browsers, but doesn't have
              a dedicated app. If you need PDF tools on your phone regularly, ILovePDF is the better
              fit.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            On a desktop, for any PDF task where privacy matters or you're working with more than a
            handful of files, ConvertYard is the better choice. On mobile, or if you need a cheap
            paid tier with a few additional tools, ILovePDF's Pro plan at ~$4/month is one of the
            most affordable in the space.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-fg">Common questions</h2>
          <div className="space-y-6">
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <p className="mb-1.5 font-semibold text-fg">{q}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-bg-elevated p-6 text-center">
          <p className="mb-4 text-base font-semibold text-fg">
            Try ConvertYard PDF tools — no upload, no account, no limit
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/pdf"
              className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
            >
              PDF tools →
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              All tools →
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
