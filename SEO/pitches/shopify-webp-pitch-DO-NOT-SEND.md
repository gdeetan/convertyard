# Shopify Blog pitch — DO NOT SEND

**Reference article:** "What Is a WebP File? How WebP Compares To JPEG and PNG"
**URL:** https://www.shopify.com/blog/what-is-webp-file
**Byline:** "Shopify Staff" (generic in-house byline, default gravatar, no individual name)
**Published:** March 28, 2025
**Length:** 7 min read

## What the article actually recommends

**For JPEG/PNG → WebP conversion:**
- Tinify
- CloudConvert
- Image Resizer

**For WebP → JPG:**
- CloudConvert, Tinify
- Or offline: Photoshop, GIMP, or cwebp CLI

**HEIC is not mentioned anywhere in the article.**

## Why this pitch shouldn't be sent

### Problem 1: No public contributor channel

All standard submission paths return 404 on shopify.com:
- `/blog/write-for-us` → 404
- `/blog/contribute` → 404
- `/blog/guest-post` → 404
- `/partners/blog/write-for-us` → 404

### Problem 2: "Shopify Staff" byline is a very strong tell

Shopify's main blog used to run a paid freelance guest program (roughly $500–$1000/article, roughly 2018–2022, byline attribution to the individual writer). Circa 2023–2026, they moved almost entirely to in-house "Shopify Staff" bylines with default gravatars. Freelance guest slots on the main blog effectively do not exist right now.

### Problem 3: The blog is a content-marketing funnel, not an editorial publication

Every article ends with `admin.shopify.com/signup` CTAs. Editorial priorities optimize for Shopify's own sales funnel. An external "here's a workflow using a non-Shopify tool" pitch conflicts directly with the funnel goal.

### Problem 4: Your pitch's framing pulls readers OUT of Shopify's ecosystem

The draft leans on: *"store owners using landing page builders, email marketing tools, or social ads platforms that don't route through Shopify's CDN. Those images need to be WebP before upload, not after."*

That framing tells the reader "this is important for platforms outside Shopify." Shopify's blog has zero incentive to publish that framing — their editorial mandate is the opposite (drive readers deeper into Shopify's own toolset).

### Problem 5: One factual claim to verify before you use it anywhere

Your pitch says: *"Shopify's media library doesn't accept HEIC natively — the file gets rejected or renders broken, and the CDN conversion never happens."*

**Verify this against current Shopify docs before using in ANY pitch or article** — the supported file types list has changed over the years, and I couldn't fully verify current 2026 behavior from public sources. Check: https://help.shopify.com/en/manual/products/product-media/product-media-types

If it turns out Shopify's media library DOES accept HEIC (via an internal conversion pipeline you didn't know about), the pitch's premise collapses and any article built on it collapses with it.

## Honest recommendation

**Skip Shopify's main blog entirely.** Same category as Buffer, Sprout Social, and CSS-Tricks — the ask category (external guest post to promote an external tool) doesn't exist as a workflow at these publications right now.

## Better-fit alternatives for Shopify-adjacent content

**Option A — Shopify Partners blog (different from main blog):**
- URL: `/partners/blog/`
- Historically more open to technical/developer content from actual Shopify Partners
- If you sign up as a Shopify Partner (free), you get a legitimate pitch anchor to write about developer/merchant workflows
- Still tightly editorially controlled but easier than the main blog

**Option B — Competing ecommerce publications with real guest programs:**
- **BigCommerce blog** — competitor, so has actual incentive to publish content that pulls readers away from Shopify's ecosystem. More open to guest contributions historically.
- **Practical Ecommerce** — independent ecommerce publication with a real editorial process for outside contributors
- **EcommerceFuel** — Andrew Youderian's community; not a traditional guest-post outlet but has a podcast and community with practitioner-to-practitioner content

**Option C — Podcast route:**
- **Shopify Masters** podcast — Shopify's own show, features merchant/builder stories. If you have a "built ConvertYard from zero to X users, here's what I learned" story with real numbers, that's a legitimate pitch angle.
- Multiple ecommerce podcasts accept guest interviews from builders with a story to tell.

**Option D — Self-publish and let it rank:**
- Write "How to Handle iPhone Product Photos in an E-Commerce Workflow (Without Uploading to Random Servers)" on your own convertyard.com blog or Hashnode
- Target long-tail "shopify heic upload" search intent — Shopify's own blog isn't targeting this specific query
- Doubles as one of the freeCodeCamp contributor samples
- You own the SEO permanently

## Where this ranks vs. previous priority triage

Adds to bottom of "Skip" list:

**High value (send now):**
1. Cloudways
2. iGeeksBlog
3. Windows Latest
4. SlashGear (Pankil handed you an unfilled gap in his own article)
5. Shutterbug

**Medium value:**
6. AppleToolBox
7. Redmond Pie
8. freeCodeCamp (structural change required)
9. KeyCDN (update-focused, longer horizon)

**Skip:**
10. Phoblographer (in-house reviews only)
11. ImprovePhotography (editorially dormant)
12. ExpertPhotography (paid-link model)
13. Buffer (submissions closed + who-shouldn't-apply)
14. Sprout Social (no channel + competing in-house tool)
15. CSS-Tricks (submissions closed + wrong ask category)
16. **Shopify main blog (no channel + Staff-only byline + funnel-hostile framing)**

## Notes on the broader pattern

You're now at 16 pitches researched. The pattern is stable:

- **Publications that convert:** ones with real editorial submission processes (Cloudways form, freeCodeCamp contributor app), fresh articles with active authors, or acknowledged gaps in the article itself (SlashGear, Shutterbug)
- **Publications that don't:** big content-marketing operations (Shopify, Buffer, Sprout, HubSpot-style sites) — they have massive audiences but zero editorial workflow for outside pitches promoting external tools
- **Publications that could convert but need a different pitch entirely:** CSS-Tricks (need to wait for guest program to reopen and pitch a technical builder story, not a tool addition), Phoblographer (submit ConvertYard for review, not a guest post)

Stop pitching content-marketing operations of SaaS competitors' size. Focus the remaining time on the four high-value pitches (Cloudways, iGeeksBlog, Windows Latest, SlashGear) — those are the ones with real conversion probability. Any additional pitches you're considering should be filtered against this framework before you research them.
