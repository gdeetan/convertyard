import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ConvertYard vs Adobe Acrobat Online — Which Is Better for You?',
  description:
    'ConvertYard is free, requires no account, and never uploads your files. Adobe Acrobat Online costs $13–23/month, requires an Adobe account, and uploads files to Adobe cloud.',
  openGraph: {
    title: 'ConvertYard vs Adobe Acrobat Online — Which Is Better for You?',
    description:
      'ConvertYard converts files in your browser for free. Adobe Acrobat Online starts at $13/month and uploads to Adobe servers. See the full comparison.',
    url: 'https://convertyard.com/convertyard-vs-adobe-acrobat',
    siteName: 'ConvertYard',
    type: 'website',
  },
  alternates: {
    canonical: 'https://convertyard.com/convertyard-vs-adobe-acrobat',
  },
}

const TABLE = [
  { feature: 'Files uploaded to a server', convertyard: '✕ Never', adobe: '✓ Yes (Adobe cloud)' },
  { feature: 'Account required', convertyard: '✕ No', adobe: 'Adobe account required' },
  { feature: 'Price', convertyard: 'Free', adobe: '$13–23/month (or CC bundle)' },
  { feature: 'Free tier conversions', convertyard: 'Unlimited', adobe: 'Very limited (2/month for some tools)' },
  { feature: 'Batch conversion', convertyard: '1,000+ files at once', adobe: 'Limited on most plans' },
  { feature: 'Works offline', convertyard: 'Yes (after first load)', adobe: 'No' },
  { feature: 'PDF editing quality', convertyard: 'Good for core workflows', adobe: 'Industry-leading' },
  { feature: 'E-signatures', convertyard: 'Not available', adobe: 'Acrobat Sign included' },
  { feature: 'BAA for HIPAA workflows', convertyard: 'Not required (no upload)', adobe: 'Available with enterprise plan' },
]

const FAQ = [
  {
    q: 'Is Adobe Acrobat Online the same as the desktop app?',
    a: 'No. Adobe Acrobat Online (acrobat.adobe.com) is a browser-based version that uploads your file to Adobe\'s cloud for processing. It offers a subset of what the full desktop application can do. The desktop app runs locally and is significantly more powerful for complex PDF editing, but costs $23/month or is bundled with Creative Cloud.',
  },
  {
    q: 'Does Adobe Acrobat upload my files?',
    a: "Yes. Adobe Acrobat Online processes files in Adobe's cloud infrastructure. Your file uploads, gets processed, and you download the result. Adobe handles data with enterprise-grade security, but the upload happens regardless. ConvertYard's processing runs inside your browser via WebAssembly — no upload, no server, no Adobe account required.",
  },
  {
    q: 'Why would I use ConvertYard when Adobe is the industry standard?',
    a: "For the core tasks — compress a PDF, convert to Word, merge documents, OCR a scan — ConvertYard does all of them free, instantly, without an account, and without uploading your file. Adobe's strengths are in things ConvertYard doesn't do: rich PDF annotation, e-signatures, complex form creation, advanced redaction workflows, and enterprise integrations. If you need those, Adobe is the right tool. If you just need to compress a PDF or convert it to Word, ConvertYard is faster and free.",
  },
  {
    q: 'How does ConvertYard compare to Adobe for PDF compression quality?',
    a: "ConvertYard uses MuPDF for PDF compression, which delivers good results for most documents. Adobe's compression algorithm is more sophisticated and tends to produce slightly smaller files for complex documents with embedded fonts and vector graphics. For typical office documents, scanned PDFs, and most workflows, the difference is not significant.",
  },
  {
    q: 'Can I use ConvertYard and Adobe together?',
    a: "Yes — and many people do. Use ConvertYard for the everyday tasks (compress, convert, merge, split) where free and private processing is the priority. Use Adobe when you need its specific strengths: rich annotation, e-signatures, or advanced editing. They're not mutually exclusive.",
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
            ConvertYard vs Adobe Acrobat Online
          </h1>
          <p className="mb-4 text-xs text-fg-subtle">Published June 17, 2026</p>
          <p className="text-lg leading-relaxed text-fg-muted">
            Adobe is the industry standard for complex PDF workflows. ConvertYard is free, requires
            no account, and never uploads your files. Most people need one for everyday tasks and
            the other for specific use cases — here's how to tell which is which.
          </p>
        </div>

        {/* 30-second summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">ConvertYard</p>
            <p className="text-sm font-semibold text-fg">Best for: everyday PDF tasks, privacy, batch processing, zero cost</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Files never leave your browser</li>
              <li>✓ No account, no signup</li>
              <li>✓ Free — no paid tier needed</li>
              <li>✓ Batch 1,000+ files at once</li>
              <li>✓ No file size limits</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Adobe Acrobat Online</p>
            <p className="text-sm font-semibold text-fg">Best for: advanced PDF editing, e-signatures, enterprise workflows</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Industry-leading PDF editing</li>
              <li>✓ Acrobat Sign (e-signatures)</li>
              <li>✓ Enterprise security and compliance</li>
              <li>✗ $13–23/month subscription</li>
              <li>✗ Files uploaded to Adobe cloud</li>
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
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">Adobe Acrobat Online</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg'}>
                    <td className="px-4 py-3 text-fg-muted">{row.feature}</td>
                    <td className="px-4 py-3 font-medium text-fg">{row.convertyard}</td>
                    <td className="px-4 py-3 text-fg-muted">{row.adobe}</td>
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
            <h3 className="mb-2 text-base font-semibold text-fg">Cost: no comparison</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Adobe Acrobat Online starts at $13/month for the standard plan and reaches $23/month
              for Acrobat Pro. Many users access it through Creative Cloud subscriptions that bundle
              it with other Adobe apps. For the core PDF conversion tasks — compress, merge, convert
              to Word, OCR — ConvertYard covers them all at zero cost. If the only reason you're
              considering Adobe is to compress a PDF or convert it to an editable Word doc, you
              don't need the subscription.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Privacy</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Adobe Acrobat Online uploads your file to Adobe's cloud. Adobe has strong enterprise
              security and compliance certifications, and the upload is necessary for the processing
              to work. ConvertYard takes the opposite approach: the WebAssembly library runs inside
              your browser, on your CPU, with no network request for the file data. If you're
              converting documents under NDA, dealing with patient data, or working with legal
              materials — the no-upload approach is meaningful.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Where Adobe is genuinely better</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Adobe Acrobat's PDF editing capabilities — inline text editing, image replacement,
              advanced form design, Acrobat Sign for legally binding e-signatures — are not things
              ConvertYard attempts to replicate. Adobe also offers enterprise-grade compliance
              features (FedRAMP, SOC 2, HIPAA BAA with enterprise plan), deep Microsoft 365
              integration, and the most accurate OCR engine in the industry. For professional PDF
              work that goes beyond conversion, Adobe is the right tool.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Using both</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              The most practical approach: use ConvertYard for the everyday high-volume tasks where
              the free, no-upload workflow saves time and cost. Keep Adobe for work that specifically
              requires its unique features — e-signatures, rich annotation, or complex form design.
              The tools solve different parts of the PDF workflow.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            If you need to compress a PDF, convert it to Word, merge documents, or run OCR — use
            ConvertYard. It's free, instant, and doesn't upload your files. If you need to edit
            PDF content, collect e-signatures, or work inside enterprise compliance requirements —
            Adobe Acrobat is the right tool, and the subscription is worth it for those use cases.
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
            Try ConvertYard — free PDF tools, no Adobe account needed
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
