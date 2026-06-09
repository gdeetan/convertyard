'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Menu, X, Lock, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const MEGAMENU_CATEGORIES = [
  {
    title: 'Images',
    href: '/tools#images',
    tools: [
      { name: 'HEIC to JPG',   href: '/heic-to-jpg' },
      { name: 'JPG to WebP',   href: '/jpg-to-webp' },
      { name: 'PNG to WebP',   href: '/png-to-webp' },
      { name: 'WebP to JPG',   href: '/webp-to-jpg' },
      { name: 'JPG to AVIF',   href: '/jpg-to-avif' },
    ],
  },
  {
    title: 'Editing',
    href: '/tools#image-editing',
    tools: [
      { name: 'Background remover', href: '/background-remover' },
      { name: 'Image compressor',   href: '/image-compressor' },
      { name: 'Image resizer',      href: '/image-resizer' },
    ],
  },
  {
    title: 'PDF',
    href: '/tools#pdf',
    tools: [
      { name: 'Merge PDF',    href: '/merge-pdf' },
      { name: 'Compress PDF', href: '/compress-pdf' },
      { name: 'PDF to JPG',   href: '/pdf-to-jpg' },
    ],
  },
  {
    title: 'Video & Audio',
    href: '/tools#video-audio',
    tools: [
      { name: 'MP4 to MP3', href: '/mp4-to-mp3' },
      { name: 'MP3 to MP4', href: '/mp3-to-mp4' },
    ],
  },
  {
    title: 'Developer',
    href: '/tools#developer',
    tools: [
      { name: 'JSON formatter', href: '/json-formatter' },
      { name: 'Base64',         href: '/base64' },
      { name: 'JSON to CSV',    href: '/json-to-csv' },
    ],
  },
  {
    title: 'AI Tools',
    href: '/tools#ai-tools',
    tools: [
      { name: 'Alt text generator', href: '/alt-text-generator' },
      { name: 'Background remover', href: '/background-remover' },
    ],
  },
]

const MOBILE_FOOTER_LINKS = [
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

function LogoLockup({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 56"
      aria-hidden="true"
      focusable="false"
      className={cn('h-8 w-auto', className)}
    >
      {/* Stacked rectangles mark */}
      <g transform="translate(0, 8)">
        <rect x="0" y="24" width="30" height="7" rx="2" fill="var(--color-primary)" opacity="0.45" />
        <rect x="4" y="14" width="30" height="7" rx="2" fill="var(--color-primary)" opacity="0.72" />
        <rect x="8" y="4"  width="30" height="7" rx="2" fill="var(--color-primary)" />
      </g>
      {/* Wordmark */}
      <text
        x="48"
        y="36"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontSize="22"
        letterSpacing="-0.4"
        fill="currentColor"
      >
        <tspan fontWeight="500">Convert</tspan>
        <tspan fontWeight="700">Yard</tspan>
      </text>
    </svg>
  )
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)

  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const megaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll → border
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 2)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // ESC closes menus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileOpen) closeMobileMenu()
        if (megaOpen) setMegaOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen, megaOpen])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Focus first item in mobile menu when opened
  useEffect(() => {
    if (mobileOpen && mobileMenuRef.current) {
      const first = mobileMenuRef.current.querySelector<HTMLElement>(
        'button, a, input'
      )
      first?.focus()
    }
  }, [mobileOpen])

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false)
    setOpenAccordion(null)
    hamburgerRef.current?.focus()
  }, [])

  const openMega = () => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current)
    setMegaOpen(true)
  }
  const closeMegaDelayed = () => {
    megaTimeoutRef.current = setTimeout(() => setMegaOpen(false), 120)
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 nav-surface backdrop-blur-md',
          'border-b transition-colors duration-200',
          scrolled ? 'border-border' : 'border-transparent'
        )}
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            aria-label="ConvertYard — go to homepage"
            className="flex shrink-0 items-center text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
          >
            <LogoLockup />
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 md:flex"
          >
            {/* Tools megamenu trigger */}
            <div
              className="relative"
              onMouseEnter={openMega}
              onMouseLeave={closeMegaDelayed}
            >
              <button
                aria-expanded={megaOpen}
                aria-controls="megamenu-panel"
                aria-haspopup="true"
                onFocus={openMega}
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium',
                  'text-fg-muted transition-colors hover:text-fg hover:bg-bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  megaOpen && 'text-fg bg-bg-muted'
                )}
              >
                Tools
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-150',
                    megaOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Megamenu panel */}
              {megaOpen && (
                <div
                  id="megamenu-panel"
                  role="region"
                  aria-label="Tools menu"
                  onMouseEnter={openMega}
                  onMouseLeave={closeMegaDelayed}
                  className={cn(
                    'absolute left-1/2 top-full mt-1 -translate-x-1/2',
                    'w-[780px] rounded-xl border border-border bg-bg-elevated',
                    'p-6 shadow-lg',
                    'animate-in fade-in slide-in-from-top-2 duration-150'
                  )}
                  style={{ '--tw-shadow': 'var(--shadow-lg)' } as React.CSSProperties}
                >
                  <div className="grid grid-cols-6 gap-6">
                    {MEGAMENU_CATEGORIES.map((cat) => (
                      <div key={cat.title}>
                        <Link
                          href={cat.href}
                          className={cn(
                            'mb-2 block text-xs font-semibold uppercase tracking-wider',
                            'text-fg-subtle hover:text-primary transition-colors',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm'
                          )}
                        >
                          {cat.title}
                        </Link>
                        <ul className="space-y-1.5" role="list">
                          {cat.tools.map((tool) => (
                            <li key={tool.href}>
                              <Link
                                href={tool.href}
                                className={cn(
                                  'block text-sm text-fg-muted hover:text-fg transition-colors',
                                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm'
                                )}
                              >
                                {tool.name}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href={cat.href}
                              className={cn(
                                'block text-xs text-primary font-medium hover:underline',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm'
                              )}
                            >
                              See all →
                            </Link>
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/how-it-works"
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium',
                'text-fg-muted transition-colors hover:text-fg hover:bg-bg-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
              )}
            >
              How it works
            </Link>

            <Link
              href="/blog"
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium',
                'text-fg-muted transition-colors hover:text-fg hover:bg-bg-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
              )}
            >
              Blog
            </Link>

            {/* Local-first badge */}
            <div
              className={cn(
                'ml-2 flex items-center gap-1.5 rounded-full',
                'border border-border bg-bg-muted px-3 py-1.5',
                'text-xs font-medium text-fg-muted'
              )}
              title="All processing runs in your browser"
              aria-label="Local-first: all processing runs in your browser"
            >
              <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
              Local-first
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg md:hidden',
              'text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
          >
            {mobileOpen
              ? <X className="h-5 w-5" aria-hidden="true" />
              : <Menu className="h-5 w-5" aria-hidden="true" />
            }
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-bg md:hidden',
          'transition-opacity duration-200',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Mobile menu header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Link
            href="/"
            aria-label="ConvertYard — go to homepage"
            onClick={closeMobileMenu}
            className="flex items-center text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
          >
            <LogoLockup />
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg',
              'text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Search */}
          <div className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search tools…"
              aria-label="Search tools"
              className={cn(
                'w-full rounded-lg border border-border bg-bg-muted py-3 pl-9 pr-4',
                'text-sm text-fg placeholder:text-fg-subtle',
                'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary focus-visible:border-primary'
              )}
            />
          </div>

          {/* Category accordions */}
          <nav aria-label="Tool categories">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Tools
            </p>
            {MEGAMENU_CATEGORIES.map((cat) => {
              const isOpen = openAccordion === cat.title
              return (
                <div key={cat.title} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`mobile-cat-${cat.title}`}
                    onClick={() => setOpenAccordion(isOpen ? null : cat.title)}
                    className={cn(
                      'flex w-full items-center justify-between py-3 px-1',
                      'text-sm font-medium text-fg',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm',
                      'min-h-[44px]'
                    )}
                  >
                    {cat.title}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-fg-subtle transition-transform duration-150',
                        isOpen && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    id={`mobile-cat-${cat.title}`}
                    hidden={!isOpen}
                  >
                    <ul className="pb-3 pl-1" role="list">
                      {cat.tools.map((tool) => (
                        <li key={tool.href}>
                          <Link
                            href={tool.href}
                            onClick={closeMobileMenu}
                            className={cn(
                              'block py-2 text-sm text-fg-muted hover:text-fg transition-colors',
                              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm',
                              'min-h-[44px] flex items-center'
                            )}
                          >
                            {tool.name}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href={cat.href}
                          onClick={closeMobileMenu}
                          className={cn(
                            'block py-2 text-sm font-medium text-primary hover:underline',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm',
                            'min-h-[44px] flex items-center'
                          )}
                        >
                          See all {cat.title} tools →
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Nav links */}
          <nav aria-label="Site navigation" className="mt-6">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              More
            </p>
            <Link
              href="/how-it-works"
              onClick={closeMobileMenu}
              className={cn(
                'flex items-center min-h-[44px] px-1 py-2',
                'text-sm font-medium text-fg hover:text-primary transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm'
              )}
            >
              How it works
            </Link>
            <Link
              href="/blog"
              onClick={closeMobileMenu}
              className={cn(
                'flex items-center min-h-[44px] px-1 py-2',
                'text-sm font-medium text-fg hover:text-primary transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm'
              )}
            >
              Blog
            </Link>
          </nav>
        </div>

        {/* Mobile menu footer strip */}
        <div className="shrink-0 border-t border-border px-4 py-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs text-fg-muted">
            <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
            Files never leave your browser
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {MOBILE_FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  'text-xs text-fg-subtle hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm',
                  'min-h-[44px] flex items-center'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
