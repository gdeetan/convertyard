import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Monitor, FileCheck, Users } from 'lucide-react'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'

export const metadata: Metadata = {
  title: 'Sensitive Document Conversion for Teams — ConvertYard',
  description:
    'Convert PDFs, compress documents, and merge files without uploading to any server. Zero upload logs. No BAA required. Built for legal, HR, healthcare, and finance.',
  openGraph: {
    title: 'Sensitive Document Conversion for Teams — ConvertYard',
    description:
      'Convert sensitive documents entirely in the browser. Nothing reaches our servers — no upload logs, no retention risk. Free for legal, HR, healthcare, and finance teams.',
    url: 'https://convertyard.com/for/teams',
    siteName: 'ConvertYard',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sensitive Document Conversion for Teams — ConvertYard',
    description:
      'Batch convert files in your browser. Nothing uploads. No accounts. Free for teams.',
  },
  alternates: {
    canonical: 'https://convertyard.com/for/teams',
  },
}

const FAQ = [
  {
    q: 'Do files ever reach your servers?',
    a: 'No. All processing runs inside the browser via WebAssembly — the same C++ libraries used in desktop software, running locally on your CPU. No file data, filenames, or metadata ever reaches our servers.',
  },
  {
    q: 'Do we need a BAA (Business Associate Agreement) to use ConvertYard?',
    a: 'No BAA is required because we never receive, store, or process any of your files. There is nothing on our end to regulate. The conversion happens entirely within your browser.',
  },
  {
    q: 'Is there an audit log of which files were processed?',
    a: "No. Because we never see your files, there's no log of file names, contents, or when conversions happened. Your Google Analytics-based usage metrics (number of page visits) are the only data collected.",
  },
  {
    q: 'Can we use this on locked-down corporate networks?',
    a: 'Yes. ConvertYard is a standard website — no special ports, no agent to install. Once the page loads, all processing happens offline in your browser. You can even block outbound traffic after load.',
  },
  {
    q: 'Does it work without an internet connection?',
    a: "Yes, after your first visit. The WebAssembly modules are cached by your browser. After that, tools work entirely offline — useful when working with documents you can't transmit over public networks.",
  },
  {
    q: 'Is there a per-seat cost?',
    a: "No. ConvertYard is free. There are no accounts, no seats, no licenses. Open a tool, use it, close the tab. We're supported by minimal display ads shown below tools.",
  },
  {
    q: 'Can we convert 500 files at once?',
    a: "Yes. Every tool accepts batch input — tested to 1,000+ files on a modern laptop. Large batches are packaged into a single ZIP for download.",
  },
]

const PROFESSIONS = [
  {
    icon: FileCheck,
    role: 'Legal',
    pain: 'Client contracts, discovery documents, NDAs',
    use: 'Merge exhibit packets, compress for email limits, convert scanned pleadings to searchable PDF.',
  },
  {
    icon: Users,
    role: 'HR',
    pain: 'Offer letters, I-9 forms, performance reviews',
    use: 'Compress offer letter PDFs before sending, convert signed documents, batch rename onboarding files.',
  },
  {
    icon: Shield,
    role: 'Healthcare',
    pain: 'Patient records, lab reports, referral letters',
    use: 'Merge multi-page referrals, compress imaging reports, convert scanned intake forms.',
  },
  {
    icon: Monitor,
    role: 'Finance',
    pain: 'Tax documents, bank statements, audit files',
    use: 'Compress statements for secure email, merge audit packets, convert scanned invoices to searchable PDF.',
  },
]

const TOOLS = [
  'compress-pdf',
  'merge-pdf',
  'pdf-to-word',
  'word-to-pdf',
  'ocr-pdf',
  'compress-image',
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
            '@type': 'WebPage',
            name: 'Sensitive Document Conversion for Teams',
            url: 'https://convertyard.com/for/teams',
            description:
              'Browser-only document conversion for legal, HR, healthcare, and finance teams. No uploads. No BAA required.',
            isPartOf: { '@type': 'WebSite', url: 'https://convertyard.com' },
          }),
        }}
      />

      {/* Hero */}
      <section
        aria-labelledby="teams-heading"
        className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 text-center"
      >
        <p className="mb-4 text-sm font-semibold tracking-wide text-primary">
          For teams
        </p>
        <h1
          id="teams-heading"
          className="text-4xl font-bold tracking-tight text-fg sm:text-5xl"
        >
          Convert files your IT policy won&apos;t touch.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
          Compress PDFs, merge documents, run OCR — entirely inside your browser.
          Nothing reaches our servers. No upload logs. No BAA required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="#tools"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-fg transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[48px]"
          >
            See document tools →
          </Link>
          <Link
            href="#how"
            className="inline-flex items-center rounded-xl border border-border px-6 py-3 text-base font-semibold text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[48px]"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* The problem with other converters */}
      <section className="bg-bg-muted py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Why most converters are a liability for sensitive documents
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                label: 'Files uploaded to unknown servers',
                detail:
                  'Most browser tools send your files to a cloud server for processing. You have no visibility into retention policies, storage regions, or who has access.',
              },
              {
                label: 'Upload logs exist',
                detail:
                  'Even "auto-delete in 1 hour" services create a record. That log can be subpoenaed, breached, or retained longer than advertised.',
              },
              {
                label: 'BAA requirements for HIPAA-adjacent workflows',
                detail:
                  'If your vendor touches patient-adjacent data, your legal team needs a BAA. Procurement cycles kill productivity.',
              },
              {
                label: 'No audit trail on your end',
                detail:
                  "When you upload to a third-party service, you lose control. You can't prove the document wasn't retained, modified, or accessed.",
              },
            ].map(({ label, detail }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-bg-elevated p-5"
              >
                <p className="mb-1.5 text-sm font-semibold text-error">✕ {label}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            How ConvertYard is different
          </h2>
          <div className="rounded-xl border border-border bg-bg-elevated p-6 sm:p-8">
            <p className="mb-4 text-sm font-semibold text-fg">
              WebAssembly runs the conversion library inside your browser — on your CPU, in your tab.
            </p>
            <p className="text-sm leading-relaxed text-fg-muted">
              When you convert a PDF on ConvertYard, the browser downloads a WebAssembly module
              (a compiled version of the same C++ library used in desktop apps like Adobe Acrobat).
              That module runs locally. Your file bytes never leave the browser process. Our server
              sees one static file request — no different from loading a page image.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Open your browser&apos;s DevTools → Network tab while converting. You&apos;ll see the WASM
              modules load once, then nothing — no outbound requests during conversion, no
              upload, no download from your documents.
            </p>
            <Link
              href="/how-it-works"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
            >
              Read the full technical explanation →
            </Link>
          </div>

          {/* Verification checklist */}
          <ul className="mt-8 space-y-3" role="list">
            {[
              'No file data in server logs — our access logs contain only page URLs, not file content',
              'No retention risk — we have nothing to retain',
              'No BAA required — we are not a Business Associate under HIPAA because we never receive PHI',
              'Works on air-gapped networks after first page load',
              'Open source WASM libraries — auditable by your security team',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-fg-muted">
                <span className="mt-0.5 shrink-0 font-bold text-success">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Use cases by profession */}
      <section className="bg-bg-muted py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Who uses it and for what
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {PROFESSIONS.map(({ icon: Icon, role, pain, use }) => (
              <div
                key={role}
                className="flex flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-muted">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-base font-semibold text-fg">{role}</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  Common documents
                </p>
                <p className="text-sm text-fg-muted">{pain}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  How they use it
                </p>
                <p className="text-sm leading-relaxed text-fg-muted">{use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Document tools
          </h2>
          <p className="mb-8 text-sm text-fg-muted">
            All free. All browser-only. No accounts.
          </p>
          <RelatedToolsStrip slugs={TOOLS} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FAQAccordion items={FAQ} />
          <p className="mt-8 text-sm text-fg-muted">
            Questions about security or compliance?{' '}
            <a
              href="mailto:hello@convertyard.com"
              className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
            >
              Email hello@convertyard.com
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
