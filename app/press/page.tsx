import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ALL_TOOLS } from '@/content/tool-catalog'

const liveToolCount = ALL_TOOLS.filter((t) => t.status === 'live').length

export const metadata: Metadata = {
  title: 'Press Kit — ConvertYard',
  description:
    'Logos, boilerplate copy, and key facts about ConvertYard — the local-first batch file converter that never uploads your files.',
  alternates: {
    canonical: 'https://convertyard.com/press',
  },
  openGraph: {
    title: 'Press Kit — ConvertYard',
    description:
      'Logos, boilerplate copy, and key facts about ConvertYard — the local-first batch file converter that never uploads your files.',
    url: 'https://convertyard.com/press',
  },
}

export default function PressPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Press kit' }]} />
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-fg sm:text-4xl">Press kit</h1>

      <div className="space-y-10 text-base leading-relaxed text-fg-muted">

        {/* Boilerplate */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-fg">About ConvertYard</h2>
          <p className="rounded-lg border border-border bg-bg-muted px-5 py-4 text-sm text-fg-muted italic">
            ConvertYard is a local-first batch file conversion tool launched in 2026. Files are
            processed entirely in your browser via WebAssembly — nothing is uploaded to any server.
          </p>
          <p className="mt-2 text-xs text-fg-subtle">
            You may use this paragraph verbatim without attribution.
          </p>
        </section>

        {/* Key facts */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-fg">Key facts</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Launched 2026</li>
            <li>{liveToolCount} free tools available</li>
            <li>No account or sign-up required</li>
            <li>No file size limits enforced server-side — processing is entirely local</li>
            <li>Works offline after first visit (WASM modules are cached)</li>
            <li>
              Supported by minimal display ads — never inside the conversion flow
            </li>
          </ul>
        </section>

        {/* Logo downloads */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-fg">Logo downloads</h2>
          <p className="mb-4">
            Use on light backgrounds. Do not alter colours, proportions, or add effects.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/logo.svg"
              download="convertyard-logo.svg"
              aria-label="Download ConvertYard logo (SVG)"
              className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Logo (SVG) ↓
            </a>
            <a
              href="/logo-mark.svg"
              download="convertyard-mark.svg"
              aria-label="Download ConvertYard mark / icon (SVG)"
              className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Mark / icon (SVG) ↓
            </a>
          </div>
        </section>

        {/* Press contact */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-fg">Press contact</h2>
          <p>
            <a
              href="mailto:hello@convertyard.com"
              className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
            >
              hello@convertyard.com
            </a>
          </p>
        </section>
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
