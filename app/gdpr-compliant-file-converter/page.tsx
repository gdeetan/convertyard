import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GDPR-Compliant File Converter — No Upload, No Server | ConvertYard',
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
    a: 'No. Under GDPR, a data processor is an entity that processes personal data on behalf of a controller. Because ConvertYard never receives your files — all processing runs in your browser — there is no data processing relationship to regulate. You do not need a DPA with ConvertYard.',
  },
  {
    q: 'Do I need a HIPAA BAA to use ConvertYard with patient records?',
    a: 'No. A BAA is required when a business associate receives, creates, or maintains PHI. ConvertYard never receives your files. Conversion happens inside your browser via WebAssembly. The file bytes never leave your device, so no business associate relationship is formed.',
  },
  {
    q: 'How can I prove files are not uploaded?',
    a: 'Open your browser DevTools (F12), go to the Network tab, then drop a file and convert it. You will see requests to load WebAssembly modules on first use, but no request containing your file data. The conversion output is assembled locally and offered as a download — no server involved.',
  },
  {
    q: 'Can ConvertYard be used on air-gapped or restricted networks?',
    a: "After the first page load, ConvertYard's WebAssembly modules are cached by the browser. Subsequent conversions work without any network access. This makes it suitable for environments with strict outbound restrictions, provided the initial load is permitted.",
  },
  {
    q: 'Is this true for all ConvertYard tools?',
    a: 'Yes. Every ConvertYard tool processes files locally — image converters, PDF tools, video extractors, and document converters all use client-side WebAssembly. The privacy guarantee is architectural, not tool-specific.',
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
            ConvertYard converts files entirely inside your browser. Your documents never reach a
            server — not ours, not anyone&apos;s. That&apos;s not a policy. It&apos;s the architecture.
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
              Under GDPR, if you upload a file containing personal data to a third-party service,
              that service becomes a data processor. You need a signed DPA. The processor must handle
              deletion, breach notification, and data subject requests. ConvertYard is not a data
              processor because it never receives your files. Conversion happens inside your browser
              via WebAssembly — the same C++ libraries (MuPDF, pdf-lib) that would run on your
              server, running locally on your CPU instead. No upload = no processor relationship =
              no GDPR obligation beyond what you already have for your own device.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">No HIPAA BAA required</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Covered entities and business associates under HIPAA must have a BAA with every vendor
              that handles PHI. If you upload a patient record to CloudConvert or Smallpdf, those
              companies become business associates — and you need a signed BAA, data retention
              policies, and breach notification procedures in place. ConvertYard never receives the
              file. The PHI never leaves your workstation. There is no business associate relationship
              to establish.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated p-6">
            <h3 className="mb-2 text-base font-semibold text-fg">Verify it yourself — in 30 seconds</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Open your browser DevTools (F12 → Network tab). Drop a file into any ConvertYard tool
              and click Convert. Watch the Network tab. You&apos;ll see requests to load WebAssembly
              modules — but you won&apos;t see your file being uploaded anywhere. The bytes stay local.
              This is the only meaningful privacy proof: not a privacy policy, not a compliance
              certificate, but the absence of an upload request in your own browser.
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
