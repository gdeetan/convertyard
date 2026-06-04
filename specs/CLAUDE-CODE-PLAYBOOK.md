# Claude Code Playbook — ConvertYard

A step-by-step plan for going from your registered domain to a live homepage,
using Claude Code as the builder.

This document has two parts:
1. **The sequence** — what to do, in order
2. **The prompts** — exact text to paste into Claude Code at each stage

---

## Part 1: Pre-Claude Code setup (do this once, no coding required)

### Step 1 — Confirm the domain spelling

You wrote "Covertyard.com" in chat. Confirm you actually registered
**ConvertYard.com** (with the "n"). If you bought the misspelled one,
contact the registrar within their cancellation window (usually 4-5 days
on Cloudflare Registrar) and re-register the correct domain.

### Step 2 — Move domain to Cloudflare (if not already there)

If registered through Cloudflare Registrar: nothing to do, you're set.

If registered elsewhere (Namecheap, GoDaddy, etc.):
1. Log in to Cloudflare → Add a Site → enter convertyard.com
2. Cloudflare will show you 2 nameservers
3. Go to your registrar's DNS settings, replace existing nameservers
   with Cloudflare's
4. Wait 1-24 hours for propagation. Cloudflare emails you when it's done.

### Step 3 — Create GitHub account + repo

1. Create a free GitHub account if you don't have one
2. Create a new **private** repo called `convertyard`
3. Don't initialize with README, .gitignore, or license — we'll add
   those via Claude Code
4. Copy the repo URL (looks like `git@github.com:yourname/convertyard.git`)

### Step 4 — Install Claude Code

Claude Code requires a Claude Pro, Max, Team, Enterprise, or API
console account. The free Claude.ai plan doesn't include it.

**Option A — Native installer (recommended, no Node.js needed):**

macOS / Linux:
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Windows (PowerShell):
```powershell
irm https://claude.ai/install.ps1 | iex
```

**Option B — via npm (if you already have Node.js 18+):**
```bash
npm install -g @anthropic-ai/claude-code
```

After install:
```bash
claude doctor
```
Should show green checkmarks. Then run:
```bash
claude
```
Follow the browser prompt to log in.

Reference: https://docs.claude.com/en/docs/claude-code/overview

### Step 5 — Create a project folder and add the planning docs

```bash
mkdir convertyard
cd convertyard
git init
git remote add origin <your-github-repo-url>
```

Drop your existing planning files into the project root:
- `CLAUDE.md`
- `PROJECT-OVERVIEW.md`
- `/categories/` folder (all 7 category briefs)
- `/specs/` folder (DESIGN-SYSTEM.md, HOMEPAGE-SPEC.md, LAUNCH-CHECKLIST.md)
- `/logos/` folder (your chosen logo SVGs)

Commit and push:
```bash
git add .
git commit -m "Initial planning docs"
git push -u origin main
```

### Step 6 — Connect GitHub to Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages →
   Connect to Git
2. Authorize GitHub, select the `convertyard` repo
3. Production branch: `main`
4. Build settings (we'll update these after scaffolding):
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `npm run build`
   - Build output directory: `out`
   - Environment variable: `NODE_VERSION = 20`
5. Save and Deploy. First deploy will fail because there's no code yet.
   That's fine.

### Step 7 — Attach custom domain

In your Pages project → Custom domains → Set up a custom domain →
enter `convertyard.com`. Cloudflare auto-creates DNS records. SSL
provisions in ~5 minutes. Repeat for `www.convertyard.com` if you want
a www version that redirects.

---

## Part 2: Claude Code prompts (in order)

Now open Claude Code from your `convertyard` folder:

```bash
cd convertyard
claude
```

Then paste the prompts below, one at a time, waiting for each to finish.

### Prompt 1 — Scaffold the Next.js app

```
Read CLAUDE.md, PROJECT-OVERVIEW.md, and all files in /specs/ and 
/categories/ before making any changes. Confirm you understand the 
project before scaffolding.

Then scaffold a Next.js 15 app with App Router, TypeScript, and 
Tailwind CSS, configured for static export to Cloudflare Pages.

Requirements:
- Static export (output: 'export' in next.config.js)
- TypeScript strict mode
- Tailwind CSS with the design tokens from specs/DESIGN-SYSTEM.md 
  (colors, typography, spacing, radius) defined as both CSS variables 
  in globals.css AND Tailwind theme extensions
- File structure exactly matching the one described in 
  specs/DESIGN-SYSTEM.md
- Path aliases configured (@/components, @/lib, @/content)
- Set up .gitignore for Node.js + Next.js
- package.json scripts: dev, build, start, lint
- Install: next, react, react-dom, typescript, tailwindcss, 
  @types/node, @types/react, @types/react-dom, postcss, autoprefixer, 
  zustand, fflate, clsx, tailwind-merge, lucide-react, zod
- Do NOT install any UI library yet (we'll add Radix primitives as needed)
- Do NOT add any pages or components yet — just the scaffold

After scaffolding, run `npm run build` to confirm the export works, 
then commit with message "chore: scaffold Next.js app with design tokens"
```

### Prompt 2 — Build the SiteShell, Nav, and Footer

```
Read specs/DESIGN-SYSTEM.md (the "Components" section) and 
specs/HOMEPAGE-SPEC.md (Nav and Footer sections) before starting.

Build these components in /components/site-shell/:
1. SiteShell — wraps every page, includes Nav and Footer
2. Nav — sticky top, ~64px tall, wordmark left, menu items right, 
   mobile hamburger with full-screen overlay
3. Footer — 4-column footer per spec

Requirements:
- Mobile-first: design at 375px viewport, scale up at md/lg breakpoints
- Use the logo SVGs in /logos/ (use the SVG file I designate as primary)
- Touch targets minimum 44px on mobile
- Keyboard accessible (tab through, focus visible, ESC closes mobile menu)
- Screen reader friendly (aria-labels, semantic HTML)
- Use lucide-react for icons (Menu, X, lock icon for "Local-first" badge)
- Sticky nav uses backdrop-blur and a 1px border that appears only after 
  scroll (use a CSS class toggled by scroll position)
- No external dependencies beyond what's already installed

Test:
- Resize browser from 320px to 1920px — no breakage
- Tab through every interactive element
- Open/close mobile menu with keyboard
- Run npm run build to confirm it still exports cleanly

Commit: "feat: SiteShell, Nav, Footer components"
```

> **Note:** Before running Prompt 2, manually copy your chosen logo SVG 
> into `/public/logo.svg` and `/public/logo-mark.svg`. Claude Code will 
> reference these.

### Prompt 3 — Build the ToolShell (most important component)

```
Read specs/DESIGN-SYSTEM.md carefully — the entire "Tool components" 
and "Layer 3: Content configs" sections. This is the single most 
important component in the codebase. Every tool page uses this. 
Get it right.

Build the ToolShell in /components/tool-shell/ with these sub-components:
1. ToolShell — main wrapper, accepts a ToolConfig object
2. Dropzone — drag-drop + click-to-pick + paste from clipboard
3. OptionsPanel — renders tool options from schema (slider, toggle, 
   dropdown, radio, number)
4. ProgressList — per-file progress during conversion
5. ResultList — completed files with individual download + "Download all 
   as ZIP"
6. FAQAccordion — accessible accordion with FAQPage JSON-LD schema
7. RelatedToolsStrip — 3-5 cards linking to related tools
8. RelatedArticlesStrip — 2-3 article cards

Also create:
- /lib/types.ts — full TypeScript types for ToolConfig, ToolOption, 
  FAQItem, etc.
- /lib/utils/zip.ts — fflate wrapper for downloading a Blob[] as a ZIP
- /lib/utils/download.ts — helper for triggering single-file download

Requirements:
- All states handled: idle, drag-over, processing, partial-success, 
  success, error
- Errors don't stop the batch — failed files are listed, successful 
  ones still downloadable
- Virtualized when file count > 50 (use @tanstack/react-virtual if needed)
- Drag-drop on desktop, tap to open native picker on mobile
- Drop zone is keyboard accessible (Enter/Space opens picker)
- Screen reader announces file additions
- Progress bars have aria-live="polite"
- All copy from spec follows pattern: "Local-first [task]. Built for 
  batches."

Build a minimal test page at /app/test-tool/page.tsx that uses 
ToolShell with a stub convertFn (just delays then returns the same 
files) to test all states.

Commit: "feat: ToolShell component with all sub-components"
```

### Prompt 4 — Build the homepage

```
Read specs/HOMEPAGE-SPEC.md fully before starting. Build the homepage 
at /app/page.tsx with all 8 sections from the spec, in order:

1. Hero — left side has H1, tagline, subhead, two CTAs. 
   Right side has a live JPG→WebP mini-converter (this is the most 
   important interactive element).
2. Trust strip — 3 columns with the exact copy from the spec
3. Tool grid — category filter pills + grid of 12 tool cards (use 
   placeholder data for now; we'll wire up real configs later). 
   Filter state in URL hash (#images, #pdf, etc.)
4. How it works — 3 numbered steps + WebAssembly explanation paragraph
5. Comparison table — exact content from spec
6. Use cases — 3 audience blocks
7. FAQ — 8 questions with FAQPage schema
8. Footer is already in SiteShell

For the hero mini-converter:
- Install @squoosh/lib OR use libvips-wasm if simpler
- Accepts ONE JPG file (this is a demo, not a real tool yet)
- Converts to WebP at quality 80, shows file size delta
- Download button, "Try another" reset
- All client-side, lazy-load the WASM only after first interaction
- Show a clear "preparing converter" state on first interaction

Section-specific copy: use the exact copy from HOMEPAGE-SPEC.md, 
don't paraphrase.

SEO requirements:
- Title: "ConvertYard — Local-first conversion, built for batches"
- Description: per spec
- Open Graph image: generate at build time using @vercel/og or 
  satori (placeholder template is fine)
- All schema: Organization, FAQPage, WebSite

Performance:
- LCP target <1.2s on the homepage
- Critical CSS inlined
- WASM is NOT loaded until user interacts with the hero converter
- Total initial JS <60kb gzipped (check with @next/bundle-analyzer)

Mobile:
- Hero stacks vertically on mobile (text first, converter below)
- Tool grid is 1 column on mobile, 2 on tablet, 4 on desktop
- Comparison table converts to side-by-side cards on mobile
- All touch targets ≥44px

Commit: "feat: homepage with hero converter, trust strip, tool grid, 
how it works, comparison, FAQ"
```

### Prompt 5 — Ship tool #1 (JPG to WebP) as a real config

```
Now we make the hero converter into a real tool page at 
/app/(tools)/jpg-to-webp/page.tsx.

Read /categories/01-image-conversion.md for the keyword targets and 
FAQ content guidance.

1. Create /content/tools/jpg-to-webp.ts with a full ToolConfig per the 
   spec in DESIGN-SYSTEM.md. Include:
   - Real convertFn using libvips-wasm
   - Options: quality slider (1-100, default 80), lossless toggle
   - 6 FAQ entries written specifically for JPG→WebP
   - relatedTools: ['png-to-webp', 'jpg-to-avif', 'webp-to-jpg', 
     'image-compressor']
   - Meta title: "JPG to WebP Converter — ConvertYard"
   - Meta description: per launch checklist (140-155 chars, mentions 
     batch, browser, 1000 files)

2. Create /app/(tools)/jpg-to-webp/page.tsx — should be ~5 lines, 
   just renders <ToolShell config={config} />

3. Create /lib/converters/libvips.ts — the WASM wrapper for image 
   conversions. Should support multiple input/output formats from a 
   single function signature.

4. Update the homepage hero converter to share the same convertFn so 
   we're not duplicating logic.

Test:
- Convert 1 JPG → works
- Convert 10 JPGs → batch UI shows per-file progress
- Convert 100 JPGs → still works, no crashes
- Try invalid file (a PDF) → graceful error, batch continues with 
  valid files
- Toggle lossless → output is larger but visually identical
- Mobile: drop works via file picker
- Lighthouse on the tool page: all scores ≥90

Commit: "feat: JPG to WebP tool — first real tool page"
```

### Prompt 6 — SEO infrastructure

```
Read specs/LAUNCH-CHECKLIST.md (SEO infrastructure section).

Build:
1. /app/sitemap.ts — auto-generates sitemap.xml from /content/tools/*.ts 
   and /content/articles/*.mdx
2. /app/robots.ts — robots.txt allowing all, pointing to sitemap
3. /app/not-found.tsx — custom 404 page with search + popular tools list
4. /lib/seo/schema.ts — generators for:
   - SoftwareApplication (tool pages)
   - FAQPage (any page with FAQs)
   - BreadcrumbList (every page)
   - Article (article pages)
   - Organization (homepage)
   - WebSite (homepage, with SearchAction if applicable later)
5. /lib/seo/metadata.ts — Next.js metadata helper that takes a slug 
   and returns full metadata + JSON-LD scripts
6. /lib/seo/og-image.tsx — build-time OG image generator using 
   @vercel/og. Template should show: tool title, ConvertYard wordmark, 
   tagline, and a subtle batch/local visual

Make sure every existing page (homepage, jpg-to-webp tool page) uses 
these helpers correctly.

Test all schema with Google's Rich Results Test using your 
preview URL.

Commit: "feat: SEO infrastructure (sitemap, schema, OG images, 404)"
```

### Prompt 7 — Polish and prepare for production

```
Run through specs/LAUNCH-CHECKLIST.md systematically. Fix anything 
that doesn't pass. Specifically address:

1. Accessibility audit — install axe-core, run on every page, fix 
   any violations
2. Lighthouse audit — run on homepage and tool page, target ≥90 on 
   all metrics
3. Mobile testing — verify at 375px, 414px, 768px viewports — no 
   horizontal scroll, all touch targets ≥44px
4. Browser testing — verify in Chrome, Safari, Firefox (use 
   Playwright tests if helpful)
5. Privacy page — write /app/privacy/page.tsx with the honest, 
   short privacy policy from the launch checklist
6. Terms page — write /app/terms/page.tsx with a basic ToS
7. About page — write /app/about/page.tsx with a short founding 
   story explaining the wedge
8. How it works page — /app/how-it-works/page.tsx with a deeper 
   technical explanation of WebAssembly + local-first
9. Verify Cloudflare Web Analytics is installed and reporting
10. Verify the favicon set is complete (16, 32, 180, 192, 512, SVG)

Commit: "chore: pre-launch polish and accessibility fixes"
```

---

## Tips for working with Claude Code

**Read CLAUDE.md before changes.** Always start a session with 
"Read CLAUDE.md and the relevant /specs/ and /categories/ files first." 
Claude Code uses this as its constitution for the project.

**One prompt = one commit.** Don't chain multiple major features into 
one prompt. If a prompt does too much, Claude Code's context fills 
and quality drops. Break it up.

**Review before committing.** Claude Code will offer to commit. Skim 
the diff before approving. Most issues are catchable in 60 seconds 
of review.

**Use Plan Mode for big changes.** For anything that touches 
multiple files, ask Claude Code to "show me the plan first, don't 
make changes yet." Then approve or correct the plan.

**Don't waste tokens explaining.** Claude Code already has CLAUDE.md 
in context. Don't re-explain the project in every prompt. Just 
reference: "per specs/HOMEPAGE-SPEC.md, build X."

**When stuck, reset.** If Claude Code gets confused (rare but possible), 
exit and restart with a fresh context. Sometimes that's the fix.

**Stop after Prompt 5 and look at the site.** Don't blast through all 
7 prompts in one day. Build, deploy, look at the actual site on your 
phone, see what feels off, then continue. The intermediate feedback 
matters more than speed.

---

## What "done with the first build" looks like

After all 7 prompts:
- Live site at convertyard.com
- Homepage with working hero converter (JPG→WebP)
- One real tool page (JPG→WebP) at /jpg-to-webp
- 11 "coming soon" tool cards in the grid
- Full footer, nav, FAQ, comparison table
- Privacy, terms, about, how-it-works pages
- Auto-generated sitemap and robots.txt
- Full schema markup
- Lighthouse ≥90 on all metrics
- Mobile-perfect

Estimated total Claude Code time: 8–15 hours of active work over 
1–2 weeks. Don't try to do it in a weekend.

Next sessions: add tool #2 (HEIC to JPG), then ship one tool per 
week from /categories/01-image-conversion.md priority order.
