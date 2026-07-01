import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ConvertYard vs Smallpdf — Which Is Better for You?',
  description:
    'ConvertYard converts files entirely in your browser — no uploads, no account, no daily limits. Smallpdf uploads your files to Swiss servers and caps free users at 2 tasks per day.',
  openGraph: {
    title: 'ConvertYard vs Smallpdf — Which Is Better for You?',
    description:
      'ConvertYard converts files in your browser. Smallpdf uploads them to its servers. See how they compare on privacy, pricing, batch conversion, and free tier limits.',
    url: 'https://convertyard.com/convertyard-vs-smallpdf',
    siteName: 'ConvertYard',
    type: 'website',
  },
  alternates: {
    canonical: 'https://convertyard.com/convertyard-vs-smallpdf',
  },
}

const TABLE = [
  { feature: 'Files uploaded to a server', convertyard: '✕ Never', smallpdf: '✓ Yes (Swiss servers)' },
  { feature: 'Account required', convertyard: '✕ No', smallpdf: '✓ Required for most features' },
  { feature: 'Free daily limit', convertyard: 'None', smallpdf: '2 tasks per day' },
  { feature: 'File size limit', convertyard: 'None', smallpdf: '5 MB (free), larger on Pro' },
  { feature: 'Batch conversion', convertyard: '1,000+ files at once', smallpdf: 'Not on free tier' },
  { feature: 'Works offline', convertyard: 'Yes (after first load)', smallpdf: 'No — requires upload' },
  { feature: 'Price', convertyard: 'Free', smallpdf: 'Free / ~$12/month Pro' },
  { feature: 'BAA required for HIPAA', convertyard: 'No — we never receive files', smallpdf: 'Required if handling PHI' },
]

const FAQ = [
  {
    q: 'Does Smallpdf upload my files?',
    a: 'Yes. Smallpdf processes files on its servers in Switzerland. The company is GDPR-compliant and deletes files after processing, but your file does travel to an external server. If you are working with sensitive documents — contracts, medical records, financial statements — that upload creates a record that Smallpdf controls, not you.',
  },
  {
    q: 'Can I use ConvertYard instead of Smallpdf for free?',
    a: 'Yes, completely. ConvertYard has no daily limit, no file size cap, no account requirement, and no paid tier. Every tool is free for everyone, forever. The only current limitation is format breadth — ConvertYard focuses on the most common formats rather than every edge case.',
  },
  {
    q: 'Is ConvertYard as good as Smallpdf for PDF tools?',
    a: "For the core workflows — compress, merge, split, rotate, convert to Word/JPG/PNG, OCR — yes. ConvertYard covers all of them, free and without upload. Smallpdf has a more polished annotation and form-filling UI and a wider ecosystem of integrations. If you need deep PDF editing or a Dropbox integration, Smallpdf's Pro plan may be worth it.",
  },
  {
    q: 'What does "2 tasks per day" mean on Smallpdf free?',
    a: 'Smallpdf limits free users to 2 file conversions per day. A single merge, compress, or convert operation counts as one task. Once you hit 2, you have to wait until the next day or upgrade to Pro. ConvertYard has no such limit.',
  },
  {
    q: 'Which tool is better for sensitive documents?',
    a: "ConvertYard, by design. Because all processing happens inside your browser via WebAssembly, your file bytes never reach any external server. There's nothing for ConvertYard to retain, subpoena, or breach. Smallpdf offers server-side security, but the upload still happens.",
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
            ConvertYard vs Smallpdf
          </h1>
          <p className="mb-4 text-xs text-fg-subtle">Published April 22, 2026</p>
          <p className="text-lg leading-relaxed text-fg-muted">
            The core difference: ConvertYard never uploads your files. Smallpdf does.
            Everything else — pricing, limits, format support — flows from that single choice.
          </p>
        </div>

        {/* 30-second summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">ConvertYard</p>
            <p className="text-sm font-semibold text-fg">Best for: privacy-conscious users and teams, batch workflows, zero friction</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Files never leave your browser</li>
              <li>✓ No account, no signup</li>
              <li>✓ No daily limits, no file size caps</li>
              <li>✓ Batch 1,000+ files at once</li>
              <li>✓ Free forever</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Smallpdf</p>
            <p className="text-sm font-semibold text-fg">Best for: occasional users who want a polished UI and ecosystem integrations</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Polished, annotation-rich PDF editor</li>
              <li>✓ Dropbox, Google Drive integrations</li>
              <li>✓ Mobile apps</li>
              <li>✗ 2 tasks/day on free tier</li>
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
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">Smallpdf</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg'}>
                    <td className="px-4 py-3 text-fg-muted">{row.feature}</td>
                    <td className="px-4 py-3 font-medium text-fg">{row.convertyard}</td>
                    <td className="px-4 py-3 text-fg-muted">{row.smallpdf}</td>
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
              Smallpdf is honest about how it works: your file uploads to its servers in Switzerland,
              gets processed, and is deleted shortly after. The company is GDPR-compliant and takes
              security seriously. But the upload still happens. Your document travels over the internet,
              lands on a third-party server, and is retained for some period of time. That creates a
              record — one that can be subpoenaed, subject to a data breach, or retained longer than
              advertised.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              ConvertYard runs the conversion inside your browser via WebAssembly. The same C++ libraries
              (MuPDF, pdf-lib) run locally on your CPU. Open your browser DevTools → Network while
              converting — you'll see no file upload request, because there isn't one.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Pricing: free vs. freemium</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Smallpdf's free tier limits you to 2 tasks per day. Hit that limit at 10am and you're done
              until tomorrow, or you upgrade to Pro at ~$12/month. ConvertYard has no tier system.
              There is no paid plan to upgrade to — every tool is free for every user, every time. The
              site is supported by minimal display ads below tools.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Batch conversion</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Smallpdf free tier processes one file at a time and counts each conversion against your
              daily limit. ConvertYard processes 1,000+ files in a single drop. All outputs package into
              a ZIP. Progress is tracked per file. If you regularly work with more than one or two
              documents at a time, the difference is significant.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Where Smallpdf is genuinely better</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Smallpdf's PDF editor has annotation tools, a form-filling interface, and e-signature
              support that ConvertYard doesn't have. Its Pro plan integrates with Dropbox, Google Drive,
              and OneDrive. It also has mobile apps for iOS and Android. If your workflow centers on
              PDF annotation, signing, or cloud storage integration, Smallpdf Pro is a reasonable choice.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            If privacy matters, or you work with sensitive documents, or you need batch conversion,
            or you just don't want to create an account for a tool you'll use once — ConvertYard.
            If you need PDF annotation, e-signatures, cloud storage sync, or mobile apps — Smallpdf Pro.
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
