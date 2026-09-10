import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'

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
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]} />
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-fg">Terms of Service</h1>
      <p className="mb-10 text-sm text-fg-subtle">Last updated: September 10, 2026</p>

      <div className="prose prose-sm sm:prose-base max-w-none text-fg-muted space-y-8">

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">1. The service</h2>
          <p>
            ConvertYard.com is a completely FREE online converter, made for browsers only. All
            converters are ONLINE - all processing takes place in your browser (WebAssembly code),
            no files get uploaded to our servers!
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">2. Using the service</h2>
          <p>You may use ConvertYard for any lawful purpose. You will not use ConvertYard for the following:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Using the service to convert copyrighted material you don&apos;t own or have rights to.</li>
            <li>Any attempts to Reverse Engineer the ConvertYard tools or to extract the WebAssembly binaries for redistribution will be denied immediately.</li>
            <li>Using ConvertYard in a way that would negatively affect other users making requests of the service.</li>
            <li>Use the service to violate any applicable law or regulation.</li>
          </ul>
          <p className="mt-3">
            We do not allow children under the age of 13 to use the Service. Registration for an
            account is not required to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">3. Your files</h2>
          <p>
            You retain the copyright and/or other intellectual property rights in your files. The
            fact that ConvertYard processes files on your local machine means that ConvertYard NEVER
            sees, receives, stores or EVER has access to your files and their contents.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">4. No warranty</h2>
          <p>
            Our Services are provided “as is” without any kind of warranty. ConvertYard does not
            guarantee the accuracy or completeness of any conversion, or that our Services will be
            performed without interruptions or errors.
          </p>
          <p className="mt-3">
            Be sure to keep back-up copies of your files before using ConvertYard to convert them.
            ConvertYard does not guarantee any ability to recover files submitted for conversion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">5. Limitation of liability</h2>
          <p>
            The operation of ConvertYard in whatever form or by whatever means is provided &quot;as
            is&quot; and ConvertYard and its owners and/or employees do not warrant the accuracy or
            completeness of any conversions or of the service as a whole and disclaim all and any
            liability to the full extent only for any and all damages, direct and indirect,
            incidental and/or consequential, including but not limited to loss of data or
            corruption of data or loss of business or interruption of business.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">6. Ads</h2>
          <p>
            Display ads (from ad networks like Google AdSense) support the website financially. They
            are mostly found in the display area below the tool’s FAQ section and within articles.
            No ads appear within the conversion process itself, and they are always below the fold.
            To improve user experience, we refrain from displaying any ads above the tool’s preview.
            In addition, some ad networks (like Google, Facebook, etc.) also set cookies on this
            website. The use of these cookies depends on your consent settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">7. Changes to the service</h2>
          <p>
            This agreement is subject to change from time to time without prior notice, and if we
            make any changes to these terms and conditions, we will post the updated date at the
            top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">8. Governing law</h2>
          <p>
            This website is governed by the laws of the United States. Any disputes will be heard
            in the applicable state courts.
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
