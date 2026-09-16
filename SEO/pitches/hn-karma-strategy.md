# HN Karma Strategy — ConvertYard

**Goal:** Build enough Hacker News karma to unlock link submissions, then post a Show HN for ConvertYard.

**Context:** New HN accounts can't submit links until they have a few upvoted comments. Target: 2–3 good comments = enough karma to submit.

---

## Hacker Newsletter Pitch

Once Show HN is live, email Kale Davis (curator) at **kale@hey.com**:

**Subject:** ConvertYard — batch file converter that runs entirely in the browser

> Hi Kale,
>
> I built a file conversion tool called ConvertYard. The whole thing runs in the browser via WebAssembly — libvips for images, ffmpeg for video, mupdf for PDFs. Nothing goes to a server, because there isn't one handling your files.
>
> The part I hadn't seen elsewhere was batch handling that actually works at scale. Drop 1,000 files, it processes them in parallel and packages a ZIP. Most converters quietly upload to S3 while showing a fake progress bar, or cap you at 20 files. I got tired of that.
>
> Planning a Show HN soon — figured I'd mention it in case it fits what you curate.
>
> Garrick
> convertyard.com

---

## Posts to Comment On (captured 2026-07-23)

### 1. Show HN: Bento — PowerPoint in one HTML file
**URL:** https://news.ycombinator.com/item?id=49008211 · 637pts
**Why:** Same category — browser-native tool, no server. Most relevant post on the page.

**Comment:**
> "The single-file approach is clever. I've been going a similar direction with ConvertYard — everything runs in-browser via libvips/mupdf WASM, no server involved. The tricky part has been handling 500+ files without blocking the main thread. Curious how Bento handles large presentations with lots of embedded assets?" - done

---

### 2. Ghost Cut — why Cut and Paste is broken everywhere
**URL:** https://news.ycombinator.com/item?id=49007626 · 126pts
**Why:** File/data UX problems. Natural angle for file conversion UX issues.

**Comment:**
> "Same frustration applies to file converters — the UX is almost universally broken. Most tools silently upload your files to S3 while showing a spinning wheel, then email you a link. The File System Access API has made it possible to do this properly in-browser now, but almost nobody uses it."

---

### 3. Back to Kagi
**URL:** https://news.ycombinator.com/item?id=49006195 · 193pts
**Why:** Privacy-focused tool discussion. Local-first as a trust signal.

**Comment:**
> "The trust problem is real across the web, not just search. I've noticed the same dynamic building a file converter — 'your files never leave your browser' is one of those claims that's easy to make and hard to verify for users. We ended up making it structurally true (everything is WASM, there's no backend) so there's nothing to misconfigure."

---

### 4. Safari Technology Preview 248 (stretch)
**URL:** https://news.ycombinator.com/item?id=49013356 · 71pts
**Why:** Only worth commenting if the thread discusses WASM or File System Access API improvements.

---

## Rules for Commenting

- Don't plug ConvertYard directly — let it come up naturally or via your profile
- Ask a genuine question or add a real observation
- Keep it under 4 sentences
- Aim for comments on #1 and #2 first — highest points = most visibility

---

## Next Steps

1. Comment on Bento and Ghost Cut posts today
2. Check karma — if >2, submit Show HN
3. Once Show HN is live, email Kale with the thread link
