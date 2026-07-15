# Design: Contact & Press Kit Pages

**Date:** 2026-07-15
**Scope:** Two new static pages — `/contact` and `/press`

---

## Overview

Both pages follow the existing `/about` pattern: `max-w-2xl` centered prose layout, `Breadcrumb` component, semantic headings, design tokens (`text-fg`, `text-fg-muted`, `text-primary`). Both URLs are already linked in the footer's Company column.

No forms. No backend. Static export compatible.

---

## `/contact` page

**File:** `app/contact/page.tsx`
**URL:** `convertyard.com/contact`

### Metadata
- `title`: `"Contact — ConvertYard"`
- `description`: ~150 chars covering bugs, feature requests, and press inquiries
- `canonical`: `https://convertyard.com/contact`
- OpenGraph title + description

### Layout
- Breadcrumb: `Home → Contact`
- H1: "Get in touch"
- Three short prose paragraphs, one per contact reason:
  1. **Bugs / broken tools** — `mailto:hello@convertyard.com`
  2. **Feature requests / format support** — same email
  3. **Press inquiries** — same email, with a link to `/press`
- Footer CTAs: `→ About`, `→ How it works`

---

## `/press` page

**File:** `app/press/page.tsx`
**URL:** `convertyard.com/press`

### Metadata
- `title`: `"Press Kit — ConvertYard"`
- `description`: ~150 chars, mentions local-first, WASM, free, batch
- `canonical`: `https://convertyard.com/press`
- OpenGraph title + description

### Layout
- Breadcrumb: `Home → Press kit`
- H1: "Press kit"

### Sections

#### About ConvertYard (copyable boilerplate)
Two sentences journalists can paste verbatim:
> "ConvertYard is a local-first batch file conversion tool launched in 2026. Files are processed entirely in your browser via WebAssembly — nothing is uploaded to any server."

#### Key facts (bullet list)
- Launched: 2026
- `{liveToolCount}` free tools available (dynamic, from `ALL_TOOLS.filter(t => t.status === 'live').length` via `@/content/tool-catalog`)
- No signup required
- No file size limits enforced server-side (processing is local)
- Works offline after first visit
- Supported by minimal display ads — never inside the conversion flow

#### Logo downloads
- `/brand/convertyard-logo.svg` — primary logo (light backgrounds)
- `/brand/convertyard-logo-dark.svg` — dark background variant
- Files live in `/public/brand/` and are linked as plain `<a href>` downloads with `download` attribute

#### Press contact
- Email: `mailto:hello@convertyard.com`

#### Footer CTAs
- `→ About`, `→ How it works`

---

## Brand assets

Logo files to place in `/public/brand/`:
- `convertyard-logo.svg`
- `convertyard-logo-dark.svg`

Source files already exist in `/logo/` — copy or symlink at build time. No new asset pipeline needed; Next.js static export serves `/public/` directly.

---

## What's explicitly excluded

- No contact form (no backend/email service)
- No founder bio or headshots
- No color palette or typography guide in press kit
- No ads on either page (consistent with existing policy for About/Privacy/Terms)
