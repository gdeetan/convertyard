# Contact & Press Kit Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/contact` and `/press` static pages, matching the existing `/about` pattern.

**Architecture:** Two new `page.tsx` files under `app/contact/` and `app/press/`. No new components — reuse `Breadcrumb` from `@/components/ui/breadcrumb`. Press page imports `ALL_TOOLS` from `@/content/tool-catalog` to derive a live tool count at build time. Logo downloads point to `/logo.svg` and `/logo-mark.svg` which already exist in `/public/`.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS (existing design tokens), static export

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/contact/page.tsx` | `/contact` route — email-only contact page |
| Create | `app/press/page.tsx` | `/press` route — minimal press kit |

No new components. No asset changes. No layout files needed (inherits root layout).

---

## Task 1: Create `/contact` page

**Files:**
- Create: `app/contact/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/contact/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export const metadata: Metadata = {
  title: 'Contact — ConvertYard',
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
          <a
            href="mailto:hello@convertyard.com"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            hello@convertyard.com
          </a>
          . Include the tool name, the file format, and what you expected to happen.
        </p>

        <p>
          Want a format or conversion we don't cover yet?{' '}
          <a
            href="mailto:hello@convertyard.com"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            hello@convertyard.com
          </a>
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
          <a
            href="mailto:hello@convertyard.com"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            hello@convertyard.com
          </a>{' '}
          directly.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/about"
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
```

- [ ] **Step 2: Verify it builds**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes, `/contact` route appears in the output pages list with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/contact/page.tsx
git commit -m "feat: add /contact page"
```

---

## Task 2: Create `/press` page

**Files:**
- Create: `app/press/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/press/page.tsx
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
              className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Logo (SVG) ↓
            </a>
            <a
              href="/logo-mark.svg"
              download="convertyard-mark.svg"
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
          href="/about"
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
```

- [ ] **Step 2: Verify it builds**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes, both `/contact` and `/press` appear in output pages list, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/press/page.tsx
git commit -m "feat: add /press page with live tool count"
```

---

## Self-Review

**Spec coverage:**
- ✅ `/contact` — email-only, 3 contact reasons, breadcrumb, footer CTAs
- ✅ `/press` — boilerplate, key facts, logo downloads, press contact, breadcrumb, footer CTAs
- ✅ Dynamic tool count via `ALL_TOOLS.filter(t => t.status === 'live').length`
- ✅ Logo links to `/logo.svg` and `/logo-mark.svg` (already in `/public/`)
- ✅ Both pages match `/about` layout pattern exactly
- ✅ Both footer links (`/contact`, `/press`) now resolve

**No placeholders, no TBDs.**
**Type consistency:** `ALL_TOOLS` and `.status` match `tool-catalog.ts` exactly (`ToolStatus = 'live' | 'coming-soon'`).
