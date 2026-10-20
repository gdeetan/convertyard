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
    a: 'Yes. Files are processed on Smallpdf’s servers in Switzerland. Smallpdf is GDPR compliant and deletes all files after processing, but yes, your file does get uploaded to an external server. If you’re working with sensitive documents like contracts, medical records, or financial statements, then yes, that upload creates a record with Smallpdf, not you.',
  },
  {
    q: 'Can I use ConvertYard instead of Smallpdf for free?',
    a: 'Yes, completely. ConvertYard has no daily limit, no file size cap, no account requirement, and no paid tier. Every tool is free for everyone, forever. The only current limitation is format breadth — ConvertYard focuses on the most common formats rather than every edge case.',
  },
  {
    q: 'Is ConvertYard as good as Smallpdf for PDF tools?',
    a: 'That would depend on what you prioritize. ConvertYard has no limits (daily, file-wise) – no account is needed, and there are no paid versions of any of the tools. For now, the converter only supports a rather limited set of the most common formats – but this is rather the only limitation of ConvertYard so far.',
  },
  {
    q: 'What does "2 tasks per day" mean on Smallpdf free?',
    a: 'This applies to the core features such as compression, merging, splitting, etc. In ConvertYard, all of these are provided for free without any upload to a third-party server. Other workflows, such as PDF to Word, JPG, PNG, etc., and OCR, are also free and don’t require any upload. Smallpdf has a very polished interface for PDF annotation and form filling and a large number of integrations. ConvertYard focuses on core features, and if you need deep PDF editing or a Dropbox integration, then Smallpdf’s Pro plan may be of interest.',
  },
  {
    q: 'Which tool is better for sensitive documents?',
    a: 'The processing happens within your browser using WebAssembly. Therefore, none of your file bytes ever touch any servers, including those of ConvertYard. Smallpdf has server-side security enabled for uploads, but an upload is created nonetheless.',
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
            The core difference from <strong className="font-semibold text-fg">Smallpdf.com</strong> is that <strong className="font-semibold text-fg">ConvertYard does not upload any files to servers</strong>. Everything else (pricing, limits, export formats) stems from this core difference.
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
              Their &ldquo;Terms of Service&rdquo; reveal how Smallpdf&rsquo;s web-based tools work for you. Smallpdf <strong className="font-semibold text-fg">processes your uploaded files on servers located in Switzerland</strong>. These files are then deleted again from their servers as soon as possible. Smallpdf abides by the rules of the General Data Protection Regulation (GDPR) and does its best to protect your documents. However, by uploading a file to a server over the internet, a copy of your document will be created and stored somewhere &ndash; whether temporarily or for a longer period of time &ndash; and can, for example, be subpoenaed, be the target of a data breach, or be stored for an extended period of time against what the service promises.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              All of the ConvertYard tools run inside your browser using <strong className="font-semibold text-fg">WebAssembly</strong>. Hence, the same C++ libraries (<strong className="font-semibold text-fg">MuPDF and pdf-lib</strong>) are executed on your local CPU just like you would run any other local application. You can verify this by opening up your browser <strong className="font-semibold text-fg">DevTools &rarr; Network tab</strong> while running a conversion. You will not see any file upload requests, as there are none.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Pricing: free vs. freemium</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Unlike Smallpdf, our free tier has <strong className="font-semibold text-fg">no limit on the number of conversions per day</strong>. Unlike the Smallpdf free tier, which only processes 1 file at a time (and counts against your daily limit), the ConvertYard.com tools can process 1000&rsquo;s of files in a single drop. All outputs are packaged into a <strong className="font-semibold text-fg">single ZIP file</strong>. Progress is tracked for each file individually.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Batch conversion</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              While Smallpdf only processes 1 file per conversion and counts each conversion against your daily limit, ConvertYard can process <strong className="font-semibold text-fg">1,000+ files in a single drop</strong> and track progress per file. All of the converted files will be packaged into a single ZIP file. If you work with more than 1 or 2 documents at a time on a regular basis, the difference here is quite significant. Try it with <Link href="/compress-pdf" className="font-medium text-primary underline-offset-2 hover:underline">compress PDF</Link>, <Link href="/merge-pdf" className="font-medium text-primary underline-offset-2 hover:underline">merge PDF</Link>, or <Link href="/split-pdf" className="font-medium text-primary underline-offset-2 hover:underline">split PDF</Link>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Where Smallpdf is genuinely better</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Smallpdf has a PDF editor with <strong className="font-semibold text-fg">annotations, form filling, and e-signatures</strong>. In the Pro plan, you can also integrate Dropbox, Google Drive, and OneDrive. Also, Smallpdf has mobile apps for iOS and Android. So if you are working with lots of PDFs and need annotation, signing, and cloud storage, then Smallpdf Pro is the better option.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            If you need to annotate PDFs, sign PDFs electronically, sync PDFs with cloud storage (like Dropbox, Google Drive, OneDrive, etc.), or use Smallpdf tools on your iOS or Android mobile device, then you need Smallpdf Pro. If <strong className="font-semibold text-fg">privacy, one-time use without an account, or batch PDF processing</strong> matter to you, then use ConvertYard.
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
              { label: 'ConvertYard vs Convertio', href: '/convertyard-vs-convertio' },
              { label: 'ConvertYard vs ILovePDF', href: '/convertyard-vs-ilovepdf' },
              { label: 'ConvertYard vs Adobe Acrobat', href: '/convertyard-vs-adobe-acrobat' },
              { label: 'ConvertYard vs CloudConvert', href: '/convertyard-vs-cloudconvert' },
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
