import Link from 'next/link'
import { Camera, Code2, ShieldCheck } from 'lucide-react'

const CASES = [
  {
    icon: Camera,
    title: 'For photographers',
    body: 'Convert hundreds of HEIC or RAW files from a shoot without uploading client work to anyone\'s servers. Batch compress, resize, and rename in one pass.',
    cta: 'See image tools',
    href: '/#images',
  },
  {
    icon: Code2,
    title: 'For developers',
    body: 'Clean, fast tools that respect your time. Shareable URLs for state. API access coming soon.',
    cta: 'See developer tools',
    href: '/#dev',
  },
  {
    icon: ShieldCheck,
    title: 'For sensitive files',
    body: 'Contracts, medical records, financial documents. They stay on your device, end of story.',
    cta: 'See all tools',
    href: '/#all',
  },
]

export function UseCases() {
  return (
    <section
      aria-labelledby="use-cases-heading"
      className="py-10 sm:py-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="use-cases-heading"
          className="mb-12 text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          Built for everyone who handles files
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CASES.map(({ icon: Icon, title, body, cta, href }) => (
            <div
              key={title}
              className="flex flex-col rounded-2xl border border-border bg-bg-elevated p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-bg-muted">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-fg">{title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-fg-muted">{body}</p>
              <Link
                href={href}
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
              >
                {cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
