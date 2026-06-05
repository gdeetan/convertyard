import Link from 'next/link'
import { Lock } from 'lucide-react'

const TOOL_LINKS = [
  { name: 'Image converters', href: '/images' },
  { name: 'Image editing', href: '/image-editing' },
  { name: 'PDF tools', href: '/pdf' },
  { name: 'Video & audio', href: '/video-audio' },
  { name: 'Developer tools', href: '/developer' },
  { name: 'Web tools', href: '/web-tools' },
  { name: 'AI tools', href: '/ai-tools' },
  { name: 'View all tools →', href: '/tools' },
]

const RESOURCE_LINKS = [
  { name: 'How it works', href: '/how-it-works' },
  { name: 'Blog', href: '/blog' },
  { name: 'API', href: '#', note: 'coming soon' },
  { name: 'GitHub', href: '#' },
]

const COMPANY_LINKS = [
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Press kit', href: '/press' },
]

const LEGAL_LINKS = [
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer aria-label="Site footer" className="border-t border-border bg-bg-muted">
      {/* Main columns */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Column 1: Tools */}
          <nav aria-label="Tool categories">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Tools
            </h2>
            <ul className="space-y-2.5" role="list">
              {TOOL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 2: Resources */}
          <nav aria-label="Resources">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Resources
            </h2>
            <ul className="space-y-2.5" role="list">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href} className="flex items-center gap-2">
                  <Link
                    href={link.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
                    aria-describedby={link.note ? `note-${link.name}` : undefined}
                  >
                    {link.name}
                  </Link>
                  {link.note && (
                    <span
                      id={`note-${link.name}`}
                      className="rounded-full bg-bg-elevated border border-border px-1.5 py-0.5 text-xs text-fg-subtle"
                    >
                      {link.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3: Company */}
          <nav aria-label="Company">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Company
            </h2>
            <ul className="space-y-2.5" role="list">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4: Legal */}
          <nav aria-label="Legal">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Legal
            </h2>
            <ul className="space-y-2.5" role="list">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {/* Wordmark + tagline */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-semibold text-fg">ConvertYard</span>
            <span className="hidden text-fg-subtle sm:inline" aria-hidden="true">·</span>
            <span className="text-sm text-fg-muted">
              Local-first conversion, built for batches.
            </span>
          </div>

          {/* Trust + copyright */}
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
              Your files stay on your device. Always.
            </span>
            <span className="text-xs text-fg-subtle">
              Files processed locally in your browser. We never see them.
            </span>
            <span className="text-xs text-fg-subtle">
              © {year} ConvertYard
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
