# WP Engine pitch — DO NOT SEND

**Reference article:** "How to Optimize Images for Web: A Step-By-Step Guide for Better Site Performance"
**URL:** https://wpengine.com/blog/optimize-images-for-web/
**Author:** Tyler Stokes — Senior Web Developer at WP Engine (in-house staff)
**Last Updated:** September 28, 2024
**Length:** 12 min read, 7 numbered steps

## What the article actually covers (verified)

1. Intro / run a speed test
2. Choose the best image file type — **JPEG, PNG, GIF only** (no WebP, no AVIF)
3. Resize images before upload
4. Compress images (tools: Image Optimizer for Local, TinyPNG, ImageOptim, JPEGmini)
5. Automate with WordPress plugin (EWWW Image Optimizer Cloud, TinyPNG, Kracken.io, Imagify)
6. Blur-up technique
7. Lazy loading (Smush plugin)

**HEIC not mentioned** — your pitch premise is factually correct.
**WebP/AVIF not mentioned in the format section** — an even bigger gap than HEIC.

## Your pitch premise is technically accurate — but the pitch still shouldn't be sent

The HEIC-at-WordPress-media-library argument holds up:
- WordPress core doesn't allow `.heic` in the MIME allowlist by default
- Upload gets rejected before any plugin runs
- The article's pipeline (steps 4–7) assumes the image is already in the media library

That's correct. But three structural problems kill this pitch anyway:

### Problem 1: No contributor channel exists

Same pattern as Buffer, Sprout Social, Shopify, CSS-Tricks, KeyCDN. All standard submission paths return 404:
- `/blog/write-for-us` → 404
- `/blog/contribute` → 404
- `/write-for-us` → 404
- `/blog/guest-post` → 404
- Only `/contact/` exists (sales/support, not editorial)

WP Engine's blog is written by in-house staff. Tyler is a Senior Web Developer at WP Engine, not a freelance contributor. There is no intake pipeline for outside pitches.

### Problem 2: The blog is a funnel for WP Engine's own product portfolio

WP Engine owns Local by Flywheel (acquired 2019), Genesis Framework, StudioPress, and other WordPress-ecosystem properties. Tyler's #1 compression tool recommendation is "Image Optimizer" — a Local add-on. The whole blog is designed to route readers toward WP Engine's own hosting + product stack.

External tool pitches conflict with that editorial mandate.

### Problem 3: Argument duplicates your Cloudways pitch

Your Cloudways pitch (already sent) makes the exact same "WordPress rejects HEIC at upload, browser conversion is the pre-step" argument, aimed at the same reader (agency/developer running client WordPress sites). Cloudways accepted the submission because they have an actual editorial form. WP Engine doesn't — sending the same argument here is redundant work with lower conversion probability.

## Honest recommendation

**Skip this pitch.** Add to the "no contributor channel" skip tier with Buffer, Sprout, Shopify, CSS-Tricks, KeyCDN.

## If the Cloudways article publishes and does well

Two derivative moves that would work better than pitching WP Engine directly:

**A. Pitch WP Engine's competitors that DO have contributor channels:**
- **Kinsta blog** — WordPress hosting competitor to WP Engine, historically publishes external contributors. Check https://kinsta.com/blog/ for contribute page.
- **Pagely / Rocket.net / GridPane blogs** — smaller WP hosting operations with more open editorial models
- **wpbeginner** — high-traffic WordPress publication, has published guest content

**B. Repurpose the Cloudways article on your own site:**
- Once the Cloudways article is live, cross-post an adapted version to your own convertyard.com blog
- Target long-tail queries like "wordpress heic upload not working" — WP Engine's article isn't optimized for that query
- Own the SEO permanently; the article ranks against WP Engine's dated piece indirectly

## Where this ranks in the running priority

Adds to "Skip" tier:

**High value:**
1. Cloudways ✓ (sent)
2. iGeeksBlog
3. Windows Latest
4. SlashGear
5. Shutterbug

**Medium value:**
6. AppleToolBox
7. Redmond Pie
8. freeCodeCamp
9. KeyCDN
10. Speckyboy (Path B rewrite as new-article pitch)

**Skip:**
11. Phoblographer (in-house reviews)
12. ImprovePhotography (editorially dormant)
13. ExpertPhotography (paid-link model)
14. Buffer (no channel + who-shouldn't-apply)
15. Sprout Social (no channel + competing in-house tool)
16. CSS-Tricks (submissions closed)
17. Shopify main blog (no channel + Staff-only)
18. **WP Engine (no channel + owns competing WP tooling + duplicates Cloudways argument)**

## Broader pattern reinforcement

Now 18 pitches researched. The signal is very clear:

**Publications with a real submission channel + fresh article + acknowledged gap = high conversion probability.** (Cloudways, iGeeksBlog, Windows Latest, SlashGear, Shutterbug.)

**Big SaaS content operations without submission channels = zero conversion probability regardless of pitch craft.** (Buffer, Sprout, Shopify, WP Engine, ExpertPhotography as paid-only.)

The WP Engine miss isn't about pitch quality — it's about ask-category-market fit. Stop researching pitches to hosting-company/scheduling-tool/CDN-company/CMS-company blogs unless they have a public contributor page. That saves you the research hours and lets you focus on the five high-value targets that will actually convert.
