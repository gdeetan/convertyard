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
      <p className="mb-10 text-sm text-fg-subtle">Last updated: September 12, 2026</p>

      <div className="prose prose-sm sm:prose-base max-w-none text-fg-muted space-y-8">

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">1. The service</h2>
          <p>
            ConvertYard.com is a 100% FREE online converter, designed to process files within the
            browser. All conversions are done without uploading anything to a server using
            WebAssembly. You can process photos, documents, audio, or video files without risking
            them falling into unauthorized hands. I value your privacy; that&apos;s why I created
            this tool.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">2. Using the service</h2>
          <p>
            You may use ConvertYard for any legitimate activity - whether it be compressing videos
            to upload them to a social media platform or converting images. It is 100% free.
            However, there are instances you may NOT use it (hint: anything that violates the law).
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Using this tool to compress or convert files you do not own for the sole purpose of using it for commercial purposes.</li>
            <li>Reverse-engineer any ConvertYard tool for redistribution as another tool.</li>
            <li>Duplicating the website as is, including its content, and using it as your own.</li>
            <li>Using the service to convert copyrighted material you don&apos;t own or have rights to.</li>
          </ul>
          <p className="mt-3">
            Children under 13 must have parental consent to use this tool. There is no need to
            submit your email to register an account to use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">3. Your files</h2>
          <p>
            You retain ownership of the files processed through this website. In fact, ConvertYard
            processes files in your browser, so we do not have access, nor do I want access to,
            those files. Nothing is uploaded to a server, and we DO NOT have access to your files.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">4. No warranty</h2>
          <p>
            The services provided &ldquo;as is where is&rdquo; without any warranty. I do my best
            through repeated testing to ensure any conversion, compression, or procedure yields the
            best results, but I cannot guarantee the completeness of any conversion - as with all
            software, there is a chance of a bug happening. Always back up your files and keep them
            in a secure location. These tools let you convert or compress files for whatever
            purpose you need. I do not guarantee any ability to recover the files submitted through
            any of the tools since I do not receive any files, as everything is processed locally.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">5. Limitation of liability</h2>
          <p>
            ConvertYard tools operate &ldquo;as is,&rdquo; as described on the page. ConvertYard,
            its owners, and/or employees don&rsquo;t guarantee the accuracy or completeness of any
            conversions or the service as a whole. We disclaim all liability to the full extent for
            any and all damages, direct and indirect, incidental and/or consequential, including
            but not limited to the loss or corruption of data or loss or interruption of business.
            In short, treat this as a tool; you are ultimately responsible for your files and for
            ensuring that your computer functions as it should before doing any conversion. Users
            are ultimately responsible for their files and understand that backing them up is a
            high priority to maintain redundancy in their operation in case their computer gets
            corrupted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">6. Ads</h2>
          <p>
            ConvertYard may display ads (from ad networks like Google AdSense) to fund website
            operations and development. I try not to flood the page with ads, but to keep usability
            a high priority and place ads where they won&apos;t affect the user experience. Some ad
            networks, like Google or Facebook, also set cookies on this website, but their use
            depends on your consent settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-fg mb-3">7. Changes to the service</h2>
          <p>
            This agreement may change from time to time without prior notice due to circumstances
            beyond our control. If we make changes to these terms and conditions, we will post the
            updated date at the top of this page.
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
