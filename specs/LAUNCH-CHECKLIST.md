# Pre-Launch Checklist

A practical list of things that often get forgotten before going live.
Work through this systematically. None of it is optional for a
production tool site.

## SEO infrastructure

- [ ] `sitemap.xml` auto-generated from tools.ts and articles
- [ ] `robots.txt` (allow all, link to sitemap)
- [ ] Google Search Console verified
- [ ] Bing Webmaster Tools verified
- [ ] Canonical URL on every page
- [ ] Open Graph image generated per tool (template-based, build-time)
- [ ] Twitter Card metadata on every page
- [ ] Schema markup:
  - [ ] SoftwareApplication on tool pages
  - [ ] FAQPage on pages with FAQs
  - [ ] BreadcrumbList on every page
  - [ ] Article on article pages
  - [ ] Organization on homepage
- [ ] Test all schema with Google Rich Results Test
- [ ] Submit sitemap to Search Console and Bing

## Meta tags (every page)

- [ ] `<title>` unique per page, follows pattern "{Title} — ConvertYard"
- [ ] `<meta name="description">` 140–155 chars
- [ ] `<meta property="og:title">`
- [ ] `<meta property="og:description">`
- [ ] `<meta property="og:image">` (1200x630)
- [ ] `<meta property="og:url">`
- [ ] `<meta name="twitter:card" content="summary_large_image">`
- [ ] `<link rel="canonical">`
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] `<meta name="theme-color">` (matches brand)
- [ ] Favicon set: ico, 16, 32, 180 (apple-touch), 192, 512, SVG
- [ ] `manifest.json` for PWA-lite behavior

## Performance

- [ ] LCP <1.5s on every page (test with PageSpeed Insights)
- [ ] TTI <2s on every page
- [ ] CLS 0 (or as close as possible)
- [ ] No render-blocking JS or CSS
- [ ] Critical CSS inlined in `<head>`
- [ ] Fonts: system stack default, brand font with `font-display: optional`
- [ ] Images: AVIF with WebP/JPG fallback, lazy-loaded below fold
- [ ] No third-party scripts on tool pages (analytics only)
- [ ] WASM lazy-loaded on first interaction
- [ ] Total initial JS <80kb gzipped (per tool page)
- [ ] Service Worker caches site shell + tool WASM for offline use

## Accessibility (WCAG 2.1 AA minimum)

- [ ] Keyboard navigation through every interactive element
- [ ] Visible focus indicators (not browser-default removed)
- [ ] Screen reader testing (VoiceOver on iOS/macOS, NVDA on Windows)
- [ ] Color contrast 4.5:1 minimum (test with axe DevTools)
- [ ] All images have meaningful alt text
- [ ] Form inputs have visible labels (not placeholder-only)
- [ ] Dropzones announce file additions to screen readers
- [ ] Progress bars have aria-live regions
- [ ] Skip-to-content link as first element
- [ ] Heading hierarchy correct (one H1, no skips)
- [ ] Language declared on `<html>` (`lang="en"`)
- [ ] Touch targets ≥44×44px on mobile

## Error and edge states

- [ ] 404 page with search and popular tools
- [ ] Error boundary catches React errors gracefully
- [ ] "Browser doesn't support WebAssembly" state (very rare but handle it)
- [ ] "File too large" warning (configurable per tool)
- [ ] "Unsupported file format" with helpful message
- [ ] "Conversion failed" state with retry option
- [ ] Network failure when loading WASM (retry button)
- [ ] Empty states for tools with no files dropped yet
- [ ] Loading states for WASM modules ("Preparing converter...")

## Mobile testing

- [ ] Test on actual iPhone (Safari)
- [ ] Test on actual Android (Chrome)
- [ ] Test on iPad (Safari)
- [ ] Test all tools at 375px viewport
- [ ] Touch targets feel right (not too small, not too cramped)
- [ ] Drag-drop fallback to file picker works
- [ ] Bottom-of-page CTAs reachable with one thumb
- [ ] No horizontal scroll on any page
- [ ] Sticky nav doesn't cover content when anchored to sections
- [ ] iOS Safari quirks: 100vh issue, position:fixed bugs, etc.

## Browser compatibility

Test in the latest versions of:
- [ ] Chrome (desktop + Android)
- [ ] Safari (macOS + iOS)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)
- [ ] Samsung Internet (Android)

Note: don't worry about IE or browsers >2 years old. WebAssembly
isn't supported there anyway.

## Privacy & legal

- [ ] Privacy policy (short, honest, accurate to your local-first claim)
- [ ] Terms of service (basic version is fine)
- [ ] Cookie banner: NOT NEEDED if you use no cookies and Cloudflare
  Web Analytics (cookieless). Lean into this. Add a small footer
  line: "We don't use cookies."
- [ ] Contact email or form
- [ ] GDPR-compliant if you have EU traffic (you do)
- [ ] No third-party tracking (no Google Analytics, no Facebook Pixel,
  no LinkedIn Insight Tag — these break the wedge)

## Infrastructure

- [ ] Domain registered on Cloudflare Registrar
- [ ] GitHub repo created
- [ ] Cloudflare Pages connected to GitHub
- [ ] `main` branch protected, requires PR
- [ ] Custom domain assigned in Cloudflare Pages
- [ ] SSL certificate auto-provisioned (Cloudflare does this)
- [ ] DNS records correct (A/AAAA via Cloudflare proxy)
- [ ] WWW redirect set up (www.convertyard.com → convertyard.com)
- [ ] Cloudflare Email Routing for hello@convertyard.com
- [ ] Cloudflare account has 2FA enabled
- [ ] GitHub account has 2FA enabled

## Monitoring & analytics

- [ ] Cloudflare Web Analytics installed
- [ ] Uptime monitoring (UptimeRobot or BetterStack free tier)
- [ ] Error monitoring (optional: Sentry free tier, but only if you
  can scrub user data — easiest is to skip and read logs manually
  early on)
- [ ] Search Console connected to property
- [ ] Bing Webmaster Tools connected

## Pre-launch trust building

- [ ] Privacy policy mentions WebAssembly and local processing explicitly
- [ ] About page tells the founding story (even if it's just "we got
  tired of uploading PDFs")
- [ ] Footer line: "Files processed locally in your browser. We never
  see them."
- [ ] Trust strip on homepage (Nothing uploads / Built for batches /
  No accounts)
- [ ] Comparison table on homepage
- [ ] How it works section with WebAssembly explanation
- [ ] FAQ addresses "is this really free" and "how does it work"

## Content checks

- [ ] No mentions of "Photoshop" anywhere
- [ ] No mentions of named competitors (iLovePDF, Convertio, etc.)
- [ ] Tagline appears in: nav (subtle), hero, OG image, footer, meta
- [ ] Copy is consistent voice across pages
- [ ] No placeholder Lorem ipsum left anywhere (search the repo for
  "lorem" before deploy)
- [ ] All "coming soon" tools clearly labeled, not linked yet
- [ ] All articles have last-updated dates

## Tool quality gates (per tool, before homepage promotion)

- [ ] Converts 1 file correctly
- [ ] Converts 10 files correctly
- [ ] Converts 100 files without crashing
- [ ] Converts 1000 files (may be slow, but should complete)
- [ ] Shows accurate progress per file
- [ ] Handles invalid files gracefully (clear error message)
- [ ] FAQ has 4-8 entries with FAQ schema
- [ ] Related tools strip populated
- [ ] At least 3 supporting articles drafted
- [ ] Mobile tested at 375px
- [ ] Lighthouse score >90 on all metrics

## Post-launch (first 30 days)

- [ ] Daily: check Search Console for crawl errors
- [ ] Daily: check uptime monitor
- [ ] Weekly: review which tools get most traffic vs. expected
- [ ] Weekly: review Search Console queries — what people search for
  that brings them to the site
- [ ] Weekly: ship 1-2 new tools, 3-5 new articles
- [ ] Month 1: write a "1 month in" blog post (good for backlinks)
- [ ] Month 2: review which articles drive most traffic, double down

## Pre-Product-Hunt-launch (before month 3-4)

- [ ] 15+ tools live, all working
- [ ] Homepage polished and fast
- [ ] Mobile experience flawless
- [ ] OG image for homepage looks great when shared
- [ ] Demo GIF prepared (showing batch conversion happening offline)
- [ ] Launch description drafted
- [ ] Maker comment drafted
- [ ] 20+ people in network notified to expect launch day
- [ ] Tuesday-Thursday launch date picked, 12:01am PT
- [ ] Backup plans for traffic spike (Cloudflare handles it but verify
  no rate limits on Pages)

## Things to absolutely never do

- [ ] Don't upload user files to a server for "convenience"
- [ ] Don't add a signup wall before download
- [ ] Don't add ads inside tool UI
- [ ] Don't use the word "Photoshop" anywhere
- [ ] Don't reproduce copyrighted character names, song lyrics, or
  named celebrities in marketing copy or sample images
- [ ] Don't build YouTube/social media downloaders (legal risk)
- [ ] Don't fake-launch on Product Hunt before the site is ready
