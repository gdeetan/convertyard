import type { Metadata } from 'next'
import { organizationSchema, webSiteSchema, faqPageSchema } from '@/lib/seo/schema'
import { Hero } from '@/components/homepage/hero'
import { TrustStrip } from '@/components/homepage/trust-strip'
import { ToolGrid } from '@/components/homepage/tool-grid'
import { HowItWorks } from '@/components/homepage/how-it-works'
import { ComparisonTable } from '@/components/homepage/comparison-table'
import { DevToolsProof } from '@/components/homepage/devtools-proof'
import { UseCases } from '@/components/homepage/use-cases'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'

// ── Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'ConvertYard — Local-first conversion, built for batches',
  description:
    'Convert thousands of images, PDFs, videos, and audio files entirely in your browser. No uploads, no accounts, no watermarks. Batch up to 1,000 files at once.',
  openGraph: {
    title: 'ConvertYard — Local-first conversion, built for batches',
    description:
      'Convert thousands of images, PDFs, videos, and audio files entirely in your browser. No uploads, no accounts. 88 free tools.',
    url: 'https://convertyard.com/',
    siteName: 'ConvertYard',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConvertYard — Local-first conversion, built for batches',
    description:
      'Batch convert files in your browser. Nothing uploads. No accounts. Free forever.',
  },
  alternates: {
    canonical: 'https://convertyard.com/',
  },
}

// ── FAQ data ──────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'How can conversion happen without uploading?',
    a: 'ConvertYard uses WebAssembly to run conversion libraries directly in your browser. Your files are processed locally by your CPU and never sent to any server.',
  },
  {
    q: 'Is there a file size limit?',
    a: "It depends on your device's memory. Most browsers can handle files up to ~2GB. We surface a clear warning when a file is too large.",
  },
  {
    q: "What's the maximum batch size?",
    a: "We've tested up to 1,000+ files per batch. The practical limit depends on your device. Older phones may handle fewer; modern laptops handle thousands.",
  },
  {
    q: 'Do you store any data about my files?',
    a: "No. We never see your files, so we can't store anything about them. All conversion runs in your browser — no file data, filenames, or contents ever reach our servers.",
  },
  {
    q: 'Do you show ads?',
    a: "Yes. Display ads appear below the FAQ on tool pages and within articles. They never appear inside the conversion flow, above the fold, or anywhere they'd get in your way. Your files are still processed entirely locally — ads and file processing are completely separate systems.",
  },
  {
    q: 'Do you use analytics or cookies?',
    a: "Two things, kept completely separate. Your files: 100% local — all conversion runs in your browser via WebAssembly and nothing ever reaches our servers. Site analytics: yes, we use Google Analytics (loaded only after you accept the cookie banner) to measure which tools are popular and to build the verified traffic data required to apply to premium ad networks like Mediavine. That ad revenue is how we keep every tool free with no signups or watermarks. Ad networks may set their own cookies. None of this touches your files.",
  },
  {
    q: 'Does it work offline?',
    a: "Yes, after your first visit. Once the tool's WebAssembly module is cached, it works without internet.",
  },
  {
    q: 'Why is this free?',
    a: "Tools should be free, so they are. The site is supported by minimal display ads below tools and on articles. Tool UIs themselves stay clean — no ads in the conversion flow, ever. We may also add a paid API tier in the future for developers.",
  },
  {
    q: 'Do I need to create an account?',
    a: "No. There's no signup, no email wall, no login. Open a tool, use it, leave.",
  },
  {
    q: 'Are there watermarks on output files?',
    a: "Never. Your output files are identical to what you'd get from desktop software.",
  },
]

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* JSON-LD schemas */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema()) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(FAQ)) }}
      />

      <Hero />
      <TrustStrip />
      <DevToolsProof />
      <ToolGrid />
      <HowItWorks />
      <ComparisonTable />
      <UseCases />

      {/* FAQ */}
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FAQAccordion items={FAQ} />
          <p className="mt-8 text-sm text-fg-muted">
            Still have questions?{' '}
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
