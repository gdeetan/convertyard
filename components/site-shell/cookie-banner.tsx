'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getCookieValue } from '@/lib/utils/cookies'
import { CONSENT_COOKIE, CONSENT_EVENT } from '@/components/analytics/ga4'

const COOKIE_MAX_AGE = 31536000 // 1 year

function setConsent(value: 'accepted' | 'rejected') {
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, { detail: { accepted: value === 'accepted' } })
  )
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const acceptRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (getCookieValue(CONSENT_COOKIE)) return

    const timer = setTimeout(() => {
      setVisible(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) return

    acceptRef.current?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConsent('rejected')
        setVisible(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible])

  function handleAccept() {
    setConsent('accepted')
    setVisible(false)
  }

  function handleReject() {
    setConsent('rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      aria-modal="false"
      className={cn(
        'fixed bottom-0 left-0 right-0 [z-index:60]',
        'sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-[420px]',
        'bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)]',
        'rounded-[var(--radius-lg)] sm:rounded-[var(--radius-xl)]',
        'shadow-xl p-5'
      )}
    >
      {/* Close button */}
      <button
        type="button"
        aria-label="Reject cookies and close"
        onClick={handleReject}
        className={cn(
          'absolute right-3 top-3',
          'flex h-7 w-7 items-center justify-center rounded-md',
          'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-muted)]',
          'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]'
        )}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Content */}
      <h2
        id="cookie-banner-title"
        className="mb-2 pr-8 font-display text-base font-semibold text-[var(--color-fg)]"
      >
        Cookies for analytics
      </h2>
      <p
        id="cookie-banner-desc"
        className="mb-4 text-sm leading-relaxed text-[var(--color-fg-muted)]"
      >
        We use Google Analytics to understand site usage. Your files are processed entirely in your
        browser and are never affected by this.{' '}
        <Link
          href="/privacy"
          className="underline underline-offset-2 hover:text-[var(--color-fg)] transition-colors"
        >
          Privacy policy
        </Link>
        .
      </p>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReject}
          className={cn(
            'flex-1 min-h-[44px] rounded-lg border border-[var(--color-border-strong)]',
            'text-sm font-medium text-[var(--color-fg)]',
            'hover:bg-[var(--color-bg-muted)] transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]'
          )}
        >
          Reject
        </button>
        <button
          ref={acceptRef}
          type="button"
          onClick={handleAccept}
          className={cn(
            'flex-1 min-h-[44px] rounded-lg',
            'bg-[var(--color-primary)] text-white',
            'text-sm font-medium',
            'hover:opacity-90 transition-opacity',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]'
          )}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
