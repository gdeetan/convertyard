import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { absolute: 'GDPR-Compliant File Converter — No Upload, No Server | ConvertYard' },
  description:
    'Convert PDFs, images, and documents without uploading to a server. Zero GDPR exposure — all processing runs locally in your browser. No BAA required for HIPAA.',
  openGraph: {
    title: 'GDPR-Compliant File Converter — No Upload, No Server | ConvertYard',
    description:
      'The only file converter where your data never leaves your machine. GDPR by architecture, not policy. No uploads, no logs, no breach risk.',
    url: 'https://convertyard.com/gdpr-compliant-file-converter',
    siteName: 'ConvertYard',
    type: 'website',
  },
  alternates: {
    canonical: 'https://convertyard.com/gdpr-compliant-file-converter',
  },
}

const TABLE = [
  { feature: 'Files uploaded to a server', convertyard: 'Never', other: 'Yes' },
  { feature: 'GDPR data processor agreement', convertyard: 'Not required', other: 'Required' },
  { feature: 'HIPAA BAA required', convertyard: 'No', other: 'Yes, if handling PHI' },
  { feature: 'Upload logs retained', convertyard: 'None', other: 'Varies by provider' },
  { feature: 'Breach surface', convertyard: 'Zero', other: 'Server-side' },
  { feature: 'Works offline', convertyard: 'Yes', other: 'No' },
  { feature: 'Cost', convertyard: 'Free', other: 'Free / Paid' },
]

const FAQ = [
  {
    q: 'Does ConvertYard qualify as a GDPR data processor?',
    a: 'No, a DPA is not required because a Data Processor is defined under the GDPR as one who processes personal data on behalf of the Data Controller. ConvertYard doesn’t upload any files to a third-party server, so no data processing is occurring. No DPA is required with ConvertYard.',
  },
  {
    q: 'Do I need a HIPAA BAA to use ConvertYard with patient records?',
    a: 'No, because you are never uploading your files and ConvertYard never receives, creates, or maintains PHI in connection with your use of the service (all processing is done in your browser via WebAssembly). Therefore, ConvertYard is not a Business Associate.',
  },
  {
    q: 'How can I prove files are not uploaded?',
    a: 'Open your browser DevTools (F12), switch to the Network tab. Open a file in a new tab and convert it there with ConvertYard (e.g., by clicking on the Convert button). All you will see in the Network tab is loading the WebAssembly modules that were required on first use of the tool for that type of file, but no upload of your file data to a server. The output of the conversion is assembled locally on your computer. It can then be downloaded from there.',
  },
  {
    q: 'Can ConvertYard be used on air-gapped or restricted networks?',
    a: "After the first page load, ConvertYard’s WebAssembly modules are cached locally by your browser. Local conversion only happens afterward, and even that does not leave your premises as long as the initial page load was allowed.",
  },
  {
    q: 'Is this true for all ConvertYard tools?',
    a: 'Yes. All ConvertYard tools are local file processors, such as image converters, PDF processors, video extractors, and document converters, and they run client-side as WebAssembly modules. The privacy guarantee is the architecture, not the tool.',
  },
]

const TOOLS = [
  { href: '/compress-pdf', name: 'Compress PDF', desc: 'Shrink PDFs for email without uploading' },
  { href: '/merge-pdf', name: 'Merge PDF', desc: 'Combine contracts and reports locally' },
  { href: '/word-to-pdf', name: 'Word to PDF', desc: 'Convert DOCX to PDF in-browser' },
  { href: '/pdf-to-jpg', name: 'PDF to JPG', desc: 'Extract pages as images, locally' },
  { href: '/ocr-pdf', name: 'OCR PDF', desc: 'Make scanned documents searchable' },
  { href: '/redact-pdf', name: 'Redact PDF', desc: 'Permanently remove sensitive content' },
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
            Privacy &amp; Compliance
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            GDPR-Compliant File Conversion — No Upload Required
          </h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            The ConvertYard tool is a web application that is used{' '}
            <strong className="font-semibold text-fg">entirely in the user&apos;s browser</strong>.
            There are{' '}
            <strong className="font-semibold text-fg">
              no files that are uploaded to servers of third parties
            </strong>
            , such as those of the developer of ConvertYard.
          </p>
        </div>

        {/* Two-card summary */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">What this means for you</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>✓ Zero GDPR obligations — no data processor agreement needed</li>
              <li>✓ No BAA required for HIPAA-covered entities</li>
              <li>✓ No upload logs, no retention risk, no breach surface</li>
              <li>✓ Verify it yourself: open DevTools → Network while converting</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Who this is for</p>
            <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
              <li>Legal teams handling contracts and NDAs</li>
              <li>HR processing sensitive employee documents</li>
              <li>Healthcare staff converting patient records</li>
              <li>Finance teams with confidential reports</li>
              <li>Anyone under GDPR, HIPAA, or SOC 2 constraints</li>
            </ul>
          </div>
        </div>

        {/* Feature table */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-fg">
            How ConvertYard compares
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-muted">
                  <th className="px-4 py-3 text-left font-semibold text-fg">Feature</th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">ConvertYard</th>
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">Server-based tools</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg'}>
                    <td className="px-4 py-3 text-fg-muted">{row.feature}</td>
                    <td className="px-4 py-3 font-medium text-fg">{row.convertyard}</td>
                    <td className="px-4 py-3 text-fg-muted">{row.other}</td>
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
            <h3 className="mb-2 text-base font-semibold text-fg">GDPR by architecture</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Under the GDPR, if you upload files containing personal data to third-party services,
              these services are considered to be data processors for you, and you will need to sign
              a Data Processor Agreement (DPA) with them. Data processors have a number of
              obligations, including deletion of personal data, notification of data breaches, and
              handling of requests from data subjects.{' '}
              <strong className="font-semibold text-fg">
                ConvertYard is not a data processor because we do not receive your files.
              </strong>{' '}
              Instead, we use{' '}
              <strong className="font-semibold text-fg">WebAssembly</strong> to run the same C++
              libraries (MuPDF and pdf-lib) that we would normally run on your server, on your CPU
              instead. Thus, there is no uploaded file and therefore no data processor relationship
              under the GDPR, in addition to the relationship(s) you already have with your
              device(s).
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">No HIPAA BAA required</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Under HIPAA, business associates and covered entities must enter into a BAA with
              vendors that handle PHI (e.g., patient records). For example, if you upload a
              patient’s record to CloudConvert or Smallpdf, you will need to establish a Business
              Associate relationship with each company, review a BAA with them, and establish
              procedures for data retention and for notifying the entity in the event of a breach.
              None of this is required, however, for files processed by ConvertYard.{' '}
              <strong className="font-semibold text-fg">
                Never does ConvertYard take possession of the file containing the PHI of your
                patients.
              </strong>{' '}
              All processing occurs on your local computer.{' '}
              <strong className="font-semibold text-fg">
                No business associate relationship with you is therefore required.
              </strong>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Verify it yourself — in 30 seconds</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Look at your browser DevTools (F12). Open the Network tab. Open up any{' '}
              <Link
                href="/tools"
                className="text-primary underline-offset-2 hover:underline"
              >
                ConvertYard tool
              </Link>{' '}
              and drag a file into it, then click Convert. You will see requests to load the
              WebAssembly module for the tool you are using for the first time, but{' '}
              <strong className="font-semibold text-fg">no upload of your file data</strong> (just
              bytes in your browser). That’s the only privacy proof you need to see: no file upload
              requests in your browser – just local processing of file bytes.{' '}
              <strong className="font-semibold text-fg">No privacy policy needed.</strong>
            </p>
          </div>
        </section>

        {/* Tools section */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-fg">
            The tools compliance teams use most
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ href, name, desc }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-border bg-bg-elevated p-4 transition-colors hover:border-border-strong"
              >
                <p className="mb-1 text-sm font-semibold text-fg">{name}</p>
                <p className="text-xs text-fg-muted">{desc}</p>
              </Link>
            ))}
          </div>
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
            Start converting — no account, no upload, no risk
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
