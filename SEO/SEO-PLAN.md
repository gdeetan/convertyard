# ConvertYard SEO Plan

**Site:** convertyard.com  
**Status:** Brand new domain (~0 referring domains)  
**Tools deployed:** 93 tools across 7 clusters  
**Resources:** Solo founder, ~3 hrs/week  
**Goal:** Build domain authority through backlinks and outreach

---

## The Strategy in One Sentence

Directories first (Month 1) → Community posts (Month 2) → Niche blog outreach (Month 3+).

Each phase unlocks the next. Directories give you the referring domain count that makes community posts
credible. Community posts drive real traffic that makes blog outreach land.

---

## Phase 1 — Technical Foundation (Week 1, ~2 hrs)

Do this before anything else. These are free and take minutes each.

### 1.1 Search Console Setup
- [ ] Go to [search.google.com/search-console](https://search.google.com/search-console)
- [ ] Add property: `https://convertyard.com`
- [ ] Verify via DNS TXT record (Cloudflare DNS → add the TXT record Google gives you)
- [ ] Submit sitemap: `https://convertyard.com/sitemap.xml`

### 1.2 Bing Webmaster Tools
- [ ] Go to [bing.com/webmasters](https://www.bing.com/webmasters)
- [ ] Import from Google Search Console (one-click after GSC is set up)

### 1.3 Verify Technical Health
- [ ] Confirm `https://convertyard.com/robots.txt` is live and correct
- [ ] Confirm `https://convertyard.com/sitemap.xml` is live and lists all 93 tool pages
- [ ] Run top 5 tool pages through [PageSpeed Insights](https://pagespeed.web.dev/) — target LCP < 2.5s
- [ ] Test structured data at [Rich Results Test](https://search.google.com/test/rich-results) on 2-3 tool pages

### 1.4 Baseline Tracking Setup
- [ ] Note today's referring domain count in Ahrefs free (ahrefs.com/backlink-checker) or Ubersuggest
- [ ] Screenshot GSC impressions baseline (will be 0 for first few weeks — that's normal)

---

## Phase 2 — Directory Submissions (Month 1, ~3 hrs total)

**Why directories?** Each submission = 1 referring domain. Go from 0 → 30+ fast. Editors don't gatekeep.
No email required. Most are free.

Work through Tier 1 first. These have the most domain authority and will move your DA the fastest.

### Tier 1 — Highest Priority (~1.5 hrs, do these in Week 2)

| Site | URL | Action | Notes |
|------|-----|--------|-------|
| Product Hunt | producthunt.com | Full launch | Schedule Tue–Thu 12:01am PST. Prep hunter, tagline, screenshots, first comment. |
| AlternativeTo | alternativeto.net | Add product | List as alternative to: iLovePDF, Smallpdf, CloudConvert, Adobe Acrobat |
| G2 | g2.com | Free listing | Category: "File Conversion" or "PDF Software" |
| Capterra | capterra.com | Free listing | Category: "PDF Software", "File Conversion" |
| SaaSHub | saashub.com | Submit profile | Will auto-track alternatives and link back |
| Slant | slant.co | Add + answer | Find threads like "best PDF tools", "best free image converters" |
| Futurepedia | futurepedia.io | Submit | AI tools section for alt-text-generator, background-remover |
| There's An AI For That | theresanaiforthat.com | Submit | AI tools: alt-text, OCR, handwriting-to-text |
| Toolify.ai | toolify.ai | Submit | AI tool directory with traffic |

### Tier 2 — Launch Directories (~1 hr, do these in Week 3)

| Site | URL | Notes |
|------|-----|-------|
| BetaList | betalist.com | Early-stage startup, shows up in newsletters |
| Uneed.app | uneed.app | Daily tool launches, active community |
| Microlaunch | microlaunch.net | Micro SaaS and tools focus |
| MakerLaunch | makerlaunch.com | Product launches |
| Launching Next | launchingnext.com | Startup directory |
| Startup Buffer | startupbuffer.com | Free listing |
| StartupStash | startupstash.com | Curated startup resource directory |
| Indie Hackers | indiehackers.com | Create product page + write an intro post |
| Fazier | fazier.com | Daily product launches |

### Tier 3 — Niche Tool Directories (~30 min, do these in Week 4)

| Site | URL | Notes |
|------|-----|-------|
| ToolHunt | toolhunt.net | Productivity tools |
| Free.technology | free.technology | Free web tools specifically |
| 10words.io | 10words.io | Describe ConvertYard in 10 words |
| MadeWithNext.js | madewith.nextjs.org | Next.js showcase — ConvertYard qualifies |
| AI Tool Hunt | aitoolhunt.com | AI tools directory |
| Toool.io | toool.io | Online tools directory |
| SaaSworthy | saasworthy.com | SaaS discovery site |
| GetApp | getapp.com | G2/Capterra competitor, free listing |
| SourceForge | sourceforge.net | Legacy but high DA, free listing |

---

## Phase 3 — Community Posts (Month 2, ~6 hrs total)

**Why wait until Month 2?** Credibility. After 15+ referring domains and 60+ days live, your site
looks real when people Google it after seeing your post. Before that, you get ignored or flagged as spam.

### 3.1 Hacker News Show HN (~1 hr)

- **Title:** `Show HN: ConvertYard – batch file conversion that never uploads your files`
- **Post on:** Tuesday–Thursday, 9am EST
- **First comment** (post immediately after submitting):
  > "Built this because I kept reaching for iLovePDF and then remembered it uploads everything.
  > ConvertYard runs entirely in the browser via WebAssembly — ffmpeg.wasm for video, mupdf for PDF,
  > libvips for images. Supports batch up to 1,000 files. Curious what the HN crowd thinks about
  > browser-based WASM tools for file processing."
- **Angle:** The technical implementation (WASM) is what HN cares about. Lead with that.

### 3.2 Reddit (~2 hrs across 2 weeks)

Post genuinely — answer a question or share something useful, not a bare link drop.

| Subreddit | Tool(s) to share | Post angle |
|-----------|-----------------|------------|
| r/webdev | json-formatter, jwt-decoder, diff-checker | "I built some dev tools that run offline — JSON formatter, JWT decoder, diff checker" |
| r/privacy | All tools | "Alternative to iLovePDF/Smallpdf that doesn't upload your files" |
| r/selfhosted | All tools | "Browser-based file converter — no server, no uploads, open to inspection" |
| r/productivity | merge-pdf, compress-pdf, screenshot-to-text | "Free PDF tools that work offline in your browser" |
| r/photography | heic-to-jpg, compress-image, jpg-to-webp | "Batch convert HEIC to JPG without uploading to a cloud service" |
| r/legaladvice | redact-pdf, protect-pdf | Add to the subreddit wiki under resources if possible |
| r/notetaking | screenshot-to-text, handwriting-to-text | "Extract text from screenshots in your browser — no upload" |
| r/datahoarder | All | "Batch file converter — 1000 files at a time, runs offline" |

**Rules to avoid getting removed:**
- Read each subreddit's rules before posting
- Don't post the same message in multiple subreddits on the same day
- Add genuine value: answer existing questions, don't just drop a link

### 3.3 Dev.to Technical Article (~2 hrs)

Write a genuine technical article:  
**Title:** "How we run FFmpeg in the browser with WebAssembly (and why it changes everything for privacy)"

- Explain the technical architecture: ffmpeg.wasm, SharedArrayBuffer, COOP/COEP headers
- Link to ConvertYard as the product this powers
- Dev.to articles get indexed fast and often rank for "ffmpeg wasm" type queries

### 3.4 Other Communities (~1 hr)

| Platform | Action |
|----------|--------|
| Lobste.rs | Share the Dev.to article (tech-savvy audience, privacy angle lands well) |
| Hashnode | Cross-post the technical article |
| Indie Hackers | Milestone post: "Launched ConvertYard — first 100 users, here's what I learned" |
| Twitter/X | Use #buildinpublic, tag @ProductHunt on launch day, share milestone posts |

---

## Phase 4 — Niche Blog Outreach (Month 3+)

### 4.1 Readiness Checklist

Do NOT start Approach B until these are true:
- [ ] 30+ referring domains (check Ahrefs free or GSC)
- [ ] GSC showing > 500 impressions/month
- [ ] Site has been live 60+ days
- [ ] All tool pages are polished on mobile

### 4.2 Email Template

Keep it short. Editors and bloggers get dozens of pitches. Three sentences max.

```
Subject: Quick question about your "[their article title]" piece

Hi [Name],

I came across your article on [specific topic] — great breakdown of [something specific they said].

I run ConvertYard, a free [PDF/image/dev] tool. Unlike most converters, everything runs in
the browser — files never touch a server, which your readers might appreciate.

Would it be worth adding as a resource? Happy to answer any questions.

[Your name]
```

**What NOT to do:**
- Don't ask for a guest post in the first email
- Don't mention DA, traffic, or rankings
- Don't use a template that looks like a template
- Don't follow up more than once

### 4.3 Outreach Targets by Cluster

See `outreach-targets.xlsx` for the full 150+ target list with contact methods.
Summary by cluster:

**PDF Tools** → Legal blogs (Law Technology Today, LexBlog), productivity (How-To Geek, MakeUseOf,
Zapier Blog), business (HubSpot Blog, Small Business Trends)

**Image Tools** → Photography (PetaPixel, Fstoppers), Apple/iPhone (iMore, 9to5Mac for HEIC),
design (Smashing Magazine, Web Designer Depot, Creative Bloq)

**Developer Tools** → Dev blogs (CSS-Tricks, DZone, SitePoint), newsletters (JavaScript Weekly,
CSS Weekly, TLDR Tech, Bytes.dev), podcasts (Syntax.fm, The Changelog)

**OCR / Image-to-Text** → Productivity (Lifehacker, Zapier Blog, Thomas Frank), note-taking
communities (r/Notion, Obsidian forums, r/notetaking)

**Video & Audio** → Creator tools (TechSmith Blog, Kapwing Blog, Wistia Blog), r/videography

**AI Tools** → AI newsletters (Ben's Bites, The Rundown AI, TLDR AI), editorial placement at
Futurepedia and AI Tool Hunt beyond the directory listing

### 4.4 Cadence for Approach B

- 10–15 outreach emails per week (1.5 hrs)
- Track in the `outreach-targets.xlsx` — mark status per row
- Expected response rate: 10–15%. That's 10–15 links per 100 emails.
- At 10/week, you'll have sent 120 emails by end of Month 4 → ~15 new links

---

## Phase 5 — Link-Earning Content Assets (Month 2–3, parallel)

These articles attract links passively — once published and indexed, bloggers link to them
when writing about adjacent topics.

### Already Published — Promote These Actively

| Article | Why It Earns Links |
|---------|--------------------|
| `how-browser-based-file-conversion-works` | Technical explainer, share on HN + Dev.to |
| `convertyard-vs-ilovepdf` | Comparison content, capture navigational searches |
| `what-is-heic` | Definitional content, HEIC articles get linked from photography blogs |
| `compress-pdf-without-uploading-privacy-guide` | Privacy angle attracts links from privacy communities |

### To Write (High Link Potential)

| Article Idea | Target Linkers |
|-------------|----------------|
| "Best free PDF tools that don't upload your files" | Privacy blogs, productivity roundups |
| "Can you open HEIC files in Windows?" | iMore, 9to5Mac, How-To Geek equivalents |
| "JSON formatter comparison: which online tool is safest?" | Dev bloggers, security-focused writers |
| "How to batch convert images without Photoshop" | Photography blogs, design tool roundups |
| "Free alternatives to Adobe Acrobat" | Business productivity sites, listicle writers |

---

## Phase 6 — Ongoing (Month 3+, ~3 hrs/week)

### Weekly Routine (3 hrs)
- **1.5 hrs** — Outreach emails (10–15/week)
- **0.5 hrs** — GSC check: new queries showing up? Any pages with impressions but no clicks?
- **0.5 hrs** — HARO / Source of Sources: respond to journalist queries where ConvertYard is relevant
- **0.5 hrs** — Monitor for brand mentions (Google Alerts for "ConvertYard") — turn unlinked mentions into links

### HARO / Journalist Sources
- Sign up at [Help a Reporter Out](https://www.helpareporter.com/) (free)
- Sign up at [Source of Sources](https://www.sourceofsources.com/) (Substack, free)
- Answer queries about: file privacy, browser-based tools, PDF software, image formats, WASM

---

## Tracking & Milestones

Track monthly in a spreadsheet (or add a tab to `outreach-targets.xlsx`):

| Metric | Where to check | Month 1 target | Month 3 target | Month 6 target |
|--------|---------------|----------------|----------------|----------------|
| Referring domains | Ahrefs free / GSC | 15+ | 50+ | 100+ |
| Organic impressions | Google Search Console | 500+ | 5,000+ | 25,000+ |
| Organic clicks | Google Search Console | 50+ | 500+ | 3,000+ |
| Outreach emails sent | outreach-targets.xlsx | — | 120+ | 300+ |
| Links earned | Ahrefs / manual | — | 15+ | 40+ |

---

## Quick Reference — Priority Order

1. **This week:** Set up GSC + Bing Webmaster Tools, submit sitemap
2. **Week 2–3:** Tier 1 + Tier 2 directory submissions (~2.5 hrs)
3. **Week 4:** Tier 3 directories, write one linkable article
4. **Month 2:** Show HN, Reddit posts, Dev.to article
5. **Month 3:** Start 10–15 outreach emails/week, sign up for HARO
6. **Ongoing:** Weekly routine above, track monthly
