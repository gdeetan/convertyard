import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    "ConvertYard processes all files locally in your browser. We never see your files. Read what we do and don't collect.",
  alternates: {
    canonical: 'https://convertyard.com/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-fg">Privacy Policy</h1>
      <p className="mb-10 text-sm text-fg-subtle">Last updated: June 6, 2026</p>

      <div className="prose prose-sm sm:prose-base max-w-none text-fg-muted space-y-8">

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">The short version</h2>
          <p>
            ConvertYard converts files inside your browser using WebAssembly. Your files never leave
            your device. We don't upload them, we don't read them, we don't store them. There are no
            servers involved in the conversion process.
          </p>
          <p className="mt-3">
            We do collect limited, non-identifying analytics to understand which tools are used. We
            use Google Analytics for this, loaded only with your consent. Cloudflare sees your IP as
            the CDN serving the static site files.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">How file conversion works</h2>
          <p>
            Every conversion tool on ConvertYard runs inside your browser tab using WebAssembly
            (WASM) — compiled C++ libraries like libvips, ffmpeg, and pdf-lib. When you drop a
            file, it is processed by your device's CPU in a sandboxed browser context. No network
            request is made for your file. Not to our servers, not to any third party.
          </p>
          <p className="mt-3">
            This is verifiable: open your browser's Network tab before and after a conversion. You
            will see no outbound request containing your file.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">Analytics</h2>
          <p>
            We use <strong>Google Analytics 4</strong> to understand aggregate site usage: which
            tools are visited, how long pages are open, which browsers are used. Google Analytics is
            loaded only after you click "Accept" in the cookie banner. If you click "Reject" or
            dismiss the banner, no analytics script loads.
          </p>
          <p className="mt-3">
            We also have <strong>Cloudflare Web Analytics</strong> — cookieless, privacy-first
            analytics provided automatically as part of Cloudflare Pages hosting. Cloudflare may log
            your IP address and basic request data as part of serving the site.
          </p>
          <p className="mt-3">
            Neither analytics system has access to your files.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">Cookies</h2>
          <p>
            We set one functional cookie — <code>convertyard_consent</code> — to remember whether
            you accepted or rejected Google Analytics. This cookie does not track you across sites
            and is not shared with any third party.
          </p>
          <p className="mt-3">
            If you accept analytics, Google Analytics sets its standard measurement cookies
            (e.g., <code>_ga</code>). You can clear these at any time from your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">What we don't collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your files, or any content within them</li>
            <li>File names or metadata</li>
            <li>Your email address (there's no account system)</li>
            <li>Payment information (the service is free)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">GDPR / Data subject rights</h2>
          <p>
            If you are in the EU or UK, you have the right to access, correct, or delete any
            personal data we hold. Because we don't collect identifying data beyond what analytics
            provides, there is very little to act on. For analytics data, the fastest path is to
            reject cookies in the banner and clear any existing analytics cookies in your browser.
          </p>
          <p className="mt-3">
            For questions, email{' '}
            <a
              href="mailto:hello@convertyard.com"
              className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
            >
              hello@convertyard.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">Changes to this policy</h2>
          <p>
            If we add new tools, analytics, or integrations that change what data is collected, we
            will update this page and the "Last updated" date above.
          </p>
        </section>

        <p className="text-sm text-fg-subtle border-t border-border pt-6">
          Questions?{' '}
          <Link
            href="mailto:hello@convertyard.com"
            className="text-primary hover:underline"
          >
            hello@convertyard.com
          </Link>
          {' '}·{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of service
          </Link>
        </p>
      </div>
    </div>
  )
}
