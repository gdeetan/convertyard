# SiteGround pitch — DO NOT SEND

**Reference article:** "AVIF Image Format & Can I Use It on My WordPress Site"
**URL:** https://www.siteground.com/kb/avif-image-format
**Type:** Knowledge Base article (`/kb/` URL — not a blog post)
**Author:** No individual byline — SiteGround technical documentation team
**Last update:** May 13, 2026
**Length:** 3 min read

## Why this pitch shouldn't be sent

### Problem 1: It's a KB article, not a blog post

The `/kb/` prefix is not decorative — SiteGround's Knowledge Base is a distinct content system:
- Hosting company technical documentation, not editorial content
- Written and maintained by SiteGround's in-house technical writers
- Purpose: help SiteGround customers with SiteGround-specific tasks and funnel toward SiteGround's own products
- No external contribution workflow exists — you can't submit KB additions

Blog articles occasionally accept external mentions. KB articles don't. Ever. That's a structural difference, not a policy one.

### Problem 2: The article promotes SiteGround's own competing product

Step 5 of the "How to Use AVIF Images in WordPress" section explicitly recommends **SiteGround Speed Optimizer** — SiteGround's own bundled plugin that ships free with their hosting. The KB is a funnel: read this → use Speed Optimizer → renew hosting.

Adding a link to an external tool that lets readers convert AVIF *without needing SiteGround's plugin (or SiteGround's hosting)* is directly hostile to the funnel. Same problem that killed the WP Engine and ImageKit pitches, arguably stronger because KB pages are more tightly controlled than blog articles.

### Problem 3: Pitch's factual claim is partially wrong

Pitch says: *"Your optimization plugin... only runs on images already in the media library. The conversion step, from whatever format a client sent, to AVIF or WebP before upload, isn't covered."*

SiteGround Speed Optimizer does convert JPG/PNG → WebP automatically server-side on upload. The "conversion step isn't covered" framing is inaccurate for JPG/PNG input.

**The real WordPress gap is HEIC — WordPress core rejects `.heic` at the media library MIME layer before Speed Optimizer ever sees the file.** But this article isn't about HEIC, it's about AVIF. Wrong article to hang the HEIC hook on.

### Problem 4: No individual author to address

The pitch is addressed "Hi SiteGround team" — which is safe. But the article has no named author because it's KB content. There's no editorial owner to persuade even if the structural problems weren't disqualifying.

## Honest recommendation

**Skip.** Add to the "hosting-company product marketing / documentation" tier alongside WP Engine, ImageKit, KeyCDN, Shopify.

## Where this ranks

**High value (send now):**
1. Cloudways ✓ (sent)
2. iGeeksBlog
3. Windows Latest
4. SlashGear
5. Shutterbug

**Medium value:**
6. AppleToolBox
7. Redmond Pie
8. freeCodeCamp
9. KeyCDN (update-focused)
10. Speckyboy (new-article path)

**Skip:**
11. Phoblographer
12. ImprovePhotography
13. ExpertPhotography
14. Buffer
15. Sprout Social
16. CSS-Tricks
17. Shopify main blog
18. WP Engine
19. ImageKit
20. Noupe
21. **SiteGround KB (KB article structure + own plugin promoted + pitch's premise partially wrong + wrong article for HEIC hook)**

## Broader pattern — filter targets before researching them

Now 21 pitches researched. The pattern is completely stable. Categories that consistently fail (do not research any further):

1. **CDN/image-hosting product blogs** — ImageKit, KeyCDN, Cloudinary, imgix, Bunny.net, Uploadcare
2. **Big SaaS content-marketing blogs without contributor channels** — Buffer, Sprout, Shopify, HubSpot, HootSuite (main blog)
3. **Hosting-company blogs/KBs** — WP Engine, SiteGround KB (Cloudways is the exception because they have a real contributor form)
4. **Editorially inconsistent publications with dead submission paths** — ImprovePhotography, Noupe
5. **Paid-link operations** — ExpertPhotography, many "guest post" networks

Categories that DO convert:

1. **Publications with real editorial submission forms** — Cloudways form, freeCodeCamp contributor app
2. **Practitioner publications with active author bylines and reachable editorial emails** — SlashGear, Shutterbug, AppleToolBox, iGeeksBlog, Windows Latest, Redmond Pie
3. **Articles where the author explicitly acknowledged a gap you can fill** — SlashGear (Pankil's unnamed bulk tool), Shutterbug (Jon's "settings fix doesn't help existing photos" quote)

**Actionable filter for any future pitch research:** Before spending time on any new target, check these three signals in ~2 minutes:
- Does `/write-for-us` or `/contribute` return a real 200 with actual submission info?
- Is the article's author an individual with a reachable email (not "Staff" byline)?
- Does the article itself acknowledge a gap you can fill (not fabricate one)?

If none of the three, skip. If one, it's medium-value. If two or three, it's high-value.
