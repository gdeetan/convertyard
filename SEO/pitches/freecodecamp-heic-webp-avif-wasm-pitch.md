# freeCodeCamp submission plan — Client-side HEIC to WebP/AVIF with WebAssembly

**Target articles being complemented:**
- "What is AVIF? How to Use AV1 Image Format Images on Your Website" — Erisan Olasheni, Nov 2020
  https://www.freecodecamp.org/news/how-to-use-avif-images-on-your-website/
- "Best Image Format for Web in 2019: JPEG, WebP, HEIC, AVIF" — comparison piece
  https://www.freecodecamp.org/news/best-image-format-for-web-in-2019-jpeg-webp-heic-avif-41ba0c1b2789

Both articles cover the "why" of modern image formats without showing a single line of conversion code. Both recommend third-party sites or desktop editors for the actual conversion step. That's the gap.

---

## Submission channel — read this before writing anything

**freeCodeCamp News does NOT accept per-article pitches by email.** The original pitch draft assumed an editorial inbox that doesn't exist. Their actual model:

1. Apply to become a **contributor** via the form at the bottom of the [Developer News Style Guide](https://www.freecodecamp.org/news/developer-news-style-guide/).
2. Application asks for **3 links to articles you've already published** (Hashnode, dev.to, or personal blog).
3. Only a small percentage of applicants are approved.
4. Once approved, you get a Ghost editor login and the editorial team reviews drafts before they go live.

There is no "Subject: Tutorial submission" email path. Sending the pitch as originally drafted will get ignored or auto-replied with "please apply via the form."

---

## The correct sequence

### Step 1 — Publish the HEIC→WebP/AVIF tutorial on Hashnode first

This does double duty: it's a real article that lives on your Hashnode, AND it becomes one of the 3 sample articles you submit with the contributor application. fCC also routinely republishes strong Hashnode articles from approved contributors onto News (with canonical link back), so a good Hashnode draft can literally become the fCC article without a second submission step.

**Working title:** *How to Convert HEIC, JPG, and PNG to WebP or AVIF in the Browser with WebAssembly*

**Angle that fills the specific gap in the two fCC pieces:**
- Their pieces answer "why AVIF / why WebP" and stop at "use an online converter."
- Yours answers "how to actually do the conversion in JavaScript, in the user's browser, with zero server round-trip, for HEIC input (iPhone photos) as well as JPG/PNG."

**Outline (target 2000–3000 words, tutorial-heavy with runnable code):**

1. **The problem** — every "modern image formats" tutorial ends with "use an online converter" or "run this ImageMagick command." Neither works if you're building a web app where users drop their own images (photographer portfolios, e-commerce sellers, CMS uploaders). This tutorial builds the converter itself.
2. **Why WebAssembly for this** — server-side conversion costs bandwidth, latency, and privacy. Client-side native `canvas.toBlob('image/webp')` handles JPG/PNG in but not HEIC in, and can't emit AVIF reliably across browsers. libvips-wasm and libheif-wasm close both gaps.
3. **The core pipeline** — file input → decode (libheif for HEIC, native for JPG/PNG) → encode (libvips-wasm for WebP/AVIF) → download or upload. Full working code.
4. **Making it non-blocking with a Web Worker** — main-thread WASM freezes the UI on 20+ MB HEIC files. Move the pipeline into a Worker; post File objects across the boundary using transferable ArrayBuffers. Full worker code + main-thread wiring.
5. **Unlocking multi-threaded WASM with COOP/COEP** — SharedArrayBuffer requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. What breaks when you add them (third-party embeds, some CDN images) and how to scope them to the converter route only.
6. **Batch processing 100+ files without crashing** — a queue with concurrency limits (navigator.hardwareConcurrency), memory-pressure backoff, and per-file progress events. Chrome tops out around 4 GB per tab; mobile Safari around 384 MB — real numbers with links to the WebKit source.
7. **Benchmarks** — WASM in-browser vs. Node sharp on the same 50-image test set. Numbers for JPG→WebP, JPG→AVIF, HEIC→WebP, HEIC→AVIF. Where WASM wins (round-trip time on small batches, zero-cost privacy) and where it loses (raw throughput on 500+ image batches).
8. **Edge cases from production** — HEIC files with HDR gain maps, HEIC sequences (Live Photos), EXIF orientation preservation, ICC profile handling, transparency in AVIF vs. WebP.
9. **When to skip this entirely** — if you have a backend and users are uploading anyway, use sharp/libvips server-side. This tutorial is for the client-first, privacy-first, or offline-capable use case.

**What makes it not-slop:** actual benchmark numbers, actual memory-ceiling numbers with source links, real edge cases (HDR gain maps, Live Photos, mobile Safari's low memory ceiling) that only show up when you've shipped this in production.

### Step 2 — Publish 2 more sample articles on Hashnode

The contributor form wants **3 samples**. If you don't have two others fCC-appropriate, candidates from your existing work:

- "Why WordPress rejects HEIC uploads (and three ways to fix it)" — repurpose of the Cloudways pitch content, but on your own Hashnode as a technical explainer
- "Batch-processing 1000 files in the browser without freezing the tab" — the Web Worker + queue + memory-backoff pattern generalized beyond images (also useful for PDF, video, etc.)

Both are things you've already built and have opinions about.

### Step 3 — Apply as a contributor

Once you have 3 samples live on Hashnode, fill out the application form linked at the bottom of the style guide: https://www.freecodecamp.org/news/developer-news-style-guide/

In the application:

- **Portfolio link:** convertyard.com
- **Sample articles:** link the 3 Hashnode pieces
- **What you want to write about:** browser-based file processing with WebAssembly (image, PDF, video). Practical tutorials with working code, benchmarks, and production edge cases. Positioning: "the local-first alternative to every 'upload your file' tutorial."
- **Bio:** same tightened version from the Cloudways pitch

### Step 4 — After approval

Once approved, either (a) draft the article natively in the Ghost editor for a fCC-original piece, or (b) ask your assigned editor about republishing the Hashnode HEIC→WebP/AVIF piece on fCC News with a canonical link. Both paths are standard.

---

## If the original email-pitch approach is required for some reason

(Not recommended — see above — but included for completeness.)

There is no public editorial address. The closest thing is the "Contact" link in the footer of freecodecamp.org, which routes general inquiries. Sending a tutorial pitch there will almost certainly get a "please apply as a contributor" reply.

If you insist on a cold outreach path, the least-bad option is Twitter DM to Quincy Larson (@ossia) with a one-line note: "Published a tutorial on client-side HEIC→AVIF conversion with WebAssembly — would fCC be interested in a republish? [Hashnode link]" That requires the Hashnode article to already exist, which loops back to Step 1.

---

## Notes to self

- Do not send the original email pitch. It'll burn the first impression.
- Write the Hashnode article to fCC's [style guide](https://www.freecodecamp.org/news/developer-news-style-guide/) from the start — active voice, short sentences, code blocks over screenshots, no clickbait titles, explain acronyms on first use.
- fCC's audience skews toward learners, so the tutorial should assume familiarity with JavaScript and file APIs but not with WASM, COOP/COEP, or Web Workers. Explain those from scratch.
- Include a "Complete working code" GitHub gist or repo linked at the top — fCC readers copy-paste.
