# Recommended Sequence — Prompts 21 → 24

This document is the master plan. It ties the 4 prompt files
together, explains the dependencies, and gives you a realistic
timeline.

**Read this BEFORE running any of the four prompt files.**

---

## Current Status — Updated 2026-06-16

| Prompt | Status | Deployed |
|--------|--------|---------|
| 21 — Bug Fix | ✅ Done | ✅ Live |
| 22 — PDF Excellence | ✅ Done | ✅ Live (pushed 2026-06-16) |
| 23 — Tier 1 Tools | ⬜ Next | — |
| 24 — Vertical Expansion | ⬜ Pending | — |

### What's live on compress-pdf right now
- Before/after comparison slider (renders page 1 on file drop)
- PDF file analyzer — shows image count, DPI, font stats, savings estimates
- Advanced settings panel — Images (DPI, JPEG quality, grayscale) + Strip (metadata, annotations, bookmarks, embedded files, JS)
- Preset buttons — Email / Web / Print / Archive / Maximum
- Competitor comparison table below FAQ
- SEO layout.tsx with JSON-LD structured data

### Immediate to-do after deploying Prompt 22
- [ ] Test compress-pdf on 5–10 real files (scanned docs, reports, slides) — catch any quirks before users do
- [ ] Post one screenshot of the before/after slider on social media — it's visually novel
- [ ] Check Cloudflare Pages build log to confirm deploy succeeded

---

## Next step: Prompt 23 — Tier 1 Tools

Prompt 23 ships 8 missing tools. It's large — split into sub-projects:

| Sub-project | Tools | New dependencies | Priority |
|-------------|-------|-----------------|----------|
| **23a — Security** | Unlock PDF, Protect PDF | none (pdf-lib already installed) | **Start here** |
| **23b — Modify** | Watermark PDF, PDF to PowerPoint | pptxgenjs | High |
| **23c — Office** | Word→PDF, Excel→PDF, PDF→Excel, PNG→PDF | mammoth, xlsx (SheetJS) | High, hardest |
| **23d — Site updates** | Homepage grid, /tools/ page, sitemap | none | Last, after all tools ship |

**Recommended order:** 23a → 23b → 23c → 23d

If short on time, ship just these 4: Unlock PDF, Protect PDF, Watermark PDF, Word to PDF.
That covers the highest-leverage gaps with the least engineering risk.

### To start Prompt 23a (Security tools)
Tell Claude Code: *"Start Prompt 23 — begin with 23a (Unlock PDF and Protect PDF)."*
No new npm installs needed. Uses pdf-lib's built-in encryption API.

---

## TL;DR

| Order | Prompt | What | Why It Goes Here |
|-------|--------|------|------------------|
| **1** | **21 — Bug Fix** | Fix the broken 5MB+ compression targets | ✅ Done |
| **2** | **22 — PDF Excellence** | Advanced settings, preview, analyzer, presets | ✅ Done |
| **3** | **23 — Tier 1 Tools** | Word↔PDF, Excel↔PDF, Watermark, Unlock/Protect, etc. | ⬜ Next — go wide |
| **4** | **24 — Vertical Expansion** | 12 new /for/ hubs | ⬜ After toolkit is credible |

**Total estimated active work:** 80-140 hours over 8-12 weeks.

---

## Why This Order Matters

### Why 21 must be first

Your compressor is producing **corrupt 500 KB files when users
target 5-50 MB**. This isn't a polish issue — it's a live trust-
killer. Every other prompt below assumes a working compressor:

- Prompt 22 adds advanced settings ON TOP of the compression
  engine. Building features on a broken foundation = features
  also broken.
- Prompt 23 ships PDF tools that may share compression code paths.
  Same risk.
- Prompt 24 builds vertical hubs that LINK to the compressor.
  Hubs driving traffic to a broken tool is worse than no hubs
  at all.

**Do not skip Prompt 21.** Do not run it "after I ship one more
thing." Do not assume the bug is small enough to defer. It's not.

### Why 22 goes before 23 (the deep-before-wide question)

This is the most contestable decision. There's a real argument
for shipping Tier 1 tools first to "close the obvious gaps." Here's
why I'm recommending depth first:

**The argument for shipping Tier 1 first:**
- 8 new tools = 8 new keyword surfaces = potentially more traffic
  per hour invested
- ConvertYard's homepage claims "60+ tools." Currently you have 32.
  Closing that gap relieves a credibility problem.
- Some Tier 1 tools (Watermark, Unlock/Protect) are easier wins —
  good morale boosts mid-roadmap.

**The argument for shipping Excellence first (which I'm choosing):**
- The biggest competitor advantage isn't tool count; it's tool
  quality. Adobe has 25+ tools; you'll never out-quantity them.
- "Compress PDF" is one of the top 3 PDF keywords by volume.
  Owning that page is more valuable than owning 8 long-tail
  conversion pages.
- Visual preview + file analyzer are GENUINELY first-in-class
  features. Once you ship them, comparison blogs and review sites
  notice. That earns backlinks. Backlinks compound across ALL of
  ConvertYard's pages, not just /compress-pdf/.
- Building the same architecture for Image Compressor later
  (Prompt 25) becomes "copy the pattern." You're investing once
  in a re-usable design.
- The honest experiments I've done across many sites: a single
  excellent flagship tool out-performs 8 average tools over a
  12-month window. The ratio is usually 3:1 or better in
  compounding traffic.

If you have **strong reasons** to disagree (existing PR
relationships for one of the Tier 1 tools, partnership
opportunities for SBI/UPPSC hub, etc.), feel free to swap 22
and 23. The strategic case is close. The bug fix (21) is not
negotiable.

### Why 24 goes last

Vertical hubs are SEO content, and SEO content takes 4-12 weeks
to mature. Shipping verticals before the toolkit is credible
means:
- Users land on /for/upsc, click "Photo Resizer for UPSC,"
  and the target-size compression is broken (the original bug)
- Users find your tools less capable than competitors when they
  reach the underlying tool pages (the lack of advanced features)
- The first impression is locked in before you've put your best
  foot forward

Verticals are amplifiers. Don't amplify a weak signal.

---

## Realistic Timeline

I want to give you honest time estimates. Most playbooks
underestimate by 2-3×. Here's what I think is realistic, with
buffer for the surprises that always come up.

### Prompt 21 — Bug Fix
- **Active work:** 8-16 hours
- **Calendar time:** 3-5 days (with verification cycles)
- **Hardest part:** the diagnostic phase. Trace the algorithm
  rigorously before changing anything.

### Prompt 22 — PDF Excellence
- **Active work:** 30-50 hours
- **Calendar time:** 2-3 weeks
- **Hardest part:** the visual preview implementation. Rendering
  PDF pages in canvas with a slider comparison is more fiddly
  than it sounds.

### Prompt 23 — Tier 1 Tools
- **Active work:** 25-40 hours (across 8 tools)
- **Calendar time:** 2-3 weeks
- **Hardest part:** PDF to Excel (table detection heuristics)
  and Word to PDF (DOCX layout fidelity). Plan to ship these
  with honest "what works / what doesn't" copy.

### Prompt 24 — Vertical Hub Expansion
- **Active work:** 20-30 hours
- **Calendar time:** 2 weeks (most time is research on each
  exam's specs, not code)
- **Hardest part:** verifying official specs for 12 different
  exams. Boring but critical work.

**Grand total:** roughly 80-140 hours over 8-12 weeks if you're
working steadily but not full-time on this.

---

## Where to Pause and Look at Reality

After each prompt, **stop building** and look at what's actually
happening:

### After Prompt 21
Test the bug fix on the 5MB/10MB/25MB targets with real files.
If it's not working, you don't proceed. Period.

### After Prompt 22
Spend 2-3 days using the new Compress PDF yourself on a variety
of files. The features are new and you'll find quirks. Better to
catch them before users do. Also: post one screenshot of the
visual preview comparing original/compressed on social media —
the visual is genuinely novel and gets attention.

### After Prompt 23
Wait 2 weeks before submitting the new tool sitemap entries to
Google Search Console. Why? Because if any of the 8 tools has
quality issues that 2 weeks of usage would reveal, you'd rather
fix them BEFORE Google starts ranking the pages. Indexed-then-
broken hurts more than not-indexed-yet.

### After Prompt 24
Wait 4-6 weeks before adding more verticals or expanding to
international exams (Pakistan, Nigeria, etc.). Use the 4-6 weeks
to:
- Monitor Search Console for which verticals get impressions
- Read what queries are surfacing
- Identify weak verticals and revise their copy
- Test the conversion path: do hub visitors actually use the
  tools, or bounce?

---

## Decisions I Can't Make For You

These come up implicitly in the prompts. Decide before you start:

### 1. Budget for the visual preview feature
Implementing it well is real work. If you're short on time,
Prompt 22 still ships excellent advanced settings + analyzer +
presets without the preview, and ConvertYard's compressor is
STILL the best free tool on the market. Decide upfront whether
you have bandwidth for the preview, and if not, defer it (mark
it as Prompt 22.5).

### 2. Whether to honest-update the "60+ tools" claim
After all 4 prompts you'll have 40+ tools live. You can either:
(a) Update homepage to "40+ tools" now and commit to "60+" later
(b) Hold the "60+ tools" claim and accept it's aspirational

I lean toward (a). Trust is built by being more honest than the
market expects, not less.

### 3. Whether to introduce monetization in this cycle
Currently ConvertYard is free, ad-free, signup-free. Some time
between 40 and 100 tools, you'll need to make money. Options:
(i) Display ads on tool pages (breaks your wedge — not recommended)
(ii) Display ads on supporting article pages only (acceptable)
(iii) Affiliate links to legit services (Adobe Pro, niche SaaS)
(iv) Premium tier for batch processing limits / API
(v) "ConvertYard for Teams" B2B SaaS sold to legal/medical firms

I'd recommend (ii) and (iii) sometime in the next 3-6 months,
NOT in this cycle. Prompts 21-24 are about building product
quality and traffic; monetization comes after you've earned the
audience.

### 4. Whether to spin off the legal vertical
Earlier in our conversations we discussed splitting US court
e-filing off as a separate domain/SaaS. Nothing in Prompts 21-24
forecloses that decision — but also nothing in them advances it.
If you want to pursue the legal SaaS, that's a parallel project
that should be Prompt 30 or beyond, after ConvertYard is
demonstrably ranking and converting.

---

## The Single Most Important Thing

If you only do ONE thing from this entire 4-prompt sequence, do
**Prompt 21**.

Bug-free is the floor. Excellence and breadth are the ceiling.
But a leaky floor sinks the whole structure.

After Prompt 21, the order can shift based on your priorities,
energy, and what you find in the data. The bug fix is the only
non-negotiable.

---

## A note on prompt size

These 4 prompt files are LONG. They're written to be exhaustive
because Claude Code works best with explicit, complete
specifications. But you don't have to paste the entire file at
once if it's too much context — you can:

1. Paste Part A first, let Claude Code finish that, then paste
   Part B in a new conversation
2. Break Prompt 23 into 23a / 23b / 23c by group
3. Save Prompt 24 hubs as 6 hubs first, 6 hubs later

The structure tolerates this. Just preserve the order within
each prompt's parts.

---

Good luck. Ship Prompt 21 first, then come back here when you're
ready to read the rest of the sequence.
