import type { Metadata } from 'next'
import { Hero } from '@/components/homepage/hero'
import { TrustStrip } from '@/components/homepage/trust-strip'
import { ToolGrid } from '@/components/homepage/tool-grid'
import { HowItWorks } from '@/components/homepage/how-it-works'
import { ComparisonTable } from '@/components/homepage/comparison-table'
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
      'Convert thousands of images, PDFs, videos, and audio files entirely in your browser. No uploads, no accounts. 60+ free tools.',
    url: 'https://convertyard.com',
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
    canonical: 'https://convertyard.com',
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
    a: "No. We never see your files, so we can't store anything. We use privacy-first analytics (Cloudflare Web Analytics) that doesn't use cookies or track individuals.",
  },
  {
    q: 'Do you show ads?',
    a: "Yes. Display ads appear below the FAQ on tool pages and within articles. They never appear inside the conversion flow, above the fold, or anywhere they'd get in your way. Your files are still processed entirely locally — ads and file processing are completely separate systems.",
  },
  {
    q: 'Do you use Google Analytics or cookies?',
    a: "Yes — the site uses Google Analytics to understand which tools are popular and improve them. Ad networks may also set cookies for ad delivery. This is standard for content sites. None of it touches your files, which are processed entirely in your browser. We show a cookie consent banner to visitors in regulated regions.",
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

// ── JSON-LD schemas ───────────────────────────────────────────────────────

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ConvertYard',
  url: 'https://convertyard.com',
  description:
    'Local-first batch file conversion in your browser. No uploads. No accounts.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://convertyard.com/tools?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ConvertYard',
  url: 'https://convertyard.com',
  logo: 'https://convertyard.com/logo.png',
  sameAs: [],
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* JSON-LD schemas */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />

      <Hero />
      <TrustStrip />
      <ToolGrid />
      <HowItWorks />
      <ComparisonTable />
      <UseCases />

      {/* FAQ */}
      <section className="py-16 sm:py-24">
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
