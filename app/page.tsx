import type { Metadata } from 'next'
import { organizationSchema, webSiteSchema, faqPageSchema } from '@/lib/seo/schema'
import { ALL_TOOLS } from '@/content/tool-catalog'

const liveToolCount = ALL_TOOLS.filter(t => t.status === 'live').length
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
  title: 'Convertyard - Batch Image, Video, Audio, PDF File Coverter. All Local. Nothing Uploads.',
  description:
    'Batch convert or compress images, videos, audio, pdf files,  up to 1,000 images in one go. All done in your browser. Nothing uploads. No Paywall or sign ups. 100% free.',
  openGraph: {
    title: 'Convertyard - Batch Image, Video, Audio, PDF File Coverter. All Local. Nothing Uploads.',
    description:
      `Convert thousands of images, PDFs, videos, and audio files entirely in your browser. No uploads, no accounts. ${liveToolCount} free tools.`,
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
    a: "ConvertYard uses a locally run library of code called WebAssembly, so the conversion happens inside the browser. The CPU processes the files, and they aren't uploaded to any server.",
  },
  {
    q: 'Is there a file size limit?',
    a: "It depends on your device's memory. Most browsers can handle files up to ~2GB. We surface a clear warning when a file is too large.",
  },
  {
    q: "What's the maximum batch size?",
    a: "I've tested a batch of over 230 files, and it finished everything in around 10 minutes. It was a mixture of large files directly off the camera (4 to 6 MB) and smaller files. I've added extra features in the file converters, like resize and target size, to help reduce the number of steps needed for your file compression or conversion needs. The actual maximum batch size depends on your processor and graphics card speed; the faster they are, the faster it will compress.",
  },
  {
    q: 'Do you store any data about my files?',
    a: "No, nothing is stored. You could test it yourself. Once the tool loads, turn off your Wi-Fi and try converting or compressing a file; it will still work without an internet connection.",
  },
  {
    q: 'Do you show ads?',
    a: "Yes. Once the site gets enough traffic, I'll show display ads, but only in areas that will not affect the tools' functionality.",
  },
  {
    q: 'Do you use analytics or cookies?',
    a: "We manage two things here: your files and the site's analytics. Your files are 100% local. We're running conversion in the browser with WebAssembly, and none of that ever hits our servers. For site analytics, we use Google Analytics (which we load in the cookie banner) to see which tools are most popular and build verified traffic stats for premium ad networks like Mediavine, so I can further develop the site. Ad revenue on our tools means they're free to use – no signups required, no watermarks. And as noted above, ad networks may set their own cookies here. None of this touches your files.",
  },
  {
    q: 'Does it work offline?',
    a: "Yes, only after the tool and script load. I've tested it with the WIFI and data turned off, and it works even without an internet connection.",
  },
  {
    q: 'Why is this free?',
    a: "One of my frustrations looking for an image conversion tool is that most of the ones I've tried have paywalls or require you to sign up. With the increasing number of data breaches from using your Gmail account to log in, I was concerned about privacy; hence, I decided to create this tool for myself.",
  },
  {
    q: 'Do I need to create an account?',
    a: "Nope. No need to create an account or log in to use the tool. There's no signup, no email wall, no login. Open a tool, use it, leave.",
  },
  {
    q: 'Are there watermarks on output files?',
    a: "No. Converted or compressed files don't have any watermarks.",
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
