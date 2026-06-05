# GA4 + Cookie Consent Banner — Design

**Date:** 2026-06-05
**Status:** Approved

## Summary

Add Google Analytics 4 (GA4) tracking behind a cookie consent gate, plus a compliant consent banner UI. Cloudflare Web Analytics and Search Console are already active and require no changes.

## Architecture

Two new client components mounted at the root layout level (`app/layout.tsx`), after `<SiteShell>`:

```
<SiteShell>{children}</SiteShell>
<GA4 />          ← mounts first, listens for consent event
<CookieBanner /> ← mounts second, dispatches consent event
```

## Component 1: `/components/analytics/ga4.tsx`

**Purpose:** Conditionally load the GA4 script based on consent state.

**Behavior:**
- `"use client"` — renders nothing visible
- On mount: reads `convertyard_consent` cookie
  - If `"accepted"`: inject `gtag.js` via Next.js `<Script strategy="afterInteractive">`
  - Otherwise: do nothing
- Listens on `window` for `"consent-changed"` custom event
  - If `event.detail.accepted === true`: dynamically load GA4 without page reload
  - If `false`: no-op (script already not loaded)
- GA4 init config:
  ```js
  gtag('config', MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: true,
  })
  ```
- If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is missing or empty: component is a no-op, no errors

**Environment variable:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`

## Component 2: `/components/site-shell/cookie-banner.tsx`

**Purpose:** Obtain user consent before GA4 loads.

**Visibility logic:**
- `"use client"` — not rendered on server (avoids hydration mismatch)
- On mount (via `useEffect`): check `convertyard_consent` cookie
  - If cookie exists (any value): do not show banner
  - If no cookie: show banner after 500ms delay (avoids flash on first paint)

**UI spec:**
- Fixed position, z-index 60
- Desktop: bottom-right, max-width 420px, `border-radius: var(--radius-xl)`
- Mobile: full-width bottom, comfortable side padding, `border-radius: var(--radius-lg)`
- Background: `var(--color-bg-elevated)`, strong drop shadow, 1px border `var(--color-border-strong)`
- Padding: 20px
- Content:
  - Title (font-display, weight 600): "Cookies for analytics"
  - Body (14px, `var(--color-fg-muted)`): "We use Google Analytics to understand site usage. Your files are processed entirely in your browser and are never affected by this. See our privacy page for details."
  - Two buttons (min-height 44px): "Reject" (ghost), "Accept" (primary)
  - × close button top-right (counts as reject)
  - Small "Privacy" link → `/privacy`

**Behavior on choice:**
- Accept: set `convertyard_consent=accepted; max-age=31536000; path=/; SameSite=Lax`, dispatch `consent-changed` with `{ accepted: true }`, hide banner
- Reject or × close: set `convertyard_consent=rejected` with same expiry, dispatch `consent-changed` with `{ accepted: false }`, hide banner

**Accessibility:**
- `role="dialog"` `aria-labelledby="cookie-banner-title"`
- Focus Accept button on mount
- Tab cycles between Accept and Reject
- Esc key triggers reject
- Both buttons minimum 44px height

## Environment Variables

- `.env.local.example` — document `NEXT_PUBLIC_GA_MEASUREMENT_ID=`
- `.env.local` — already in `.gitignore`, not committed
- Cloudflare Pages: measurement ID added via Settings → Environment Variables → Production

## Out of Scope

- Cloudflare Web Analytics: already active, no changes needed
- Google Search Console: already verified via DNS, no changes needed
- Privacy page (`/privacy`): referenced but not built in this task
- Consent granularity beyond accept/reject (no per-category toggles)
