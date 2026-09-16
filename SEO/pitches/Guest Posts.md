Guest Post Targets

#Search Engine Journal

Submitted via: https://www.searchenginejournal.com/contact/
Subject: Ad-hoc pitch: The AVIF adoption gap in small-business SEO

Hi SEJ editorial team,

I read your contributor guidelines and understand new contributors are invited by the editorial team only. I'm not pitching to be added to the roster — I'm asking for consideration of a single ad-hoc slot for one specific article that fills a real gap in your current image SEO coverage.

Proposed title: The AVIF Adoption Gap — Why 60% of Small-Business Sites Still Fail Lighthouse's "Serve Images in Next-Gen Formats" Audit in 2026

Proposed title: The AVIF Adoption Gap — Why 60% of Small-Business Sites Still Fail Lighthouse's "Serve Images in Next-Gen Formats" Audit in 2026

Why this article, and why now:

WordPress 6.5 added native AVIF support in early 2024. Every major browser ships AVIF today. Lighthouse has flagged "next-gen formats" as an audit issue since 2019, and AVIF is now what Cloudflare, Netflix, and Google Search all serve for image delivery.

But the small-business SEO market — SEJ's exact audience — is still overwhelmingly stuck on JPEG and PNG. When I audit client sites for CWV issues, this is the most common LCP-adjacent failure I see, and often the single easiest technical SEO win available. Your current image SEO coverage skips this format transition almost entirely, and no major SEO publication has a definitive 2026 piece on it yet.

What the article would cover (~1,800 words):

1. Why AVIF isn't just "another format" — the LCP math on real product page test cases, with before/after numbers from three anonymized client audits, including one case where AVIF alone moved LCP from 3.1s to 1.7s
2. Why adoption stalled: encoder maturity, WordPress version fragmentation, plugin gaps, and the persistent misconception that browser support isn't ready
3. A decision tree — when to use AVIF vs WebP vs stay on JPEG, with the browser/format edge cases small business sites actually hit in practice
4. Four implementation paths at different technical levels: plugin-based, CDN-based (Cloudflare Polish, BunnyCDN Optimizer), server-side conversion, and pre-upload conversion via browser-based WASM tooling
5. What to watch for in Lighthouse and PageSpeed Insights after the switch, including common false-positive audit errors that trip readers up

About me:

I run ConvertYard (https://convertyard.com), a network of client-side WebAssembly file conversion tools. Our image compressor handles AVIF encoding via libvips in the browser, so I've spent 18 months in the AVIF ecosystem: encoder trade-offs, quality-vs-size curves, browser rendering quirks, WordPress compatibility edge cases. I've written internally about these trade-offs but never syndicated any of it, so nothing here would fail your Copyscape check.

On format:

I read your no-AI-content rule and want to be direct: the article would be written by me, from my own audit data and reading of the actual specs — no LLM drafting. Happy to demonstrate that however works on your end, whether a sample chapter, an expanded outline, or a short call.

On cadence:

Not asking to be a regular contributor. One-shot pitch. If it lands and there's editorial interest in future pieces, I'd be open to a quarterly slot — but that's a bridge to cross later.

Thanks,
Garrick Dee Tan
ConvertYard

#Smashing Magazine

Subject: Article pitch: HEIC in the Browser — What Just Became Possible

Hi Smashing team,

Pitching a technical article for consideration. Details below in your preferred format.

Proposed title: HEIC in the Browser: What Just Became Possible (and Why It Matters for Web Apps)

Target audience: Intermediate to advanced front-end developers building web apps that accept user photo uploads, image-heavy PWAs, or client-side media tools. Assumes familiarity with WASM basics, Web Workers, and the Canvas API.

Reader takeaway: A definitive 2026 reference on where HEIC support actually stands across browsers, how to feature-detect correctly, how to polyfill in Chrome/Firefox with libheif-js, and a production-ready graceful-degradation pattern for upload flows. The reader leaves able to accept HEIC uploads in a real app by end of day.

Why me: I run ConvertYard (https://convertyard.com), a network of client-side WASM-based file conversion tools. Our image compressor uses libvips-wasm for encoding and libheif-js for HEIC decoding, so I've spent 18 months in the exact edge cases this article covers — Safari version behavior differences, worker memory limits on iPhone photos, encoder trade-offs. Nothing in the piece has been published elsewhere and it would fail no plagiarism check.

Outline (~1,600–1,900 words, code samples inline):

Introduction: The HEIC problem developers still think they have

Most front-end devs still believe HEIC can't be displayed in the browser and route around it entirely. That was true in 2020. It's not true in 2026. This section frames the state change: Safari 17+ decodes HEIC natively in <img>, iOS cameras still produce it by default, and yet 90% of web apps reject the format at upload. The gap between what's supported and what developers assume is why this article exists.

What each browser actually does with HEIC today

A concrete browser-by-browser matrix: Safari (native since 17), Chrome (no native, WASM required), Firefox (no native, WASM required), Edge (follows Chromium). Covers what happens with <img src="photo.heic"> in each engine, why (libheif licensing, patent history), and what changes are coming based on public Blink and Gecko discussions.

Feature-detecting HEIC support the right way

The naive way (User-Agent sniffing) is wrong. The right way is a small canvas-based decode test. Code sample: an async function that returns true for Safari 17+ and false elsewhere without false positives. Includes the gotcha where Safari on macOS behaves differently from Safari on iOS for the same version.

Polyfilling with libheif-js in browsers that need it

Walkthrough of loading libheif-js (~600KB WASM decoder), decoding a HEIC file to a Uint8Array, rendering into a canvas. Covers memory management for large iPhone photos, decoding off the main thread with a Web Worker, and the two-stage approach: cheap header parse first, full decode only when needed.

Production pattern: graceful degradation for upload flows

End-to-end pattern for a web app accepting user photo uploads: detect capability, decode-and-reencode where needed, fall back to server-side conversion only when the browser can't handle it. Real-world numbers on payload savings and latency.

Happy to adjust scope, depth, or angle if any of this reads off. Cadence-wise this is a one-shot pitch, not an ongoing contributor ask.

Thanks,
Garrick Dee Tan
ConvertYard

#FStoppers (Probably looking for Photographer Writers)

- URL: https://fstoppers.com/originals/how-pitch-article-600996
- Traffic: ~800,000 monthly unique visitors — massive
- Payment: None, but referral traffic is real (10k+ clicks per average post)
- Format: Full complete blog post + images (≥710px wide), under 3,000 words
- Submit via: Contact page (dedicated pitch link)
- Difficulty: LOW-MEDIUM (they publish tons of guest content)
- Fit for you: Photographers dealing with HEIC files, product photography workflows, batch processing tens of shoots — direct match
- Suggested topic: "How to Batch Convert an Entire Wedding Shoot from HEIC Without Uploading a Single File" — a workflow piece framed around client privacy

#Digital Photography School (DPS)

- URL: https://digital-photography-school.com/
- DR: 82 | huge photography audience (hobbyist + prosumer)
- Contributor program: Real, features external photographers regularly
- Submit via: Contact form on the site
- Suggested topic: "The iPhone Photographer's Guide to HEIC: What It Is, Why Your Editing Software Rejects It, and Three Ways to Fix It"

#SLR Lounge

- Photography education + gear, accepts contributor content
- Smaller than DPS but engaged audience of working photographers
- Best for pieces on client workflow, deliverables, file management

# Practical Ecommerce

- URL: https://www.practicalecommerce.com/
- Audience: Merchants improving their online businesses
- Format: Expert commentary + how-to
- Contact: Reach via their contact form + reference existing contributor examples like Gagan Mehra
- Difficulty: MEDIUM — they want expert credentials
- Suggested topic: "The Product Photo Prep Checklist Every Merchant Should Run Before Uploading to Shopify/BigCommerce/Woo"

# Ecommerce Bytes

- Long-running e-commerce trade publication (mostly for eBay/Etsy/Amazon sellers)
- Smaller but engaged reseller audience
- Fits marketplace-seller angle

# Content Marketing Institute (CMI)

- URL: https://contentmarketinginstitute.com/cmi-guest-blogging-guidelines
- DR: 88 | Verified accepting guest contributions in 2026
- Payment: No cash, but they offer free Content Marketing World registration or Content Marketing University enrollment after 2 accepted posts (real value)
- Difficulty: HIGH — they favor pitchers who've built relationships (attended their events, engaged with editors on LinkedIn first)
- Suggested topic: "The Hidden Content Ops Cost of Poor Image Workflows (And How to Fix It Without Adding Another SaaS)"

#Marketing Insider Group (Michael Brenner's site)

- DR: 76 | actively accepts guest contributors
- Audience: B2B content marketers
- Angle: Content ops / creative workflow efficiency

#Speckyboy Design Magazine

- DR: 78 | design + web design audience
- Accepts contributor content via contact form
- Best for pieces framed around designer workflow (delivering assets to clients, format handling for handoffs)

#Envato Tuts+

- DR: 88 | design/photo/business tutorials
- Payment: Yes, they pay writers (rate varies by scope)
- Accepts pitches via their contribute page
- Best for how-to tutorials with a clear practical outcome

#LogRocket

Submitted via: https://blog.logrocket.com/become-a-logrocket-guest-author/ (click "Get Started" or use the form)
Subject: Guest author pitch: Building a fully client-side image processing pipeline with libvips-wasm

Proposed title: Building a Fully Client-Side Image Processing Pipeline with libvips-wasm

Unique angle / why this is different:
Front-end tutorials on image work almost always assume server-side processing (Cloudinary, Imgix, a Node backend) or use <canvas> alone. Very few walk through libvips in the browser, even though it's the same imaging library that powers Cloudflare Images, Netflix's thumbnail pipeline, and Squoosh. This post shows front-end devs how to run a production-grade image processing stack — compression, format conversion, batch handling — entirely in the browser using WebAssembly, with no server dependency at all. Sits alongside your recent "real time voice AI agent in the browser" piece as another "what's now possible in the browser that used to require a backend" story.

Reader takeaway:
By the end, the reader can wire libvips-wasm into a React app, offload work to a Web Worker so drag-and-drop stays responsive, handle memory for large source images, and encode to WebP/AVIF with quality controls — the full pipeline needed to ship a browser-based image tool.

Target audience:
Intermediate to advanced front-end devs (React, Vue, Svelte — the tutorial uses React but is framework-neutral). Familiarity with Promises, async/await, and Web Workers assumed. Not aimed at beginners.

Professional application:
Anyone shipping an app that accepts user photos (uploads, avatars, product images, PDF-to-image flows) can move the processing off the server. Concrete benefits: eliminates a whole backend service, removes an entire attack surface, avoids server egress bandwidth costs, works offline, keeps sensitive user files (medical, legal, financial) off third-party infrastructure. Directly relevant to teams thinking about SOC 2 scope reduction, GDPR data-processor mapping, or just cutting infra spend.

Bulleted outline (~2,500 words + working code):

- Why libvips-wasm now, and what it replaces — the state of browser imaging in 2026, why <canvas> isn't enough, and where libvips fits between raw WASM builds (like Squoosh's codecs) and full server frameworks
- Setting up libvips-wasm in a React project — install, initial bundle size analysis (~1.2MB gzipped), the ES module vs UMD split
- Moving the workload to a Web Worker — worker message contracts, OffscreenCanvas, why main-thread encoding blocks the drop UI even on M-series Macs
- Compressing and format-converting a batch — a full drag-and-drop → ZIP-download flow with progress reporting per file
- Handling memory correctly — WASM heap sizing, why iPhone photos crash naive implementations on Safari mobile, and the two-pass pattern (header parse first, full decode only when needed)
- Encoder trade-offs: WebP vs AVIF vs MozJPEG — quality settings map, encode-time-vs-file-size curves, and a decision tree for picking a default
- Progressive UX patterns — showing the first result within 150ms while the rest stream in, cancellation of in-flight work when the user drops a new batch
- What still requires a backend (and how to know when) — ML upscaling, non-libvips formats like JPEG XL animation, orchestrating GB-scale jobs

About me:
I built ConvertYard (https://convertyard.com), a network of client-side WASM file conversion tools using this exact stack in production. Every pattern in the tutorial is drawn from real user-facing edge cases we've hit — not synthetic examples. Article would be exclusive to LogRocket for the first month per your terms; after that I'd only republish on my own site with canonical pointing back.

Delivery:
Draft in Markdown, working demo repo on GitHub, all code samples runnable as-is. Cadence: this is a one-shot pitch, not a recurring contributor ask — but if it lands well I'd be open to more.

Thanks,
Garrick Dee Tan
ConvertYard
https://convertyard.com

---
Send strategy:
- LogRocket accepts pitches via a form on their guest author page — click the "Get Started" or contact link at the bottom of https://blog.logrocket.com/become-a-logrocket-guest-author/. If the form is broken, email editorial@logrocket.com with the pitch body.
- The 7-question format the page asks for is what I've structured this around — hitting each of their evaluation criteria directly increases acceptance rate significantly
- Their editor Matt Angelosanto has historically been the first responder for author pitches — reference to their recent "real time voice AI agent" post shows you've read the current content direction
- Response time: 1–3 weeks. If accepted, they'll ask for a first draft in ~3–4 weeks
- Cross-posting: republish on convertyard.com/blog after month one is up, with rel=canonical pointing to LogRocket if you want to preserve their SEO. That's the standard arrangement.
- The tutorial has ZERO product pitch — mentions ConvertYard only in the byline. This matches LogRocket's "not covering paid tools" rule and keeps editors comfortable.
- If they reject the WASM angle, pivot to their React/UX interests — "How to build a drag-and-drop file processor React component that doesn't lock the UI" is a smaller, more React-flavored version of the same underlying content.

# The New Stack

- URL: https://thenewstack.io/contributions/
- Submit to: contributors@thenewstack.io
- DR: 82 | 1-week response time (fast)
- Payment: None disclosed but strong distribution
- Critical constraint: They stopped publishing tutorials, framework walkthroughs, and "what is X" explainers. They want opinion, analysis, or reporting with a genuine point of view.
- Format flip: This means the pitch is completely different from Smashing/Codrops/LogRocket — no code samples, no tutorial. It's an argued piece.

Angle recommendation:

"The Client-Side Comeback: Why WebAssembly Is Quietly Rewriting the SaaS Economics of File Processing"

Reasoning:
- Fits their "opinion + analysis + reporting" format exactly
- Cloud-native audience will recognize the trend (Cloudflare Workers, edge compute, WASM-in-the-browser all pointing in the same direction)
- You have real numbers to argue from (bandwidth costs saved, SOC 2 scope reduction, privacy compliance side effects)
- Not a product pitch — it's a market analysis piece where ConvertYard is one data point among several (Squoosh, ffmpeg.wasm, Cloudflare Images, transformers.js, etc.)
- Different enough from Codrops (tutorial) and Smashing (technical explainer) that all three can coexist without stepping on each other

#CircleCI

Confirmed as of May 14, 2026 via CircleCI support — the guest writer program is active. The specific /blog/guest-writer-program/ URL redirects to their main blog, so the intake is via guestwriters@circleci.com directly.

Angle: I'll bridge ConvertYard's WASM stack to CircleCI's audience specifically. The piece has to help their users get more value from CircleCI — otherwise it won't land. Best fit is a testing/infrastructure angle where CircleCI is the star of the piece, not the sidekick.

To: guestwriters@circleci.com
Subject: Guest writer pitch: Testing WebAssembly Front-End Apps in CircleCI

Hi CircleCI team,

Pitching a technical tutorial for your Guest Writer Program. Reviewed the program details via your support article (May 2026) confirming it's active. Details below.

Proposed title: Testing WebAssembly-Heavy Front-End Apps in CircleCI: A Practical Guide

Why this article, why now:

WebAssembly has quietly moved from experimental to production-critical for a whole class of front-end apps — client-side image/video processing, in-browser ML inference (transformers.js), local-first databases (DuckDB-wasm), and format conversion tools. But CI testing for these apps is still a black hole. Most tutorials on WASM assume you're testing library correctness in isolation. Testing a full front-end app that ships WASM to real users — with the WASM modules loading, initializing, allocating heap memory, running in Web Workers, and interacting with the DOM — is a very different problem, and the CI patterns for it aren't documented anywhere in one place.

CircleCI is the natural home for this piece because the config primitives that make WASM CI testing tractable — resource classes for memory-hungry jobs, browser tools orb for headless Chromium with WASM enabled, parallelism for cross-browser WASM behavior — are all first-class in your platform. Most competing CI docs skip these use cases entirely.

Reader takeaway:

By the end, the reader can build a CircleCI pipeline that runs Playwright tests against a WASM-heavy front-end app across Chromium, Firefox, and WebKit; catches WASM memory regressions before they hit production; and produces artifacts (screenshots, network HARs, WASM heap snapshots) they can inspect when a test fails. Full example config + Playwright test suite in a public repo.

Target audience:

Intermediate CircleCI users (familiar with .circleci/config.yml, orbs, and workflows) who ship front-end apps with meaningful WASM components. Not a WASM introduction — assumes basic familiarity with what WASM is and why you'd use it.

Ties to CircleCI features directly:

- Resource classes — why WASM tests need medium+ or large (heap sizing), with real numbers on when the default fails
- Browser tools orb — spinning up Chromium/Firefox/WebKit with WASM SIMD and threads enabled
- Parallelism — sharding cross-browser WASM tests across parallel executors
- Artifacts — capturing WASM heap snapshots and browser HARs for post-mortem debug
- Caching — properly caching large WASM binaries (~1–2MB gzipped) across builds
- Contexts and secrets — running against production-grade sample assets without leaking them

Bulleted outline (~2,200 words + working demo repo):

- Why WASM breaks the default CI test setup — the specific ways Node's default 512MB heap, headless Chromium's WASM allocation, and the browser's cross-origin isolation requirements combine to make WASM tests flaky in vanilla CI
- Setting up a WASM-aware config in CircleCI — full annotated .circleci/config.yml for a WASM front-end app, showing resource class selection, browser tools orb, and env vars for cross-origin isolation
- Playwright test patterns for WASM apps — waiting for WASM ready state (not just DOM ready), asserting on Web Worker output, testing OffscreenCanvas rendering
- Cross-browser parallelism — running the same WASM test suite across Chromium, Firefox, and WebKit in parallel, and the specific bugs each browser exposes
- Catching memory regressions — a lightweight assertion pattern that fails the build when WASM heap growth crosses a threshold
- Artifact strategy for post-mortem debug — what to capture from a failing WASM test (heap snapshot, HAR, screenshot, console log) and how to structure them for fast triage
- What still doesn't work well — honest section on the current CI gaps for WASM: GPU tests, mobile Safari, WASM threads on Firefox CI. What to work around and what to skip.

About me:

I built ConvertYard (https://convertyard.com), a network of client-side WASM file conversion tools that ship libvips-wasm and libheif-js to real users. Every pattern in the tutorial comes from our production CI setup—nothing hypothetical. Article would be original and unpublished per your terms. Not a partner or company account — pitching as an individual contributor.

Delivery:

Draft in Markdown, with a working demo repo on GitHub and a runnable CircleCI config; all code samples testable as-is. One-shot pitch, not a recurring contributor ask — but open to more if this lands well.

Thanks,
Garrick Dee Tan
ConvertYard
https://convertyard.com

#Netlify blog

Details:
- URL: https://www.netlify.com/blog/
- Verified: Confirmed accepting (May 2026 published guest post from Conor Martin)
- Payment: None disclosed
- Contact: No public "write for us" — cold pitch to blog@netlify.com, or reach a DevRel contact on X/LinkedIn
- Fit: Strong — Jamstack + edge audience is the natural home for a "client-side WASM as an architecture pattern" argument
- Difficulty: MEDIUM (cold pitch, opaque process)

Suggested angle (different from Codrops/Smashing/CircleCI):

"Client-First Architecture: When to Push Work to the Browser Instead of Serverless Functions"

- Positioning piece, not a tutorial (Netlify already ships plenty of tutorials from staff)
- Argues that the Jamstack philosophy naturally extends to client-side processing for a class of workloads — image/video/PDF conversion, format transcoding, on-device search indexing
- Uses ConvertYard as one data point among several (Squoosh, transformers.js, DuckDB-wasm, PGlite)
- Fits Netlify's editorial voice — they publish opinion + architecture pieces, not just how-tos

#Envato Tuts+

Envato Tuts+ Pitch — Ready to Submit

Form URL: https://docs.google.com/forms/d/e/1FAIpQLSdmTCLvxy8Uhrbfe5kM982Bhy42n83_DrJIzrurM9xcPXuxLA/viewform
Section: Photo & Video → Tutorial (not a course)
Recommended payment tier ask: Standard tutorial rate (they set based on scope)

---
Form field: Name

Garrick Dee Tan

Form field: Email

gdtwebmaster@gmail.com

Form field: Background / About you

I built ConvertYard (https://convertyard.com), a network of free browser-based file conversion tools used by photographers, small merchants, and design teams. Our image converter handles the HEIC → JPEG/WebP/AVIF path in production, so the tutorial I'm pitching is drawn directly from real user cases we see every week — not synthetic examples. Comfortable writing for both technical and non-technical audiences.

Form field: Section

Photo & Video

Form field: Proposed title

How to Batch-Convert iPhone HEIC Photos to Web-Friendly JPEG, WebP, or AVIF in Your Browser

Form field: Why this tutorial / Reader takeaway

Since iPhone 11 (2019), iPhones default to HEIC/HEIF for photos. Every photographer working with client phone shots hits the same wall: HEIC won't upload to WordPress, won't preview in most CMSs, and most desktop converters are slow, paid, or Mac-only. Tuts+ Photo & Video doesn't currently have a definitive 2026 guide on this — and it's one of the most common workflow bottlenecks working photographers deal with.

By the end, the reader can:
- Drop a folder of HEIC files into a browser tab and get a ZIP of correctly-formatted, correctly-sized images back — without installing software, signing up, or uploading files to a third party
- Understand why each output format (JPEG, WebP, AVIF) exists and when to choose which
- Know the four common conversion methods and which fits their situation (Mac user, Adobe subscriber, PC user, technical user)
- Preserve EXIF/color profile correctly for portfolio archival vs strip it correctly for web upload

Form field: Target audience

Working photographers and serious hobbyists comfortable with basic file management. Zero coding knowledge required. Zero WordPress admin experience required. Assumes familiarity with terms like "JPEG" and "file size" but nothing beyond that.

Form field: Tutorial outline

Target length: ~1,500 words + 8–12 annotated screenshots

1. Why iPhone photos break your normal workflow — 30-second explainer on HEIC/HEIF and why the format exists
2. The four ways to convert HEIC — comparison table with pros/cons and best-use case for each
3. Method 1: Browser-based batch conversion (recommended for most cases, works on any OS) — full step-by-step with screenshots
4. Method 2: macOS Preview (Mac only, single-file limitation explained)
5. Method 3: Adobe Photoshop (for existing Adobe subscribers) — including the correct Export As settings
6. Method 4: Command line with ImageMagick (for the technically curious) — one-command batch conversion
7. Which output format to choose: JPEG vs WebP vs AVIF — decision tree with concrete example scenarios (web hero image, email attachment, portfolio thumbnail, print backup, client delivery)
8. Recommended quality settings for common uses — a table with numeric quality values for each output type
9. Common gotchas — EXIF data preservation vs stripping, color profile shifts, transparency handling, orientation flags

Form field: Writing sample/link to prior work

[Paste 1–2 URLs to prior published pieces here — Codrops piece once live, personal blog posts, or any technical/photography writing you have public]

Form field: Exclusivity

Original content, not published elsewhere. Would be exclusive to Envato Tuts+ at time of publication.

Alt subject line for the Topic field (if you'd rather lead with the audience):
"The Modern Photographer's Guide to Handling iPhone HEIC Photos — from Import to Web Upload"

Send strategy:
- Submit via the Google Form. Do not email cold — Tuts+ editors filter cold email aggressively but read form submissions on a weekly review.
- Do not name ConvertYard as the primary tool in the outline itself. Method 1 should reference "a browser-based tool like Squoosh, iLoveHEIC, or ConvertYard" — Tuts+ editors reject pieces that read as single-tool promotion.
- Response time: 2–4 weeks. Do not follow up before week 4.
- Payment: negotiated after acceptance. Ask for their standard rate first; if it's below $250, you can propose a higher rate given the deliverable includes 8–12 original screenshots and sample HEIC files.
- Byline gets one ConvertYard link. That's the return.
- If they reject the Photo & Video pitch, fallback pitch for the Design section: "Preparing Client Photos for Web Delivery: A Modern Photographer's Format Guide" — broader piece, less HEIC-specific, same underlying content.


#Netlify blog
Contact / Submission: blog@netlify.com (no public form, but May 2026 published guest author confirms)
Payment: Unpaid
Fit: Coding/Jamstack — strong

#Publication: Speckyboy Design Magazine
Contact / Submission: https://speckyboy.com/contribute-an-article/
Payment: Unpaid
Fit: Design/dev — good. Warning: they auto-delete pieces that read as self-promotion or infographic pitches

#Torque Magazine
Contact / Submission: editor@torquemag.io (WP Engine-owned) -- https://torquemag.io/contribute/
Payment: Unpaid
Fit: WordPress ecosystem — strong

#Content Marketing Institute (Not Accepting)
Contact / Submission: https://contentmarketinginstitute.com/cmi-guest-blogging-guidelines
Payment: No cash (free CMWorld registration or CMU enrollment after 2 accepted posts)
Fit: Content marketing — medium

#Better Programming / Level Up Coding / JS in Plain English
Contact / Submission: Medium publication apply pages
Payment: Medium Partner Program earnings
Fit: Coding — always open, low editorial gate

#Dev.to / Hashnode
Contact / Submission: Self-publish
Payment: None
Fit: Coding — always open, no gatekeeping

#Search Engine Journal
https://www.searchenginejournal.com/writers-guidelines-for-search-engine-journal/

#Search Engine Land
https://searchengineland.com/contact

#Pragmatic Engineer pitch — ready to submit

Form URL: https://docs.google.com/forms/d/e/1FAIpQLSeM4OSQJymhY3VsYmZ1RcJB1OCMP_xQI1nUW-qpksMAXIw98w/viewform

---
Form: Name

Garrick Dee Tan

Form: Email

gdtwebmaster@gmail.com

Form: Proposed title

The Hidden Costs of Going Backend-Free: 18 Months of Building a Zero-Server Product

Form: Article summary

Most "serverless" architecture posts stop one step short of the interesting question: what happens when you don't have a backend at all? I built ConvertYard (a file conversion product) as a fully client-side WebAssembly app — no server-side processing, no user accounts, no upload endpoints, no compute layer at all. The static site is served from Cloudflare Pages and every "operation" happens in the browser via libvips-wasm, libheif-js, ffmpeg.wasm, and pdf-lib.

18 months in, the architecture bet has paid off in ways I expected (infra spend near zero, GDPR footprint literally zero, SOC 2 scope shrunk to nothing) and cost me in ways I didn't expect (product analytics is genuinely hard, "backend" features like batch queuing and cross-device sync are structurally impossible, and hiring is weird because I need to explain why there's no Kubernetes anywhere).

This article walks through the real trade-off matrix with numbers: what backend-free architecture actually delivers, what it forecloses, and — most importantly — the honest signals for when not to make this bet. Not a "you should try this too" post. A "here's what two years of living inside this decision actually looks like" post.

Form: Why this article for your audience

The Pragmatic Engineer readership skews toward engineers making architecture decisions at startups and scale-ups. The client-first / WASM / edge-only path keeps appearing in job posts and RFCs (Cloudflare Workers, Vercel Edge Runtime, Fly.io, Transformers.js in the browser) but there's very little honest writing on what living with the extremes looks like. Most content is either marketing ("just use serverless!") or dismissive ("that won't scale"). A concrete retrospective from someone who actually shipped and lived with a fully client-side product fills a real gap.

Structurally close to the "Paying down tech debt" and "Past and future of backend practices" guest posts you've already published — a hard-earned-experience post that reads as a decision framework rather than a promotion.

Form: Article outline (~3,500 words)

1. The bet: what "backend-free" actually means in 2026 — not serverless, not JAMstack, not "static site with API routes." Zero compute layer. Concrete diagram of the request path.
2. What the architecture actually delivered — with real numbers: infra cost per user, GDPR data-processor mapping, SOC 2 scope, engineering hours saved per month
3. What it foreclosed — batch queuing, cross-device sync, server-side pre-processing for cache warming, product analytics that isn't laughably shallow, anything that needs coordination between users
4. The unexpected costs — hiring conversations, investor conversations, users assuming there's a backend that isn't there and asking why it's broken
5. The decision framework: when this bet works, when it doesn't — a concrete matrix of product characteristics that favor / disfavor backend-free (data size, coordination requirements, ML model size, offline behavior, monetization model)
6. What I'd do differently at 100k users — the specific inflection points that would force a backend, and my current plan for keeping that bet delayed as long as possible

Form: Writing samples / prior work

[Insert Codrops piece URL once live, plus 1–2 published pieces from convertyard.com/blog or personal blog. If none exist yet, submit after the Codrops piece publishes — Gergely reads past writing carefully before responding.]

Form: Anything else

Happy to adjust scope, tone, or emphasis based on what fits current pipeline. Also open to a shorter/tighter framing if 3,500 words is too long. One-shot pitch, not a recurring contributor ask — but open to it if a first piece lands.

---
Send strategy:

- Wait for the Codrops piece to publish before sending this one. Gergely reads writing samples carefully; sending with a Codrops byline in hand raises acceptance odds meaningfully. You mentioned Codrops is already scheduled — check when it publishes and send this within a week after.
- Do NOT lead with ConvertYard as the product. The piece is an architecture retro that happens to be about ConvertYard. Gergely rejects anything that reads as product marketing dressed up as thought leadership.
- The angle "here's what didn't work" is the strongest part. Everyone pitches him success stories; the "unexpected costs" section is what makes this different.
- Payment: Don't ask for a specific rate in the form. He sets rates after seeing the draft. If accepted, expect a private offer.
- Response time: 2–4 weeks typically. If no response by week 5, do NOT follow up — that's a soft no.
- The 3,500-word length is deliberate. Gergely's guest posts run long; short posts don't fit his format. If you can't sustain that depth honestly, pitch something else.
- Byline gets one ConvertYard link. That's the return. Don't try to work more links into the body — he'll cut them.

---
Tracker entry for your MD file:

### The Pragmatic Engineer — Backend-Free Architecture Retrospective

- **Publication:** The Pragmatic Engineer newsletter (Gergely Orosz)
- **URL of article/target page:** https://blog.pragmaticengineer.com/pragmatic-engineer-guest-article/
- **Submission link / contact:** https://docs.google.com/forms/d/e/1FAIpQLSeM4OSQJymhY3VsYmZ1RcJB1OCMP_xQI1nUW-qpksMAXIw98w/viewform
- **Audience:** 85% experienced software engineers / eng leaders, 65% startup/scaleup/Big Tech
- **DR / traffic:** #1 tech newsletter on Substack
- **Payment:** Paid (rate set post-acceptance, industry reports $1000–$2500)
- **Topic pitched:** The Hidden Costs of Going Backend-Free: 18 Months of Building a Zero-Server Product
- **Angle summary (1 sentence):** Architecture retrospective on client-only WASM product, framed as an honest decision framework — not a success story.
- **Status:** [ ] Drafted [ ] Sent [ ] Reply received [ ] Accepted [ ] Rejected [ ] Published
- **Date sent:**
- **Follow-up date (10–14 days after send):** DO NOT follow up — soft no if no response by week 5
- **Reply notes:**
- **Published URL:**
- **Notes / next steps:** WAIT for Codrops piece to publish before sending — Gergely reads writing samples carefully. Piece must read as retrospective, not marketing. "What didn't work" section is the differentiator. Byline gets one ConvertYard link.