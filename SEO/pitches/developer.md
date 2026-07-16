# Developer Blog, Newsletter & Podcast Pitches

---

## CSS-Tricks

**Article referenced:** What's !important #15: Boundary-aware CSS, Time-based CSS, Full-bleed CSS, and More — https://css-tricks.com/whats-important-15/
**Contact:** DigitalOcean editorial team

**Subject:** Zero server requests: running 93 file converters entirely in WASM

Hi CSS-Tricks team,

Your recent "What's !important #15" roundup caught my attention — you cover the browser platform deeply, and I think ConvertYard fits squarely in that territory. I built a batch file converter (93 tools: images, PDF, video, audio) where every conversion runs client-side via ffmpeg.wasm, libvips-wasm, mupdf-wasm, and transformers.js — open DevTools during a conversion and you'll see zero outgoing network requests. I'd love to write a deep-dive guest article on architecting zero-server file processing with WebAssembly for the CSS-Tricks audience.

— Garrick
convertyard.com

---

## DZone

**Article referenced:** Building Offline-First iOS Applications with Local Data Storage — https://dzone.com/articles/advanced-ios-performance-optimization
**Contact:** contributor at dzone.com/writers

**Subject:** WASM-only file processing: architecture notes from 93 browser tools

Hi DZone team,

Your offline-first iOS piece resonated — the same principle (process locally, never phone home) is what I applied to a web-based batch file converter. ConvertYard runs 93 tools entirely in WebAssembly: ffmpeg.wasm, libvips-wasm, mupdf-wasm, transformers.js. Files never touch a server. Open DevTools during a conversion — zero outgoing requests. I'd like to contribute a technical article on the WASM threading model, memory management, and the lessons from building at 1,000-file batch scale for the DZone audience.

— Garrick
convertyard.com

---

## SitePoint

**Article referenced:** Most recent SitePoint articles — https://www.sitepoint.com
**Contact:** editors@sitepoint.com

**Subject:** Guest article: building a 1,000-file batch converter with WebAssembly

Hi SitePoint team,

SitePoint's coverage of browser APIs and modern JavaScript is where I've sent junior devs for years. I built ConvertYard — 93 file-conversion tools (image, video, PDF, audio) where everything runs in the browser via WebAssembly. No server. No upload. Files process locally using ffmpeg.wasm, libvips-wasm, and mupdf-wasm. I'd like to write a practical walkthrough for your audience: how to architect WASM workers for batch processing, handle memory limits at 1,000 files, and ship real tools — not demos.

— Garrick
convertyard.com

---

## Codrops

**Article referenced:** The Architecture Behind Trionn: Coordinating GSAP, Three.js, Lenis, and Web Audio — https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/
**Contact:** info@tympanus.net

**Subject:** Architecture write-up: zero-server file conversion in WASM

Hi Codrops team,

Your Trionn architecture breakdown — coordinating GSAP, Three.js, Lenis, and Web Audio in one coherent system — is exactly the kind of technical depth I find valuable. I built ConvertYard with a similar coordination challenge: ffmpeg.wasm, libvips-wasm, mupdf-wasm, and transformers.js running concurrently in SharedArrayBuffer workers, converting batches of 1,000 files entirely in the browser. I'd love to write an architecture piece for Codrops on the multi-library WASM orchestration approach that made it work.

— Garrick
convertyard.com

---

## Dev.to

**Article referenced:** What WebAssembly actually is, and why it escaped the browser — https://dev.to/iwtlp/what-webassembly-actually-is-and-why-it-escaped-the-browser-142a
**Contact:** Write directly (no gatekeeping)

**Subject:** How I built 93 file converters that run entirely in WASM

Hi Dev.to community,

The post "What WebAssembly actually is, and why it escaped the browser" framed WASM's broader potential well. I went the other direction: keeping WASM firmly in the browser as a privacy guarantee. ConvertYard is 93 file-conversion tools (images, video, PDF, audio) built on ffmpeg.wasm, libvips-wasm, mupdf-wasm, and transformers.js. The DevTools test is simple: open the Network tab during a conversion — zero outgoing requests. Planning to publish a detailed article here on the WASM worker architecture, SharedArrayBuffer threading, and how batch-at-1,000-files changes your memory strategy.

— Garrick
convertyard.com

---

## Hashnode

**Contact:** hashnode.com (cross-post)
**Note:** Cross-post from Dev.to with canonical tag

**Subject:** Cross-post: 93 file converters, zero server, all WASM

Hi Hashnode team,

Cross-posting my Dev.to piece on building ConvertYard — 93 batch file-conversion tools running entirely in WebAssembly (ffmpeg.wasm, libvips-wasm, mupdf-wasm, transformers.js). No file ever leaves the machine. The article covers WASM worker threading, SharedArrayBuffer memory management, and lessons learned at 1,000-file batch scale. Setting canonical to Dev.to.

— Garrick
convertyard.com

---

## Hacker Noon

**Article referenced:** AI Is Reshaping PR Forever: Here's How — https://hackernoon.com/ai-is-reshaping-pr-forever-heres-how
**Contact:** Submit story at hackernoon.com

**Subject:** Story submission: building file converters with zero server infrastructure

Hi Hacker Noon team,

I noticed you publish broadly on software architecture and unconventional technical approaches. ConvertYard is a batch file converter (93 tools) where the entire stack — ffmpeg.wasm, libvips-wasm, mupdf-wasm, transformers.js — runs client-side. No server sees user files, ever. The practical verification: open DevTools during a 100-file batch conversion and watch the Network tab stay empty. I'd like to submit a story on why WASM-only architecture is a defensible product moat, not just a privacy checkbox.

— Garrick
convertyard.com

---

## JavaScript Weekly

**Contact:** news@cooperpress.com
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard runs 93 file-conversion tools (images, PDF, video, audio) entirely in the browser via ffmpeg.wasm, libvips-wasm, mupdf-wasm, and transformers.js — open DevTools during a conversion and you'll see zero outgoing network requests. Batch up to 1,000 files, everything processes locally: convertyard.com"

---

## CSS Weekly

**Contact:** zoran@css-weekly.com
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard is a local-first batch file converter — 93 tools covering images, PDF, video, and audio — where all processing runs in WebAssembly in the browser, files never touch a server, and the UI stays under 80kb gzipped before WASM loads: convertyard.com"

---

## TLDR Tech

**Contact:** dan@tldr.tech
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard ships 93 batch file-conversion tools built entirely on WebAssembly (ffmpeg.wasm, libvips-wasm, mupdf-wasm, transformers.js) — zero server-side file processing, verifiable via DevTools Network tab, handling batches up to 1,000 files in-browser: convertyard.com"

---

## Bytes.dev

**Contact:** Submit on site
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard is a local-first batch converter with 93 tools — images, video, PDF, audio — all running client-side via WebAssembly with zero network requests during processing; open DevTools and verify it yourself: convertyard.com"

---

## Frontend Focus

**Contact:** news@cooperpress.com
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard runs 93 file-conversion tools (image, PDF, video, audio) entirely in the browser using ffmpeg.wasm, libvips-wasm, mupdf-wasm, and transformers.js — no files hit a server, no sign-up required, and it handles batches of 1,000 files: convertyard.com"

---

## Web Tools Weekly

**Contact:** webtoolsweekly.com/submit
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard — 93 batch file-conversion tools (images, PDF, video, audio) that run entirely in WebAssembly in the browser; zero server uploads, verifiable via DevTools, up to 1,000 files per batch: convertyard.com"

---

## Sidebar.io

**Contact:** Submit on site
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard is a local-first batch file converter — 93 tools, everything in WebAssembly, zero outgoing network requests during conversion, up to 1,000 files at a time: convertyard.com"

---

## Syntax.fm

**Episode referenced:** 1019: LGTM, Ship It: The AI Code Review Problem — https://syntax.fm/1019
**Contact:** sponsor@syntax.fm

**Subject:** WASM architecture deep-dive — tool mention or guest spot for ConvertYard

Hi Wes and Scott,

Episode 1019 on AI code review hit on something I think about a lot: shipping code you can't fully audit. With ConvertYard I went the opposite direction — every conversion runs locally in WebAssembly (ffmpeg.wasm, libvips-wasm, mupdf-wasm, transformers.js), so users can open DevTools and verify zero outgoing requests themselves. 93 tools, 1,000-file batches, all client-side. Worth a Sick Picks mention, or I'm happy to come on and walk through the WASM threading architecture if that's a better fit.

— Garrick
convertyard.com

---

## The Changelog

**Episode referenced:** MCP on Code Mode — https://changelog.com/podcast/681
**Contact:** editors@changelog.com

**Subject:** ConvertYard — zero-server file tooling built entirely on WASM

Hi Changelog team,

Episode 681 on MCP and Code Mode was a good breakdown of where local tooling is heading. I built something in the same spirit: ConvertYard, a batch file converter (93 tools) where ffmpeg.wasm, libvips-wasm, mupdf-wasm, and transformers.js do all the work in the browser. No file ever leaves the machine — the Network tab is the proof. I think the architecture story (SharedArrayBuffer workers, WASM threading at 1,000-file scale, keeping JS bundles under 80kb before WASM loads) would make a solid Changelog episode.

— Garrick
convertyard.com

---

## Shop Talk Show

**Episode referenced:** 723: Ads on Your Website, UX for Web Dev Jobs, and Progressive Web Components — https://shoptalkshow.com/723/
**Contact:** Twitter/X @ShopTalkShow

**Subject:** ConvertYard — 93 WASM converters, zero server, verifiable in DevTools

Hi Chris and Dave,

Episode 723 touched on progressive web components and ads-on-your-site — two topics that intersect directly with ConvertYard. I built 93 batch file-conversion tools (images, PDF, video, audio) that run entirely in WebAssembly: no server, no upload, open DevTools and the Network tab stays empty during any conversion. The site runs display ads below the fold only — tool UI never sees one. Would love a mention on the show, or to come on and talk WASM-first architecture and how the "no server" constraint shapes every product decision.

— Garrick
convertyard.com
