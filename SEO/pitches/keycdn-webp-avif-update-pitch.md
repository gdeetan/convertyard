# KeyCDN pitch — Update-focused (original pitch had factual errors, rewritten)

**Two target articles (both severely outdated):**

**WebP article:**
- URL: https://www.keycdn.com/blog/convert-to-webp-the-successor-of-jpeg
- Author: Sven Baumgartner
- Last updated: September 4, 2022 (~4 years old)

**AVIF article:**
- URL: https://www.keycdn.com/blog/avif (not `/blog/avif-image-format` — that 404s)
- Author: Martin Williams (different author from WebP article)
- Published: October 17, 2019 (~7 years old)

## Major factual errors in the original pitch

The original pitch describes content that isn't actually in these articles:

- ❌ Pitch says AVIF article has an "encoder comparison and browser support table" — **it has neither**
- ❌ Pitch says AVIF article recommends "avifenc via command line" — **avifenc is not mentioned once**
- ❌ Pitch says WebP article's "ImageMagick route" — **ImageMagick is not mentioned**
- ❌ Pitch says both articles are "technically thorough" for developers — the AVIF article's encoding advice is one paragraph of theoretical libaom-C-API references; the WebP article's conversion advice is a WordPress plugin recommendation

Sending the pitch as drafted would make it obvious that the writer didn't read the articles. That's a first-impression killer worse than any grammar mistake — it looks like a template/AI-generated pitch.

## What both articles ACTUALLY recommend

**WebP article (Sven Baumgartner, 2022) recommends:**
- Optimus WordPress plugin + Cache Enabler (for WordPress users — outdated since WP 5.8+ ships native WebP)
- .htaccess rewrite rules to serve WebP based on `Accept` header
- No CLI, no ImageMagick, no browser-based tool

**AVIF article (Martin Williams, 2019) says:**
- "Choose libaom as your encoder" and use "the typical libaom encoder library known as C API"
- No `avifenc`, no `cavif`, no browser-based tool
- Claims AVIF "cannot be downloaded by Chrome, Firefox, or Explorer" (Chrome 85 shipped AVIF Aug 2020, Firefox 93 Oct 2021, Safari 16 Sept 2022)

## Both articles are genuinely broken in 2026 — that's the real hook

Real factual errors that KeyCDN readers are seeing right now:

**WebP article:**
- "Opera and Chrome support WebP" (in fact: everything including Safari, Firefox, Edge)
- "Firefox has announced support... in the future" (Firefox shipped WebP in FF 65, January 2019)
- "Internet Explorer and Safari are left out completely" (Safari 14 shipped WebP in Sept 2020)
- Recommends third-party WP plugins that WordPress core made unnecessary in 5.8+

**AVIF article:**
- "Most web browsers do not currently support this type of image format" (in fact: Chrome, Firefox, Safari, Edge, and Opera all ship AVIF)
- "It will be hard to understand the potential that this format has" (in fact: AVIF is now default on many sites and CDN pipelines)
- No modern encoder guidance (avifenc, cavif, cavif-rs, and Squoosh/browser-based options all exist now)

This is a real, honest update opportunity for KeyCDN. Not "add my tool" — "your articles are years out of date and losing trust with readers who compare against caniuse.com."

## Submission channel

- **No public write-for-us page** (both `/blog/write-for-us` and `/blog/contribute` → 404)
- `/contact` and `/support` pages exist — check the contact page for the form or the direct email
- KeyCDN historically publishes guest posts by external practitioners (Julia Evans and others have contributed to their blog) — this is a real submission target, not a locked-down operation

Send to whatever email is listed on their `/contact` page. Verify before sending — I couldn't fully extract it from the page markup.

---

## Revised pitch (send after confirming email address on /contact)

**Subject:** Two of your image-format articles need a 2026 update — happy to help

Hi KeyCDN team,

Two of your image format articles are showing their age in ways that are probably affecting the trust readers place in the blog:

1. Convert to WebP Format - The Successor of JPEG by Sven Baumgartner (last updated Sep 2022): still says Firefox WebP support is "in the future" (shipped 2019), Safari is "left out completely" (shipped 2020), and only Chrome and Opera support the format. Also recommends third-party WP plugins that became unnecessary when WordPress 5.8 shipped native WebP in July 2021.

2. AV1 Image File Format (AVIF) by Martin Williams (Oct 2019): claims "most web browsers do not currently support this type of image format" and that AVIF "cannot be downloaded by Chrome, Firefox, or Explorer." Chrome 85 shipped AVIF in Aug 2020, Firefox 93 in Oct 2021, Safari 16 in Sept 2022. The encoding section recommends "libaom C API" — modern practitioners now use `avifenc` (from libavif), `cavif-rs`, or browser-based tools.

Both articles still rank because they were early and thorough for their time, so a reader who lands on them from a Google search assumes the info is current. It isn't.

What I'd like to offer: I can supply the specific corrections and updated recommendations for both articles — accurate browser support (with caniuse.com references), current encoder options for AVIF, current WebP tooling (WordPress core, `cwebp`, browser-based converters), and updated .htaccess rules that account for Safari's `Accept: image/webp` header behavior.

I run ConvertYard (https://convertyard.com), a set of browser-based image converters (HEIC/JPG/PNG → WebP/AVIF, all client-side via WebAssembly). One of the modern browser-based options I'd suggest listing as "no-CLI alternative" is ConvertYard itself, but the update is worth doing regardless of what tools you decide to include — the outdated browser-support claims are the bigger credibility issue.

Two ways I can help:

- Option A: send you a redlined document with corrections, current sources, and suggested new content sections. Your team edits and publishes in-house.
- Option B: I write a full updated draft for either article, submitted as a guest contribution with a bio link. You edit and publish.

Either works — happy to do whichever fits your editorial process.

— Garrick Dee Tan
ConvertYard · convertyard.com
gdtwebmaster@gmail.com

---

## Notes for follow-up

- **Verify the correct email address on `/contact` before sending.** Do not send blind to `info@keycdn.com` or a guessed alias.
- Do NOT send the original pitch. Its factual errors would burn future outreach permanently — KeyCDN's engineers will spot them immediately.
- If they say yes to Option A (redlines), respond within 48 hours with the actual document. Include real source links (caniuse.com URLs, WP core changelog, MDN docs for AVIF/WebP) — not just claims.
- If they say yes to Option B (guest post), the WebP one is the better first draft — the AVIF article needs a bigger structural overhaul that's harder to sell as a first guest contribution.
- If they say no or don't reply: the research is still useful. You can self-publish the "why every WebP/AVIF blog post from 2019-2022 is now wrong" article on Hashnode as one of your freeCodeCamp contributor samples.
- KeyCDN is a Swiss/Austrian company — response times may skew European business hours.
- **Do not push for the ConvertYard link in the first email.** The whole pitch value hinges on being credible about the errors. If they trust the corrections, the link happens naturally in Option A or Option B. If you push for the link upfront, you look like every other SEO outreach and they'll decline.
