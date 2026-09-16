# Speckyboy pitch — DO NOT send original draft; alternate path outlined

**Reference article:** "How to Optimize Images on Websites to Improve Performance and UX"
**URL:** https://speckyboy.com/optimize-images-websites-improve-performance-ux/
**Author:** Nicole Amsler — **VP of Marketing at Cloudinary** (byline confirmed on the article and her author page)
**Last Updated:** April 30, 2025 (originally 2016 — image URLs contain `/2016/03/`, references The Fiscal Times 2015 data)

## Four critical factual errors in the original pitch

The original draft has four things factually wrong about the article:

### 1. Wrong author name

Pitch is addressed "Hi Paul." Author is Nicole Amsler. Wrong-name greeting = immediate credibility death.

### 2. Fabricated AVIF section

Pitch says: *"the section on AVIF and WebP as the priority formats is current and accurate."*

**The article does not mention AVIF at all.** It covers WebP and JPEG-XR (JPEG-XR is essentially dead — Microsoft-only, never got mainstream browser adoption). If Nicole reads this line, she knows the writer didn't read her article.

### 3. Fabricated tool list

Pitch says: *"Kraken.io, Imagify, Squoosh: all assume the file is already in the right format."*

**None of these three tools appear in the article.** The actual tools Nicole names:
- PNGCrush
- OptiPNG
- Yahoo smush.it (which shut down in 2014)
- Every "how to fix" section links to a Cloudinary tutorial

### 4. Pitching a Cloudinary employee to add a competitor

Nicole Amsler is **Cloudinary's VP of Marketing**. Her author bio on Speckyboy states: *"Nicole Amsler is vice president of Marketing at Cloudinary."* Every "how to fix" recommendation in her article routes to Cloudinary blog posts. This is essentially Cloudinary contributor/sponsored content on Speckyboy.

Cloudinary offers image conversion tools that compete with ConvertYard. Asking Nicole to add a link to a competitor is a non-starter — she is not going to help.

## Speckyboy's actual submission channel

**Confirmed from their `/contribute-an-article/` page:**
- Email: **`mail@speckyboy.com`** (decoded from Cloudflare obfuscation)
- Open to designers, developers, bloggers, WordPress experts
- Any format accepted (Google Doc, Word, text, HTML)
- Images sized ≤1000px wide

**Critical hard filter — verbatim from their submission guidelines:**
> *"Please note that if your article is self-promotional, clearly only seeking a 'follow' link, or mentions an infographic, your submission will be automatically deleted."*

Any pitch that reads as tool promotion — no matter how well-written — gets auto-trashed.

## Two path forward — pick one

### Path A: Skip this pitch entirely (recommended)

- Nicole won't help (Cloudinary employee)
- The article isn't going to get an update to add a competing tool
- Speckyboy's spam filter will delete a self-promotional pitch anyway

### Path B: Pitch a NEW article to Speckyboy (via `mail@speckyboy.com`)

Nicole's article is 8-9 years old at its core and genuinely factually stale — no AVIF, references dead services, still recommends JPEG-XR, still cites Yahoo smush.it. There's a real editorial gap for an updated 2026 piece. Speckyboy's contributor program is open and functional.

**Working title:** *"How Image Optimization Changed Between 2016 and 2026 — A Practical Update for Designers"*

**Structure (survive the "automatically deleted" filter):**

1. **What's changed** — AVIF adoption, WebP adoption reaching universal, JPEG XL's status, HEIC as an input format, browser support tables that finally landed
2. **Modern format-first workflow** — convert to modern format BEFORE compression, not after. Cover the specific step Nicole's article skips.
3. **Tool comparison table (not a promo list)** — categorize by use case: browser-based (Squoosh, ConvertYard, RIP smush.it), CLI (cwebp, avifenc, cavif-rs), CDN-side (Cloudinary, imgix, Shopify's CDN), desktop (GIMP, ImageOptim). One line per tool, no ranking, no "best of."
4. **Format decision tree for designers** — when to choose AVIF vs WebP vs JPEG XL vs JPEG based on delivery target (web, email, ad platforms, static export)
5. **What Nicole's 2016 fixes still hold up** — PNGCrush/OptiPNG are still solid; the .htaccess-style rewrite pattern still works. Credit her original article; this is a companion, not a replacement.
6. **What's newly required in 2026** — Core Web Vitals impact, LCP image priority hints, `<picture>` element with AVIF/WebP source, srcset for responsive delivery

**How to survive the anti-promotion filter:**
- ConvertYard appears ONCE, in the tools comparison table (Path A: browser-based, one line, no adjectives)
- No "sign up" language, no "check it out," no anchor text asking for keyword placement
- Genuine practitioner content that a designer could act on without touching ConvertYard at all
- Link out to the original article and give Nicole credit — this positions the piece as an update to her framework, not a replacement

**Length:** aim for 1,800-2,500 words. Speckyboy publishes longer explainer pieces.

**Word to editor before submitting:** send a 3-sentence pitch first to `mail@speckyboy.com` asking if the update angle interests them. Only draft the full article if they say yes. Cold-submitting a 2,500-word draft is more likely to trigger the "delete" reflex than a short pitch that lets them opt in.

## Draft short pitch to send to `mail@speckyboy.com`

**Subject:** Article idea: what's changed in image optimization since 2016

Hi Speckyboy editorial,

Nicole Amsler's "How to Optimize Images on Websites to Improve Performance and UX" (last updated April 2025) still ranks well, but the underlying framework is from 2016 — some of it (Yahoo smush.it, JPEG-XR) has aged into inaccuracy, and formats that didn't exist yet in 2016 (AVIF as a mainstream option) don't appear.

I'd like to write an update-companion piece: *"How Image Optimization Changed Between 2016 and 2026 — A Practical Update for Designers."* It would credit Nicole's original framework, keep the parts that still hold up (PNGCrush, OptiPNG, the "modern formats" principle), and add what's genuinely new: AVIF adoption, browser support that finally landed, the convert-then-compress workflow the original article skips, and a format decision tree tied to real delivery targets (web, email, ad platforms).

I build browser-based image conversion tools for a living, so I'd write from what I've seen actually work at scale for design teams — not a listicle.

Aiming for 1,800-2,500 words in your usual house style. Would this fit your calendar? Happy to send an outline before drafting.

— Garrick Dee Tan
convertyard.com
gdtwebmaster@gmail.com

---

## Notes for follow-up

- Send the SHORT pitch first, not a full article. Speckyboy's contribute guidelines don't say "outline first" but the anti-spam filter clearly favors small, specific inquiries over cold-submitted content.
- **Do NOT mention ConvertYard in the initial pitch email.** Only mention it if they ask what you build. This pitch's value hinges on being taken seriously as a writer, not filtered out as a tool marketer.
- If they say yes and you write the full article, keep ConvertYard mentions to ONE — in a tools comparison table, one line, no adjectives. Any more and you trip the "self-promotional... automatically deleted" filter even if the article passes initial editorial review.
- If they say no or don't reply in 2 weeks: no follow-up. Speckyboy's model is high-volume submissions filtered aggressively. One nudge would burn the address.
- If they accept and publish: real, sustainable long-term value. Speckyboy has strong DA (~70+), the article would rank for "image optimization 2026" queries where Nicole's aging piece currently occupies the top spot, and the ConvertYard mention would sit inside genuinely useful editorial content.

## Where this ranks in overall priority

Adds to Medium value:

**High value:**
1. Cloudways
2. iGeeksBlog
3. Windows Latest
4. SlashGear
5. Shutterbug

**Medium value:**
6. AppleToolBox
7. Redmond Pie
8. freeCodeCamp
9. KeyCDN (update-focused)
10. **Speckyboy (with Path B rewrite as new-article pitch, not the original tool-add pitch)**

**Skip:**
11. Phoblographer
12. ImprovePhotography
13. ExpertPhotography
14. Buffer
15. Sprout Social
16. CSS-Tricks
17. Shopify main blog
