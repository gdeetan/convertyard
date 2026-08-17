import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export const metadata: Metadata = {
  title: { absolute: 'Contact — ConvertYard' },
  description:
    'Report a broken tool, request a format, or reach out for press inquiries. Email us at hello@convertyard.com.',
  alternates: {
    canonical: 'https://convertyard.com/contact',
  },
  openGraph: {
    title: 'Contact — ConvertYard',
    description:
      'Report a broken tool, request a format, or reach out for press inquiries. Email us at hello@convertyard.com.',
    url: 'https://convertyard.com/contact',
  },
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        Get in touch
      </h1>

      <div className="space-y-6 text-base leading-relaxed text-fg-muted">
        <p>
          Found a bug or a tool that's producing wrong output?{' '}
          <Link
            href="mailto:hello@convertyard.com"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            hello@convertyard.com
          </Link>
          . Include the tool name, the file format, and what you expected to happen.
        </p>

        <p>
          Want a format or conversion we don't cover yet?{' '}
          <Link
            href="mailto:hello@convertyard.com"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            hello@convertyard.com
          </Link>
          . If it can run in a browser without uploading files, it's on the table.
        </p>

        <p>
          For press inquiries, logos, and boilerplate copy, see the{' '}
          <Link
            href="/press"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            press kit
          </Link>
          . Or email{' '}
          <Link
            href="mailto:hello@convertyard.com"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            hello@convertyard.com
          </Link>{' '}
          directly.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/about/"
          className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          About ConvertYard →
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          How it works technically →
        </Link>
      </div>
    </div>
  )
}
