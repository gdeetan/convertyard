import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ConvertYard vs CloudConvert — Which Is Better for You?',
  description:
    'ConvertYard converts files entirely in your browser — no uploads, no account, no daily limits. CloudConvert uploads your files to its servers and charges per conversion minute.',
  openGraph: {
    title: 'ConvertYard vs CloudConvert — Which Is Better for You?',
    description:
      'ConvertYard converts files in your browser. CloudConvert uploads them to its servers. See how they compare on privacy, pricing, batch conversion, and free tier limits.',
    url: 'https://convertyard.com/convertyard-vs-cloudconvert',
    siteName: 'ConvertYard',
    type: 'website',
  },
  alternates: {
    canonical: 'https://convertyard.com/convertyard-vs-cloudconvert',
  },
}

const TABLE = [
  { feature: 'Files uploaded to a server', convertyard: '✕ Never', cloudconvert: '✓ Yes (EU servers)' },
  { feature: 'Account required', convertyard: '✕ No', cloudconvert: '✓ Required for API / paid plans' },
  { feature: 'Free daily limit', convertyard: 'None', cloudconvert: '25 conversions/day' },
  { feature: 'File size limit', convertyard: 'None', cloudconvert: '1 GB (free), larger on paid' },
  { feature: 'Batch conversion', convertyard: '1,000+ files at once', cloudconvert: 'Via API only (not free)' },
  { feature: 'Works offline', convertyard: 'Yes (after first load)', cloudconvert: 'No — requires upload' },
  { feature: 'Price', convertyard: 'Free', cloudconvert: 'Free tier / pay-per-use or subscription' },
  { feature: 'BAA required for HIPAA', convertyard: 'No — we never receive files', cloudconvert: 'Required if handling PHI' },
  { feature: 'API access', convertyard: 'None (browser-only)', cloudconvert: '✓ Full REST API' },
]

const FAQ = [
  {
    q: 'Does CloudConvert upload my files?',
    a: 'Yes. CloudConvert processes files on its servers, hosted in the EU (Frankfurt). The company is GDPR-compliant and deletes files after processing. But your file does travel to an external server. If you are handling sensitive documents — contracts, medical records, financial statements — that upload creates a record that CloudConvert controls, not you.',
  },
  {
    q: 'Can I use ConvertYard instead of CloudConvert for free?',
    a: 'For the most common file conversion tasks, yes. ConvertYard has no daily limit, no file size cap, no account requirement, and no paid tier. CloudConvert offers 25 free conversions per day and then charges per conversion minute or via a monthly subscription. If you need broad format support or API access, CloudConvert has the edge. If you need privacy, batch conversion, or zero friction — ConvertYard.',
  },
  {
    q: 'Is ConvertYard as powerful as CloudConvert?',
    a: "CloudConvert supports 200+ formats and has a full REST API used by thousands of developers. ConvertYard focuses on the most common formats — images, PDFs, video/audio — and runs them entirely in your browser. For everyday conversion tasks ConvertYard is faster and simpler. For exotic formats, automated pipelines, or server-to-server workflows, CloudConvert is the better tool.",
  },
  {
    q: 'What does "25 conversions per day" mean on CloudConvert free?',
    a: 'CloudConvert free accounts get 25 conversion minutes per day. Each conversion uses a fraction of a minute depending on file size and complexity. Once you exhaust your daily allowance, you need to wait or purchase more conversion minutes. ConvertYard has no such limit.',
  },
  {
    q: 'Which tool is better for sensitive documents?',
    a: "ConvertYard, by design. All processing happens inside your browser via WebAssembly — your file bytes never reach any external server. There's nothing for ConvertYard to retain, subpoena, or breach. CloudConvert offers strong server-side security and GDPR compliance, but the upload still happens.",
  },
  {
    q: 'Does CloudConvert have a good API?',
    a: "Yes — CloudConvert's REST API is one of the best in the conversion space. It supports job queuing, webhooks, S3 input/output, and 200+ formats. If you're building a backend pipeline that converts files server-to-server, CloudConvert is a strong choice. ConvertYard has no API and is browser-only.",
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
            ConvertYard vs CloudConvert
          </h1>
          <p className="mb-4 text-xs text-fg-subtle">Published July 4, 2026</p>
          <p className="text-lg leading-relaxed text-fg-muted">
            The core difference: ConvertYard never uploads your files. CloudConvert does.
            Everything else — pricing, limits, format breadth, API access — flows from that single choice.
          </p>
        </div>

        {/* 30-second summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">ConvertYard</p>
            <p className="text-sm font-semibold text-fg">Best for: privacy-conscious users, batch workflows, zero friction</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Files never leave your browser</li>
              <li>✓ No account, no signup</li>
              <li>✓ No daily limits, no file size caps</li>
              <li>✓ Batch 1,000+ files at once</li>
              <li>✓ Free forever</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">CloudConvert</p>
            <p className="text-sm font-semibold text-fg">Best for: developers needing an API, exotic formats, automated pipelines</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ 200+ supported formats</li>
              <li>✓ Full REST API with webhooks</li>
              <li>✓ S3 and cloud storage integration</li>
              <li>✗ 25 conversions/day on free tier</li>
              <li>✗ Files uploaded to servers</li>
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
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">CloudConvert</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg'}>
                    <td className="px-4 py-3 text-fg-muted">{row.feature}</td>
                    <td className="px-4 py-3 font-medium text-fg">{row.convertyard}</td>
                    <td className="px-4 py-3 text-fg-muted">{row.cloudconvert}</td>
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
            <h3 className="mb-2 text-base font-semibold text-fg">Privacy: browser vs. server</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              CloudConvert is transparent about its architecture: your file uploads to its EU servers,
              gets processed, and is deleted shortly after. The company is GDPR-compliant and SOC 2 audited.
              But the upload still happens. Your document travels over the internet, lands on a
              third-party server, and exists there during processing — creating a record you don't control.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              ConvertYard runs the conversion inside your browser via WebAssembly. Open DevTools → Network
              while converting — you'll see no file upload request, because there isn't one. The conversion
              happens on your CPU, not CloudConvert's.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Pricing: free vs. pay-per-use</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              CloudConvert's free tier gives you 25 conversion minutes per day. For light use that's
              adequate. For anything heavier — bulk conversions, large files, or regular batch work —
              you're looking at pay-as-you-go credits or a monthly subscription starting around $13/month.
              ConvertYard has no tier system and no paid plan. Every tool is free for every user, every
              time. The site is supported by minimal display ads below tools.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Batch conversion</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              CloudConvert's batch processing is available through its API — not through the web UI on the
              free tier. ConvertYard processes 1,000+ files in a single drop with no API required.
              All outputs package into a ZIP with per-file progress. If you regularly convert more than a
              handful of files at once and don't want to write API code, ConvertYard is significantly
              more practical.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Where CloudConvert is genuinely better</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              CloudConvert supports over 200 file formats — including exotic formats like AutoCAD DWG,
              3D model files, and obscure document types that ConvertYard doesn't handle. Its REST API
              supports webhooks, S3 input/output, job queuing, and server-to-server workflows. If you're
              building a backend pipeline, integrating with cloud storage, or need format support beyond
              the common ones, CloudConvert is the right tool. ConvertYard doesn't compete there.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            If privacy matters, or you work with sensitive documents, or you need batch conversion without
            writing code — ConvertYard. If you need a developer API, 200+ format support, cloud storage
            integration, or automated server-to-server pipelines — CloudConvert.
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

        {/* See also */}
        <section className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">See also</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'ConvertYard vs Smallpdf', href: '/convertyard-vs-smallpdf' },
              { label: 'ConvertYard vs Convertio', href: '/convertyard-vs-convertio' },
              { label: 'ConvertYard vs ILovePDF', href: '/convertyard-vs-ilovepdf' },
              { label: 'GDPR-safe file converter', href: '/gdpr-compliant-file-converter' },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg">
                {label} →
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-bg-elevated p-6 text-center">
          <p className="mb-4 text-base font-semibold text-fg">
            Try ConvertYard — no account, no upload, no limit
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
