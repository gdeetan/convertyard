# CSS-Tricks pitch — DO NOT SEND AS DRAFTED

**Reference article:** "Useful Tools for Creating AVIF Images"
**URL:** https://css-tricks.com/useful-tools-for-creating-avif-images/
**Author:** Sunkanmi Fafowora (freelance guest contributor, not CSS-Tricks staff — confirmed via her author comment replies)
**Published:** May 2022 (comment dates confirm)

## Article structure (verified from JSON-LD and body content)

**Browser Solutions:**
- Squoosh (4MB per-image size limit)
- **Cloudinary** (no stated file size limit) — the pitch missed this

**Command Line Solutions:**
- `avif-cli` by lovell (via `npm install avif`) — the pitch doesn't misstate this, but note it's not `avifenc`

## Corrections to the original pitch

1. Draft says *"Squoosh gets a mention as the browser-based option"* — the article lists **Squoosh AND Cloudinary**. Cloudinary's the closer competitor to a batch use case than the pitch acknowledges.
2. Draft says *"the article doesn't have a batch browser option"* — Cloudinary lets you upload multiple images without Squoosh's 4MB per-image wall. Real gap is narrower: **local-first, no-signup, no-server batch**. Cloudinary uploads to their servers and pushes account creation for anything at scale; Squoosh is one-image UX; that's where ConvertYard is genuinely different.
3. The article's CLI recommendation is `avif-cli` (npm) — pitch doesn't misstate this, but if you reference it, get the name right.

## Why you shouldn't send this pitch

### Problem 1: Guest article proposals are closed

From https://css-tricks.com/guest-writing/:
> *"Heads up! We're not currently taking new article proposals. It's just for a bit though. You can still check out the advice and guidelines here if you're interested in writing in the future when things open back up."*

### Problem 2: This isn't a guest-post ask anyway — it's an update-to-existing-article ask

Even when guest submissions are open, they cover NEW articles. Getting a 4-year-old freelance contributor article edited to add a tool is a different (harder) ask that CSS-Tricks editorial doesn't have a workflow for.

### Problem 3: Sunkanmi Fafowora is a freelance guest, not CSS-Tricks staff

She wrote the piece in 2022 as a paid guest ($250 via PayPal, per their guest writing page). She can't decide to add ConvertYard. CSS-Tricks editors would need to go back to a 4-year-old article and update someone else's contributor piece. That's an unusually high-friction ask.

### Problem 4: The article isn't broken

Squoosh, Cloudinary, and avif-cli all still exist and work. The article isn't factually wrong (unlike KeyCDN's WebP/AVIF pieces where the browser-support tables are years out of date). Without a "your info is wrong" hook, an addition ask reads as pure link-request.

### Problem 5: Site is publishing daily but the guest program is a bottleneck

The homepage shows articles through Aug 13, 2026 — the site is very much alive. So the shutdown isn't editorial, it's just that guest slots are paused. Priority for staff writers is likely current front-end topics, not maintaining old tool roundups.

## Honest recommendation

**Skip this pitch.** Same pattern as Buffer, Sprout Social, and Buffer:
- Wrong ask category (update to old freelance piece instead of standard channel)
- Submission channel closed
- No factual-error hook to justify the update

## When guest proposals reopen — the right CSS-Tricks pitch

CSS-Tricks' guidelines are extremely specific about what they want:
> *"a specific situation of a learning discovery you made that resonates with readers personally and gives them something new to bookmark and use later."*

And explicitly say what they don't want:
> *"It can't be documentation that the reader can get somewhere else, nor can it be a tutorial using the same example — modal, to-do list, meme generator, etc. — that is already well-covered in other tutorials."*

**The pitch that fits their model when submissions reopen:**

**Working title:** *"Batch AVIF Conversion in the Browser: What I Learned Wiring libvips-wasm Into a Real Web App"*

**Angle:** technical build story about the WebAssembly + Web Worker + SharedArrayBuffer + COOP/COEP stack that makes local-first batch image conversion actually work in production. Real numbers, real edge cases (mobile Safari's 384 MB memory ceiling, transferable ArrayBuffer patterns to avoid main-thread jank, why single-threaded WASM is often faster than multi-threaded for JPEG→AVIF batches).

**Why this fits:**
- "Learning discovery" ✓ — nobody's written a proper CSS-Tricks-quality article on this stack
- "Practitioner writing" ✓ — you built and shipped ConvertYard on it
- "Technically detailed and correct" ✓ — the WASM/COOP/COEP stack is technical
- "Practical, useful, self-contained" ✓ — a reader could follow along and build the same thing
- Not "documentation you can get somewhere else" ✓ — the info is scattered across libvips docs, wasm-feature-detect docs, Chrome team blog posts; there's no single article
- Length: fits their 600-1,500 word range, though this piece would probably run 1,800-2,500 words (they permit longer for technical depth)

**When to send it:** check https://css-tricks.com/guest-writing/ every 4-6 weeks. When the "we're not currently taking proposals" banner comes down, send the pitch immediately — expect a competitive submission queue when they reopen.

**How ConvertYard fits:** one paragraph at the end, "this is what I built with the stack." Not the article's subject. That's the pattern CSS-Tricks tolerates.

## Notes for follow-up

- The libvips-wasm technical piece is a real long-term asset. Whether or not CSS-Tricks accepts it, you can publish it on Hashnode as one of your freeCodeCamp contributor samples.
- $250/article payment via PayPal — modest but not trivial. And the CSS-Tricks byline is worth more than the payment for a technical builder trying to establish credibility.
- Do NOT try to sneak a "please add ConvertYard to your tools list" ask into a hypothetical pitch. CSS-Tricks editors read every guest writer's guidelines pitch through their explicit "not marketing content" filter. Product mentions have to be earned by the article's substance.
