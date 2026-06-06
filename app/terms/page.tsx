import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of service for ConvertYard. Free file conversion tools, no accounts required.',
  alternates: {
    canonical: 'https://convertyard.com/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-fg">Terms of Service</h1>
      <p className="mb-10 text-sm text-fg-subtle">Last updated: June 6, 2026</p>

      <div className="prose prose-sm sm:prose-base max-w-none text-fg-muted space-y-8">

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">1. The service</h2>
          <p>
            ConvertYard provides free, browser-based file conversion and transformation tools at
            convertyard.com. All processing runs client-side via WebAssembly. No files are uploaded
            to our servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">2. Using the service</h2>
          <p>You may use ConvertYard for any lawful purpose. You agree not to:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Use the service to convert copyrighted material you don't own or have rights to</li>
            <li>Attempt to reverse-engineer or extract the WebAssembly binaries for redistribution</li>
            <li>Automate requests in a way that degrades the experience for other users</li>
            <li>Use the service in any way that violates applicable law</li>
          </ul>
          <p className="mt-3">
            You must be at least 13 years old to use this service. No account is required.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">3. Your files</h2>
          <p>
            You retain all rights to your files. Because processing is entirely local, we never
            receive, see, or store your files or their contents. You are responsible for ensuring
            you have the right to process any file you submit to the tool.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">4. No warranty</h2>
          <p>
            The service is provided "as is" without warranty of any kind. We don't guarantee
            that conversions will be error-free, that every file format or codec will be
            supported, or that the service will be available without interruption.
          </p>
          <p className="mt-3">
            Always keep a copy of your original files. We cannot recover files — they never
            leave your device.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">5. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, ConvertYard and its operators are not liable
            for any indirect, incidental, or consequential damages arising from your use of the
            service, including data loss, file corruption, or business interruption.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">6. Ads</h2>
          <p>
            ConvertYard displays minimal display ads to support the free service. Ads appear below
            tool FAQs and within articles. They do not appear inside conversion flows, above the
            fold, or in any way that disrupts tool use. Ad networks may set cookies subject to your
            consent preferences.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">7. Changes to the service</h2>
          <p>
            We may add, modify, or remove tools at any time. We may also update these terms. If
            we make material changes, we'll update the date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">8. Governing law</h2>
          <p>
            These terms are governed by the laws of the United States. Disputes are subject to
            the exclusive jurisdiction of the courts in the applicable state.
          </p>
        </section>

        <p className="text-sm text-fg-subtle border-t border-border pt-6">
          Questions?{' '}
          <a
            href="mailto:hello@convertyard.com"
            className="text-primary hover:underline"
          >
            hello@convertyard.com
          </a>
          {' '}·{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy policy
          </Link>
        </p>
      </div>
    </div>
  )
}
