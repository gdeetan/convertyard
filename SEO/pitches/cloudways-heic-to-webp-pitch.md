# Cloudways guest post pitch — HEIC → WebP before WordPress upload - Pitch Sent Aug 14 2026

**Target article:** How to Serve Images in Next-Gen Formats in WordPress – A Comprehensive Guide (Inshal Ali, updated Dec 28, 2023)
URL: https://www.cloudways.com/blog/serve-next-gen-formats-wordpress/

**Submission channel:** https://www.cloudways.com/en/write-for-us.php (form only — no public email)
**Outline template to follow:** https://docs.google.com/spreadsheets/d/1IhtcdZjBdUMNG96QEWipPGH9Jb8FWQ_AHsXefQuVTYk/
**Category to pick in the form:** "WordPress Speed & Performance" (or "WordPress Tutorials & Guides")

---

## Message to paste into the form's "Topic Details" field

Hi Inshal (and Cloudways editorial),

Your next-gen formats guide is the piece I send clients when they ask why their site is slow — the WebP Express / EWWW / `.htaccess` / `<picture>` walkthrough is genuinely the cleanest one online. I want to pitch a companion post that plugs the one gap I hit every time I deploy that stack for a client: **HEIC input from iPhones.**

WordPress core doesn't allow `.heic` in the upload MIME allowlist, so a client who drops photos straight from their iPhone into the media library gets "Sorry, this file type is not permitted for security reasons" — and Imagify, ShortPixel, WebP Express, and EWWW never run because nothing was ever uploaded. Even sites that whitelist HEIC via `upload_mimes` hit the second problem: GD and most ImageMagick builds on shared hosts can't decode HEIC, so thumbnails and WebP variants fail silently. The Cloudways guide's pipeline is correct; it just assumes JPG/PNG input, and iPhone clients break that assumption on day one.

The post I'd write is the pre-step: **converting HEIC to WebP in the browser before it reaches the media library**, so the rest of your recommended stack (Imagify, WebP Express, `.htaccess` rewrite) works exactly as documented.

**Proposed title:** *When Your Client Sends HEIC: The Missing Step Before WordPress Image Optimization*

**Rough outline (I'll submit the formal one in your Google Sheet template on approval):**

1. **Why the optimization pipeline breaks before it starts** — a walkthrough of what actually happens when a non-technical client uploads an iPhone photo to WordPress (MIME rejection, silent thumbnail failure, WebP variant never generated). Screenshots of the real error.
2. **Two failure modes, one root cause** — (a) core MIME rejection, (b) GD/ImageMagick without libheif. Why the fix isn't "just whitelist the MIME."
3. **Three fixes, ranked** — server-side plugin (heavy, needs libheif on the host), Cloudflare/CDN transform (works but adds a dependency), and browser-side conversion before upload (no plugin, no server config, works on any host including Cloudways). Trade-offs table.
4. **The browser-side workflow** — libheif-wasm decoder → canvas → WebP encode, all client-side. Code snippet of the core conversion, plus a "give this URL to your client" flow using an existing tool so non-devs aren't running scripts. Handles batches (a wedding photographer client sending 400 photos won't crash a tab).
5. **Where this slots into the Cloudways stack** — once files land as WebP, Imagify / WebP Express / EWWW / `.htaccess` behave exactly as your guide describes. Includes an internal link back to your next-gen formats guide as the "next step after conversion."
6. **When NOT to use browser conversion** — if the client has SSH/plugin access and the host supports libheif, ImageMagick server-side is fine. This post is for the (very common) case where they don't.
7. **Key Takeaways box at the top** + FAQ section with FAQPage schema.

**Length:** ~1800–2200 words, well over your 1500 minimum. Arial 12pt, ≤2 no-follow links to my project, one dofollow internal link to your next-gen formats guide as the natural continuation.

**Why me:** I built ConvertYard (convertyard.com), a network of local-first WASM converters including a HEIC → WebP tool that runs entirely in-browser. I've handled this exact problem for photographer and real-estate clients on managed WP hosts (including Cloudways) and want to document the workflow properly. The article won't be a product plug — the technique works with any browser-based HEIC decoder; ConvertYard is one implementation, mentioned once in context.

Happy to send the full outline in your Google Sheet template as soon as you'd like to see it, or adjust the angle if you'd prefer a different slice (e.g. "HEIC support for WooCommerce product galleries" is a tighter version if that fits the calendar better).

— Garrick Dee Tan
convertyard.com


(Working title: When Your Client Sends HEIC: The Missing Step Before WordPress Image Optimization

The gap this fills: Your existing guide "How to Serve Images in Next-Gen Formats in WordPress" by Inshal Ali covers WebP/AVIF beautifully via Imagify, WebP Express, EWWW, .htaccess, and <picture>. It assumes JPG/PNG input. The moment a client uploads iPhone photos, the entire pipeline breaks before it starts — WordPress core rejects .heic from the MIME allowlist ("Sorry, this file type is not permitted for security reasons"), and even sites that whitelist HEIC via upload_mimes hit a second wall: GD and most shared-host ImageMagick builds can't decode HEIC without libheif, so thumbnails and WebP variants fail silently. This post is the pre-step that makes the recommended stack actually work for real-world clients.

Proposed outline (~1800–2200 words):

1. Key Takeaways box
2. Why the optimization pipeline breaks before it starts — the exact upload error, screenshots, and what's happening under the hood
3. Two failure modes, one root cause: (a) core MIME rejection, (b) GD/ImageMagick without libheif
4. Three fixes ranked with a trade-offs table: server-side plugin (needs libheif on host), CDN transform (adds dependency), browser-side WASM conversion (host-agnostic, no plugin)
5. The browser-side workflow: libheif-wasm → canvas → WebP encode, with a code snippet and a "give this URL to your client" flow for non-technical uploaders. Handles 400+ photo batches without crashing a tab.
6. Where this slots into the Cloudways stack — once files land as WebP, Imagify / WebP Express / EWWW / .htaccess behave exactly as Inshal's guide describes. Internal link to that guide as the natural next step.
7. When NOT to use browser conversion — if the client has SSH and libheif is available on the host, server-side is fine.
8. FAQ section (FAQPage schema)

Length: 1800–2200 words. Arial 12pt. One dofollow internal link to your next-gen formats guide. Up to two no-follow links to my project.

Why me: I built ConvertYard (convertyard.com), a network of local-first WASM converters including HEIC → WebP that runs entirely in-browser. I've solved this exact problem for photographer and real-estate clients on managed WP hosts. The article won't be a product plug — the technique works with any browser HEIC decoder; ConvertYard is one reference implementation, mentioned once in context.

Happy to send the full outline in your Google Sheet template on approval, or reshape the angle (e.g., a WooCommerce product-gallery version) if that fits the calendar better.)

---

## Form field values

- **First Name:** Garrick
- **Last Name:** Dee Tan
- **Email:** gdtwebmaster@gmail.com
- **Category:** WordPress Speed & Performance
- **Website URL:** https://convertyard.com
- **Cloudways customer:** No (unless you are — check first)
- **Twitter / LinkedIn:** fill from your profiles
- **Your Biography:** Garrick builds ConvertYard, a network of local-first, batch-first file conversion tools that run entirely in the browser via WebAssembly. Focuses on the intersection of image pipelines and non-technical client workflows — the "my client just sent me 400 iPhone photos" problems that break otherwise good CMS setups.
- **Topic Details:** paste the message above.

---

## Notes for follow-up

- If the form gets no reply in 2 weeks, try tweeting @Cloudways or reaching Inshal Ali on LinkedIn with a one-line nudge referencing the form submission date.
- Do NOT cold-email a personal Cloudways address — their process is explicitly form-based, and going around it will burn the pitch.
- If accepted, remember: the article must include at least one dofollow link to a Cloudways post. The next-gen formats guide itself is the obvious one; the WordPress image optimization guide (linked from within it) is a second option.
