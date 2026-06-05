# CLAUDE.md

## Project: ConvertYard (convertyard.com)

**Tagline:** Local-first conversion, built for batches.

ConvertYard is a network of local-first batch file tools. Everything runs
in the browser via WebAssembly. No file uploads to servers, ever. This
constraint is the product.

## Core principles

1. **Local-only processing.** All file operations happen client-side via
   WASM (libvips, ffmpeg.wasm, pdf-lib, mupdf-wasm, transformers.js).
   The server never sees user files. If a task literally can't run
   in-browser, we don't build it.
2. **Batch by default.** Every tool accepts 1+ files, handles 1000+
   gracefully, shows per-file progress, and outputs a ZIP. Single-file
   mode is just batch with n=1.
3. **Speed is the feature.** LCP <1.5s, TTI <2s. No layout shift.
   No blocking fonts. Tool UI renders before WASM finishes loading.
4. **No dark patterns.** No "sign up to download." No fake progress
   bars. Ads are allowed below tools and in articles only — never inside
   the conversion flow. See "Ad placement policy" below.

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Output:** Static export (`output: 'export'` in next.config.js)
- **Styling:** Tailwind CSS
- **State:** Zustand for tool state; URL params for shareable state
- **File handling:** File System Access API where supported, fallback
  to standard input
- **WASM libraries:** libvips-wasm (images), ffmpeg.wasm (video/audio),
  pdf-lib + mupdf-wasm (PDF), @huggingface/transformers (in-browser ML)
- **Zipping:** fflate (faster than JSZip)
- **Hosting:** Cloudflare Pages (connected to GitHub repo)
- **Analytics:** Cloudflare Web Analytics (privacy-first, fits brand)

## Deployment

- Code lives in a GitHub repo
- Hosting: Cloudflare Pages, connected to GitHub
- Branch `main` auto-deploys to production
- PR branches auto-deploy to preview URLs
- Build command: `npm run build` outputs to `/out` (static export)
- Custom domain managed via Cloudflare DNS
- No manual deploys, no FTP, no SSH

## Runtime constraints

- All file processing runs in the browser via WASM
- The server (Cloudflare Pages edge) only serves static assets
- No Node.js APIs (fs, path, child_process, etc.) at runtime
- API routes (if any) must use Web Standard APIs
- Build-time scripts CAN use Node (build runs in Cloudflare's CI Node env)

## File structure

```
/app
  /(tools)/[tool-slug]/page.tsx       # Each tool
  /(articles)/[article-slug]/page.tsx # Supporting content
/components
  /tool-shell/                        # Shared layout for every tool
  /ui/                                # Buttons, dropzones, progress
/lib
  /converters/                        # WASM wrappers per format
  /seo/                               # Metadata helpers
/content
  /tools.ts                           # Tool registry (slug, title, meta)
  /articles/                          # MDX articles
/categories                           # Cluster briefs (this folder)
```

## Tool page template

Every tool page renders `<ToolShell>` with these props:
- `slug`: matches the URL
- `title`: H1 ("Convert JPG to WebP")
- `subtitle`: one line, follows the pattern
  "Local-first [thing]. Built for batches."
- `accepts`: array of accepted MIME types
- `convertFn`: async (File[]) => File[] (the actual conversion)
- `optionsSchema`: zod schema for tool-specific options (quality, etc.)
- `faqEntries`: array of {q, a} — rendered + JSON-LD FAQ schema

The shell handles dropzone, batch progress, ZIP packaging, error states,
download UI, related-tools strip, and SEO metadata. Don't reimplement.

## SEO conventions

- Title format: "{Action} — ConvertYard" (e.g., "JPG to WebP Converter — ConvertYard")
- URL pattern: `convertyard.com/{tool-slug}` (flat, no nesting)
- H1 includes target keyword as first 1–3 words
- Meta description: 140–155 chars, mentions "batch", "1000 files",
  "in your browser"
- Every tool page has 4–8 FAQ entries with FAQPage schema
- Every tool page links to 3–5 related tools (same cluster) and 2–3
  supporting articles
- Schema: SoftwareApplication on tool pages, Article on article pages

## Content/copy voice

- Direct, no fluff. "Convert your JPGs to WebP. Drop files, click convert."
- Lead with the action, not the benefit.
- Trust signals stated as facts, not claims: "Files never leave your
  browser" (verifiable), not "We respect your privacy" (claim).
- Avoid superlatives unless backed: "Up to 1000 files," not
  "Convert unlimited files."

## Performance budget

- Tool page initial JS: <80kb gzipped (before WASM)
- WASM lazy-loaded on first interaction
- Images on the site: AVIF, with WebP and JPG fallbacks
- Fonts: system stack first, optional brand font with
  `font-display: optional`
- No third-party scripts on tool pages except analytics

## When adding a new tool

1. Read the relevant `/categories/*.md` cluster brief first
2. Add entry to `/content/tools.ts` with slug, cluster, related tools
3. Create `/app/(tools)/[slug]/page.tsx` using ToolShell
4. Implement `convertFn` in `/lib/converters/`
5. Write 4–8 FAQ entries
6. Draft 3–5 supporting articles before the tool launches (or in
   the first month after)
7. Internal-link from related tool pages
8. Test with 1, 10, 100, and 1000 files — last one must work

## When writing supporting articles

- Target a long-tail keyword from the cluster's keyword sheet
- 1200–2500 words, with real examples and code/screenshots
- Always link to the relevant tool page (above the fold)
- Use H2/H3 hierarchy matching the SERP for that keyword
- Add FAQPage schema for any Q&A section
- Update the article's "last updated" date when revising

## Branch conventions

- `main` — production, protected, requires PR
- `feature/*` — new tools, new articles
- `fix/*` — bug fixes
- Squash-merge to keep history clean

## Ad placement policy

ConvertYard runs minimal, respectful display ads to keep tools free.
The rules below are absolute and apply to every tool and article
page now and in the future.

### Allowed
- One ad slot per tool page, placed BELOW the FAQ section
- One ad slot in the middle of long-form articles (between H2s)
- Standard display formats: 300×250, 728×90, responsive
- Static placements (no refresh, no rotation during page view)
- Lazy-loaded after main content paints (must not block LCP)
- Clearly labeled "Advertisement" above the slot

### Forbidden
- Ads above the fold on any page
- Ads inside the dropzone, options panel, progress UI, or result list
- Ads between the convert button and the result
- Ads on the homepage (homepage stays 100% ad-free as the brand
  showcase)
- Pop-ups, pop-unders, interstitials, vignettes
- Auto-play video ads (especially with sound)
- Sticky or floating ads on mobile
- Ads that obscure download buttons or any CTA
- Ads that load before WASM modules
- Ads on the privacy, terms, or about pages

### Why this matters
Our differentiation is being the clean, trustworthy converter.
Ads must be invisible enough that someone using the site for the
first time doesn't notice them until after they've completed
their conversion. If any future change pushes against these
rules, it must be discussed and updated here first.

## Anti-patterns (do not do)

- ❌ Server-side file processing for anything user-uploaded
- ❌ Email/signup walls before download
- ❌ Generic "image converter" pages that try to rank for everything
- ❌ Stuffing keywords. One target per page.
- ❌ AI-generated articles without a human editing pass
- ❌ Building tool #50 before fixing tool #1's bounce rate
- ❌ The word "Photoshop" anywhere on the site (trademark + wrong frame)
- ❌ Adding complex manual editing (layers, brushes) — that's Photopea's
  fight, not ours
- ❌ Ads inside the conversion flow (above the fold, in the dropzone,
  in progress UI, between convert and download)
- ❌ Ads on the homepage

## Important note
Do not make any changes until you have 95% confidence in what you need to build. Ask me follow-up questions until you reach that confidence.