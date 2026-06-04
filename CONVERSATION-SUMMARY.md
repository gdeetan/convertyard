# ConvertYard — Project Context Summary

> Drop this file into a new Claude conversation along with `CLAUDE.md`,
> `PROJECT-OVERVIEW.md`, and any specific spec files you're working on.
> It will let any Claude pick up where the original planning left off.

---

## What ConvertYard is

A network of local-first batch file conversion and utility tool pages
at **convertyard.com**. Wedge: all file processing runs in the browser
via WebAssembly. Nothing uploads. Built specifically to handle batches
of 1,000+ files at once.

**Tagline (locked):** Local-first conversion, built for batches.

**Brand voice:** Direct, no fluff. Facts over claims. Workshop/yard
metaphor (crates, batches, getting work done).

## All locked decisions

| Decision | Value |
|---|---|
| Brand name | ConvertYard |
| Domain | convertyard.com (registered) |
| Tagline | Local-first conversion, built for batches. |
| Logo | Direction A — three stacked rectangles (workshop/crates) |
| Primary color | Terracotta `#C2410C` |
| Background | Warm stone `#FAFAA9` |
| Display font | Fraunces (variable serif) |
| Body/UI font | Geist |
| Mono font | Geist Mono |
| Framework | Next.js 15, App Router, TypeScript |
| Output mode | Static export (`output: 'export'`) |
| Hosting | Cloudflare Pages |
| Source control | GitHub (private repo) |
| Domain registrar | Cloudflare Registrar (or transfer to) |
| Analytics | Cloudflare Web Analytics (privacy-first, cookieless) |
| Build approach | Use Claude Code |
| Cookie banner | Not needed (no cookies = exempt) |

## The wedge — why this exists

Most online converters share three weaknesses ConvertYard is designed
against:

1. They upload user files to servers (privacy concern, especially for
   PDFs, contracts, medical scans, personal photos)
2. They choke past 20 files or force one-by-one downloads
3. They are ad-choked, watermark output, or add signup walls

Every page, every tool, every article reinforces local-first + batch.

## Traffic goal

**100K monthly visits within 12–18 months.** Achieved via ~60 tools
across 7 clusters + ~200 supporting articles + programmatic SEO for
format combinations.

## Tool clusters (each has a brief in /categories/)

1. **Image conversion** — JPG/PNG/WebP/AVIF/HEIC (priority #1)
2. **Image editing** — Resize, compress, crop, watermark, BG remove
3. **PDF tools** — Merge, split, compress, convert, true redaction
4. **Video & audio** — MP4/MP3 conversions, compression, trimming
5. **Developer utilities** — JSON, Base64, regex, encoding tools
6. **Web/brand utilities** — Favicons, OG images, QR, color tools
7. **AI-powered tools** — Alt text, BG removal, upscaling, transcription

Combined cluster traffic potential: 111–164K monthly visits.

## Launch lineup (12 tools, day one)

- **Images (5):** HEIC→JPG, JPG→WebP (hero converter), PNG→WebP, WebP→JPG, Bulk image compressor
- **PDF (3):** Merge PDF, Compress PDF, PDF→JPG
- **Video/Audio (1):** MP4→MP3
- **Developer (2):** JSON formatter, Base64 encoder/decoder
- **AI (2):** Alt text generator (batch), Background remover

## File structure (planning docs)

```
/CLAUDE.md                  ← AI coding assistant project context
/PROJECT-OVERVIEW.md        ← Summary of all locked decisions
/categories/
  01-image-conversion.md
  02-image-editing.md
  03-pdf-tools.md
  04-video-audio.md
  05-developer-utilities.md
  06-web-brand-utilities.md
  07-ai-tools.md
/specs/
  DESIGN-SYSTEM.md          ← Tokens, components, templated architecture
  HOMEPAGE-SPEC.md          ← Section-by-section homepage spec
  LAUNCH-CHECKLIST.md       ← Pre-launch checklist (100+ items)
  CLAUDE-CODE-PLAYBOOK.md   ← Step-by-step prompts for Claude Code
/logos/
  logo.svg                  ← Full lockup (Direction A)
  logo-mark.svg             ← Mark only (favicon source)
  direction-a-stacks-*.svg  ← Originals
  direction-b-*.svg         ← Alternate (not chosen)
  direction-c-*.svg         ← Alternate (not chosen)
  logo-comparison.html      ← Visual comparison page
homepage-prototype.html     ← Working homepage prototype
```

## The templated system (key architectural insight)

Three layers — get these right and every new tool is a 1-hour ship:

**Layer 1: Design tokens** — colors, type, spacing as CSS variables.
**Layer 2: Components** — ToolShell, ArticleShell, Nav, Footer, etc.
**Layer 3: Content configs** — each tool is a TypeScript config object;
the page itself is 5 lines that render `<ToolShell config={config} />`.

## Anti-patterns (never do)

- ❌ Server-side file processing for anything user-uploaded
- ❌ Email/signup walls before download
- ❌ Ads inside tool UI
- ❌ The word "Photoshop" anywhere (trademark + wrong frame)
- ❌ Complex manual editing (layers, brushes) — that's Photopea's fight
- ❌ Naming competitors in marketing copy
- ❌ YouTube/social media downloaders (legal risk)

## Current state

**Done:**
- All planning, positioning, branding
- Domain registered (convertyard.com)
- Logo designed (Direction A)
- Working homepage prototype (HTML + real Canvas-based JPG→WebP)
- Full file structure for the repo

**Next steps (in order):**
1. Open `homepage-prototype.html` in browser, review on mobile + desktop
2. Set up GitHub repo, push all planning files
3. Connect to Cloudflare Pages
4. Install Claude Code (requires Pro/Max/Team subscription)
5. Follow `/specs/CLAUDE-CODE-PLAYBOOK.md` — 7 sequential prompts that
   take you from scaffold to a live production homepage with one
   real working tool

## Things to remember about the user

- Building solo, treating ConvertYard as an SEO-driven business
- Not a developer themselves — using Claude Code as the builder
- Wants methodical, organized planning (cluster-based, prioritized)
- Located in Philippines
- Goal: passive organic traffic that compounds

## Key principles

- **Build the system, not just pages.** Templated architecture means
  tool #50 is as easy as tool #1.
- **Quality over speed.** 30 great tools beats 100 mediocre ones.
- **The wedge is the marketing.** Every page reinforces local-first +
  batch. No exceptions.
- **Search drives growth.** Long-tail articles + supporting articles
  compound. Tool pages alone cap at ~30K visits.
- **Product Hunt at month 3–4**, not earlier. Site must be polished first.

## Marketing milestones

- **Month 0–3:** Build foundation, ship 15 tools, validate batch UX
- **Month 3–4:** Product Hunt launch (main site)
- **Month 6:** Open-source converter components on GitHub for backlinks
- **Month 8:** Product Hunt launch (sub-product, e.g., AI tools)
- **Month 12:** Product Hunt launch (API or major version)
- **Month 12–18:** Push to 100K+ monthly visits

## Useful prompt for resuming work in a new chat

> "I'm building ConvertYard — a local-first batch file converter site.
> Read the attached CLAUDE.md, PROJECT-OVERVIEW.md, and CONVERSATION-SUMMARY.md.
> I'm working on [specific task]. The relevant spec file for this task
> is [HOMEPAGE-SPEC.md / DESIGN-SYSTEM.md / specific category file].
> [Then ask your question.]"
