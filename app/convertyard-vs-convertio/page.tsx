import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ConvertYard vs Convertio — Which Is Better for You?',
  description:
    'ConvertYard converts files in your browser with no upload and no daily limits. Convertio caps free users at 25 conversions per day and 100 MB per file, and uploads everything to its servers.',
  openGraph: {
    title: 'ConvertYard vs Convertio — Which Is Better for You?',
    description:
      'ConvertYard converts files in your browser. Convertio uploads them to cloud servers and limits free users to 25 conversions per day. See the full comparison.',
    url: 'https://convertyard.com/convertyard-vs-convertio',
    siteName: 'ConvertYard',
    type: 'website',
  },
  alternates: {
    canonical: 'https://convertyard.com/convertyard-vs-convertio',
  },
}

const TABLE = [
  { feature: 'Files uploaded to a server', convertyard: '✕ Never', convertio: '✓ Yes (cloud servers)' },
  { feature: 'Account required', convertyard: '✕ No', convertio: 'Required for conversion history' },
  { feature: 'Free daily limit', convertyard: 'None', convertio: '25 conversions per day' },
  { feature: 'File size limit (free)', convertyard: 'None', convertio: '100 MB per file' },
  { feature: 'Batch conversion', convertyard: '1,000+ files at once', convertio: '1 file at a time (free)' },
  { feature: 'Works offline', convertyard: 'Yes (after first load)', convertio: 'No — requires upload' },
  { feature: 'Supported formats', convertyard: '~40 common formats', convertio: '300+ including obscure formats' },
  { feature: 'Price', convertyard: 'Free', convertio: 'Free / $10–$25/month' },
]

const FAQ = [
  {
    q: 'Does Convertio upload my files to its servers?',
    a: "Yes. Convertio's conversion happens in the cloud — your file uploads to its servers, gets processed, and is deleted after a set period. The company stores files for up to 24 hours by default. This is convenient for handling large or unusual formats, but it means your file leaves your device every time.",
  },
  {
    q: 'What happens when I hit Convertio\'s 25 conversion limit?',
    a: 'Once you hit 25 conversions in a day, Convertio blocks further conversions until the counter resets. You can upgrade to a paid plan ($10/month for 50 files/day or $25/month for unlimited) to remove the cap. ConvertYard has no conversion limit.',
  },
  {
    q: 'Does Convertio support more formats than ConvertYard?',
    a: "Yes — significantly more. Convertio supports 300+ formats including obscure ones like CAD files (DWG, DXF), e-book formats (EPUB, MOBI), and dozens of audio/video codecs. ConvertYard focuses on the ~40 formats that cover 95% of real-world conversion needs. If you need a truly unusual format, Convertio is the better choice.",
  },
  {
    q: 'Is ConvertYard better than Convertio for everyday image and PDF conversion?',
    a: 'For the most common conversions — JPG, PNG, WebP, AVIF, PDF to Word, PDF compress, merge, split — yes. ConvertYard handles all of them without uploading your files, with no daily limit, and with batch support that Convertio\'s free tier doesn\'t offer.',
  },
  {
    q: 'Which tool is better if I work with sensitive files?',
    a: "ConvertYard, clearly. Because conversion runs inside your browser via WebAssembly, your file bytes never reach any external server. Convertio uploads your file — even with deletion policies in place, the upload happens, the server sees the file, and a record exists. For legal documents, personal photos, or medical records, that distinction matters.",
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
            ConvertYard vs Convertio
          </h1>
          <p className="mb-4 text-xs text-fg-subtle">Published May 9, 2026</p>
          <p className="text-lg leading-relaxed text-fg-muted">
            Convertio supports 300+ formats. ConvertYard supports ~40 and never uploads your files.
            The right choice depends on what you're converting and how sensitive it is.
          </p>
        </div>

        {/* 30-second summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">ConvertYard</p>
            <p className="text-sm font-semibold text-fg">Best for: common formats, privacy, batch workflows, no account</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Files never leave your browser</li>
              <li>✓ No account, no signup</li>
              <li>✓ No daily limits, no file size caps</li>
              <li>✓ Batch 1,000+ files at once</li>
              <li>✓ Free forever</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Convertio</p>
            <p className="text-sm font-semibold text-fg">Best for: obscure or unusual formats not supported elsewhere</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ 300+ formats including CAD, e-books, audio codecs</li>
              <li>✓ Simple drag-and-drop UI</li>
              <li>✗ 25 conversions/day free limit</li>
              <li>✗ 100 MB file size cap (free)</li>
              <li>✗ Files uploaded to cloud servers</li>
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
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">Convertio</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg'}>
                    <td className="px-4 py-3 text-fg-muted">{row.feature}</td>
                    <td className="px-4 py-3 font-medium text-fg">{row.convertyard}</td>
                    <td className="px-4 py-3 text-fg-muted">{row.convertio}</td>
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
            <h3 className="mb-2 text-base font-semibold text-fg">Format breadth: Convertio wins</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Convertio supports over 300 file formats — documents, images, audio, video, CAD files,
              e-books, fonts, and more. If you're converting something unusual (a DWG to PDF, an EPUB
              to MOBI, a FLAC to OGG), Convertio almost certainly handles it. ConvertYard focuses on
              the ~40 formats that cover the vast majority of real-world conversion needs. For niche
              formats, Convertio is the better tool.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Privacy: ConvertYard wins</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Convertio processes files in the cloud. Your file uploads to its servers, the conversion
              runs server-side, and the output is available for download. Files are typically deleted
              after 24 hours. For most users converting non-sensitive files, this is fine. For legal
              documents, financial records, medical images, or anything you wouldn't email to a stranger
              — it's a meaningful risk that ConvertYard eliminates entirely by never receiving the file.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Free tier limits</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Convertio's free tier caps users at 25 conversions per day and 100 MB per file. Exceed
              either limit and you're blocked until the next day or prompted to upgrade. The $10/month
              plan raises the daily limit to 50 files; unlimited requires $25/month. ConvertYard has
              no caps — you can convert 1,000 files in one session, repeat it all day, and never hit
              a limit.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Batch conversion</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Convertio's free tier converts one file at a time, and each counts against your daily
              limit. ConvertYard accepts 1,000+ files in a single drop, processes them in your browser
              with a per-file progress indicator, and packages everything into a ZIP download. If you
              regularly work with more than a handful of files at once, the difference is substantial.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            Use ConvertYard when converting JPG, PNG, WebP, AVIF, PDF, Word, or other common formats
            — you'll get no daily limit, no file size cap, no upload, and batch support. Use Convertio
            when you need a format that ConvertYard doesn't support — its 300+ format library covers
            formats you won't find anywhere else for free.
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
              { label: 'ConvertYard vs ILovePDF', href: '/convertyard-vs-ilovepdf' },
              { label: 'ConvertYard vs Adobe Acrobat', href: '/convertyard-vs-adobe-acrobat' },
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
              href="/images"
              className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Image tools →
            </Link>
            <Link
              href="/pdf"
              className="inline-flex items-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              PDF tools →
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
