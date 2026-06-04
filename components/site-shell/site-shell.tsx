import { Nav } from './nav'
import { Footer } from './footer'

interface SiteShellProps {
  children: React.ReactNode
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      {/* Skip-to-content for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-fg focus:shadow-md focus:outline-2 focus:outline-primary"
      >
        Skip to main content
      </a>

      <Nav />

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </>
  )
}
