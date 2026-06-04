import { Lock, Package, Zap } from 'lucide-react'

const PILLARS = [
  {
    icon: Lock,
    heading: 'Nothing uploads',
    body: 'All processing runs via WebAssembly, on your device.',
  },
  {
    icon: Package,
    heading: 'Built for batches',
    body: '1,000+ files at once, downloaded as a single ZIP.',
  },
  {
    icon: Zap,
    heading: 'No accounts',
    body: 'No signups, no email walls, no ads in tools.',
  },
]

export function TrustStrip() {
  return (
    <section
      aria-label="Why ConvertYard"
      className="bg-bg-muted py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, heading, body }) => (
            <div key={heading} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-bg-elevated">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <dt className="mb-1 text-base font-semibold text-fg">{heading}</dt>
              <dd className="text-sm leading-relaxed text-fg-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
