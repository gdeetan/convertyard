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
  { feature: 'Batch conversion', convertyard: 'Up to 1,000 files at once', convertio: '1 file at a time (free)' },
  { feature: 'Works offline', convertyard: 'Yes (after first load)', convertio: 'No — requires upload' },
  { feature: 'Supported formats', convertyard: '~40 common formats', convertio: '300+ including obscure formats' },
  { feature: 'Price', convertyard: 'Free', convertio: 'Free / $10–$25/month' },
]

const FAQ: { q: string; a: React.ReactNode; text: string }[] = [
  {
    q: 'Does Convertio upload my files to its servers?',
    a: (
      <>
        Yes, all the conversions on Convertio take place in the cloud. Every file you upload to
        Convertio is stored on a third-party server for a set period of time (by default up to
        24 hours), and then it gets deleted.
      </>
    ),
    text: 'Yes, all the conversions on Convertio take place in the cloud. Every file you upload to Convertio is stored on a third-party server for a set period of time (by default up to 24 hours), and then it gets deleted.',
  },
  {
    q: "What happens when I hit Convertio's 25 conversion limit?",
    a: (
      <>
        Converting more than 25 files per day in a 24-hour period will cause Convertio to stop
        processing any more files until the conversion counter has cycled. The user can upgrade
        to a paid account for $10 per month (process 50 files per day) or $25 per month (process
        any number of files). <strong>ConvertYard does not impose any limit on conversions.</strong>
      </>
    ),
    text: 'Converting more than 25 files per day in a 24-hour period will cause Convertio to stop processing any more files until the conversion counter has cycled. The user can upgrade to a paid account for $10 per month (process 50 files per day) or $25 per month (process any number of files). ConvertYard does not impose any limit on conversions.',
  },
  {
    q: 'Does Convertio support more formats than ConvertYard?',
    a: (
      <>
        Convertio supports 300+ formats (CAD DWG, DXF, e-book formats EPUB, MOBI, and dozens of
        audio/video codecs), while ConvertYard supports ~40 formats, which cover{' '}
        <strong>95% of all the conversions</strong>. Should you need a very special format to
        convert, you are better off with Convertio.
      </>
    ),
    text: 'Convertio supports 300+ formats (CAD DWG, DXF, e-book formats EPUB, MOBI, and dozens of audio/video codecs), while ConvertYard supports ~40 formats, which cover 95% of all the conversions. Should you need a very special format to convert, you are better off with Convertio.',
  },
  {
    q: 'Is ConvertYard better than Convertio for everyday image and PDF conversion?',
    a: (
      <>
        ConvertYard offers more features for the most common conversions (
        <Link href="/jpg-to-webp/" className="text-primary underline-offset-2 hover:underline">
          JPG, PNG, WebP, AVIF
        </Link>
        ,{' '}
        <Link href="/pdf-to-word/" className="text-primary underline-offset-2 hover:underline">
          PDF to Word
        </Link>
        ,{' '}
        <Link href="/compress-pdf/" className="text-primary underline-offset-2 hover:underline">
          PDF compression
        </Link>
        ,{' '}
        <Link href="/merge-pdf/" className="text-primary underline-offset-2 hover:underline">
          merge
        </Link>
        ,{' '}
        <Link href="/split-pdf/" className="text-primary underline-offset-2 hover:underline">
          split
        </Link>
        , etc.). On the image conversion pages, all tools show{' '}
        <strong>before-and-after previews</strong> before you convert and estimate file-size
        settings (at least the first three, which can serve as a baseline for what to expect).
        All of these conversions are executed on your computer{' '}
        <strong>without uploading your files</strong>. No daily limits. And ConvertYard even
        supports <strong>batch conversion</strong> for all these conversions, which is not
        possible with the free tier of Convertio.
      </>
    ),
    text: 'ConvertYard offers more features for the most common conversions (JPG, PNG, WebP, AVIF, PDF to Word, PDF compression, merge, split, etc.). On the image conversion pages, all tools show before-and-after previews before you convert and estimate file-size settings (at least the first three, which can serve as a baseline for what to expect). All of these conversions are executed on your computer without uploading your files. No daily limits. And ConvertYard even supports batch conversion for all these conversions, which is not possible with the free tier of Convertio.',
  },
  {
    q: 'Which tool is better if I work with sensitive files?',
    a: (
      <>
        <Link href="/gdpr-compliant-file-converter/" className="text-primary underline-offset-2 hover:underline">
          ConvertYard
        </Link>
        , because the conversion happens completely in the browser using WebAssembly, i.e.,{' '}
        <strong>your file bytes never leave your device</strong>. In contrast, even though
        Convertio deletes your uploaded files after a while, your files are still uploaded to the
        server (even if only temporarily), and thus a record of them is kept on the server. This
        would be a problem for <strong>legal documents, photos of children, medical records</strong>,
        etc.
      </>
    ),
    text: 'ConvertYard, because the conversion happens completely in the browser using WebAssembly, i.e., your file bytes never leave your device. In contrast, even though Convertio deletes your uploaded files after a while, your files are still uploaded to the server (even if only temporarily), and thus a record of them is kept on the server. This would be a problem for legal documents, photos of children, medical records, etc.',
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
            mainEntity: FAQ.map(({ q, text }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text },
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
            We support <strong className="text-fg">300+ formats</strong>, while ConvertYard
            supports <strong className="text-fg">~40 formats</strong> and{' '}
            <strong className="text-fg">does not upload your files</strong>. Whether Convertio or
            ConvertYard is the best solution for you depends on the formats you need to convert
            and on the <strong className="text-fg">sensitivity of the files</strong> in question.
          </p>
        </div>

        {/* 30-second summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">ConvertYard</p>
            <p className="text-sm font-semibold text-fg">Best for: common formats, privacy, batch workflows, no account required</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ <strong className="text-fg">Files never leave your browser</strong></li>
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
              Convertio supports <strong className="text-fg">over 300 file types</strong>,
              including documents, images, audio, video, and many more, including CAD files and
              e-books. If you need to convert something unusual like DWG to PDF, EPUB to MOBI, or
              FLAC to OGG, then Convertio is almost certainly going to support it. ConvertYard,
              on the other hand, supports <strong className="text-fg">about 40 file types</strong>,
              which cover most users' file conversion needs. Files with unusual extensions that
              are not supported by ConvertYard will likely be supported by Convertio.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Privacy: ConvertYard wins</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Convertio is an entirely web-based file converter. You upload a file to its servers,
              convert it, and download the result. Generally speaking, uploaded files are deleted
              from the servers after 24 hours. For ConvertYard, the file is{' '}
              <strong className="text-fg">never transferred to the servers of ConvertYard</strong>.
              Thus, you don't have to worry about ConvertYard converting files that contain{' '}
              <strong className="text-fg">sensitive information</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Free tier limits</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              The free Convertio tier limits users to{' '}
              <strong className="text-fg">25 conversions per day</strong> (100 MB per file). A
              $10/month plan lifts daily limits to 50 files. The unlimited plan costs $25/month.
              The ConvertYard tool has <strong className="text-fg">no limits whatsoever</strong>:
              convert 1,000+ files in a single session, and come back tomorrow and do it all again.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Batch conversion</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Convertio allows for <strong className="text-fg">single-file conversion</strong> and
              counts against your daily limit. ConvertYard, on the other hand, allows you to add
              up to <strong className="text-fg">1,000 files for conversion all at once</strong>.
              You can add all the files you need for conversion in one drop, get a{' '}
              <strong className="text-fg">progress bar for each file</strong>, and have all the
              converted files packed into a single ZIP file.
            </p>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Verdict</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            Converting common files like JPG, PNG,{' '}
            <Link href="/png-to-webp/" className="text-primary underline-offset-2 hover:underline">
              WebP
            </Link>
            ,{' '}
            <Link href="/avif-to-jpg/" className="text-primary underline-offset-2 hover:underline">
              AVIF
            </Link>
            , PDF, Word documents, and more in ConvertYard is{' '}
            <strong className="text-fg">unlimited in terms of the number of files per day</strong>,{' '}
            <strong className="text-fg">unlimited in terms of file size</strong>, and there is{' '}
            <strong className="text-fg">no upload of your files to remote servers</strong>. Batch
            conversion of hundreds of files in one session is also supported. All converted files
            are packaged into a ZIP archive for easy download. Convertio is the better option if
            the file you need to convert is not supported by ConvertYard (there are 300+ formats
            supported by Convertio and not supported by ConvertYard).
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
              { label: 'WebP to JPG', href: '/webp-to-jpg' },
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
              href="/images/"
              className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Image tools →
            </Link>
            <Link
              href="/pdf/"
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
