# GA4 + Cookie Consent Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GA4 analytics behind a cookie consent gate, with a compliant banner UI that loads GA4 only after the user accepts.

**Architecture:** Two new client components (`GA4` and `CookieBanner`) mounted in `app/layout.tsx`. GA4 reads the `convertyard_consent` cookie on mount and listens for a `consent-changed` window event. CookieBanner manages the consent cookie and dispatches that event.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS with CSS custom properties, Next.js `<Script>` component, `document.cookie` API, `CustomEvent` / `window.addEventListener`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `components/analytics/ga4.tsx` | Conditionally loads GA4 script based on consent |
| Create | `components/site-shell/cookie-banner.tsx` | Consent UI — banner, buttons, cookie write, event dispatch |
| Modify | `app/layout.tsx` | Mount `<GA4>` and `<CookieBanner>` after `<SiteShell>` |
| Create | `.env.local.example` | Document `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Create | `README.md` | Analytics setup instructions |

---

## Task 1: Create the GA4 client component

**Files:**
- Create: `components/analytics/ga4.tsx`

- [ ] **Step 1: Create the file**

Create `components/analytics/ga4.tsx` with this exact content:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const MID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

export function GA4() {
  const [load, setLoad] = useState(false)

  useEffect(() => {
    if (!MID) return

    if (getCookieValue('convertyard_consent') === 'accepted') {
      setLoad(true)
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ accepted: boolean }>).detail
      if (detail.accepted) setLoad(true)
    }

    window.addEventListener('consent-changed', handler)
    return () => window.removeEventListener('consent-changed', handler)
  }, [])

  if (!MID || !load) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MID}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors for this file (other pre-existing errors acceptable if any exist)

- [ ] **Step 3: Commit**

```bash
git add components/analytics/ga4.tsx
git commit -m "feat: GA4 client component with consent gate"
```

---

## Task 2: Create the cookie consent banner

**Files:**
- Create: `components/site-shell/cookie-banner.tsx`

- [ ] **Step 1: Create the file**

Create `components/site-shell/cookie-banner.tsx` with this exact content:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const COOKIE_NAME = 'convertyard_consent'
const COOKIE_MAX_AGE = 31536000 // 1 year

function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

function setConsent(value: 'accepted' | 'rejected') {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
  window.dispatchEvent(
    new CustomEvent('consent-changed', { detail: { accepted: value === 'accepted' } })
  )
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const acceptRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (getCookieValue(COOKIE_NAME)) return

    const timer = setTimeout(() => {
      setVisible(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) return

    acceptRef.current?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleReject()
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
      aria-modal="false"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-60',
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
      <p
        id="cookie-banner-title"
        className="mb-2 pr-8 font-display text-base font-semibold text-[var(--color-fg)]"
      >
        Cookies for analytics
      </p>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-fg-muted)]">
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add components/site-shell/cookie-banner.tsx
git commit -m "feat: cookie consent banner component"
```

---

## Task 3: Mount both components in layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace the entire file content:

```tsx
import type { Metadata } from 'next'
import { SiteShell } from '@/components/site-shell/site-shell'
import { GA4 } from '@/components/analytics/ga4'
import { CookieBanner } from '@/components/site-shell/cookie-banner'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://convertyard.com'),
  title: {
    default: 'ConvertYard — Local-first conversion, built for batches',
    template: '%s — ConvertYard',
  },
  description:
    'Batch file conversion in your browser. No uploads. No signups. Up to 1,000 files at once.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
        <GA4 />
        <CookieBanner />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: mount GA4 and CookieBanner in root layout"
```

---

## Task 4: Environment variable docs

**Files:**
- Create: `.env.local.example`
- Create: `README.md`

- [ ] **Step 1: Create .env.local.example**

Create `.env.local.example`:

```
# Google Analytics 4 measurement ID
# Get from analytics.google.com → Admin → Data Streams → Web → Measurement ID
# Format: G-XXXXXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

- [ ] **Step 2: Create README.md**

Create `README.md`:

```markdown
# ConvertYard

Local-first batch file conversion, entirely in your browser.

## Development

```bash
npm install
npm run dev
```

## Analytics Setup

Three analytics systems are used. Two require no configuration:

**Cloudflare Web Analytics** — active automatically when the domain is proxied through Cloudflare. No environment variable or script tag needed.

**Google Search Console** — verified via Cloudflare DNS TXT record. No environment variable or meta tag needed.

**Google Analytics 4** — requires a measurement ID:

1. Go to [analytics.google.com](https://analytics.google.com) → Admin → Data Streams → your web stream
2. Copy the Measurement ID (format: `G-XXXXXXXXXX`)
3. For local development: copy `.env.local.example` to `.env.local` and fill in the ID
4. For production: add to Cloudflare Pages → Settings → Environment Variables → Production:
   - Variable name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: your `G-XXXXXXXXXX` ID

GA4 only loads after the user accepts the cookie consent banner. If the env variable is missing, the banner still appears but GA4 never loads (no errors).
```

- [ ] **Step 3: Verify .gitignore covers .env.local**

Run: `grep "\.env\.local" .gitignore`
Expected output includes `.env.local`

- [ ] **Step 4: Commit**

```bash
git add .env.local.example README.md
git commit -m "docs: analytics setup instructions and env example"
```

---

## Task 5: Build verification and manual QA

- [ ] **Step 1: Run production build**

```bash
npm run build
```
Expected: exits with code 0, no TypeScript errors, no "Module not found" errors.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```
Open `http://localhost:3000`.

- [ ] **Step 3: First load — banner appears, GA4 does not**

- Wait ~500ms after page load — consent banner should appear in bottom-right (desktop)
- Open DevTools → Network tab → filter by "gtag" or "googletagmanager"
- Expected: zero matching requests (GA4 script not loaded)

- [ ] **Step 4: Accept consent**

- Click "Accept" in the banner
- Expected: banner disappears
- Expected: `convertyard_consent=accepted` cookie visible in DevTools → Application → Cookies
- Expected: `gtag.js` request appears in Network tab

- [ ] **Step 5: Reload — no banner, GA4 loads**

- Reload the page
- Expected: banner does NOT appear
- Expected: `gtag.js` loads in network tab (GA4 initialises on mount)

- [ ] **Step 6: Test reject flow**

- Delete `convertyard_consent` cookie in DevTools → Application → Cookies → right-click → delete
- Reload
- Expected: banner appears after 500ms
- Click "Reject"
- Expected: banner disappears, `convertyard_consent=rejected` cookie set
- Expected: no gtag requests in network tab
- Reload again — banner does NOT appear (rejected state persists)

- [ ] **Step 7: Test × close button**

- Delete `convertyard_consent` cookie again, reload
- Click the × button in the banner corner
- Expected: same behavior as Reject (cookie set to `rejected`)

- [ ] **Step 8: Test Esc key**

- Delete cookie, reload, wait for banner
- Press Esc
- Expected: banner closes, `rejected` cookie set

- [ ] **Step 9: Check for console hydration warnings**

- Open Console tab in DevTools
- Expected: no "Hydration failed" or "Text content did not match" warnings

- [ ] **Step 10: Final commit**

```bash
git add -A
git commit -m "feat: GA4 with cookie consent banner"
```

---

## Notes

- `z-60` is used for the banner. Tailwind v3 does not include this by default — if it doesn't apply, add `'[z-index:60]'` as a class or add `60: '60'` to `theme.extend.zIndex` in `tailwind.config.js`. The nav uses `z-40` and mobile menu uses `z-50`, so `z-60` places the banner above both.
- The `--color-primary` variable is used in the Accept button and focus rings — verify it exists in `globals.css` (it should alongside the other `--color-*` variables).
- No `font-display` utility exists in standard Tailwind — if this class doesn't resolve, check whether the project defines it (e.g., via `fontFamily: { display: [...] }`). If not, replace with `font-sans font-semibold`.
