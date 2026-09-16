# Backlinko Digital PR Strategies — ConvertYard Action Plan

**Source:** https://backlinko.com/digital-pr-strategies
**Article:** "6 Digital PR Strategies to Boost AI Visibility" (Backlinko)
**Core premise:** 84% of AI citations come from earned media (Muck Rack). LLMs recommend brands they see repeatedly across trusted third-party sources. On-site SEO is table stakes; off-site presence is what makes ChatGPT / Gemini / Perplexity name-drop you.
**Applied to:** ConvertYard — local-first, browser-based, batch file conversion (images, PDF, video/audio, developer tools). Differentiators: no uploads, WASM, batch of 1000+, privacy-first, ad-free flow.

---

## Why this matters for ConvertYard specifically

When a user asks "best way to batch convert HEIC to JPG on Windows" or "convert JPG to WebP without uploading," we want ChatGPT/Perplexity/Gemini to name **ConvertYard**. That only happens if our brand shows up across the sources those models trust: Reddit, tool listicles, HN, GitHub gists, dev blogs, photography blogs, PDF/paperless-office blogs, and comparison pages.

Current state (from repo): heavy outreach work already underway — pitches drafted in `SEO/pitches/`, target lists in Excel. This plan slots those efforts into a coherent, prioritized framework.

---

## The 6 strategies, mapped to ConvertYard

### Strategy 1 — Data-Led PR
**Backlinko's version:** Publish original research or statistical roundups; pitch to journalists/bloggers looking for fresh data.

**ConvertYard application:**
- **Original research angles we can uniquely own (nobody else has this data):**
  - "State of Browser-Based File Conversion 2026" — benchmark WASM converters (libvips, ffmpeg.wasm, mupdf-wasm) on real files: speed, memory ceiling, output quality vs. server tools like CloudConvert.
  - "How much bandwidth do file converters waste?" — measure MB uploaded/downloaded by top 10 cloud converters vs. zero for local-first tools. Translate to $ / CO2 / battery.
  - "HEIC in the wild" — sample N public web pages, count HEIC vs. JPG vs. WebP vs. AVIF adoption over time.
  - "PDF bloat report" — analyze N government/enterprise PDFs; average compressible size vs. actual size.
  - "AVIF/WebP browser support & real-world usage" quarterly refresh.
- **Publishing format:** dedicated `/research/{slug}` pages with clean charts, downloadable CSV, embed-friendly images, canonical stat callouts (great for AI-citation snippets).
- **Distribution:**
  - Pitch to Search Engine Journal, Smashing Mag, CSS-Tricks, KeyCDN, ImageKit, Web.dev community, PDF Association blog.
  - Reach out to authors of existing stat roundups (e.g. web performance stats posts) offering our fresher numbers.
  - Post as a Show HN + write-up on r/webdev, r/photography, r/pdf.
- **Cadence:** 1 flagship study per quarter; 1 stat refresh per month.

### Strategy 2 — AI Citation Outreach
**Backlinko's version:** Find the specific pages LLMs already cite for target prompts. Get listed / mentioned on them.

**ConvertYard application:**
1. **Prompt-mining** — build a spreadsheet of ~100 prompts a ConvertYard user would ask an LLM:
   - "best free HEIC to JPG converter that doesn't upload"
   - "how to batch convert 500 images to WebP"
   - "compress PDF locally without a server"
   - "convert MOV to MP4 in browser"
   - Seed from: Search Console long-tail queries; People Also Ask; Reddit search; sales/support tickets.
2. **Cited-page mapping** — run each prompt through ChatGPT (search on), Perplexity, Gemini, Claude. Log the URLs each cites. Group by domain.
3. **Prioritize** the domains that show up ≥3 times — these are the "AI-canonical" pages for our space. Likely candidates: G2 alternatives pages, AlternativeTo, Slant, Tom's Guide, PCMag roundups, GitHub awesome-lists, tool comparison blogs.
4. **Outreach** — pitch each cited page's author to add ConvertYard, with:
   - a ready-to-paste one-line blurb ("ConvertYard — local-first batch converter that keeps files in your browser via WebAssembly. Free, no signup, 1000+ files at once."),
   - a screenshot, a direct link, offer a reciprocal mention.
5. **Track** — re-query the same prompts monthly to see whether citations start including us.

**This is likely the single highest-ROI activity for AI visibility.** Do it first.

### Strategy 3 — Reactive PR
**Backlinko's version:** Be first to publish on breaking news → LLMs must go to the web → they cite the early sources.

**ConvertYard application:**
- **Triggers to monitor:**
  - Apple / Google / Adobe changes to image or video codecs (HEIC/HEVC/AVIF/JPEG XL support flips).
  - iOS/macOS/Windows updates that change default photo formats.
  - Browser releases that ship WebCodecs, AVIF encode, WASM SIMD improvements, File System Access API changes.
  - New WASM ports of ffmpeg/libvips.
  - AI image format announcements (e.g., new lossy formats from Google/Meta).
  - Data breaches at cloud converters (huge trust angle for us — "here's why local-first matters").
- **Monitoring setup:** RSS via Feedly for Chrome Platform Status, Apple Developer News, Mozilla Hacks, WebKit blog, Cloudinary blog; Reddit r/webdev + r/photography saved searches; Google Alerts for "HEIC", "AVIF", "WebP", "PDF/A", "ffmpeg.wasm"; Qwoted/Featured/HARO for journalist requests.
- **Response format:** short (600–900 word) explainer on our `/blog/` within 24–48h of the trigger, with a tool link above the fold + JSON-LD `Article` schema. Also post to Hacker News and the relevant subreddit.
- **Owner:** 2 hours/week reserved on the calendar for this. Batch to Mon+Thu triage.

### Strategy 4 — Ego Bait
**Backlinko's version:** Feature experts/influencers → they share/link back.

**ConvertYard application:**
- **"Top 20 image-optimization voices to follow in 2026"** — feature Addy Osmani, Jake Archibald, Estelle Weyl, Jen Simmons, Colin Bendell, Kornel Lesiński (mozjpeg/libimagequant), Jon Sneyers (JPEG XL), Matt Hobbs, etc. Notify each; hand them a shareable OG image with their face.
- **"12 best PDF/paperless-office bloggers"** — feature Lawyerist, PaperlessMovement, PDF Association contributors, etc. (We already have some of these in our outreach lists.)
- **"Video creators who ship at web scale"** — feature devs behind ffmpeg, Handbrake, shaka-packager.
- **Expert-quote roundups** — pick a topic ("Is JPEG XL dead?", "When should you use AVIF over WebP?"), collect 60-word quotes from 8–12 practitioners, publish as one canonical resource. High link magnet + high LLM citation potential (LLMs love structured "expert says X" content).
- **Format for AI citations:** always structure as ordered list with `<h3>` per person + `Person` schema. That's what shows up in AI Overviews.

### Strategy 5 — Thought Leadership
**Backlinko's version:** Build a recognizable voice, not just ranking content.

**ConvertYard application:**
- **Founder/brand voice on:** LinkedIn (primary — devs and product people are here), X, and a personal-brand column on ConvertYard's own blog.
- **Signature POVs to own (say them loudly, repeatedly):**
  - "The server never needs to see your files. Cloud converters are a legacy of pre-WASM constraints."
  - "Batch is the product, not a feature."
  - "The best converter is the one you never have to sign up for."
  - Real numbers to back each: bandwidth saved, time saved, privacy incidents avoided.
- **Content cadence:** 2 LinkedIn posts/week (short, opinionated, screenshot-forward), 1 longer essay/month on the blog. Cross-post the essay to dev.to and Medium for AI-training corpus reach.
- **Speaking / podcasts:** pitch 1 podcast/month — Syntax.fm, ShopTalk, Frontend Happy Hour, Smashing Podcast, PDF Association podcast, JAMstack Radio.

### Strategy 6 — Community Building
**Backlinko's version:** Contribute meaningfully on Reddit/Quora/Slack/Discord. LLMs scrape these heavily.

**ConvertYard application:**
- **Priority subreddits:** r/webdev, r/photography, r/DigitalPhotoDatabases, r/pdf, r/paperless, r/sysadmin, r/MacOS, r/iOSProgramming, r/videography, r/DataHoarder, r/selfhosted.
- **Rules of engagement (per Backlinko + Reddit reality):**
  - Answer 3–5 relevant questions/week per person.
  - Only mention ConvertYard when it *genuinely* answers the OP's question. Otherwise just be helpful.
  - Always disclose ("I run ConvertYard, but honestly for this use case I'd suggest…").
  - Build karma for 4–6 weeks before mentioning the brand at all.
  - See existing `SEO/pitches/hn-karma-strategy.md` — same principle applies here.
- **Quora:** answer high-volume questions like "How do I convert HEIC to JPG on Windows without uploading?" — Quora answers surface heavily in ChatGPT citations.
- **Discord/Slack:** join Frontend Horse, Reactiflux, PDF Association Slack, image-processing focused communities.
- **AMAs:** schedule one in r/webdev and r/photography once we have a strong story (e.g., after publishing a research report).
- **GitHub presence:** open-source small utilities that share code with the main product (e.g., a WASM-benchmark harness, a ffmpeg.wasm cheatsheet). Star magnets → LLM training signal.

---

## 90-day sequencing (what to actually do first)

**Weeks 1–2 (foundation)**
- Set up prompt-mining spreadsheet (Strategy 2, step 1). Log 100 prompts.
- Query all 4 major LLMs for each prompt; log cited URLs. This is the master target list.
- Set up reactive-PR monitoring (Strategy 3): Feedly, Google Alerts, Reddit saved searches, Qwoted/Featured accounts.

**Weeks 3–6 (fastest wins)**
- Execute AI Citation Outreach (Strategy 2) on the top 30 domains from step 2. Target: 5 additions/week.
- Publish first ego-bait roundup ("Top image-optimization voices" or similar). Notify every person featured.
- Start Reddit karma-building on 3 priority subs. No brand mentions yet.

**Weeks 7–12 (compounding)**
- Ship first data-led research piece (Strategy 1) — "State of Browser-Based File Conversion 2026" is the most defensible. Distribute widely.
- Begin thought-leadership cadence on LinkedIn (2 posts/week).
- Continue AI citation outreach; re-query the master prompt list to measure lift.
- File first 2 podcast pitches.

---

## Measurement

Track weekly in a single sheet:
- **AI citations gained** — count of prompts (from master list) where ConvertYard now appears in ChatGPT/Perplexity/Gemini/Claude answers. This is the north-star metric.
- **Referring domains** — new/unique root domains linking to us (Ahrefs / free alternative).
- **Brand mentions** (unlinked) — Google Alerts + `"convertyard"` on Reddit/HN/X.
- **Outreach conversion rate** — sent → replied → placed.
- **Reddit karma & AMA reach** (per priority sub).
- **Research piece performance** — referring domains + AI citations per study.

---

## Overlap with work already in flight

- `SEO/pitches/*.md` — most of these are Strategy 2 (AI Citation Outreach) or Strategy 4 (Ego Bait). Categorize each pitch by strategy so we know what's under- vs. over-invested.
- `SEO/pitches/hn-karma-strategy.md` — this is Strategy 6, Reddit variant. Extend the same doc to cover r/webdev, r/photography, r/pdf.
- Existing outreach spreadsheets — merge into the "cited-domain" master list from Strategy 2 so we prioritize domains that already show up in AI answers over cold prospects.

---

## What NOT to do (respecting CLAUDE.md guardrails)

- No AI-generated pitch spam. Every outreach email must have a human editing pass; Backlinko specifically warns pitch quality is what wins.
- No fake data. Original research must be reproducible — publish the raw dataset alongside the study.
- No "sign up to download the report" — same anti-dark-pattern rule that applies to tools applies here.
- Don't say "Photoshop." Don't imply we do editing.
- Don't chase every trending story; only the ones where local-first / WASM / batch is genuinely the angle.
