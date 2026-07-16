# Developer Blog, Newsletter & Podcast Pitches

---

## CSS-Tricks

**Article referenced:** Write for CSS-Tricks! (Guest Writing Program) — https://css-tricks.com/guest-writing/
**Contact:** DigitalOcean editorial team via https://css-tricks.com/guest-writing/

**Subject:** Guest article pitch — Running FFmpeg in the browser with zero server involvement

Hi CSS-Tricks team,

Your guest writing program asks for articles that teach real browser capabilities — this fits squarely in that lane. I built ConvertYard, a batch file converter that runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm entirely in the browser — no server ever touches a user file. The architecture is verifiable: open DevTools during a conversion and the Network tab shows zero outgoing file requests. I'd like to write a deep-dive on threading WASM workers, SharedArrayBuffer requirements, and the COOP/COEP header dance that makes it work in a static site context.

— Garrick
convertyard.com

---

## DZone

**Article referenced:** Article Submission Guidelines — https://dzone.com/articles/dzones-article-submission-guidelines
**Contact:** Contributor portal at https://dzone.com/writers

**Subject:** Contributor pitch — Client-side file processing at scale with WebAssembly

Hi DZone team,

I've read through your WebAssembly coverage and notice there's a gap on practical browser-side file processing at batch scale. I built ConvertYard to convert up to 1,000 files locally using ffmpeg.wasm, libvips-wasm, and mupdf-wasm — nothing leaves the browser. The DevTools Network tab stays empty during the entire conversion. I'd like to contribute an article on architecting zero-server file tooling with WASM: memory limits, worker threading, and graceful degradation for Safari's SharedArrayBuffer restrictions.

— Garrick
convertyard.com

---

## SitePoint

**Article referenced:** SitePoint WebAssembly tag — https://www.sitepoint.com/tag/webassembly/
**Contact:** editors@sitepoint.com

**Subject:** Article submission — WebAssembly for real-world file conversion in the browser

Hi SitePoint editors,

SitePoint's WebAssembly coverage has historically covered the "what is WASM" angle well — I want to submit a practical follow-up on what it actually takes to ship a production tool built on it. ConvertYard runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm entirely client-side, handling up to 1,000 files per batch with no server uploads. You can verify it in DevTools: zero network requests for file data. The article would cover worker setup, COOP/COEP headers for SharedArrayBuffer, and memory management for large batches.

— Garrick
convertyard.com

---

## Codrops

**Article referenced:** "WebGL for Designers: Creating Interactive, Shader-Driven Graphics Directly in the Browser" — https://tympanus.net/codrops/2026/03/04/webgl-for-designers-creating-interactive-shader-driven-graphics-directly-in-the-browser/
**Contact:** info@tympanus.net

**Subject:** Article pitch — Client-side batch file conversion with WASM (no server, no uploads)

Hi Codrops team,

Your WebGL-in-the-browser piece from March showed exactly how far native browser capabilities have come — the same reasoning applies to file processing. I built ConvertYard, which runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm in-browser to convert batches of up to 1,000 files with zero server uploads. Open DevTools during a conversion: the Network tab shows no outgoing file requests. I'd like to contribute a tutorial on threading WASM workers for batch file processing — practical, browser-API-first, and directly relevant to your frontend audience.

— Garrick
convertyard.com

---

## Dev.to

**Note:** Open platform — publish directly at dev.to. No pitch needed. Write and cross-post.

**Suggested article title:** "How I built a 1,000-file batch converter that runs entirely in the browser (ffmpeg.wasm + libvips + mupdf)"

**Article angle:** First-person build log covering WASM worker threading, SharedArrayBuffer/COOP/COEP headers for static hosting on Cloudflare Pages, memory management for large batches, and the DevTools zero-network-request proof. Link back to convertyard.com throughout.

**Tags to use:** `#webassembly` `#javascript` `#ffmpeg` `#showdev`

---

## Hashnode

**Note:** Cross-post platform — publish the same article from Dev.to on Hashnode with canonical URL pointing back to Dev.to or convertyard.com.

**Cross-post strategy:** After publishing on Dev.to, cross-post to Hashnode. Set canonical URL to the Dev.to post or a future convertyard.com/blog URL. Use the same article angle above.

**Tags to use:** `webassembly` `javascript` `ffmpeg` `frontend`

---

## Hacker Noon

**Article referenced:** "How to Run FFmpeg in the Browser Using WebAssembly" — https://hackernoon.com/how-to-run-ffmpeg-in-the-browser-using-webassembly
**Contact:** Submit story at hackernoon.com/contribute

**Subject:** Story submission — Zero-server batch file conversion: ffmpeg.wasm + libvips + mupdf at 1,000 files

Hi Hacker Noon team,

The FFmpeg-in-the-browser article on Hacker Noon covers the proof of concept — I built the production version. ConvertYard runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm together in a static Next.js site on Cloudflare Pages, converting up to 1,000 files per batch with no server ever receiving a user file. DevTools verification: zero outgoing file requests during conversion. I'd like to submit a story on the architectural decisions — WASM module loading strategy, worker threading for batch parallelism, and COOP/COEP header requirements for SharedArrayBuffer on a static host.

— Garrick
convertyard.com

---

## JavaScript Weekly

**Contact:** news@cooperpress.com
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard (convertyard.com) runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm entirely in the browser — no server, no uploads, up to 1,000 files per batch. Open DevTools during a conversion and the Network tab shows zero outgoing file requests; all processing happens in WASM workers on the client."

---

## CSS Weekly

**Contact:** zoran@css-weekly.com
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard is a local-first batch file converter built on WebAssembly — ffmpeg.wasm, libvips-wasm, and mupdf-wasm run in the browser so files never leave the machine. Worth a look for frontend developers curious about what WASM-powered tooling looks like in a static Next.js + Cloudflare Pages deployment."

---

## TLDR Tech

**Contact:** dan@tldr.tech
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard (convertyard.com) converts up to 1,000 files per batch using WebAssembly — ffmpeg.wasm, libvips-wasm, and mupdf-wasm run client-side with zero server file uploads. You can verify the zero-upload claim by opening DevTools: the Network tab shows no outgoing file requests during conversion."

---

## Bytes.dev

**Contact:** Submit at bytes.dev
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm in the browser to batch-convert up to 1,000 files with no server involvement — built on Next.js static export hosted on Cloudflare Pages. The zero-upload architecture is DevTools-verifiable: no outgoing file requests during conversion."

---

## Frontend Focus

**Contact:** news@cooperpress.com
**Type:** Newsletter submission

**Submission copy:**
"ConvertYard (convertyard.com) is a batch file converter that runs entirely in the browser via WebAssembly — ffmpeg.wasm for video/audio, libvips-wasm for images, mupdf-wasm for PDFs. Files never leave the machine; the Network tab stays empty during conversion. Handles batches up to 1,000 files."

---

## Web Tools Weekly

**Contact:** Submit at https://webtoolsweekly.com/submit
**Type:** Newsletter submission (tool listing — perfect fit)

**Submission copy:**
"ConvertYard — free local-first batch file converter. Converts images, video, audio, and PDFs in the browser using WebAssembly (ffmpeg.wasm, libvips-wasm, mupdf-wasm). No uploads, no account, no file limit per batch up to 1,000 files. DevTools-verifiable: zero outgoing file requests. convertyard.com"

---

## Sidebar.io

**Contact:** Submit at sidebar.io
**Type:** Daily design link submission

**Submission copy:**
"ConvertYard — batch file converter that runs entirely in the browser. No uploads, no account. Drop up to 1,000 files and convert in WebAssembly. convertyard.com"

---

## Syntax.fm

**Episode referenced:** "Text Editor Keybindings, WASM Replacing Docker, LLM apathy and hosting mini apps" — https://syntax.fm/930
**Contact:** sponsor@syntax.fm

**Subject:** Tool mention / guest pitch — ConvertYard: batch file conversion in the browser via WASM

Hi Wes and Scott,

Episode 930 touched on WASM replacing Docker as a distribution primitive — the same WASM runtime story plays out in the browser too. I built ConvertYard, which runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm client-side to convert batches of up to 1,000 files with zero server uploads. Open DevTools during a conversion: Network tab shows nothing. I'd love a tool mention, or if you're doing a WASM-in-the-browser episode, I'm happy to come on and walk through the SharedArrayBuffer/COOP/COEP setup that makes it work on a static Cloudflare Pages host.

— Garrick
convertyard.com

---

## The Changelog

**Episode referenced:** "Code Cartoons, Rust, WebAssembly with Lin Clark" — https://changelog.com/podcast/294
**Contact:** editors@changelog.com

**Subject:** Guest pitch — WebAssembly in production: zero-server batch file conversion

Hi Changelog team,

Episode 294 with Lin Clark covered WebAssembly's potential as a web language — I've shipped a production version of that idea. ConvertYard runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm entirely in the browser to convert batches of up to 1,000 files with no server ever receiving a user file. The DevTools proof is concrete: zero outgoing network requests for file data during conversion. I'd like to come on to talk about what it actually takes to ship WASM-powered tooling on a static host — worker threading, SharedArrayBuffer requirements, and where the limits are today.

— Garrick
convertyard.com

---

## Shop Talk Show

**Episode referenced:** "Better DX for Web Components, What Was Popular That Now We're Used To?" — https://shoptalkshow.com/717/
**Contact:** @ShopTalkShow on Twitter/X or contact form at shoptalkshow.com

**Subject:** Guest pitch — Building production file tools with WASM in the browser

Hi Chris and Dave,

Episode 717's discussion on better DX for browser-native APIs landed well — WebAssembly in the browser is the next step of that same story. I built ConvertYard, which runs ffmpeg.wasm, libvips-wasm, and mupdf-wasm client-side to convert up to 1,000 files per batch. No server, no uploads — verifiable by opening DevTools during a conversion. I'd love a few minutes to walk through how you wire up WASM workers for batch file processing on a static host, and where the browser API gaps still are in 2026.

— Garrick
convertyard.com
