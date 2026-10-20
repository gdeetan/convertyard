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

const FAQ = [
  {
    q: 'Is Adobe Acrobat Online the same as the desktop app?',
    a: "No. The online version of Adobe Acrobat (acrobat.adobe.com) runs in your browser and uploads your PDF to Adobe's cloud for processing. This offers a limited set of features compared to the full-fledged application, which you can download for free as a trial. After the trial, it costs $23/month or is included in Creative Cloud.",
  },
  {
    q: 'Does Adobe Acrobat upload my files?',
    a: "Yes. Adobe Acrobat Online processes the data in Adobe's cloud on your behalf to create the result that you download. Adobe handles the security of your data in their enterprise-quality environment, but that does mean your file is uploaded to be processed in the cloud. Processing in ConvertYard is done entirely within your browser using WebAssembly, so there is no upload, no server involved, and no Adobe account required.",
  },
  {
    q: 'Why would I use ConvertYard when Adobe is the industry standard?',
    a: "ConvertYard's PDF compression uses MuPDF to produce a compressed PDF for free (for everyday PDFs like office documents and scanned PDFs). Adobe's more advanced compression (for PDFs with embedded fonts and many vector graphics) can lead to slightly smaller files for complex documents. In most cases, the difference in file size is not significant. ConvertYard is best for free and private basic tasks (compression, converting PDFs to Word, merging or splitting documents). Adobe is best for advanced tasks like rich annotating, e-signing, complex form creation, and advanced redaction.",
  },
  {
    q: 'How does ConvertYard compare to Adobe for PDF compression quality?',
    a: "ConvertYard's PDF compression uses a hybrid approach. The PDF structure is rewritten with pdf-lib, rendering and object-stream packing are done with MuPDF, and downsampling and re-encoding of embedded images is handled by a custom worker pool. Adobe can compress scanned PDFs much smaller because it ships with JBIG2 and JPEG2000 encoders. For common office documents, however, the difference in size is usually not noticeable.",
  },
  {
    q: 'Can I use ConvertYard and Adobe together?',
    a: "Yes. Many people use ConvertYard for the majority of their free, private PDF processing (compression, convert to Word, merge, split). They use Adobe Acrobat for its unique features like rich annotation and e-signatures. The two tools fill very different roles in PDF work.",
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
            Adobe Acrobat Online is the <strong className="font-semibold text-fg">industry standard for complex PDF workflows</strong>.
            ConvertYard is <strong className="font-semibold text-fg">free, requires no account, and does not upload files</strong>.
            Most people will need one tool for their everyday tasks and another for very specific tasks.
            Here&apos;s a short overview to help you decide which one you need.
          </p>
        </div>

        {/* 30-second summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">ConvertYard</p>
            <p className="text-sm font-semibold text-fg">Best for: everyday PDF tasks, privacy, batch processing, zero cost.</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ <strong className="font-semibold text-fg">Files never leave your browser</strong></li>
              <li>✓ No account, no signup</li>
              <li>✓ Free — no paid tier needed</li>
              <li>✓ Batch <strong className="font-semibold text-fg">1,000+ files</strong> at once</li>
              <li>✓ No file size limits</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Adobe Acrobat Online</p>
            <p className="text-sm font-semibold text-fg">Best for: advanced PDF editing, e-signatures, enterprise workflows.</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Industry-leading PDF editing</li>
              <li>✓ Acrobat Sign (e-signatures)</li>
              <li>✓ Enterprise security and compliance</li>
              <li>✗ <strong className="font-semibold text-fg">$13–23/month subscription</strong></li>
              <li>✗ Files uploaded to Adobe cloud</li>
            </ul>
          </div>
        </div>

        {/* Deep dives */}
        <section className="mb-12 space-y-8">
          <h2 className="text-xl font-bold tracking-tight text-fg">The details</h2>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Cost: no comparison</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Adobe Acrobat costs <strong className="font-semibold text-fg">$13 per month</strong> for the standard plan and{' '}
              <strong className="font-semibold text-fg">$23 per month</strong> for Acrobat Pro. It&apos;s also usually included
              in Creative Cloud subscription plans. Compared with Adobe Acrobat Online for basic PDF conversions
              such as <Link href="/compress-pdf/" className="text-primary underline hover:text-primary-hover">compressing</Link> and{' '}
              merging, ConvertYard offers the same conversions (to Word documents, etc.) needed regularly by most people,{' '}
              <strong className="font-semibold text-fg">100% free of charge</strong>. There&apos;s no need for Adobe Acrobat Online
              if you only need to occasionally compress a PDF or{' '}
              <Link href="/pdf-to-word/" className="text-primary underline hover:text-primary-hover">convert it to an editable Word document</Link>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Privacy</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Adobe Acrobat Online uses its cloud server to upload your file in order to process it. Adobe processes
              this securely, backed by enterprise security and compliance certifications that many other companies can
              only dream of. ConvertYard takes the opposite approach. The <strong className="font-semibold text-fg">WebAssembly</strong>{' '}
              library required to convert your documents is run on your CPU in your browser.{' '}
              <strong className="font-semibold text-fg">There are no network requests made with the file data.</strong>{' '}
              This has huge implications for documents that are converted under <strong className="font-semibold text-fg">NDA</strong>,
              for documents that contain <strong className="font-semibold text-fg">patient data</strong>, or for lawyers who
              work with large amounts of legal material online.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Where Adobe is genuinely better</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Adobe Acrobat Online offers PDF editing capabilities like inline text editing, image replacement, and
              advanced <Link href="/fill-pdf-form/" className="text-primary underline hover:text-primary-hover">form creation</Link>,
              as well as e-signatures using Acrobat Sign. This, along with enterprise-level compliance features like{' '}
              <strong className="font-semibold text-fg">FedRAMP, SOC 2, and HIPAA BAA</strong> support with the enterprise plan,
              as well as deep Microsoft 365 integration, makes Adobe the best choice for{' '}
              <strong className="font-semibold text-fg">professional PDF work that extends beyond simple file conversion</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Using both</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              The best approach is to use ConvertYard for most of your tasks, where you save time and money with the{' '}
              <strong className="font-semibold text-fg">free no-upload workflow</strong>. Use Adobe Acrobat Online for the
              special cases — PDF editing, e-signatures, richer annotations, complex form work — where Adobe uniquely
              solves the problem for you.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            If all you need to do is compress PDFs, convert PDFs to editable Word documents,{' '}
            <Link href="/merge-pdf/" className="text-primary underline hover:text-primary-hover">merge documents</Link>, and run{' '}
            <Link href="/ocr-pdf/" className="text-primary underline hover:text-primary-hover">Optical Character Recognition (OCR)</Link>{' '}
            on PDFs, then use ConvertYard to get these tasks done{' '}
            <strong className="font-semibold text-fg">quickly, free, and without uploading your files</strong> to remote servers.
            If you need to edit PDFs,{' '}
            <Link href="/digital-sign-pdf/" className="text-primary underline hover:text-primary-hover">sign PDFs electronically</Link>,
            work with rich PDF annotations, or work within complex PDF forms, and require enterprise-level compliance within
            your organization, then use Adobe Acrobat — the subscription is well worth it for these unique and powerful
            capabilities.
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
            Try ConvertYard — free PDF tools, no Adobe account needed
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/pdf/"
              className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
            >
              PDF tools →
            </Link>
            <Link
              href="/tools/"
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
