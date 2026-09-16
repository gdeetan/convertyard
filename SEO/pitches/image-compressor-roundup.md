## Best Image Compressors - google search #

## SaleSlayer

Link: https://blog.saleslayer.com/the-best-image-compressors
Email: vero.gasco@saleslayer.com - Pitch Sent Aug 18 2026

Subject: small update for your image compressor roundup
Hi Vero,

Your image compressor roundup still ranks well for me when I search around ecommerce image optimization — the JPG vs PNG breakdown up top is genuinely clearer than most of what's out there.

One thing I noticed while re-reading: the piece was published in 2019, and a lot has shifted for catalog teams since. WebP is now supported everywhere and AVIF is close behind — both cut file size 25–50% below optimized JPG, which matters a lot when you're pushing thousands of product shots through a PIM. Also, most of the tools on your current list cap out around 20 files or 5–25 MB per upload, which is painful for anyone running a real catalog refresh.

I built ConvertYard partly because of that gap. It's a browser-based batch compressor — JPG, PNG, WebP, and AVIF in and out, up to ~1000 files at once, no upload to a server (everything runs client-side via WebAssembly), no account, no watermark. For a Sales Layer reader compressing a full product catalog, that's a meaningful workflow change vs. TinyPNG's 20-file cap or Kraken's paid tier.

If it's a fit, it would slot naturally into the "Websites for image compression" section, or into a "Modern browser-based compressors" note near the top. Here's a one-line description if easier:

ConvertYard (https://convertyard.com/compress-image) — Local-first batch compressor. JPG, PNG, WebP, AVIF. Up to 1000 files, no uploads, free.

Either way, thanks for keeping that piece live — it's still one of the more useful roundups on this topic.

Garrick
ConvertYard

## SitePoint

Link: https://www.sitepoint.com/image-compression-tools/
Email: editors@sitepoint.com
Author: ada.ivanoff@sitepoint.com - Pitch Sent Aug 18, 2026
Subject: small addition for your image compression tools showdown

Hi Ada,

Your "Showdown! 5 Online Image Compression Tools Compared" is one of the few compressor roundups that actually tests output rather than just listing features — I still see it cited when devs ask which tool to reach for.

Sharing one for the next update: I built ConvertYard, a browser-based batch image compressor aimed at devs who want to skip the upload-to-a-server dance. A few things that make it fit SitePoint's audience specifically:

- Runs entirely client-side via WebAssembly (libvips under the hood) — no upload, no account, no queue, works offline once loaded.
- Batch by default — drop 1000 files, get a ZIP back. TinyPNG's 20-file/5MB free cap is a real ceiling for anyone doing site-wide asset work.
- WebP and AVIF in and out, alongside JPG and PNG — the current 5-tool list is mostly JPG/PNG only.
- Free, no watermark, no signup.

Slotting it into the comparison would work either as a 6th entry or as a "modern browser-local alternative" callout near the top.

One-line description if easier to drop in:

ConvertYard (https://convertyard.com/compress-image) — Local-first batch image compressor. JPG, PNG, WebP, AVIF. Up to 1000 files, runs in-browser via WebAssembly, no uploads, free.

Happy to send test output vs. the current 5 if that would help — quality comparison at matched file sizes, that kind of thing.

Either way, appreciate you keeping the piece maintained. Not many roundups from 2014 are still useful in 2026.

Garrick
ConvertYard

## Tinify

Link: https://tinify.com/blog/best-image-compression-software

## AlikGriffin

Link: https://alikgriffin.com/best-image-compressor-for-windows/

Pitch Sent 18, 2026
Subject: quick note on your Windows image compressor post

Hi Alik,

Read your "Best Image Compressor For Windows 11" post — the ImageOptim-alternative framing is spot on. That's genuinely the hardest gap to fill for photographers who switched from Mac, and I agree Caesium is the least-bad option (Riot's UI is exactly the 1995 vibe you described).

Wanted to flag one more for your readers: I built ConvertYard, a browser-based batch image compressor. The reason it might fit your post specifically:

- Nothing to install. Works the same on Windows or Mac from the same URL — so a reader coming from ImageOptim doesn't need to hunt for a Windows equivalent at all.
- Lossy JPG compression with quality control, plus optional EXIF/metadata preservation for copyright.
- Batch — drop a folder of shoot exports, download a ZIP.
- Runs entirely client-side (WebAssembly / libvips) — no upload to a server, which matters when you're compressing unreleased client work.
- Free, no account, no watermark.

Not pushing WebP — I saw your take in the post and honestly agree that a well-compressed JPG covers most photographer/blogger needs.

Link if you want to poke at it: https://convertyard.com/compress-image

Either way, thanks for actually writing an opinionated post instead of the usual "top 10" spam you called out. Rare to find.

Garrick
ConvertYard

#AWPLife

Link: https://awplife.com/best-top-20-image-compressor-and-resizer-tools/?srsltid=AfmBOorQtdYBSsEV_LC18tJnqEXbDKizpYTyHvbabs7836etRI6ygIHs

Email: support@awplife.com - Pitch Sent Aug 18 2026
Subject: one for #21 on your image compressor list

Hi team,

Read your "Best Top 20 Image Compressor And Resizer Tools for 2026" — solid roundup, and I especially liked that you called out ImageOptim's local-only processing as a real feature (most lists miss that framing entirely).

One suggestion for a future update or #21 slot: I built ConvertYard, a browser-based batch image compressor. It fits into the gap between Squoosh and TinyPNG on your list — specifically:

- Squoosh (your #6) is browser-based and supports WebP/AVIF/JPEG XL, but it only handles one file at a time. That's fine for developers experimenting with formats, painful for a WordPress owner cleaning up 500 media library images.
- TinyPNG (your #1) handles batch but only 20 files / 5MB free, and everything uploads to their servers — not ideal for client work under NDA.

ConvertYard is Squoosh's format support + real batch processing (up to ~1000 files, ZIP output) + fully client-side via WebAssembly (nothing uploaded, works offline once loaded). Free, no signup, no watermark.

For your WordPress audience specifically, the pitch is: "compress the whole media library export in one drop, without uploading it to a third party."

One-line description if easier to slot in:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch image compressor. JPG, PNG, WebP, AVIF. Up to 1000 files, runs locally via WebAssembly, no uploads, free.

Best for: Bulk WordPress media library optimization, privacy-conscious workflows, no-install batch processing.

Happy to send a screenshot of a real batch run if that would help.

Thanks for keeping the list current — most "top 20" posts are from 2019 and still list JPEGmini as cutting-edge.

Garrick
ConvertYard

#MiniPX

Link: https://minipx.com/blog/best-free-image-compressor-tools/

#RoundCut

Link: https://roundcut.app/blog/best-7-image-compressor-software-2026/

#FileSlim

Link: https://fileslim.com/comparisons/best-image-compression-tool

#SarahWorBoyes

Link: https://sarahworboyes.co.uk/best-image-compression-tools/

Subject: quick note on your image compression tools post

Hi Sarah,

I found your "Best Image Compression Tools" post while researching what people actually recommend for WordPress speed work — and honestly it's one of the least dry write-ups on this topic I've come across. The "dodgy photocopier" line made me laugh.

Wanted to flag one more for a future update: I built ConvertYard, a browser-based batch image compressor. Why it might suit your readers specifically:

- Handles JPG, PNG, WebP, and AVIF (in and out) — so your readers can convert straight to WebP without a separate step.
- Batch by default — drop up to ~1000 files, get a ZIP back. TinyPNG's 20-file / 5MB free cap is genuinely painful when someone's compressing an entire WordPress media library.
- Runs entirely in the browser via WebAssembly — nothing uploaded to a server, which matters when you're touching a client's brand assets.
- Free, no signup, no watermark.

For a small biz owner following your guide and trying to compress a folder of 200 blog images before uploading to WordPress, it's a workflow saver.

Site if you want to poke at it: https://convertyard.com/compress-image

Either way, thanks for writing something readable on a topic that's usually a snoozefest.

Garrick
ConvertYard

#HowtoConvert

Link: https://howtoconvert.co/blog/best-jpg-to-avif-converters

#ThimPress

Link: https://thimpress.com/best-free-jpg-to-avif-converter/

Email: hoadt@thimpress.com - Pitch Sent Aug 18, 2026

Subject: one more free JPG to AVIF converter for your roundup

Hi Sally,

Read your "8+ Best Free JPG to AVIF Converter" post — I appreciate that you actually explained why AVIF matters for WordPress speed rather than just listing tools. That HDR + royalty-free framing is more accurate than most write-ups I've seen on this format.

Wanted to flag one for a future update: I built ConvertYard, a browser-based JPG to AVIF converter. Two things that make it a fit for a WordPress-focused audience specifically:

- Real batch processing — up to ~1000 JPGs in, ZIP of AVIFs out. Convertio (your current pick) supports batch but the free tier caps hard on file count and size; ConvertYard has no per-file limit because the browser is the ceiling.
- Nothing uploaded — all conversion runs client-side via WebAssembly (libvips + AVIF encoder). Matters for WordPress users touching client media libraries or unreleased assets.

Also free, no signup, no watermark, drops EXIF automatically.

For a WordPress site owner following your guide to convert an entire media library to AVIF, it's a workflow saver vs. uploading batches through Convertio's free tier.

One-line description if easier to slot in:

ConvertYard JPG to AVIF (https://convertyard.com/jpg-to-avif) — Browser-based batch converter. Handles ~1000 files at once, runs locally via WebAssembly (nothing uploaded), free with no signup.

Pros:
- Real batch (up to 1000 files)
- 100% local, no upload
- Free, no watermark, no signup

Cons:
- Browser-based only (no desktop app or WordPress plugin yet)

Happy to send a quick screenshot of a 500-file batch run if that would help visualise it.

Either way, thanks for keeping the AVIF conversation going — WordPress 6.5 finally supporting it native was overdue, and posts like yours help site owners actually adopt it.

Garrick
ConvertYard

#Hostinger

Link: https://www.hostinger.com/tutorials/optimize-images-wordpress/?utm_source=google&utm_medium=cpc&utm_id=21813259421&utm_campaign=Generic-Tutorials-DSA-t3|NT:Se|LO:Other-ASIA&utm_term=&utm_content=717370304366&gad_source=1&gad_campaignid=21813259421&gbraid=0AAAAADMy-haeZx88kUcEl9H4oxIroZe_Z&gclid=Cj0KCQjw-frTBhCvARIsADv4XY73ZTLe6sYy07n-NW5znSGgbl6zlvdNl23nXiWrORZpGbkwyNqUXMUaAmdbEALw_wcB

Subject / opener (adapt to LinkedIn):

quick note on your WordPress image optimization tutorial

---
Copy-paste pitch (LinkedIn DM or contact form):

Hi Hasna,

Read your "How to optimize images for WordPress" tutorial — the structure is clean and the plugin comparison section is more useful than most competing guides on this topic.

Sharing one you might consider for a future update: I built ConvertYard, a browser-based batch image compressor and format converter. Why it might fit alongside the plugin recommendations in your tutorial:

- Pre-upload workflow. Most WordPress plugins (Smush, ShortPixel, etc.) compress after upload. For site owners preparing a media library migration or a bulk image refresh, ConvertYard lets them compress + convert (JPG → WebP or AVIF) before uploading — no plugin needed, no server round-trip.
- Batch of up to ~1000 files in a single drop, ZIP output.
- Runs entirely client-side via WebAssembly — nothing uploaded to a server, useful for anyone handling client work under NDA.
- Free, no signup, no watermark.

It slots into the "manually optimize images before upload" section (or as an alternative to WordPress plugin-based workflows for one-time cleanup jobs).

Link: https://convertyard.com/compress-image

Not asking for a link commitment — happy for you to just test it and see if it fits editorially.

Garrick
ConvertYard

#Kinsta
Pitch Sent Aug 18, 2026
Subject: browser-based batch tool for your image optimization guide

Hi Kinsta content team,

Read "How To Optimize Images for Web and Performance" — the layered structure (format → compression → lossy vs lossless → tools → resize) is genuinely one of the clearest walkthroughs of this topic I've seen. And it shows in that you keep it updated — March 2026 is refreshing for an image optimization article.

Wanted to flag one for the "Image Optimization Tools and Programs" section on a future refresh: I built ConvertYard, a browser-based batch image compressor and converter. Why it might fit alongside your current ShortPixel / TinyPNG / ImageOptim picks:

- Pre-upload workflow. ShortPixel and Smush optimize after upload — great for automation, but painful for one-off cleanup jobs (media library migration, bulk product image refresh). ConvertYard lets a Kinsta customer compress + convert (JPG → WebP or AVIF) before uploading, no plugin required.
- Real batch. Up to ~1000 files in a single drop, ZIP output. TinyPNG's 20-file / 5MB free cap is the main friction people mention in that step of your guide.
- Runs entirely client-side via WebAssembly (libvips + AVIF/WebP encoders). Nothing uploaded to a server — matters for agencies touching client media libraries under NDA.
- Free, no signup, no watermark.

The natural slot would be next to your existing "Websites for image compression" grouping — as the "browser-local batch" option to complement TinyPNG's cloud-batch approach.

One-line description if easier to slot in:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch compressor and format converter. JPG, PNG, WebP, AVIF in and out. Up to ~1000 files per batch, runs locally via WebAssembly (nothing uploaded), free, no signup.

Happy to send a matched-quality benchmark vs. TinyPNG and Squoosh output if that would help editorially — same input images, same target quality, actual file sizes.

Either way, thanks for keeping the piece maintained. Most "optimize images for web" articles were written in 2018 and never touched again.

Garrick
ConvertYard

## Bryant.Edu

Link: https://is.bryant.edu/how-optimize-images-web
helpdesk@bryant.edu - PITCH Sent Aug 18 2026
ITServiceDesk@bryant.edu

Subject: small suggestion for your image optimization guide

Hi Bryant IS team,

I came across your "How to Optimize Images for the Web" tutorial while looking at how universities document image workflows for staff. It's genuinely clearer than most — the resize-then-compress-in-that-order framing is exactly right, and the Squoosh walkthrough is the right level of detail for a non-technical staff audience.

Wanted to flag one addition that might help Bryant staff who follow the guide: Squoosh is excellent for single images, but it only processes one file at a time. For staff uploading batches of event photos, department portraits, or gallery imagery, that becomes a bottleneck fast.

I built a tool called ConvertYard that fills that gap:

- Batch processing — drop up to ~1000 images, get a compressed ZIP back.
- Same in-browser approach as Squoosh — files never upload to a server, runs locally via WebAssembly. Relevant if staff are compressing images with any sensitivity (student-adjacent content, unreleased event photos, etc.).
- Handles JPG, PNG, WebP, and AVIF in and out.
- Free, no signup, no watermark.

Could work as a callout in the tutorial along the lines of: "For batches of images, ConvertYard offers the same in-browser approach with support for compressing multiple files at once."

Link: https://convertyard.com/compress-image

Not asking for anything specific — happy for you to just try it against your existing Squoosh workflow and see if it fits. If there's a better contact for the person who maintains that page, I'd appreciate a forward.

Thanks for publishing a genuinely useful guide.

Garrick
ConvertYard

#MightlyBytes

Link: https://www.mightybytes.com/insights/how-to-optimize-images/
Email:  tim@mightybytes.com - PITCH SENT Aug 18 2026
hello@mightybytes.com
Subject: local-first image compression — sustainability angle for your Mightybytes post

Hi Tim,

Read "How to Optimize Images for Faster Load Times and Sustainability" — the framing around image weight as the dominant lever for page-level emissions matches the data I've seen too, and Ecograder's crawl history backing that claim is genuinely useful evidence. I also noticed the passing line about WordPress plugins and third-party services coming with "their own set of sustainability challenges" — that's the honest caveat most guides skip.

I wanted to flag something that ties into that specific point. I built ConvertYard, a browser-based image compressor and format converter, and the thing that might interest you specifically is that it's local-first — all compression runs client-side in the browser via WebAssembly (libvips + AVIF/WebP encoders). No server-side compute per image, no image upload traffic, no cloud round-trip.

The sustainability implication: cloud-based compressors (TinyPNG, ShortPixel, JPEGmini API, etc.) transfer the original image to a server, run compression on that server, and transfer the output back. Every one of those steps has an emissions cost. ConvertYard eliminates the transfer entirely and moves the compute to hardware the user is already powering.

I don't want to overstate this — the per-image savings are small in absolute terms. But for someone bulk-compressing a media library, or for a design team running compression thousands of times a month, the delta compounds. And it maps cleanly onto the Web Sustainability Guidelines section your article and Ecograder both align with.

Practical stats for context:

- Batch of up to ~1000 files per drop, ZIP output.
- JPG, PNG, WebP, AVIF in and out.
- No signup, no watermark, free — no incentive to gatekeep behind a paid tier that would push server-side workflow.

If it fits editorially, it could slot into the "Image Optimization Tools" section as an example of the local-first pattern — or as a specific answer to the third-party-service sustainability concern you already flagged.

Link: https://convertyard.com/compress-image

Also — genuinely appreciate the work you're doing on Ecograder and the Web Sustainability Guidelines. It's rare to find agency content that treats performance and emissions as the same problem.

Garrick
ConvertYard

#JoomUnited

Link: https://www.joomunited.com/news/how-to-easily-optimize-images-for-web-without-losing-quality
Email: hudypratama@joomunited.com - AUG 18 2026
hudy.pratama@joomunited.com
fajar@joomunited.com
damien@joomunited.com ← Damien Barrere, founder (well-known in WordPress community, sometimes handles editorial directly)
contact@joomunited.com
  
Subject: one more compression tool for your WordPress optimization guide

Hi Fajar,

Read "How to Easily Optimize Images for Web Without Losing Quality" — the section walking through format choice → resize → compress in that specific order is genuinely one of the better teach-throughs I've seen. Most posts jump straight to "install this plugin" without explaining the workflow.

Wanted to flag one for the "Compress Images" section on a future update: I built ConvertYard, a browser-based image compressor. Why it fits alongside your current TinyPNG / ShortPixel / Smush picks:

- No plugin, no upload. All compression runs client-side via WebAssembly (libvips + AVIF/WebP encoders). For a WordPress user who wants to compress before uploading — the workflow your article recommends — it removes the "sign up to TinyPNG" and "install another plugin" friction.
- Real batch. Up to ~1000 files per drop, ZIP output. Handy when someone's preparing a full media library refresh or a batch of blog images.
- JPG, PNG, WebP, AVIF in and out. Reader can compress + convert format in a single step.
- Free, no signup, no watermark.

The natural slot is as a fourth option in your Compress Images list, framed as "browser-based, no upload, batch."

One-line description if easier to slot in:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch image compressor. JPG, PNG, WebP, AVIF. Up to ~1000 files per batch, runs locally via WebAssembly (nothing uploaded), free, no signup.

Happy to send benchmark output against TinyPNG at matched quality if that would help editorially.

Either way, thanks for keeping the piece practical — a lot of WordPress optimization content is just "install our plugin" and calls it a day.

Garrick
ConvertYard

- Do NOT position ConvertYard as an alternative to WP Media Folder — their flagship product includes some optimization features. Position it as a pre-upload tool that complements any WordPress workflow (which is what it genuinely is).
- Mirrored their teach-through voice — they clearly value practical walkthroughs.
- If Fajar doesn't respond, escalate to Damien (founder) directly at ~14 days with a polite forward request: "wanted to make sure this reached the right person."
- Joomunited publishes constantly — if accepted, ask to be included in the sibling post: joomunited.com/news/awesome-wordpress-optimization-plugins (already linked from this article) as a non-plugin alternative.
- If they push back and offer paid placement: your call. Their audience is real WordPress buyers, but paid links carry SEO risk unless properly tagged sponsored.

#PraviKumar
Email: pravin@pravinkumar.co Aug 18 2026
hello@pravinkumar.co

Subject: re: your Webflow image optimization guide — on the AVIF tooling gap

Hi Pravin,

Read your "Complete Guide to Image Optimization on Webflow for 2026 SEO" — it's one of the more technically honest Webflow-specific guides I've come across. The line about AVIF conversion tools still being less mature than WebP tools is exactly the caveat most guides skip, and the pre-upload workflow recommendation is the right advice given how Webflow's CDN handles source assets.

Wanted to share one that might help close the AVIF tooling gap for your clients: I built ConvertYard, a browser-based batch image compressor and converter. What might interest you specifically:

- Handles both WebP and AVIF encoding in the browser via WebAssembly (libvips + AVIF encoders). Faster than most cloud AVIF tools because there's no upload round-trip — the browser encodes in place.
- Real batch — up to ~1000 files per drop, ZIP output. Fits the workflow of someone prepping a full Webflow asset library refresh.
- JPG, PNG, WebP, AVIF in and out, with quality control per format.
- Nothing uploaded — all processing runs client-side. Relevant when handling unreleased client assets.
- Free, no signup, no watermark.

For your clients following the pre-upload workflow you recommend, it removes one of the friction points — no need to sign up for TinyPNG, install a plugin, or wait for cloud AVIF encoders that are still, as you noted, slow.

Link: https://convertyard.com/compress-image

If it fits editorially, it would slot into your "How Should You Size and Compress Images?" section as the browser-based batch option, or as a specific answer to the AVIF tooling caveat you already flagged.

Also — genuinely appreciate the AEO framing throughout the piece. Not many Webflow-focused writers connect image optimization to AI-crawler citation signals, and that's going to matter more, not less.

Garrick
ConvertYard

Link: https://www.pravinkumar.co/blog/image-optimization-webflow-seo-complete-guide-2026

#AuthenticJobs

Link: https://authenticjobs.com/the-5-best-free-image-optimizer-tools/
Contact — priority order:

1. support@authenticjobs.com ← confirmed public inbox, most likely to be read - PITCH SENT AUG 18 2026
2. editorial@authenticjobs.com (guess)
3. hello@authenticjobs.com (guess)
4. Contact form: https://authenticjobs.com/contact/

Subject: one more no-signup image optimizer for your roundup

Hi Authentic Jobs editorial team,

Read "The 5 Best Free Image Optimizer Tools" — I liked that you led with Fullres specifically because it has "no extra hurdles." That's the right criteria for the designer/developer audience reading Authentic Jobs, and most compression roundups miss it entirely (they lead with plugin-based or signup-gated tools instead).

Wanted to share one for the list on a future update: I built ConvertYard, a browser-based image compressor and format converter. It fits the same "no hurdles" ethos as Fullres, but adds two things Fullres doesn't:

- Real batch processing — up to ~1000 files per drop, ZIP output. TinyPNG's 20-file / 5MB cap (which you flagged as a con) is the ceiling ConvertYard clears.
- Runs entirely client-side via WebAssembly — nothing uploaded to a server. Fullres and TinyPNG both send images to their servers; ConvertYard doesn't. Useful for designers touching client work under NDA.

Format-ready entry that matches your existing Pros/Cons style:

ConvertYard (https://convertyard.com/compress-image)
A browser-based batch image compressor and format converter. JPG, PNG, WebP, AVIF in and out. No signup, no watermark, and everything processes locally in your browser via WebAssembly — no upload to a server.

Pros:
- No sign-up required and completely free.
- Real batch — up to ~1000 files per drop, ZIP output.
- Runs locally in the browser (no upload).
- Handles WebP and AVIF, not just JPG/PNG.

Cons:
- No native desktop app (browser-only).
- Larger batches depend on the user's device performance.

Slots naturally as #6 or as a swap for one of the tools no longer maintained.

Happy to send a matched-quality comparison against Fullres and TinyPNG if that would help editorially.

Either way, thanks for keeping the piece tight — most "top 5" lists these days feel like they were written to hit a keyword, not to help anyone. This one reads like it was actually tested.

Garrick
ConvertYard
#WPEngine

Link: https://wpengine.com/blog/optimize-images-for-web/

#FatStacksBlog
 info@fatstacksblog.com - Pitch Sent Aug 18 2026
 Subject: one more for your 20 image optimization tools post

Hi Jon,

Read your "20 Image Optimization Software" post — I appreciated the honest "straight to the point, what do I use" section at the top. Most roundups bury their actual recommendation under 3000 words of listicle content. Yours doesn't.

Wanted to flag one for the list on a future update: I built ConvertYard, a browser-based batch image compressor. It fits alongside your Optimizilla and Bulkresizephotos.com picks (the pre-upload browser tools), but with a couple of advantages your existing options don't have:

- Real batch — up to ~1000 files per drop, ZIP output. Bulkresizephotos caps well below that and uploads everything.
- Runs entirely client-side via WebAssembly — nothing uploaded to a server. Faster for large batches (no upload wait) and works offline once loaded. Useful for niche site publishers processing folders of stock or AI-generated images.
- JPG, PNG, WebP, AVIF in and out. Reader can convert JPGs to WebP in the same step as compressing, which pairs well with your ShortPixel-plus-WebP workflow.
- Free, no signup, no watermark, no monthly credit limit.

Straight-shooter note: ConvertYard has no affiliate program, so there's no revenue angle here for you. I'm reaching out because it genuinely fits the "pre-upload browser tools" slot in your list, and figured it was worth flagging even without a commission attached. Totally understand if that changes the priority.

Link if you want to try it against Bulkresizephotos or Optimizilla: https://convertyard.com/compress-image

Either way, the WebP conversion recommendation you added post-2019 is the right call — most niche site owners still don't do it, and that's leaving Core Web Vitals scores on the table.

Garrick
ConvertYard

Link: https://fatstacksblog.com/image-optimization-software/

#F5 Studio
 1. info@f5-studio.com ← general, confirmed public - AUG 18 2026
  2. julia@f5-studio.com ← likely marketing/biz dev; best for outreach
  3. maks@f5-studio.com ← likely dev lead/owner; try if #1 and #2 quiet
 
Subject: browser-based batch tool for your image optimization article — and for agency use

Hi F5 Studio team,

I read your "Best Free Image Optimization Tools" article. The agency perspective at the start is honest — big JPEGs from clients slowing down WordPress sites is a real problem that most tool roundups ignore.

Two things I wanted to share:

1. A quick update note for the article. The section on image formats says WebP "is not supported by all browsers as of now." That was accurate a few years ago, but as of 2026, WebP has 97% global browser support and AVIF has 94%. Both are safe to recommend as defaults now, not just experimental formats. Might be worth a small update since your article ranks for people looking for current advice.

2. A tool to consider adding. I built ConvertYard — a browser-based batch image compressor and format converter. It might fit your list, and it might also be useful for your own agency workflow. Here's why:

- Runs entirely in the browser via WebAssembly. No files uploaded to any server. This is useful when you compress client images that are under NDA or unreleased brand assets.
- Real batch — up to about 1000 files per drop, ZIP output. Useful when you migrate a client media library.
- Handles JPG, PNG, WebP, AVIF in and out. You can convert JPGs to WebP in the same step as compressing.
- Free, no signup, no watermark.

For the article, it fits alongside your current tool picks as the "no upload, no signup, batch" option.

For your agency's internal workflow: same reason, but with the added benefit that you never expose client images to third-party servers.

Link if you want to try it: https://convertyard.com/compress-image

Happy to answer any questions if you want to test it on a real client batch.

Garrick
ConvertYard
 
Link: https://f5-studio.com/articles/best-free-image-optimization-tools/

#WPBuff

1. hello@wpbuffs.com ← standard founder pattern, best first guess -- PITCH SENT AUG 18 2026
2. content@wpbuffs.com (editorial guess)
3. info@wpbuffs.com (general guess)
4. Contact form: https://wpbuffs.com/contact/ (fallback — will route to sales, ask for editorial forward in the message)
5. LinkedIn: search "WP Buffs" + "Content" / "Editorial"

Subject: one more for your 18 image optimization tools post — no upload, batch

Hi WP Buffs editorial team,

Read "Optimize Images 300% in WordPress with 18 Free Tools and Plugins" — the split between pre-upload online tools and post-upload plugins is exactly the right structure for the WordPress audience, and it's clearer than most guides that just dump both into one list.

Wanted to flag one for the "Best Free Online Image Optimizer Tools" section on a future update: I built ConvertYard, a browser-based batch image compressor and format converter. Why it fits your audience specifically:

- Pre-upload workflow. Complements the plugin section rather than duplicating it — for site owners cleaning up a media library before migration, or agency partners onboarding a client site with a bloated /wp-content/uploads/ folder.
- Real batch — up to ~1000 files per drop, ZIP output. Most of the online tools in your current list (TinyPNG, Compressor.io, etc.) cap between 5–20 files free.
- Runs entirely client-side via WebAssembly — nothing uploaded to a server. Relevant for your white-label agency partners handling client images under NDA.
- JPG, PNG, WebP, AVIF in and out — supports converting formats in the same step as compressing.
- Free, no signup, no watermark.

There's a specific value here for the WP Buffs agency partner audience: cleaning up a new client's media library often means compressing hundreds of legacy images. Doing that in-browser (no upload, no per-file fee) is meaningfully faster than uploading batches to TinyPNG's free tier and hitting their limits.

One-line description if easier to slot in:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch image compressor and converter. JPG, PNG, WebP, AVIF. Up to ~1000 files per batch, runs locally via WebAssembly (nothing uploaded), free with no signup.

Happy to send a benchmark against TinyPNG or Optimizilla at matched quality if that would help editorially.

Either way, thanks for keeping the piece comprehensive — most 2024 WordPress image optimization guides skip the pre-upload workflow entirely and jump straight to plugin recommendations.

Garrick
ConvertYard

Link: https://wpbuffs.com/optimize-images-wordpress/

#1st WebDesigner

1. Contact form: https://1stwebdesigner.com/about/ (scroll to "Contact Us")
2. Email format is first@1stwebdesigner.com — but no public editor name to target
3. Try: editor@1stwebdesigner.com, hello@1stwebdesigner.com, admin@1stwebdesigner.com (guesses) - pitch sent Aug 18 2026
4. LinkedIn: search "1stWebDesigner" + "Editor" / "Content"

Subject: noticed your image optimization tools post is due for a refresh

Hi 1stWebDesigner editorial team,

I came across "10 Free Tools and Apps for Optimizing Images" while researching what people currently recommend for image compression. The piece still ranks well, but it's from April 2019 — and the image tooling landscape has shifted significantly since then. A few things a 2026 reader would find surprising:

- No mention of WebP or AVIF — these are now supported by 97% and 94% of browsers globally, and are the practical default formats for modern web builds.
- APNG Assembler, Pngcrush, gulp-image — tools that are either abandoned, effectively obsolete, or replaced by newer alternatives (Sharp, Squoosh, etc.).
- No batch-oriented browser tools — the "compress this image" workflow has largely moved from single-file uploads to batch processing (Squoosh added batch, TinyPNG added higher-tier batch, several new browser-local tools appeared).

Wanted to flag one for whenever the piece gets a refresh: I built ConvertYard — a browser-based batch image compressor and converter that fits the modern slot. Specifically:

- JPG, PNG, WebP, AVIF in and out — covers the formats the current article doesn't mention.
- Real batch — up to ~1000 files per drop, ZIP output.
- Runs entirely client-side via WebAssembly — nothing uploaded, no signup, no watermark, free.

If updating the 2019 article isn't in the cards, I'd be happy to write a fresh companion piece — something like "Image Optimization in 2026: What Actually Changed Since 2019" — that references the original and takes readers into the current landscape. Happy to draft an outline for you to review first, no obligation.

Link if you want to check the tool: https://convertyard.com/compress-image

Either way, thanks for keeping the original post live — even outdated, it still gets clicked. Which is a good problem to have and a reason to update it.

Garrick
ConvertYard

Link: https://1stwebdesigner.com/free-tools-apps-optimizing-images/

#Indeed

Link: https://www.indeed.com/career-advice/career-development/how-to-reduce-the-size-of-picture

#Skylum

Link: https://skylum.com/how-to/how-to-reduce-the-size-of-picture

#BloggingWizzard

Link:  https://bloggingwizard.com/image-compression-tools/
1. adam@bloggingwizard.com ← best first guess (standard founder pattern) -- PITCH SENT AUG 18 2026
2. hello@bloggingwizard.com (secondary)
3. editor@bloggingwizard.com (they have an editor role)
4. Contact form on https://bloggingwizard.com/about/
5. LinkedIn DM to Adam: https://uk.linkedin.com/in/adamconnell

Subject: one for the browser-based section of your image compression roundup

Hi Adam,

Read "10 Best Image Compression Tools For 2026" — the split you make between plugin-based tools (NitroPack, ShortPixel) and browser-based tools (TinyPNG, Squoosh) is exactly the framing readers need, and it's clearer than most compression roundups that just dump everything into one list.

Wanted to flag one for the browser-based section on a future update: I built ConvertYard, a browser-based batch image compressor and converter. Why it might fit alongside your current TinyPNG / Squoosh picks:

- Real batch — up to ~1000 files per drop, ZIP output. Squoosh is a great one-file-at-a-time tool but has no batch mode; TinyPNG batches 20 files at a time and 5MB per file on free. ConvertYard closes both caps.
- Runs entirely client-side via WebAssembly (libvips + AVIF/WebP encoders). Nothing uploaded to a server, works offline once loaded. Same privacy angle you likely appreciate about Squoosh.
- JPG, PNG, WebP, AVIF in and out — supports converting formats in the same step as compressing.
- Free, no signup, no watermark.

Straight-shooter note: ConvertYard has no affiliate program, so there's no commission angle here for you. I'm flagging it because it genuinely fits the "batch browser tool" gap in your current list, not because there's revenue in it. Totally understand if that changes where it ranks.

Link if you want to test it against Squoosh or TinyPNG: https://convertyard.com/compress-image

Happy to send a matched-quality benchmark against the tools you already cover if that would help editorially.

Either way, thanks for keeping the piece structured around actual workflow (browser vs. plugin) rather than just a keyword-stuffed listicle. Rare to find in this category.

Garrick
ConvertYard

Notes:

- Addressed the affiliate elephant directly, same tactic as the Fat Stacks pitch. Adam is a savvy publisher — pretending you didn't notice his monetization model will read as either naive or manipulative. Being upfront builds credibility.
- Referenced his specific structural choice (browser vs. plugin split) — proves you read past the TL;DR.
- Positioned ConvertYard as a complement to Squoosh in the browser section, not a replacement for NitroPack (his top affiliate). This is important — never appear to threaten the affiliate revenue.
- Do NOT ask about affiliate program partnerships. If ConvertYard ever launches one, it's a follow-up conversation, not a first-touch ask.
- Follow up once at 10 days if no reply. Adam is UK-based, so send during UK business hours (9am–5pm GMT) for same-day visibility.
- If the piece does get updated and ConvertYard is added, take whatever mention position you get without pushing. A plain link mention in the browser-based section is still a real Blogging Wizard backlink — solid DA and topical relevance.
- Longer play: Adam runs BloggingWizard as part of a broader marketing ecosystem. If ConvertYard ever produces original data (compression benchmark studies, WebP adoption trends, etc.), that's the type of content Adam might link to editorially without any pitch. Content-led link building works better here than tool pitching.

#IORiver.io

1. rostyslav@ioriver.io ← author, first-name format is likely (small startup)
2. info@ioriver.io ← confirmed public
3. edward@ioriver.io ← CEO, small company so founders sometimes handle content decisions
4. LinkedIn DM to Rostyslav Pidgornyi (author page has his LinkedIn photo, easy to find)
5. Contact form on ioriver.io/about (fallback)

Subject: browser-based batch tool that pairs with multi-CDN delivery

Hi Rostyslav,

Read "The Best 10 Image Optimization Tools in 2025" — the mix of pre-upload tools (TinyPNG, ImageOptim, Squoosh) and CMS-integrated ones (ShortPixel, WP Smush, Optimole) is the right split for readers landing on an ioriver post, most of whom are already thinking about the delivery side.

Wanted to flag one for the origin-side of your list on a future update: I built ConvertYard, a browser-based batch image compressor. Why it might fit your audience specifically:

- Real batch — up to ~1000 files per drop, ZIP output. TinyPNG's 20-file / 5MB free cap becomes friction for anyone doing site-wide asset prep before pushing to CDN.
- Runs entirely client-side via WebAssembly (libvips + AVIF/WebP encoders). No upload to a compression service — files go straight to the browser, then straight to your CDN origin. One fewer round-trip in the pipeline.
- JPG, PNG, WebP, AVIF in and out. Reader can convert to WebP/AVIF at the origin before ioriver's CDN layer serves them.
- Free, no signup, no watermark.

The positioning that would fit your audience: ConvertYard handles the origin-side compression (pre-CDN), and ioriver handles the delivery-side (post-CDN). Complementary rather than competitive with your product.

Could slot into your existing list at any position, or into a small "batch pre-upload" callout in the "Choosing the Right Image Optimization Tool" section.

One-line description if easier to slot in:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch image compressor. JPG, PNG, WebP, AVIF in and out. Up to ~1000 files per batch, runs locally via WebAssembly (nothing uploaded), free with no signup. Ideal as a pre-upload step before pushing assets to CDN origin.

Happy to send a matched-quality benchmark against TinyPNG and Squoosh if that would help editorially.

Either way, good post — the split between origin and delivery isn't obvious to most readers, and the ioriver framing around CDN optimization is a useful lens to organize the topic through.

Garrick
ConvertYard

Link:  https://www.ioriver.io/blog/image-optimization-tools

#InfiniteUploads
1. blake@infiniteuploads.com ← ClikIT CEO, current owner, likely first-name format at small acquired co. -- PITCH SENT AUG 18 2026
2. hello@infiniteuploads.com (secondary guess)
3. support@infiniteuploads.com ← their public support inbox; will get routed but sometimes forwarded to content team
4. Twitter/X DM: @infiniteuploads
5. aaron@uglyrobot.com ← the original founder; only use as a last resort with an ask to forward to ClikIT

Subject: pre-upload batch compression to pair with Infinite Uploads' media pipeline

Hi Blake,

Read "9 Best Ways to Optimize Images for WordPress in 2025" — the framing that puts compression before offloading in the workflow is exactly right, and it's the framing most WordPress content misses. ShortPixel is a solid #1 given that context.

Wanted to flag one for a future update, and one that pairs naturally with what Infinite Uploads does for its customers: I built ConvertYard, a browser-based batch image compressor and format converter. Why it might fit both your article and your product workflow:

- Real batch — up to ~1000 files per drop, ZIP output. Directly relevant for Infinite Uploads users doing initial media library migrations off self-hosting.
- Runs entirely client-side via WebAssembly (libvips + AVIF/WebP encoders). No upload to a compression service — files stay local until they hit your pipeline. That's a genuine value-add over ShortPixel's cloud round-trip for customers already offloading to Infinite Uploads.
- JPG, PNG, WebP, AVIF in and out. Reader can convert to WebP/AVIF before uploading, so your CDN doesn't have to serve legacy JPEGs.
- Free, no signup, no watermark.

The positioning that fits your audience: compress + convert with ConvertYard at the origin → offload to Infinite Uploads → deliver via your CDN. Clean pipeline, no third-party compression service in the middle.

Could slot into your list at any position, or as a callout in the "compress before you upload" workflow section.

One-line description if easier to slot in:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch image compressor and converter. JPG, PNG, WebP, AVIF. Up to ~1000 files per batch, runs locally via WebAssembly (nothing uploaded), free with no signup. Ideal for compressing media libraries before offloading to storage/CDN.

Happy to send benchmark output against ShortPixel at matched quality if that would help editorially.

One more thing worth flagging: for Infinite Uploads users doing initial site migrations, ConvertYard could genuinely reduce the volume you have to store from day one. Might be worth a mention in your onboarding docs too, not just the blog. I'm not asking for that — just noting the workflow overlap.

Either way, thanks for keeping the piece maintained. Most WordPress media guides written in 2021 haven't been touched since.

Garrick
ConvertYard

Link: : https://infiniteuploads.com/blog/how-to-compress-and-optimize-images-for-wordpress/

#Wisernotify
1. krunal@wisernotify.com ← author of the post, active on Indie Hackers (indie-friendly, accessible) - PITCH SENT AUG 18
2. alpesh@wisernotify.com ← CEO/founder
3. info@wisernotify.com ← confirmed public
4. support@wisernotify.com ← confirmed public, secondary
5. LinkedIn: search "Krunal Vaghasiya" + WiserNotify
6. Indie Hackers DM: https://www.indiehackers.com/wisernotify

Subject: browser-based batch tool that fits several tactics in your image optimization post

Hi Krunal,

Read "13+ Easy Ways to Optimize Images for WordPress" — I appreciate that it's structured around tactics rather than a straight tool list. Most WordPress image optimization posts just dump 20 plugin names on the reader without explaining what each one solves. Yours actually walks through the why first.

Wanted to share one for a future update: I built ConvertYard, a browser-based batch image compressor and format converter. It's worth flagging because it supports several of the tactics your article already recommends in a single tool:

- Compress before upload (your tactic #4-ish) — up to ~1000 files per drop, ZIP output. TinyPNG's 20-file / 5MB free cap is the ceiling ConvertYard clears.
- Convert to WebP/AVIF — supports both formats in and out. Reader can compress + convert in a single step, no separate tool needed.
- Runs entirely client-side via WebAssembly — nothing uploaded to a server. Useful for WooCommerce store owners handling product photos before catalog import.
- Free, no signup, no watermark.

For your specific audience (WordPress + WooCommerce store owners), the natural use case is: bulk-compress a product catalog's images before uploading to the WooCommerce media library. Doing that reduces both storage cost and initial page-load weight — one action, two wins.

Could slot into your list at any position, or as a callout in the "compress before upload" tactic section as the browser-based batch option.

One-line description if easier to slot in:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch image compressor and format converter. JPG, PNG, WebP, AVIF. Up to ~1000 files per batch, runs locally via WebAssembly (nothing uploaded), free. Ideal for bulk product-catalog cleanup before WordPress upload.

Happy to send test output against Smush or ShortPixel at matched quality if that would help editorially.

Also — saw you on Indie Hackers. Building free tools alongside a paid product is a solid moat for the WordPress ecosystem, and WiserNotify's positioning around trust + urgency is one of the cleaner articulations of social proof I've seen. Nice work.

Garrick
ConvertYard

Link: https://wisernotify.com/blog/image-optimization-wordpress/

#GuideFlow

Link:  https://www.guideflow.com/blog/best-image-optimization-software
1. contact@guideflow.com ← confirmed public, will route to content or marketing team - pitch sent Aug 18 2026
2. content@guideflow.com (guess for content team lead)
3. hugo@guideflow.com (co-founder, less senior than CEO)
4. LinkedIn: search "Guideflow" + "Content Marketing Manager" / "SEO"
5. Do NOT email Geoffroy directly (CEO) — content asks feel off-brand at that level for a first touch

Subject: one more for your image optimization roundup — matches your 4 criteria

Hi Guideflow team,

Read "11 best image optimization software in 2026, tested and compared" — the framing around marketers and web teams (not just developers) is a smart angle for this keyword. Most image optimization roundups are written for the WordPress admin audience, which misses the marketing-team reader entirely. Yours doesn't.

Wanted to flag one for a future update: I built ConvertYard, a browser-based batch image compressor and format converter. Scored against your four criteria:

- Compression performance: ~70% average file size reduction on JPEGs at quality 80, ~55% on PNGs. Uses MozJPEG + OxiPNG + libvips under the hood — same encoders that back most of the tools in your existing list.
- Format support: JPEG, PNG, WebP, AVIF in and out. AVIF encoding is a real differentiator vs. Imagify and Optimizilla, which either lack it or charge for it.
- Quality preservation: matched-quality output vs. TinyPNG at any quality slider setting, with more control over per-format encoding parameters if you want it.
- Automation and workflow fit: batch of up to ~1000 files per drop, ZIP output. No signup, no API needed. Runs entirely client-side via WebAssembly — nothing uploaded to a server.

The specific gap ConvertYard fills in your current list: batch pre-upload compression without a plugin or a paid service. Cloudinary is best-for-scale but requires setup + CDN integration. Imagify is best-for-WordPress but only runs inside WordPress. ConvertYard is the "campaign designer needs to compress 500 images before uploading them to a landing page" workflow — a genuinely common marketing use case that none of your current tools solve without friction.

One-line description matching your format:

ConvertYard (https://convertyard.com/compress-image) — Browser-based batch image compressor and converter. JPG, PNG, WebP, AVIF. Up to ~1000 files per batch, runs locally via WebAssembly, no upload, free with no signup. Best for: marketing teams compressing large image sets before landing page or campaign uploads.

Happy to send benchmark output at matched quality against 2–3 tools from your current list if that would help editorially. Given you referenced the SammaPix benchmark methodology, I could match that methodology exactly for a direct comparison.

Either way, thanks for approaching this from the marketer's perspective rather than the developer's. That framing genuinely helps the piece rank differently — and better — than the twenty near-identical "best WordPress image plugin" posts already crowding this SERP.

Garrick
ConvertYard

#PixandHue

Link:  https://www.pixandhue.com/compress-images-for-wordpress/
1. louise@pixandhue.com ← solo founder, first-name format is safest bet - PITCH SENT AUG 18 2026
2. hello@pixandhue.com (secondary)
3. Contact form on her site (likely at /contact/ or /about/)
4. Instagram DM — solo creators like Louise often respond faster there than email. Search @pixandhue on Instagram.
5. WordPress.org profile: profiles.wordpress.org/pixandhue/

Subject: Louise — one more tool for your WordPress image compression post

Hi Louise,

Found your "How to Improve Page Speed – Compress Images for WordPress" post while researching how designers walk clients through image prep. Yours is genuinely one of the friendliest walkthroughs on this topic — the "pre-upload matters" framing is exactly right, and the Mac Preview tip for bulk resizing is one that most compression guides skip entirely.

Wanted to share one you might like: I built ConvertYard, a browser-based batch image compressor. It handles the three specific things your article walks through — reduce, bulk, convert to WebP — in a single step:

- Bulk compress up to ~1000 images per drop, ZIP output. No cap issues like TinyPNG's 20-file free limit.
- Convert to WebP or AVIF at the same time as compressing. Reader doesn't need a separate tool.
- Runs entirely in the browser — nothing uploaded to a server. That's genuinely useful for your audience (photographers, entrepreneurs, brand-conscious folks handling their own imagery who probably don't want their work sitting on some third-party server).
- Free, no signup, no watermark, no time limit.

Feels like a natural fit for your "pre-upload workflow" audience — same philosophy as Mac Preview, but with WebP conversion built in so they don't need a second step.

Link if you want to poke at it: https://convertyard.com/compress-image

Not asking for anything specific — happy for you to just try it and see if it fits the workflow you teach. If you ever mention it, that's a bonus but not the ask.

Also — genuinely nice work on the Pix & Hue theme aesthetic. The Gwyneth Jane theme in particular is one of the cleaner feminine-brand WordPress designs I've seen. Rare to find themes that don't sacrifice speed for style.

Garrick
ConvertYard

---
Notes:

- Personal, warm tone throughout — matches her brand voice. Don't switch to corporate-speak here; it'll feel off.
- Named a specific theme (Gwyneth Jane) — proves you actually looked at her products. Solo creators feel seen when someone references specific work, not just their blog. This is one of the highest-leverage sentences in the pitch.
- The "not asking for anything specific" close is deliberate. Solo creators respond much better to soft asks than link demands. Louise likely gets pitched constantly by SEO agencies with pushy asks — being the friendly opposite stands out.
- Do NOT push for a link in the follow-up. If she engages, let the relationship develop. Solo creators build long-term relationships with tools they trust — that's worth more than one link.
- If she engages positively, longer-term angles: (a) her theme customers are prime ConvertYard users, so an integration mention or bundled tutorial could work later, (b) she might feature ConvertYard in her newsletter (her main channel to her audience).
- Instagram DM is genuinely a strong fallback here — solo WordPress designers live on Instagram more than email. If email is silent at day 10, try IG.
- Send during US business hours (she appears US-based based on style/pricing). Weekday morning EST is ideal.


#UCLA

1. marcom@anderson.ucla.edu ← best first guess, standard department pattern - PITCH SENT AUG 18 2026
2. Search LinkedIn: "UCLA Anderson" + "Marketing Communications" or "Digital Content Manager" — the actual page owner is more likely to act than a generic inbox
3. anderson-web@anderson.ucla.edu (guess for web team)
4. Contact form on Anderson site if the above bounce
5. As last resort: any general helpdesk at UCLA — ask for forward to Anderson Marcom

Subject: small addition suggestion for your ADA image guidelines page

Hi Anderson Marcom team,

I came across your "ADA Guidelines for Images" page while looking at how universities document image accessibility and compression workflows for staff. The three-step structure (alt text → dimensions → format/compression) is clearer than most similar staff-facing guides I've seen from other business schools — the alt text length rule (~40 characters) especially is a helpful concrete constraint.

Wanted to flag one small workflow suggestion for the compression section:

TinyJPG is excellent, but the free tier caps at 20 files and 5 MB per file. For Anderson staff processing a batch of speaker headshots, an event photo album, or a bulk refresh of bio card images, that becomes a real bottleneck fast — they have to compress in small groups and repeat.

I built a tool called ConvertYard that might close that gap for your staff:

- Batch processing — up to ~1000 images per drop, ZIP output. One session handles a full event photo set or department bio refresh.
- Runs entirely in the browser — files never upload to a third-party server. Same privacy posture as ImageOptim on the desktop, but no install required. Relevant for staff handling any pre-release marketing imagery (upcoming speaker announcements, unpublished student profiles, embargoed event materials, etc.).
- Supports the formats your guidelines already recommend — JPG, PNG, and adds WebP/AVIF if staff want the smaller-file modern options.
- Free, no signup, no watermark.

Could work as a small addition to the compression section along the lines of:

"For batches of images or files larger than TinyJPG's 5 MB limit, ConvertYard (https://convertyard.com/compress-image) offers the same in-browser approach with support for compressing up to ~1000 files at once."

Not asking for anything specific — happy for your team to just try it against a real Anderson image batch and see if it fits the staff workflow. If there's a better contact for the person who maintains this page, I'd appreciate a forward.

Thanks for publishing a genuinely useful guide. It's rare to find university marcom pages that address ADA compliance and file optimization together—most treat them as unrelated topics.

Garrick
ConvertYard

Link: https://www.anderson.ucla.edu/marcom/ada-guidelines-images

#MSU

1. dxstudio@msu.edu ← best guess for their team inbox -- PITCH SENT AUG 18 2026
2. dx@msu.edu (shorter variant)
3. ucomm@msu.edu ← parent department (University Communications and Marketing)
4. Search LinkedIn: "Michigan State University" + "Digital Experience Studio" or "Web Standards" — find the actual page owner
5. General comms.msu.edu contact form as fallback

Subject: small addition suggestion for your Assets and Images web standards page

Hi DXStudio team,

I came across the "Assets and Images" section of MSU's web standards while looking at how universities document image workflows for CMS content owners. The structure is genuinely useful — the WCAG 2.0 AA compliance framing at the top, the quality setting guidance (20-30 in Photoshop), and the explicit "JPG or WebP for photos" recommendation are all clearer than most similar university guides.

Wanted to flag one small gap and a workflow suggestion:

The gap: the current compression tool recommendations are ImageOptim (Mac-only per the imageoptim.com/mac link) and TinyIMG. MSU staff on Windows are left without a native equivalent to ImageOptim in the guide. That's a real friction point — Windows content owners have to either install a separate tool or fall back to TinyIMG's browser interface with its file caps.

The suggestion: I built a tool called ConvertYard that might close that cross-platform gap:

- Runs entirely in the browser — works identically on Windows, Mac, and Linux from the same URL. Same in-browser processing model as ImageOptim's privacy posture, but no install and no OS constraint.
- Batch processing — up to ~1000 images per drop, ZIP output. Useful when a unit is refreshing an event photo set or department bio images.
- Includes JPG → WebP conversion in a single step. Your guide recommends WebP for photos, but the current tool section doesn't cover a batch converter for staff wanting to move existing JPG assets over.
- Files never upload to a server — everything runs client-side via WebAssembly. Relevant for units handling any pre-publication content.
- Free, no signup, no watermark.

Could work as a small addition to the compression bullet along the lines of:

"Use a free tool such as ImageOptim (Mac), TinyIMG, or ConvertYard (https://convertyard.com/compress-image) for a cross-platform batch alternative with WebP conversion support."

Not asking for anything specific — happy for your team to try it against a real MSU image batch and see if it fits the workflow you document. If there's a better contact for the person who maintains this page, I'd appreciate a forward.

Thanks for maintaining a genuinely useful standards page. Most university web standards docs haven't been touched since 2018 — this one clearly is.

Garrick
ConvertYard

Link: https://dxstudio.msu.edu/website-technology/web-standards/assets-images

#Utah.edu

1. webmaster@utah.edu ← confirmed public -- PITCH SENT AUG 18 2026
2. Search LinkedIn: "University of Utah" + "Web Services" or "Digital Marketing" — U Web Community has staff, actual page owner is more likely to act than the generic inbox
3. As last resort: general utah.edu/contact/ form

Subject: small workflow addition + format update note for your Images best practices page

Hi University of Utah webmaster team,

I came across your "Images" best practices page while looking at how university webmaster resources document image workflows for campus site owners. The layered structure (accessibility → copyright → resize → compress → file type) is well-organized, and honestly one of the cleaner university web standards pages I've reviewed — most others treat these as unrelated topics.

Wanted to share two small notes for your webmaster audience:

1. Workflow addition: batch alternative to Squoosh.

Squoosh (currently in your compression section) is excellent for single-image tuning with its slider preview, but it doesn't batch. For campus site owners processing an event photo album, a department bio page refresh, or a bulk banner update, they either have to run Squoosh one image at a time or switch to ShortPixel's paid tier.

I built a tool called ConvertYard that closes that gap:

- Batch of up to ~1000 images per drop, ZIP output. Same in-browser approach as Squoosh, but built for volume.
- Runs entirely client-side via WebAssembly — files never upload to a server. Same privacy posture that makes Squoosh a good fit for university use.
- Handles JPG, PNG, WebP, and AVIF in and out.
- Free, no signup, no watermark.

Could slot into your compression bullet along the lines of:

"Software like Photoshop already does a good job at this, but you can use image compression software to bring down the file size further (ex. Squoosh, ShortPixel, or ConvertYard for batch processing)."

2. Update note: WebP and AVIF in the file type section.

The "Choose a file type" section currently covers JPEG, PNG, and SVG only. As of 2026, WebP has 97% global browser support and AVIF has 94% — both are past the "safe to recommend as production defaults" threshold. Adding a short note on WebP (25-35% smaller than JPEG at equivalent quality) would give campus webmasters a genuine performance lever they're likely already curious about but hesitant to recommend without guidance.

Happy to send a short paragraph on WebP/AVIF formatted for your existing bullet style if that would help — no obligation, just an offer.

Not asking for anything specific. If there's a better contact for the person who maintains this page, I'd appreciate a forward.

Thanks for keeping the resource live — pages like this genuinely help small departments make better web decisions without a full web team.

Garrick
ConvertYard

Link: https://uwebresources.utah.edu/best-practices/images.php

#Purdue Agriculture

1. agcomm@purdue.edu ← best guess for department inbox -- PITCH SENT AUG 18 2026
2. agweb@purdue.edu (guess for web-specific)
3. LinkedIn: search "Purdue AGCOMM" or "Purdue College of Agriculture" + "Web Developer" / "Digital Communications" — find the actual page owner
4. agcomm.sharedwork.com internal request system — do NOT use (it's for CoA project requests, not outreach)
5. Fallback: general Purdue web team via purdue.edu/contact

Subject: tool suggestion for the 0.9 MB image limit workflow in Cascade

Hi AGCOMM web team,

I came across your Cascade user guide's "How to work with images" page while researching how universities document CMS image workflows for non-technical content owners. It's genuinely one of the better staff-facing guides I've seen — the block-type-to-dimensions matrix is more concrete than most, and the Siteimprove QA-report step for finding large images already uploaded is a smart operational touch that most guides skip.

Wanted to flag one workflow suggestion specifically tied to your 0.9 MB file size ceiling:

For AGCOMM staff and Extension content owners batch-processing event photos, headshot sets, or program imagery, hitting 0.9 MB per file consistently across a batch is real friction. Pixlr and RedKetchup are solid single-image tools but neither handles bulk compression toward a specific size target well.

I built a tool called ConvertYard that fits this specific workflow:

- Target-size mode — set a max file size (e.g., 900 KB or 800 KB for safety margin) and it compresses each file in the batch to hit that ceiling. This directly matches your 0.9 MB Cascade rule without staff having to eyeball quality sliders per file.
- Batch of up to ~1000 files per drop, ZIP output. Useful for event photo albums, department headshot updates, program refresh cycles.
- Runs entirely in the browser — files never upload to a server. Same privacy posture Extension staff want when handling pre-publication imagery (upcoming events, student profiles, grant program launches).
- Handles JPG, PNG, WebP, and AVIF. If you ever consider updating the guide to include WebP (25-35% smaller than JPEG at the same quality — would let staff more easily stay under 0.9 MB), ConvertYard covers the conversion in the same step.
- Free, no signup, no watermark.

Could slot into your FAQ answer about compression, or into the resize/tools answer alongside Pixlr and RedKetchup, along the lines of:

"For batch compression to a specific file size target (useful for the 0.9 MB Cascade rule), ConvertYard (https://convertyard.com/compress-image) processes up to 1000 files at once in the browser and lets you set a max output size."

Not asking for anything specific — happy for your team to try it against a real AGCOMM image batch and see if it fits the Cascade workflow. If there's a better contact for whoever maintains this page, I'd appreciate a forward.

Thanks for maintaining a resource that clearly gets used. Most university CMS user guides feel like they were written once and forgotten — yours is very evidently maintained by people who understand the actual pain points.

Garrick
ConvertYard

Link: https://ag.purdue.edu/department/agcomm/cascade-user-guide/getting-started/how-do-i-work-with-images-in-cascade.html

#Clemson

Link: https://open.clemson.edu/all_theses/4240/

#Standford

1. sws@stanford.edu ← best guess for Stanford Web Services team inbox -- PITCH SENT AUG 18 2026
2. web-services@stanford.edu (alternate format)
3. webservices@stanford.edu (alternate format)
4. Consultation request form: https://sitesuserguide.stanford.edu/support (formal but real intake)
5. LinkedIn: search "Stanford Web Services" — SWS has a public "Meet the Team" page (sitesuserguide.stanford.edu/about-stanford-web-services) — pick the person whose title includes "Content" or "Documentation"
6. UIT: uit-help@stanford.edu (fallback)

Subject: WebP conversion suggestion for the Stanford Sites Images guide

Hi Stanford Web Services team,

I came across the "Images" section of the Stanford Sites User Guide while researching how universities document CMS image workflows for site managers. Genuinely one of the better-organized guides I've seen — the focal point section, the naming convention example (DogAtBeach-1760x520.png), and the honest acknowledgment that DPI doesn't matter for web are details most similar guides skip.

Wanted to flag two small suggestions:

1. Format gap: no WebP conversion tool in the current recommendations.

Preview, Windows Photos, Compressor.io, and Gimp are solid picks, but none of them make it easy for a Stanford site manager to convert JPGs to WebP. WebP has 97% browser support in 2026 and is typically 25–35% smaller than JPEG at equivalent quality — meaningful for anyone bumping up against the 2 MB file size ceiling.

2. Suggested addition: a browser-based batch converter that covers WebP + hits target sizes.

I built a tool called ConvertYard that fits this specific gap:

- Batch of up to ~1000 images per drop, ZIP output. Useful for site managers processing event photos, faculty headshot updates, or research lab image galleries.
- Runs entirely in the browser — files never upload to a server. Same privacy posture that makes Preview and Photos safe recommendations for Stanford use.
- JPG, PNG, WebP, and AVIF in and out. Site manager can compress + convert to WebP in a single step to comfortably stay under the 2 MB Stanford Sites limit.
- Optional target-size mode — set a max output size (e.g., 1.8 MB for headroom under your 2 MB cap) and each file compresses to hit it.
- Free, no signup, no watermark, no rate limit.

Could slot into the "Image editing resources" list along the lines of:

"ConvertYard (https://convertyard.com/compress-image). A free browser-based batch compressor and format converter. Useful for compressing many images at once and converting to WebP to stay comfortably under the 2 MB Stanford Sites file size limit."

Not asking for anything specific — happy for your team to try it against a real Stanford Sites image batch and see if it fits the site manager workflow you document. If there's a better SWS contact for whoever owns this specific guide page, I'd appreciate a forward.

Also — appreciated that your guide addresses the responsibility framing at the top (usage rights, accessibility). Most CMS user guides jump straight to the technical steps and skip the compliance context. Yours does both, which is what actually helps site managers make good decisions.

Garrick
ConvertYard

Link: https://sitesuserguide.stanford.edu/build/media-library/images

#Maine.edu

1. extension.communications@maine.edu ← confirmed public, primary -- PITCH SENT
2. LinkedIn: search "UMaine Extension" + "Communications" or "Marketing" — solo team member outreach usually beats generic inbox
3. Phone (last resort, only if email is silent for weeks): 207.581.3188

Subject: small workflow addition for the "Prepare Images for the Web" page

Hi UMaine Extension Communications team,

I came across the "How to prepare images for the web" page in the Plugged In resource while looking at how university Extension services document image workflows for staff and volunteers. The step-by-step framing (Mac vs. PC instructions, exact 1000-pixel width recommendation, quality = best) is more concrete than most similar staff-facing guides — that specificity is what actually helps non-technical volunteers get it right the first time.

Wanted to flag one workflow suggestion for the "Free online image compressors" section:

TinyPNG and Compressor.io are solid picks for one or two images at a time, but both have file count caps on the free tier (TinyPNG stops at 20 images / 5 MB per file). For Extension staff and volunteers processing a full 4-H event album, an ag research field photo set, or a batch of program participant photos, that becomes a real bottleneck — they have to run multiple sessions and re-upload.

I built a tool called ConvertYard that fits this specific workflow:

- Batch of up to ~1000 images per drop, ZIP output. One session handles a full event photo set.
- Optional target-size mode — set a max output size (e.g., 2.5 MB for headroom under your 3 MB UMaine cap) and each file compresses to hit that ceiling automatically. Directly matches your existing file size rule.
- Runs entirely in the browser — files never upload to a third-party server. Useful for volunteers handling any photos involving minors (4-H participants, youth programs) where staying local is a plus.
- Handles JPG, PNG, WebP, and AVIF — supports converting to WebP in the same step, which helps staff comfortably stay under 3 MB with room to spare.
- Free, no signup, no watermark.

Could slot into the "Free online image compressors" list along the lines of:

"ConvertYard (https://convertyard.com/compress-image) — for batches of images or when you need to keep everything under UMaine's 3 MB limit"

Not asking for anything specific — happy for your team to try it against a real Extension image batch and see if it fits the volunteer workflow you document. If there's a better contact for whoever maintains this specific page, I'd appreciate a forward.

Also — the way Plugged In pairs the technical steps with the copyright + release form resources at the bottom of the page is unusually well-considered. Most Extension resources treat these as separate topics, and having them accessible in one place is genuinely helpful for volunteers who need to think about both at once.

Garrick
ConvertYard

Link: https://extension.umaine.edu/plugged-in/technology-marketing-communications/web/tips-for-web-managers/prepare-images-for-web/

#Tarleton.edu

1. kbuchanan@tarleton.edu ← Web Applications Manager, most likely direct page owner - PITCH SENT AUG 18 2026
2. webmaster@tarleton.edu ← general WordPress inbox, confirmed public
3. kboatright@tarleton.edu ← Full Stack Developer, may also handle tutorial pages
4. rjackson1@tarleton.edu ← Digital Marketing Manager, controls broader web content
5. LinkedIn: search "Tarleton State University" + first name of the person you email — sometimes gets a faster reply

Subject: small addition suggestion for your WordPress Add Media tutorial

Hi Kim,

I came across the "How to Add Media" WordPress tutorial on the Tarleton Web Operations site while researching how universities document image workflows for staff running department WordPress sites. The image dimension table is genuinely one of the more concrete references I've seen — matching hero/slider/headshot dimensions directly to the block types they're used in is what actually helps non-technical staff get uploads right the first time.

Wanted to flag two small suggestions:

1. Workflow addition: batch alternative to Optimizilla.

Optimizilla is a solid pick for one or two images at a time, but its 20-image / 20 MB free cap becomes real friction for staff processing an event photo album, a headshot batch for a new cohort, or a bulk refresh of news featured images.

I built a tool called ConvertYard that closes that gap:

- Batch of up to ~1000 images per drop, ZIP output.
- Runs entirely in the browser — files never upload to a server. Same in-browser processing model as Optimizilla, but built for volume and privacy.
- Handles JPG, PNG, WebP, and AVIF in and out. Staff can convert to WebP in the same step to reduce file size further.
- Optional target-size mode if a specific WordPress upload limit is enforced.
- Free, no signup, no watermark.

Could slot into the current compression links along the lines of:

"Image Compressor — for single or small batches
ConvertYard — for larger batches or bulk headshot/album processing"

2. Optional: a Mac equivalent to the Windows crop/resize section.

The current page has clear Windows Photos steps for cropping and resizing, but no Mac Preview equivalent. Might be worth adding a short Mac section for staff on Apple hardware — Preview handles the same operations natively. Happy to draft that section if it would be useful.

Not asking for anything specific — happy for your team to try ConvertYard against a real Tarleton image batch and see if it fits the WordPress workflow you document. If it turns out webmaster@tarleton.edu is a better inbox for this kind of suggestion, feel free to forward or let me know.

Thanks for maintaining a tutorial that's genuinely useful for staff. The dimension table alone probably saves your web team a lot of "why is my image cropped weird?" support tickets.

Garrick
ConvertYard

Link: https://www.tarleton.edu/wordpress-tutorials/add-media/

#University of South Carolina

Link: https://www.usca.edu/departments/marketing/website/images-and-video/

1. chris.cardelli@usca.edu ← Creative Director. Most likely to care about image workflow quality. Best primary target. -- Pitch Sent Aug 18 2026
2. jamesr@usca.edu ← Director of Marketing. Second choice — controls broader content decisions.
3. heather.henley@usca.edu ← Associate Vice Chancellor. Too senior for a first-touch tool suggestion; skip unless the others bounce.
4. LinkedIn: search "Chris Cardelli" + USCA — solo pitch to a named creator has best odds.

Subject: Chris — quick note on the USCA image optimization tools list

Hi Chris,

I came across the "Images and Video" page under USCA Marketing and Communication while looking at how small-to-mid-sized universities document image workflows for staff. The JPG vs PNG breakdown is actually clearer than most similar guides — the "photocopy of a photocopy" framing for repeated JPEG compression is a genuinely useful way to explain quality decay to non-technical staff.

Wanted to flag one small suggestion for the "Free Online Image Optimizers" list, specifically tied to your 1 MB file size rule:

The five tools currently listed (TinyPNG, Optimizilla, Kraken.io, Compressor.io, Image Optimizer) all send files to their own servers for processing, and all cap the free tier somewhere between 20 files and 25 MB per session. For USCA staff processing an event photo album, an athletics season set, or a department bulk refresh, that becomes real friction — they end up running multiple upload cycles just to hit the 1 MB target on a batch.

I built a tool called ConvertYard that fits this specific use case:

- Batch of up to ~1000 images per drop, ZIP output.
- Optional target-size mode — set a max size (e.g., 900 KB for safety margin under your 1 MB cap) and each file compresses to hit that ceiling automatically. Directly matches your existing rule.
- Runs entirely in the browser — files never upload to a third-party server. Same processing model as the recommended tools, but nothing leaves the staff member's device. Relevant for USCA imagery involving students, athletes, or unpublished campus events.
- Handles JPG, PNG, WebP, and AVIF — supports WebP conversion for anyone wanting to comfortably stay under 1 MB with room to spare.
- Free, no signup, no watermark.

Could slot as a sixth entry in the current list along the lines of:

"ConvertYard (https://convertyard.com/compress-image) — for batches of images or when specific file size targets are needed"

Not asking for anything specific — happy for your team to try it against a real USCA batch and see if it fits the workflow. If it turns out this kind of edit is better routed through James or the general web team, feel free to forward.

Also — I noticed you're a Creative Director rather than a straight web admin, which is unusual for a page like this. It shows in the content — the framing prioritizes visual quality reasoning ("banding of colors," "translating gradients") over pure technical specs. Rare to find university image guidelines written by someone who actually thinks about the image and not just the file size.

Garrick
ConvertYard

Notes:

- Chris Cardelli by first name. Creative Directors respond warmly to peer-creative outreach. Do not over-formal this — small-university Creative Directors expect direct-tone email from other creative folks.
- Specific 1 MB target-size hook. Same tactic as Purdue AGCOMM and UMaine — referencing their exact rule makes the pitch feel like the answer to their stated constraint.
- Compliment referenced the JPG vs PNG framing specifically and calls out that the page reads like it was written by an actual creative — this is real, not flattery. Chris will notice you engaged with the content.
- "If James or the general web team is a better route, feel free to forward" — soft handoff option. Some Creative Directors at small universities are creative-first and don't own the tech documentation. Making forwarding easy costs nothing and improves odds.
- Do NOT mention SEO, DA, or backlinks. Same rule for all .edu outreach.
- Follow up once at 3 weeks. If Chris is silent, try James Raby (Director of Marketing) with a light "wanted to make sure this reached the right person" bump.
- Ninth .edu pitch queued now. Portfolio depth is real: Bryant, UCLA Anderson, MSU, Utah, Purdue, Stanford, UMaine, Tarleton, USCA. Different states, different tiers, different departments. Google reads a diverse .edu backlink pattern as authentic authority signal rather than link farming.
- Longer-term angle for Chris specifically: if he responds positively, Creative Directors at small universities often trade recommendations with peers at other institutions. One good relationship here could seed 2–3 more .edu placements organically.

#MIT.EDU

Email: hgb@mit.edu -- PITCH SENT (AUG 18 2026)

Subject: Small suggestion for your image-compression tip (from a fellow batch-compression nerd)

Hi Heather,

I stumbled onto your Tips and Tricks (How To) page from the HTMAA 2021 archsite while looking at how other people were solving the "my website images are way too big" problem. The step-by-step you wrote for batch-compressing .jpeg files with Homebrew, ffmpeg, and Cameron's Python script is genuinely one of the clearest walkthroughs I've seen — especially the "drag the folder into Terminal to get the path" trick. That's the kind of tip that saves someone 20 minutes of Stack Overflow.

I'm writing because I built something that might be worth adding as an option for the students who read that section and get stuck on step 1 (Homebrew install, permissions prompt, "command not found," the usual). It's a browser tool called ConvertYard — everything runs locally via WebAssembly, so files never upload anywhere, and it handles batches the same way your script does (drop a folder, get a zip back). No terminal, no Python, no install, no paywall.

The two pages that map directly onto your existing tips:

- Batch image compress (the .jpeg folder case): https://convertyard.com/compress-image
- Video compress under 1 MB: https://convertyard.com/compress-video

Worth flagging on the video tip specifically: freeconvert.com has tightened its free tier since 2021 — it now caps free users at 5 files per batch and 10 total operations before it asks for a paid plan. For an HTMAA week where a student might have 30+ short clips to shrink, that hits fast. ConvertYard has no cap and no upgrade prompt because there's nothing to upgrade to — it's just the tool.

I'm not asking you to swap out Cameron's script — it's a great teaching artifact and the terminal experience is part of the HTMAA point. But a lot of your visitors are probably Architecture-section students on deadline who just want the file smaller, and a one-line "if you'd rather do this in the browser, here's a no-install option" would help them and keep your page useful for future cohorts.

A couple of specific things I thought you'd care about, given the audience:

1. It works offline after first load — helpful in Building 1 basements where the WiFi is famously grumpy.
2. No file size cap, no batch cap, no upload — I've tested it with 1000-image batches. The freeconvert route also breaks the "files never leave your browser" contract that the CBA network cares about.
3. Outputs a ZIP with original filenames preserved, so the git add . step after doesn't get weird.

If you'd rather see the code first (totally fair given the audience), the WASM stack is libvips for images and ffmpeg.wasm for video — same ffmpeg you're already recommending, just compiled to run in-browser.

Either way, thanks for keeping that page up. It's the sort of documentation the fab.cba site is at its best for.

Best,
Garrick
convertyard.com

## Electronics Alibaba

Link: https://electronics.alibaba.com/buyingguides/3gp-to-mp4-conversion-guide

#Atlassian.net
Email 1: jay@adventfs.com -- PITCH SENT (AUG 18 2026)
Email guess 2: jduplessis@adventfs.com
confirmed: help@adventfs.com -- PITCH SENT (AUG 18 2026)

Subject:  A privacy-safer replacement for the three file tools on your "How do I upload documents?" page

Hi Jay,

I came across your "How do I upload documents?" article in the AeL Student Support space (updated Dec 4, 2025) and wanted to flag something you'll probably want to know about — plus offer a fix if it's useful.

The three sites you currently link out to for format conversion, image compression, and PDF compression — freeconvert.com, imageresizer.com, and pdf2go.com — all work by uploading the student's file to their servers. For most sites that's fine. For AeL specifically, your students are usually uploading a driver's license, a court referral, a probation form, or something equivalent to register for a court-ordered course. Telling that population to upload IDs to a third-party converter is a defensible-but-fragile recommendation, and it's the kind of thing an agency compliance reviewer or a suspicious student support ticket ("why is the site telling me to upload my license to some random tool?") could turn into a real headache.

There are also two functional problems that have gotten worse since these tools were originally picked:

1. freeconvert.com now caps free users at 5 files per batch and 10 total operations before requiring a paid plan. A student converting one HEIC is fine; a student with three documents in the wrong format hits the wall.
2. pdf2go.com limits free users to 3 tasks per hour and 100MB per file — a student who fails once and retries can get stuck.
3. imageresizer.com is ad-heavy and defaults to keeping a copy on their server for 24 hours per their privacy policy.

I built a tool called ConvertYard that does the same three jobs but runs entirely in the student's browser via WebAssembly — the file never leaves their device. No account, no upload, no paywall, no file cap. The three direct replacements for your existing links:

- Format conversion (HEIC → JPG/PNG, any → PDF): https://convertyard.com/convert-image
- Image compress (get under 10 MB): https://convertyard.com/compress-image
- PDF compress (get under 10 MB): https://convertyard.com/compress-pdf

Why this specifically fits your page:

1. HEIC is a first-class input — you already list .heic as an accepted format, and iPhone students are the ones most likely to hit "my file is in the wrong format." One-click HEIC → JPG in-browser, no App Store, no upload.
2. Nothing is uploaded, ever. You could add a sentence like "These tools process the file on your own device — nothing is sent to a server," which is a genuine reassurance for a student who's nervous about uploading ID.
3. Works on the same phone they're already using. No install, no desktop required, and it doesn't care if the browser is maximized (which pairs nicely with your existing tip #1).
4. No paywall or task cap — a student who has to retry three times doesn't get punished for it.

The lightest possible edit to your page would be swapping the three existing links for the three above. If you want to be more conservative, adding "or, if you'd prefer not to upload the file: [ConvertYard link]" next to each existing link works too — it lets students self-select based on how sensitive their document is.

Happy to answer any technical questions, or if useful, I can send you a two-line summary of the WASM stack (libvips for images, mupdf-wasm for PDFs) for anyone on your side who wants to vet it before you recommend it.

Either way, thanks for keeping the AeL support docs current — most Confluence spaces I land in from Google are five years stale, and yours isn't.

Best,
Garrick
convertyard.com

Link: https://adventfs.atlassian.net/wiki/spaces/STU/pages/2366242840/How+do+I+upload+documents

#Cloudinary
support@cloudinary.com -- PITCH SENT AUG 27 2026

Subject: Reader-experience note on the AVIF to PNG guide (FreeConvert free-tier cap)

Pitch (send to support@cloudinary.com addressed to the Content / Guides team):

Hi there — this is feedback on a marketing guide page rather than a technical support question, so please route this to whoever owns the Cloudinary Guides content (Content Marketing / SEO team). Sending here because there's no public content-team address I could find.

The page in question:
https://cloudinary.com/guides/image-formats/everything-you-need-to-know-about-avif-to-png-conversion

Two small reader-experience notes about the "Ways to Convert AVIF to PNG" section, in case they're useful for the next refresh (I saw the Nov 16, 2025 update stamp, so the page is actively maintained):

1. FreeConvert's free tier caps daily conversion volume. Readers who follow the guide, click through, and try to convert more than a handful of AVIFs will hit the limit and be prompted to pay a monthly fee. That's a rough experience for someone who clicked in from a "free converter" guide, and it reflects back on the guide rather than on FreeConvert. Worth a one-line caveat next to the FreeConvert entry, or worth adding an option that doesn't have a per-day cap.
2. All five recommended tools (Convertio, Pixelied, Zamzar, FreeConvert, and the option before) share the same upload-then-convert mechanic. For readers converting screenshots, mockups, unreleased design assets, or anything else they'd rather not hand to a third-party server, none of the current five options let them do the conversion locally. Not a dealbreaker for most readers, but worth an alternative for the ones for whom it matters.

I built ConvertYard (https://convertyard.com/avif-to-png), a free browser-based AVIF to PNG converter that addresses both:

- Runs entirely inside the browser via WebAssembly. The file never leaves the reader's device. No account, no upload, no queue, no retention.
- No per-day cap and no paid tier gating file count or file size. Batch a hundred AVIFs in one shot without hitting a wall.

Not asking for FreeConvert, Convertio, Zamzar, or Pixelied to be removed. Just a sixth option worth mentioning in the "Ways to Convert AVIF to PNG" section for readers who either (a) run past the FreeConvert free-tier cap, or (b) don't want to upload the source file to a third party first.

If it's not the right fit for the guide, no worries at all. Either way, thanks for maintaining the piece — the format-comparison sections (browser support, compression efficiency) are genuinely useful, which is why the page ranks the way it does.

Best,
Garrick
ConvertYard

Link: https://cloudinary.com/guides/image-formats/everything-you-need-to-know-about-avif-to-png-conversion

#Multiscreensite 

Contact:  https://live-web-design-documentation.multiscreensite.com/feedback-form
Email: info@townsquareinteractive.com -- PITCH SENT (AUG 18 2026)

Subject: TinyPNG / SmallPDF / freeconvert — heads up

Hi Live Design Team,

Sending this because I use your Resource Library as a bookmark and noticed several of the linked tools have paywalled or throttled their free tiers over the last year. Probably shows up as friction in your designers' day without anyone connecting it back to the resource page.

Specifically:

- freeconvert.com (HEIC→JPG and Video) — 5 files per batch, 10 total ops before paid plan.
- TinyPNG — 20 files per batch, 5MB per file. Fine for logos, not client photography.
- imageresizer.com — ad-heavy and retains uploads for 24 hours per their privacy policy.
- SmallPDF — 2 free tasks per hour before the paywall hits.
- iLovePDF / iLoveIMG — batches capped around 25 files, account required beyond that.

I run ConvertYard, which does the same jobs but runs entirely in the browser via WebAssembly — no upload, no account, no paywall, no batch cap. Nothing to log into because there's no tier system.

The six direct replacements for tools you already link:

- HEIC → JPG: https://convertyard.com/heic-to-jpg
- Image Compressor: https://convertyard.com/compress-image
- Image Resizer: https://convertyard.com/resize-image
- PDF Compressor: https://convertyard.com/compress-pdf
- Video Compressor: https://convertyard.com/compress-video
- Image → any format: https://convertyard.com/convert-image

Why it fits a team building client sites at scale:

1. No batch cap — tested on 1000-image folders. No mid-task paywall wall.
2. Nothing uploads — real answer if a client ever asks where their branding assets went.
3. HEIC as first-class input — iPhone photos from clients convert one-click.
4. Original filenames preserved in the ZIP — no image_1.jpg cleanup after.

Small ask: add ConvertYard as a second option next to each of the six links so designers can self-select. Nothing breaks for anyone with muscle memory for the current tools, and it lets the team try it in real work before any bigger changes.

Underlying stack is libvips (images), mupdf-wasm (PDFs), and ffmpeg.wasm (video) — same ffmpeg your freeconvert link uses, just in-browser.

Thanks for keeping the Resource Library public.

Best,
Garrick

Link: https://live-web-design-documentation.multiscreensite.com/resource-links

#HootSuite

Primary: Chloe West (article author) via LinkedIn DM — https://www.linkedin.com/in/chloewest28
Freelancers with well-ranked bylines often care enough to nudge their editor. Twitter (@ChloeWest28) is a backup if LinkedIn is quiet. Direct email isn't published; her contact form at https://chloesocial.com/contact/ is the only web option.

Secondary (unverified guess): press@hootsuite.com — standard Fortune-500 pattern. If it bounces, no fallback that isn't a sales form.

Tertiary: Hootsuite's help-request form at https://www.hootsuite.com/about/contact-us — pick "Something else" and note it's blog content feedback. Low chance of routing to the right team but the only sanctioned channel.

Subject: Small privacy note for the video-to-MP3 section of your Reel audio guide

Pitch:

Hi Chloe,

I came across your Hootsuite piece on downloading Instagram Reel audio while researching the space, and it's one of the few guides that actually walks through more than one workable method (the file-extension rename trick in method #3 is one I hadn't seen documented anywhere else). Wanted to send a quick note in case it's useful either for you or for whoever handles refreshes on the piece at Hootsuite.

In method #2 you list three video-to-MP3 converters — FreeConvert, CloudConvert, and OnlineConverter. They all work, and they all share the same mechanic: the user uploads the raw Reel video to the tool's server, waits in the queue, then downloads the MP3 back.

For most Reel audio grabs that's fine. But there are a couple of situations where readers of a guide like this might want an alternative:

- Anyone ripping audio for internal moodboards, brand pitches, or client presentations who'd rather not have the source video sitting on a third-party server, even briefly
- Creators pulling audio for reference from Reels they don't want tied to their IP address in a converter's server logs (given how much of Reel audio ripping is in copyright-gray territory, "no retention because there's nothing to retain" is a genuine risk-reducer)
- Anyone on a slow or metered connection where a browser-local conversion is dramatically faster than upload + queue + download

I built ConvertYard, a free set of browser-based converters that could sit alongside the three you already list. Two pages are directly relevant to method #2 in your guide:

- https://convertyard.com/mp4-to-mp3 — direct MP4 to MP3, matches CloudConvert's page
- https://convertyard.com/extract-audio — general video-to-audio extractor, matches FreeConvert's page

Both run entirely inside the browser via WebAssembly. The file never leaves the reader's device. No account, no upload, no queue, no retention.

Not asking for FreeConvert / CloudConvert / OnlineConverter to be removed. Just a fourth option worth mentioning for readers who'd rather do the conversion locally. If you don't have editorial reach on the piece anymore, no worries — happy to be pointed toward whoever at Hootsuite handles refreshes on evergreen guides, or just ignore this if it's not something you want to nudge.

Either way, the article's a solid piece of work, and it's the sort of guide that makes freelance bylines actually matter.

Best,
Garrick
ConvertYard

Link: https://blog.hootsuite.com/download-instagram-reel-audio/

#Washington.Edu
email: uweb@uw.edu
potential email 1: tsevare@uw.edu
potential email 2: tiffanys@uw.edu

Subject: freeconvert link in your video story doc

Hi Tiffany,

Sending this because I use your "How to Create a Video Story" doc as a reference (came across it looking at how other university web teams handle background video specs) and wanted to flag that the compressor tool you link — freeconvert.com/video-compressor — has tightened its free tier. It now caps free users at 5 files per batch and 10 total operations before requiring a paid plan. Content editors who need to compress a batch for a campaign hit the wall quickly.

I run ConvertYard, a browser-based tool that does the same job but runs entirely in the user's browser via WebAssembly — nothing uploads, no account, no paywall, no batch cap. Same ffmpeg under the hood as freeconvert, just compiled to run in-browser.

Direct replacements for the tools your doc touches:

- Video Compressor (get MP4s under 20MB): https://convertyard.com/compress-video
- Image Compressor (poster images): https://convertyard.com/compress-image
- HEIC → JPG (iPhone photos from editors): https://convertyard.com/heic-to-jpg

Why it fits your doc's priorities:

1. Quality control stays with the editor — full quality slider, real-time preview, so "make sure the quality stays high" is enforced by the person exporting, not by an upload service's defaults.
2. Nothing uploads — content editors compressing unreleased announcements, embargoed news, or student-focused footage don't send those files to a third-party server. Reasonable answer for a public university.
3. Works on slow connections — after the first load, everything is local. Aligns with your "not everyone has a fast internet connection" note. Uploading a 40MB video to freeconvert on hotel WiFi is exactly the scenario your doc warns against.
4. No batch cap — a campaign with 8 poster images and 3 background videos completes in one pass.

Small ask: add ConvertYard next to the existing freeconvert link as an alternative — nothing breaks for anyone with muscle memory for the current tool, and content editors can self-select. If it earns its place over time, the swap happens on its own.

Happy to answer any technical questions. Also happy to add captions to the ConvertYard docs pointing back to UW's accessibility guidance if that's useful — your accessibility section (PEAT, 3-flashes-per-second, YouTube captions) is one of the clearer explainers I've seen, and I'd want to link to it, not restate it.

Thanks for keeping the doc public.

Best,
Garrick

P.S. Unrelated small heads-up while I was on the page — a couple of the video embeds look like they aren't showing, specifically the two columns under the "Copy block with video embed" section. Could be my browser (Chrome, latest, no extensions), but I'm flagging it in case it's a real breakage worth a quick look.

Link: https://www.washington.edu/docs/how-to-create-a-video-story/

#ZDNet

Author website:  https://monkeypantz.net/contact-jack/

Subject: The missing 4th option for your PDF→Word article
Email: jack@jackwallen.com -- PITCH SENT AUG 18, 2026

Hi Jack,

Longtime reader — your 3-ways article on PDF → Word came up while I was researching how other writers frame the privacy tradeoff in this category. Your framing of Method 1 is exactly right: for anyone who cares about keeping their document private, uploading to Adobe / PDFSimpli / etc. is a real problem, especially given training-data concerns. Telling privacy-conscious readers to skip straight to desktop/CLI is the honest call.

I'm writing because there's a fourth option worth considering that resolves the tradeoff: a web-based tool where the file never leaves the browser. Not "the file is deleted after 24 hours" — literally never uploaded. All conversion happens client-side via WebAssembly, so the tab is the entire pipeline.

The tool is called ConvertYard. The PDF → Word page: https://convertyard.com/pdf-to-word

Why it fits the gap in your article:

1. No upload. Open DevTools → Network tab, drop a PDF, and watch — no request goes out with the file. The mupdf-wasm module runs the extraction, docx generation happens in-browser, download is a Blob URL.
2. Same convenience as Method 1. Drop file, get .docx back. No install, no Java tools, no sudo apt-get. Method 3 is great for you and me, but the average reader who hit your article via Google isn't running Pop!_OS.
3. No paywall, no account, no batch cap. PDFSimpli requires signup for anything beyond a single file. Adobe caps free at 2 files per hour. ConvertYard has no tier system.
4. Runs on Linux, same as any other browser. Chromium, Firefox, whatever — no OS lock-in like PDFCandy (Windows-only, as you noted) or Nitro ($250).

The honest limitation, since you called it out for the other methods: it works best on text-mostly PDFs — same caveat you already have at the top of the article. Scanned/image-only PDFs need OCR, which is on the roadmap but not shipped. Not trying to oversell.

Small ask: if it holds up when you test it, consider adding it to the article as a fourth option — or as a note in the Method 1 section for readers who want the convenience without the upload. Not asking to bump anyone else off the list, just to fill the gap your article correctly identifies.

Happy to answer any technical questions or walk through the WASM stack if useful (mupdf-wasm for PDF parsing, in-browser docx generation, fflate for the zip container). If you'd rather independently verify it's actually not uploading, DevTools Network tab is the quickest sanity check — that's the demo I'd want to see too if I were writing this article.

Either way, thanks for continuing to write the "here's the tradeoff, here's how to pick" style. It's rarer than it should be.

Best,
Garrick
convertyard.com

Link: https://www.zdnet.com/home-and-office/work-life/3-ways-to-convert-a-pdf-to-a-word-document/

#Buffer.com
hello@buffer.com -- PITCH SENT AUG 27 2026
press@buffer.com 

Subject: Small tip for the "compressing a video" line in your Sharing Videos help doc

Pitch:

Hi Buffer team,

Quick note about your Help Center article on sharing videos through Buffer — specifically the tip box in the "How to find the bitrate of your video" section, where you recommend FreeConvert and Veed for compression and bitrate changes. Wanted to send this to your Advocacy / Content team rather than log a support chat since it's not a bug or an account question.

Two small things about that recommendation worth considering next time it's touched:

1. Upload mechanic. FreeConvert compresses the file on their server, which means the creator uploads the raw video first, waits in the queue, then downloads the result. For a lot of Buffer users this is fine, but there are creators for whom it isn't:

  - Anyone posting sponsored or embargoed content who's not supposed to hand the raw file to a third party before the sponsor's launch date
  - Agencies posting on behalf of clients whose content is under NDA
  - Creators with copyright-sensitive footage (unreleased music video cuts, licensed b-roll, brand-supplied assets) where the paperwork covers Buffer and the destination platform but not a general-purpose converter
  - Personal footage where the creator would prefer no third party retains a copy, even briefly, given how frequently converter services show up in data-breach lists
2. Free tier limits. FreeConvert is free for smaller files and basic settings, but larger files, higher-quality output, and some of the more useful compression options are gated behind paid plans. Not a deal-breaker, just worth flagging so the tip doesn't read as fully free when it isn't.

I built ConvertYard (https://convertyard.com/compress-video), a browser-based video compressor that could sit alongside FreeConvert and Veed in that tip box. It runs entirely inside the browser via WebAssembly, so:

- The file never leaves the creator's device (nothing to upload, nothing sitting on someone else's server)
- No account, no queue, no file retention
- No paid tier gating file size or compression options
- Size-specific presets that match Buffer's exact per-network limits (300 MB for Instagram Reels, 100 MB for Bluesky, 40 MB for Mastodon, 1 GB for Facebook / X / LinkedIn / Pinterest / TikTok / Threads — all of which you already list higher up in the same article)

That last point is the one I think fits your doc most naturally. A creator scheduling a Reel wants "compress this to under 300 MB" — not "figure out the right bitrate to hit 300 MB." Size-target compression is a nicer creator UX for exactly the workflow this article describes.

Not asking for FreeConvert or Veed to be removed. Just a third option worth mentioning in the same tip box for creators whose content shouldn't touch a third-party server, or who hit the free-tier ceiling on the current recommendations.

If it's not the right fit, no worries at all. Either way, thanks for keeping that article as detailed as it is — the per-network breakdown is genuinely the best version of this table on the internet.

Best,
Garrick
ConvertYard



Link: https://support.buffer.com/en-us/articles/sharing-videos-through-buffer-LOe2p2rnAI

#FlipSnack

Email: contact@flipsnack.com -- PITCH SENT AUG 18, 2026

Subject: freeconvert link in your optimize-media doc — heads up

Hi Flipsnack Help Center team,

Sending this because your "How to optimize videos and images for Flipsnack" article (updated August 10) recommends freeconvert.com for video and image compression, and I wanted to flag that freeconvert has tightened its free tier — it now caps free users at 5 files per batch and 10 total operations before requiring a paid plan. A Flipsnack customer prepping a magazine issue with multiple embedded videos or a catalog with a batch of product photos hits the wall fast.

I run ConvertYard, a browser-based tool that does the same jobs but runs entirely in the user's browser via WebAssembly — no upload, no account, no paywall, no batch cap. Same ffmpeg under the hood as freeconvert, just compiled to run in-browser.

Direct replacements for the tools your article touches:

- Video Compressor (H.264 MP4, bitrate control): https://convertyard.com/compress-video
- Image Compressor (with DPI/dimension control): https://convertyard.com/compress-image

Why it fits your article's priorities:

1. Quality control stays with the editor. Full bitrate and quality slider with real-time preview, so the "4–6 Mbps sweet spot" you recommend is something the user actually sets, not what an upload service defaults to.
2. Nothing uploads. Flipsnack customers are often prepping pre-release magazines, embargoed catalogs, or paid client work. Not sending those files to a third-party server is a genuinely better answer than "we recommend a trustworthy uploader."
3. No batch cap. A catalog with 40 product images or a magazine with 6 embedded video clips completes in one drop.
4. H.264 MP4 output as default. Matches your recommended format exactly — no user has to figure out codec settings.

Small ask: add ConvertYard next to the existing freeconvert link as an alternative — nothing breaks for anyone who prefers freeconvert, and Flipsnack customers can self-select based on file sensitivity and batch size. If it earns its place over time, the swap happens on its own.

Happy to answer any technical questions. The underlying stack is libvips (images) and ffmpeg.wasm (video) — same ffmpeg your current recommendation is using, just running in the customer's browser instead of on someone else's server.

Thanks for keeping the article specific about bitrate, DPI, and format — most "compress your files" guides skip the actual numbers.

Best,
Garrick
convertyard.com

Link: https://help.flipsnack.com/en/how-to-optimize-videos-and-images-for-flipsnack

#TechRadar
matt.hanson@futurenet.com -- PITCH SENT AUG 27 2026

Subject: Small suggestion for your MKV to MP4 how-to (privacy angle for the online-tool section)

Pitch:

Hi Matt,

I read Nikshep Myle's MKV to MP4 how-to on TechRadar and wanted to send a quick note in case it's useful the next time the Computing team refreshes the piece. Not asking for a link swap, just flagging an option worth adding.

The article's online-service section walks readers through FreeConvert. It works, but the mechanic is that the reader uploads the MKV file to FreeConvert's server, waits in a queue, then downloads the MP4 back. That's fine for a lot of content, but MKV files being converted for personal reasons often aren't "a lot of content":

- Home videos and family recordings people don't want sitting on a third-party server
- Screen recordings of private calls, medical consultations, or work sessions
- Downloaded footage from personal cameras or dashcams where the reader would prefer no queue, no retention, no account
- Anything the reader is converting specifically because they want it off the internet and onto their local drive

Given TechRadar covers VPNs and privacy tooling heavily elsewhere on the site, an in-browser option in this how-to would fit the house perspective.

I built ConvertYard (https://convertyard.com/mkv-to-mp4), a free MKV to MP4 converter that runs entirely inside the browser via WebAssembly. The file never leaves the reader's device. No upload, no account, no queue, no file retention because there's nothing to retain. It's not a replacement for FreeConvert (or for HandBrake, which the desktop section already covers well) — it just fills the middle ground between "cloud upload" and "install a desktop app."

If it feels like a fit for the piece, a single line in the online-service section along the lines of "If you'd rather not upload the file to a third-party server, ConvertYard runs the same conversion locally in your browser" would do it. If not, no worries at all — happy either way that the how-to exists, and it's the sort of piece that punches above its keyword.

Best,
Garrick
ConvertYard

Link: https://www.techradar.com/how-to/how-to-convert-mkv-to-mp4

#TutsPlus

Subject: Suggestion for the 2026 update of your video compression roundup
Email: stephanie@starbeardgame.com

Hi Jonathan,

Sending this because your "10 Best Size Reducer Video Compression Software" roundup keeps showing up when I search for how other writers frame this category — and the title currently says 2025, which suggests a 2026 update is on the calendar. Two things worth flagging for that refresh, plus a category gap I think is worth filling.

Two entries that have aged since Feb 2024:

- #7 FreeConvert now caps free users at 5 files per batch and 10 total operations before requiring a paid plan. That's a meaningful change — your current write-up says "no software installation, free to use" without mentioning the wall.
- #10 CloudConvert has tightened its free tier to ~25 conversion minutes per day and 1GB uploads. Worth adding to the Cons list if you keep it.

The category gap: every web-based tool on your list uploads the user's file to a server. That's fine for casual users, but it's the entire reason serious videographers (your audience) skip the "convenient" web tools and grind through HandBrake instead. There's a real third category now — browser tools that run locally via WebAssembly. Same UX as FreeConvert (drop file, get file), but the video never leaves the browser. No upload, no server, no "we delete after 24 hours" trust exercise.

I run one of these — ConvertYard. If you'd consider a slot in the 2026 list (or swapping the FreeConvert entry, whose selling point has quietly disappeared), the compressor page: https://convertyard.com/compress-video

Why it earns a slot, honestly:

1. Same engine as HandBrake at the core — ffmpeg with x264/x265 codec support. Compiled to WebAssembly instead of running natively. Same output quality, same codec control.
2. No upload, verifiable. Open DevTools → Network tab, drop a 500MB video, no request goes out with the file. This is genuinely different from every web tool currently on your list.
3. No batch cap, no account, no freemium wall. Not "free tier limited to X" — there's no tier system to graduate out of.
4. Runs on any OS with a browser. Solves the "HandBrake on macOS Big Sur has this weird bug" thread that shows up in your Cons for HandBrake.

Honest limitations, so you can weigh it fairly:
- Slower than native HandBrake on very large files (WASM has ~1.5–2x overhead vs. native ffmpeg on the same machine).
- No CLI or scripting — pure GUI. Not a HandBrake replacement for automation-heavy workflows.
- No preset library as deep as HandBrake's. Presets cover the common cases (web, social, email attachment sizes), not niche broadcast profiles.

I'd put ConvertYard between HandBrake and FreeConvert in terms of positioning: not for automation power users, but the best option for anyone who currently uses FreeConvert/CloudConvert and cares about privacy or hits their file-count caps.

If it's useful, I can send a Pros/Cons block in your existing article format so a refresh is copy-paste for whoever handles the edit. No pressure to include — but if the 2026 refresh happens, I think leaving the local-first browser category out again would be the biggest gap.

Thanks either way for keeping the list current — most roundups in this space are just recycled 2018 top-10s that still include tools that have gone out of business.

Best,
Garrick
convertyard.com

Link: https://photography.tutsplus.com/articles/10-best-size-reducer-video-compression-software-free-paid-2024--cms-108386

##Intercom.help
email: support@pubby.co -- SENT AUG 18, 2026
Subject: Small suggestion for your "Interior Manuscript Files" article
Hi Kristy,

I was reading your help article on interior manuscript files and had one small suggestion for the "My file is taking a long time to upload" section.

Right now it points authors to Adobe's PDF compressor and freeconvert.com for ePub. Both are solid, but both work by uploading the manuscript to a third-party server. For a lot of your authors that's an unpublished book — the exact thing Pubby's own encryption is built to protect once it's inside the platform. Felt like a small gap worth mentioning.

I run ConvertYard (https://convertyard.com). Our PDF and EPUB compressors run entirely in the browser via WebAssembly — the file never leaves the author's device. No upload, no server, no account. It's also built for batch, so authors with a series can drop the whole set at once.

- https://convertyard.com/compress-pdf
- https://convertyard.com/compress-epub

No affiliate link, no tracking, no ask beyond "if it's useful, consider adding it alongside Adobe and FreeConvert." Totally fine if it's not a fit — figured it was worth flagging given who your users are.

Either way, the article is one of the clearer author-onboarding docs I've read this week. Nice work.

Best,
Garrick
ConvertYard

Link: https://intercom.help/pubby/en/articles/8856798-interior-manuscript-files

#AWeber
Email: seant@aweber.com -- PITCH SENT - Aug 15, 2026

Subject: Small addition for the "Speed up your website" tip in your marketing objectives post

---
Hi Sean,

I was working through your "13 Multichannel marketing objectives" piece (the SEO section, specifically) and had one small suggestion for the "Speed up your website" tip under organic traffic.

You currently recommend TinyPNG and Freeconvert for compressing onsite images and videos. Both work well. The one gap — especially for the small business owners AWeber tends to serve — is that both of them upload the file to a third-party server. For a solo marketer sitting on unreleased product photos, a client's assets, or lead-magnet PDFs, that's a friction point people don't always think about until after they've done it.

I run ConvertYard (https://convertyard.com). Our image and video compressors run entirely in the browser via WebAssembly — files never leave the device, no upload, no account. It's also built for batch, so someone prepping 40 blog images or a full set of product shots can drop the whole folder in at once instead of doing them one-by-one.

Relevant pages if you want a look:
- https://convertyard.com/compress-image
- https://convertyard.com/compress-video

No affiliate link, no tracking, no ask beyond "if it's useful, consider adding it as a third option next to TinyPNG and Freeconvert." Genuinely fine if it's not a fit.

Side note — the framing of the whole post around picking objectives before planning is a good corrective. Most "goals" articles skip straight to the list.

Best,
Garrick
ConvertYard

Link: https://blog.aweber.com/learn/top-email-marketing-campaign-goals.htm

#LifeWire

Email: contact@lifewire.com
Direct email: brad@bradstephenson.com -- PITCH SENT AUG 18, 2026

Subject: Small update idea for your "Convert Video to Audio" guide (2021 → 2026)

Hi Brad,

Your Lifewire piece on converting video to audio (the one that walks people through FreeConvert and Y2Mate) has been sitting near the top of Google for that query for years — I landed on it myself the other week. The last update on it is March 2021, so I figured I'd flag one thing that's changed since then in case you're ever back in the doc.

Both tools you recommend upload the video to a third-party server. In 2021 that was basically the only option for a non-technical user. In 2026 it isn't — modern browsers can run FFmpeg directly via WebAssembly, so the extraction happens on-device and nothing ever leaves the user's computer. For anyone converting a screen recording, an interview, or anything sensitive, that's a real difference.

I run ConvertYard (https://convertyard.com). Our MP4-to-MP3 and general audio-extract tools do exactly this — 100% in the browser, no upload, no signup, batch support if you have a folder of files.

- https://convertyard.com/mp4-to-mp3
- https://convertyard.com/extract-audio

No affiliate link, no tracking parameter. If it's useful, it'd slot in cleanly under your "What to Know" box as a third option alongside FreeConvert and Y2Mate — with the added line that it works offline once the page loads. If it's not, totally fine.

Either way, the "MUSIC Converters → MP3 → Choose Files" walkthrough is the clearest version of that flow I've seen. Nice work on it.

Best,
Garrick
ConvertYard

Link: https://www.lifewire.com/convert-video-to-audio-5072415

#University of Washingon Food Services

Email: huskycrd@uw.edu -- PITCH SENT AUG 18, 2026

Subject: Small privacy suggestion for your "Submit a Photo" page (Husky Card)

---
Hi Husky Card team,

I was reading the "Submit a Photo" instructions on the HFS site and wanted to flag something small but genuinely worth thinking about. It's a compliment, not a complaint — the page is one of the clearer student-onboarding docs I've seen from a university, which is why the one gap stood out.

Under "How to Save and Name Your Photo," the page recommends freeconvert.com and picresize.com to get files under 750KB. Both are solid tools, but both work by uploading the image to a third-party server. That's fine for a random photo — but in this workflow, the "photo" is often a scan of a driver's license, passport, or birth certificate + Social Security card, because that's what the very next section asks students to submit.

Two paragraphs later, the page also says: "In accordance with UW's security and privacy policies, your ID documents will not be saved in any system." That's true on UW's end — but the students have already sent those same documents to freeconvert.com to resize them before uploading. The privacy promise gets undercut before students ever hit the UW form.

I run ConvertYard (https://convertyard.com). Our image resizer and compressor run entirely in the browser via WebAssembly — the file never leaves the student's device, no upload, no account. It's free, has no ads on the tool pages, and works on Chromebooks and phones (which matters for the freshman-with-no-laptop case).

Relevant pages:
- https://convertyard.com/resize-image
- https://convertyard.com/compress-image

No affiliate link, no tracking. If you'd rather not add another vendor, another option is to add one line to that tip—something like, "If your file contains ID documents, use an in-browser tool that doesn't upload the file." Even that would materially close the gap.

Happy to answer any questions about how the tool works, or to share a short technical note your ITS team could review if that's useful.

Thanks for the work on the page,
Garrick
ConvertYard

Link: https://hfs.uw.edu/about-hfs/services-operations/huskycard-services/submit-a-photo/

#Detik

Link: https://inet.detik.com/tips-dan-trik/d-7015509/cara-kompres-video-tanpa-aplikasi

#Cuny.edu
Email: DigitalSignage@ccny.cuny.edu -- PITCH SENT AUG 18, 2026
CC: ATS@ccny.cuny.edu -- PITCH SENT AUG 18, 2026

Subject: Suggestion for the "Helpful websites" section on your Digital Signage page

---
Hi ATS team,

I was reading the CCNY Digital Signage submission guide (the page under IT → ATS) and wanted to flag a small consolidation idea for the "Helpful websites" list under Content Submissions.

Right now the page sends faculty and staff to three separate services to prep their content:
- FreeConvert — convert to MP4
- VideoCandy — merge videos
- VideoSmaller — reduce file size

All three work, but each is a separate site, each requires uploading the video to a third-party server, and each has its own ad experience. For a faculty member prepping a slide about an unannounced event or a draft campus message, "upload to three different vendors" isn't ideal.

I run ConvertYard (https://convertyard.com). All of our video tools run entirely in the browser via WebAssembly — the file never leaves the user's device, no upload, no account. What's relevant for your page specifically:

- Convert to MP4: https://convertyard.com/mov-to-mp4  (also webm, avi, mkv, flv → mp4, same landing pattern)
- Merge videos: https://convertyard.com/merge-video
- Compress video: https://convertyard.com/compress-video

Two bonuses that map directly to rules already on your page:

- Your rule "Videos must be submitted without audio or sound. Files containing audio will be rejected." → https://convertyard.com/video-muter (strips audio in one click, no re-encoding needed)
- Your 15-second cap → https://convertyard.com/video-trimmer

No affiliate link, no tracking parameter. If it's useful, the "Helpful websites" list could either add ConvertYard as a fourth option or replace all three with a single line pointing to the video-audio category page: https://convertyard.com/video-audio-tools

Happy to answer any questions from your team, or send a short technical note if IT wants to review how the WebAssembly conversion works before recommending it.

Thanks for the work on this page — the "acceptable formats" list is unusually clear compared to most campus signage docs.

Best,
Garrick
ConvertYard

Link: https://www.ccny.cuny.edu/it/digital-signage

#THImpress

Email: hoadt@thimpress.com -- PITCH SENT - AUG 18, 2026
Backup: contact@thimpress.com

Subject: One more AVIF converter worth adding to your top-converters roundup

---
Hi Sally,

I came across your "6+ Top AVIF Converters to Optimize Images" post while researching AVIF tools (it ranks well for that query — nice work), and wanted to flag one you might want to consider adding when the piece is next updated.

Your current list covers the two main archetypes well: server-based converters (CloudConvert, Convertio, FreeConvert) and single-file browser tools (Squoosh). One thing I noticed reading the post as a user, though — the "Cons" sections mention "conversion limits" and "free plan limits" but don't spell them out, and the limits are actually pretty tight in practice. For example:

- FreeConvert caps the free tier at around 10 files before pushing you to a paid plan
- Convertio limits free users to 100MB per file and a handful of conversions per day
- CloudConvert gives 25 free conversions per day, then it's pay-per-conversion or subscription

For a WordPress site owner batch-converting a real /uploads/ folder — which is your target reader — that means most of these tools break down on the first meaningful job. Worth calling out concretely, because "free with limits" and "10 files then pay" land very differently with someone about to convert 400 product photos.

That's the gap where the tool I'd suggest adding fits in:

ConvertYard — https://convertyard.com/jpg-to-avif

Pros:
- Runs 100% in the browser via WebAssembly — no upload, no account
- No file cap, no daily limit, no paid tier — the batch of 1,000 that would hit FreeConvert's paywall on file 11 just runs
- Real batch output: drop a folder, get a zip back with original filenames preserved
- Quality slider so you can tune AVIF output for your site

Cons (matching your existing Pros/Cons format):
- Uses the browser's own resources, so a 10,000-image job will be slower than a server-side tool on a fast machine
- No API — it's a website tool, not a workflow integration

Direct AVIF pages if useful for the write-up:
- JPG → AVIF: https://convertyard.com/jpg-to-avif
- PNG → AVIF: https://convertyard.com/png-to-avif
- WebP → AVIF: https://convertyard.com/webp-to-avif

No affiliate link, no tracking parameter. Happy to send a screenshot at whatever spec you use for the roundup images if it makes the update easier — just let me know the dimensions.

Either way, thanks for keeping the AVIF vs. WebP piece up to date — it's one of the few places actually explaining the trade-off clearly instead of just picking a winner.

Best,
Garrick
ConvertYard

Link: https://thimpress.com/top-avif-converters-to-optimize-images/

# InVideo.io
Author: contact@kritikanarula.com -- PITCH SENT AUG 18 2026
Backup Email:  blog@invideo.io

Subject: Small addition for your JPG-to-PNG guide (in-browser + batch option)

---
Hi Kritika,

I came across your "7 Super Easy Ways to Convert JPG to PNG" post on the InVideo blog while researching how creators handle bulk asset conversion, and wanted to flag one thing you might want to consider adding when the piece is next updated.

The online section covers Convertio, OnlinePNGTools, FreeConvert, TinyPNG, and JPG2PNG well — but every option in that list works the same way: upload the image to a third-party server, wait, download. You even note the Convertio detail that "files are stored on the website for 24 hours." For the InVideo audience specifically — creators converting thumbnails, character sheets, client-branded assets, or unreleased content — that upload step is friction people don't always think about until after they've done it.

A second gap: every tool in the online section is one-file-at-a-time in practice. Convertio's free tier caps at 100MB per file and limits daily conversions, FreeConvert paywalls after about 10 files, TinyPNG's free tier is capped at 20 images at a time. For a creator converting a full folder of thumbnails or a batch of storyboard frames, they'll hit a wall.

I run ConvertYard (https://convertyard.com). Our JPG-to-PNG tool runs entirely in the browser via WebAssembly — the file never leaves the user's device, no upload, no account, and no daily cap. Drop 500 JPGs, get a zip of PNGs back.

- https://convertyard.com/jpg-to-png

If it fits, it'd slot in cleanly as option D in your online section (or as a separate note under the existing list — something like "if you're batch-converting or dealing with sensitive/client assets, an in-browser tool avoids the upload step entirely"). No affiliate link, no tracking parameter.

Also worth mentioning: the reason for converting to PNG that opens your piece — transparency — actually leads people wrong sometimes. Converting a JPG to PNG doesn't add transparency; it just wraps the same opaque image in a bigger file. That might be worth a one-line clarification near the top so readers who want a transparent background don't get frustrated. Just an outside observation from someone who fields those support questions.

Either way, the phone/Mac/Windows sections in the piece are unusually complete — most JPG-to-PNG articles skip mobile entirely.

Best,
Garrick

Link: https://invideo.io/blog/how-to-convert-jpg-to-png/

#WP Rocket
Email: hello@wp-rocket.me (try) -- PITCH SENT AUG 27 2026
https://wp-rocket.me/contact/

Subject: Small update idea for the "Loading Fast with Video" post (compression section)

---
Hi WP Rocket team,

I was reading the "How to Keep Your Website Loading Fast with Video" post on your blog (the 15-tip guide, guest post from Dirk Gavor) and wanted to flag one addition to consider the next time it's refreshed.

Tip #4, "Use a Video Compression Tool," splits the recommendation into desktop (HandBrake, FFmpeg) and online (Clideo, FreeConvert). That's a clean split, but there's now a third category worth including: in-browser compressors that run FFmpeg via WebAssembly. They sit between the two — no install like HandBrake, no upload like FreeConvert.

This matters specifically for the WP Rocket audience because:

1. Privacy of unreleased assets. Clideo and FreeConvert upload the video to their servers. For an agency compressing a client's unreleased product demo, or a marketer prepping a launch video, that's a real concern most people don't think about until after the upload finishes.
2. Free-tier caps bite fast. FreeConvert paywalls after around 10 files. Clideo's free tier adds a watermark unless you sign up. For a WordPress site owner compressing a batch of testimonials or background loops, they'll hit a wall on file #11.
3. The exact use case in tip #4 — "optimize the file before uploading it to your server" — is the case where you want zero intermediate uploads. Adding a third-party server hop to avoid a server-load problem is a strange trade.

I run ConvertYard (https://convertyard.com). Our video compressor runs FFmpeg entirely in the browser via WebAssembly — same engine your existing desktop recommendation (FFmpeg) uses, just without the install step and without the upload.

- Compress video: https://convertyard.com/compress-video
- Related for tip #6 (Use a Lightweight File Format): https://convertyard.com/mov-to-mp4 and https://convertyard.com/mp4-to-webm

If it fits, it'd slot in cleanly as a third bullet under tip #4 — something like "in-browser options like ConvertYard use the same FFmpeg engine but skip the upload and install steps." No affiliate link, no tracking parameter.

Also, one small factual note in case it's useful for the refresh: the piece is titled "in 2024" and cites Wyzowl's 2023 survey. Wyzowl now has 2025 and 2026 editions out — updating the stats would give the whole post a natural reason to touch it and re-index.

Best,
Garrick
ConvertYard

Link: https://wp-rocket.me/blog/keep-your-website-loading-fast-video/

#Creative Market
Email: blog@creativemarket.com -- PITCH SENT AUG 18 2026
Subject: Small suggestion for your "What Is a WebP Image" guide on Creative Market

---
Hi Creative Market editorial team,

I tried Marc Schenker directly first but couldn't reach him through his site, so sending this your way — you own the URL and the refresh decision anyway.

I came across your "What Is a WebP Image? A Guide for Designers" piece on the Creative Market blog while researching WebP tooling, and wanted to flag one addition worth considering the next time you're back in the doc. The last update is April 2024, so it's probably due for a refresh.

The "How to convert an image to WebP" section covers CloudConvert, Online-Convert, EZGIF, and Convertio well — plus Google's cwebp CLI for the technical crowd. Two gaps stood out reading it as a designer, though:

1. Every online option in the list uploads the file to a third-party server. For the Creative Market audience specifically — designers converting client mockups, unreleased brand assets, or work-in-progress from a paying project — that upload step is a real concern. The alternative you offer (Google's cwebp CLI) solves it, but "download this command-line tool and run it in Terminal" is a hard ask for the visual designers Creative Market serves.

2. Free-tier caps bite fast. CloudConvert gives 25 free conversions a day. Convertio limits free users to 100MB per file and a handful of daily conversions. A designer converting a full folder of hero images or product shots for one project will hit a wall mid-batch. Worth calling out in the write-up because "free to use on the Internet" and "free until file 26" land very differently.

I run ConvertYard (https://convertyard.com). Our WebP tools run entirely in the browser via WebAssembly—same conversion quality as cwebp (we use libvips under the hood, which many production image pipelines use), but with a drag-and-drop UI. No install, no upload, no daily cap, real batch.

Direct pages:
- JPG to WebP: https://convertyard.com/jpg-to-webp
- PNG to WebP: https://convertyard.com/png-to-webp
- WebP to JPG (the "convert back" direction you mention for dwebp): https://convertyard.com/webp-to-jpg
- WebP to PNG: https://convertyard.com/webp-to-png

If it fits, it'd slot in as a fifth bullet under your online-converters list — with the differentiator being "in-browser, so it works like the online tools but keeps the file local like the CLI." No affiliate link, no tracking parameter.

One other small note that might be worth folding into a refresh: browser support for WebP is now universal (Safari added it in 2020, so even Safari 14+ handles it). The piece still hedges a bit on adoption, and the reality in 2026 is that WebP has basically won on the web-image side while AVIF is fighting for the next tier. That framing shift might give the whole post a natural reason to re-index.

Best,
Garrick
ConvertYard

Link: https://creativemarket.com/blog/what-is-a-webp-image

#MakeUseOf
Author email: mahnoorfaisalx@gmail.com -- Pitch Sent Aug 18, 2026
Editorial: editor@makeuseof.com

Subject: Small addition for your "Extract Audio From Video on Smartphone" post

---
Hi Mahnoor,

Read your MakeUseOf piece on extracting audio from video on a smartphone — the iOS/Android app walkthroughs are unusually clear compared to most guides on this query, so I wanted to flag a small addition for the "Use an Online Video to MP3 Converter" section in case you're back in the doc.

Right now the online option is FreeConvert, which works — but two things stood out reading it as someone in the target audience (grab audio off a phone, no fuss):

1. FreeConvert uploads the video to their servers, which is a step people don't think about until after they've done it. For a Reel or a personal recording, it's not the end of the world; for a video with someone else in it, or work content, it's meaningful.
2. The free tier hits a paywall pretty quickly (around 10 files), which is easy to miss until you're mid-flow.

Also worth noting — your own iOS walkthrough calls out "you may need to watch an ad during this process" for MP3 Converter. That's the third piece of friction the "just use a website" section can actually solve, if the website is the right kind.

I run ConvertYard (https://convertyard.com). Our video-to-MP3 tool runs entirely in the mobile browser via WebAssembly (FFmpeg compiled to WASM — same engine most desktop converters use). What that means in practice for the smartphone context you're writing about:

- No app install, no App Store permission dance
- No upload — the file stays on the phone
- No ads on the tool page, no signup, no daily cap
- Works the same on iOS Safari and Android Chrome
- https://convertyard.com/mp4-to-mp3
- https://convertyard.com/extract-audio  (handles MOV, WebM, MKV, etc. → MP3/WAV/AAC)

If it fits, it'd slot in cleanly as a second bullet under the online section — the framing being "in-browser tools run the conversion on the phone itself, so no upload and no ads." No affiliate link, no tracking parameter. Totally fine if it's not the right time to update.

One tiny factual note in case it's useful — the article's summary line says "for a one-time audio extraction from a video," but there's nothing stopping in-browser tools from doing batch conversions (drop a folder of clips, get a zip back). That might be worth mentioning as an edge for the online-tool path over the app path, since the mobile apps you cover are strictly one-at-a-time.

Best,
Garrick
ConvertYard

Link: https://www.makeuseof.com/extract-audio-from-video-on-smartphone/

#OmniSend
Likely email: aiste@omnisend.com -- PITCH SENT AUG 18 2026
Editorial: content@omnisend.com
General: hello@omnisend.com

Subject: Small addition idea for your "How to Send GIFs in Text Messages" guide

---
Hi Aistė,

I read your Omnisend piece on adding GIFs to text messages (the full-device walkthrough from January) and wanted to flag one thing that felt like a genuine gap in an otherwise complete article — not a correction, more a "here's a section that might be worth adding."

The piece covers where to find pre-made GIFs (GIPHY, Tenor) really well. What it doesn't cover is how a marketer makes their own GIF from brand footage — and for the SMS marketing use case Omnisend actually competes in, that's arguably the more important workflow. Nobody wants their Black Friday MMS campaign to lead with a stock Donald Duck reaction — they want a 3-second loop of their own product, a founder waving, or the box being unpacked. The "How to send GIFs with Omnisend" section talks about adding a GIF, but stops short of showing where that on-brand GIF comes from in the first place.

That's the section I'd suggest adding, and I'll happily fill in what a marketer usually needs to know:

1. Trim a clip to 2-4 seconds — MMS carriers cap file size, so short is mandatory
2. Convert MP4 to GIF — this is the actual conversion step
3. Keep it under ~1 MB — most US carriers cap MMS attachments around 1-1.2 MB

I run ConvertYard (https://convertyard.com). The relevant tools that map to that three-step flow:

- Trim video: https://convertyard.com/video-trimmer
- Convert to GIF: https://convertyard.com/video-to-gif
- All in-browser via WebAssembly — file never leaves the marketer's device, no upload, no account. Matters when the source clip is unreleased brand content.

If it fits, this could be a new H2 between "Where to find GIFs to text" and "How to send GIFs with Omnisend" — call it something like "How to make your own GIF for SMS marketing" — and it'd make the piece meaningfully more useful to the ecommerce audience the rest of the article is written for. No affiliate link, no tracking parameter.

One other small note that might be worth folding in: the piece links to GIPHY and Tenor as "where to find GIFs," but a lot of the trending Tenor content is now un-licensed for commercial marketing use. Worth a one-line disclaimer somewhere — "if you're sending GIFs in a marketing campaign, check the license before using pop-culture content" — because that's a lawsuit-shaped hole in a lot of SMS strategies right now.

Best,
Garrick
ConvertYard

Link: https://www.omnisend.com/blog/how-to-send-gifs-in-text-messages/

#MaxGiving
support@maxgiving.com -- PITCH SENT AUG 27 2026

Subject: Small addition for your "Adding Photos or Videos" help doc

Pitch (paste this into the contact form's "Short Description of your Event" field, or send as email if you have a direct address):

Hi there,

I was going through your knowledge base article on adding photos and videos to a MaxGiving site (the one that suggests FreeConvert for MOV to MP4). Really practical piece, especially the note about YouTube URLs as a lighter alternative for page load. Wanted to send a quick suggestion in case it's useful the next time the docs team touches that page.

FreeConvert works well for MOV to MP4, but it uploads the file to their server before converting. For a general SaaS audience that's often fine, but nonprofit organizers on MaxGiving are frequently handling video that's sensitive in specific ways:

- Event footage that includes minors at galas, walks, or youth-serving programs, where the consent forms cover the nonprofit's own use but not third-party servers
- Donor testimonials recorded under limited-use consent
- Videos of donated auction items (art, jewelry, one-of-a-kind pieces) before the item catalog goes public
- Sponsor-provided reels that are under embargo until the event launches

I built ConvertYard (https://convertyard.com/mov-to-mp4), a free browser-based MOV to MP4 converter that does the conversion locally via WebAssembly. The file never leaves the volunteer's or staff member's device, no account, no upload queue, no retention. It could sit alongside your existing FreeConvert recommendation as an option for orgs whose footage they'd rather not hand to a third party first.

Not asking for FreeConvert to be removed or for a formal link swap. Just one more option to mention for the nonprofits on your platform who care about where donor and beneficiary media travels.

If it's not the right fit for the docs, no worries at all — either way, thanks for keeping the knowledge base actively maintained (I noticed the June 2026 update on the print guide page, which is more upkeep than most SaaS help centers manage).

Best,
Garrick
ConvertYard

Link: https://maxgiving.helpscoutdocs.com/article/43-adding-photos-or-videos-to-your-site

#Kuula
360toursutah@gmail.com -- PITCH AUG 27 2026

Subject: Small addition for the audio-compression section in your Kuula tour post

Pitch:

Hi Paul,

I came across your Kuula post on using music and audio in virtual tours while researching how tour builders handle Kuula's 5 MB audio limit, and I ended up bookmarking it — the point about erring quieter rather than louder is the sort of thing you only learn after annoying a client once. I also appreciated the ArtList shout-out; the mood/theme filtering is genuinely underrated.

I wanted to send one quick suggestion for the "Compressing" section in case it's useful the next time you edit the post.

You currently recommend OnlineConverter and FreeConvert as the two web options. Both work well, but they both upload the file to their server before compressing. For a lot of tours that's fine, but there are cases where it matters:

- Real estate walkthroughs where the listing hasn't hit MLS yet and the agent doesn't want any part of it sitting on a third party's queue
- Corporate or venue tours with voiceover narration that includes the client's own voice, or names/details that shouldn't leave the editor's laptop
- Any tour where the narrator recorded scratch takes with off-the-cuff comments they'd rather never surface

I built ConvertYard (https://convertyard.com/compress-mp3), which does MP3 compression entirely inside the browser via WebAssembly. The file never leaves the device, no account, no upload queue. A couple of specific things that map to your workflow:

- Size-specific presets. You can tell it "compress to 5 MB" directly, which lines up exactly with Kuula's upload cap. No trial-and-error with bitrate settings.
- Standard quality slider if you'd rather set a bitrate manually.
- Podcast / speech mode. For voiceover narration specifically, it cuts files by roughly 70–80% with no noticeable quality drop for spoken audio. Not useful for background music tracks, but very useful for the "voice over narration" workflow you mention.

Not asking for a link swap or for you to remove FreeConvert / OnlineConverter. Just an option worth mentioning alongside them for editors who'd rather not upload client audio. If it doesn't feel right for the post, no worries at all.

Also, if it's helpful for other Kuula creators, the Audio help doc on kuula.co (kuula.co/help/audio) mentions MP3Smaller and Audacity for the same task — feel free to pass this along to the Kuula team if you think they'd want a note too.

Thanks again for putting the post out there. Guides like this are why the Kuula community is what it is.

Best,
Garrick
ConvertYard

Link: https://blog.kuula.co/music-audio-virtual-tours

#Descript

Editorial fallback: content@descript.com

Subject: One more free video-to-audio converter worth considering for your roundup

---
Hi Holly,

Came across your "9 Best Video to Audio Converters in 2026" piece for Descript while researching this space, and wanted to flag one you might want to include in the "free" section next time the piece is refreshed. Sending this to you rather than Descript because you own the byline and I figure you care about the list being complete.

The current free section covers the two main archetypes well: desktop installs (VLC, HandBrake) and hosted web tools. What's missing is a third category that's grown a lot in the last two years — in-browser converters that run the FFmpeg engine locally via WebAssembly. They sit between the two: no install like VLC, no upload like FreeConvert.

ConvertYard — https://convertyard.com/extract-audio

Relevant for the format your existing entries use:

Best for: Users who need VLC-quality output without the download, and don't want to upload the file to a third-party server.

Features:
- Extracts audio from MP4, MOV, WebM, MKV, AVI, FLV to MP3, WAV, M4A, FLAC, OGG
- Runs entirely in the browser via FFmpeg-WebAssembly — same engine VLC uses under the hood
- Real batch (drop a folder, get a zip back)
- Bitrate, sample rate, and channels are user-configurable

Pros:
- No install, no signup, no daily cap
- File never leaves the user's device (matters for unreleased interviews, client footage, gated podcast content)
- Works on Chromebook / mobile browser, which VLC and HandBrake don't
- Free with no paid tier

Cons:
- Uses the browser's own resources, so a multi-GB file will be slower than a native desktop app
- No editing features beyond format conversion (which is actually the point — it's a converter, not an editor)

If it fits, it'd slot in cleanly between the "3. VLC" (desktop) and "5. FreeConvert" (upload) entries as the browser-native option that bridges them. No affiliate link, no tracking parameter. Totally get it if a browser-based free tool is a hard sell inside a Descript-owned URL — figured it was worth flagging either way given the piece is positioned as a genuine comparison.

Best,
Garrick
ConvertYard

Link: https://www.descript.com/blog/article/best-video-to-audio-converter

#ShortPixel

Link: https://shortpixel.com/blog/compress-gif-images/

#SlashGear

Author email: marinelsigue1996@gmail.com

Subject: Small addition for your "How to Add a PDF to Google Docs" article

---
Hi Marinel,

Read your SlashGear piece on adding PDFs to Google Docs (the four-method walkthrough from Feb 2024) — the "as smart chip" vs "as image" split is one of the clearer explanations of that distinction I've come across. Wanted to flag one small suggestion for the "As an image" section in case you're back in the doc for a refresh.

The section currently sends readers to two PDF-to-image converters: pdf2png.com and freeconvert.com/pdf-to-jpg. Both work — but reading the article's own framing (your intro literally calls out "a student needing to finish homework or a professional creating a monthly report for a client"), the file being converted is often exactly the kind of thing you'd rather not upload to a random third-party server: a course syllabus, a client contract, a graded paper, a signed NDA. And that's before the free-tier limits — FreeConvert paywalls after around 10 conversions.

I run ConvertYard (https://convertyard.com). Our PDF-to-image tools run entirely in the browser via WebAssembly (PDF.js + libvips compiled to WASM) — the file never leaves the user's device, no upload, no account, no daily cap.

- PDF to JPG: https://convertyard.com/pdf-to-jpg
- PDF to PNG: https://convertyard.com/pdf-to-png

Both handle multi-page PDFs cleanly — one page per image, output as a zip, so a student inserting a 12-page PDF as images doesn't have to convert page by page like they would on pdf2png.com.

If it fits, it'd slot in cleanly as a third bullet under step 1 of the "As an image" method — something like "Via in-browser converter — the file is processed locally and never uploaded, which matters if your PDF contains sensitive content." No affiliate link, no tracking parameter.

One other small note that might be worth folding in on a refresh: Google Docs added native PDF import in late 2024 (File → Import → PDF) which will convert the PDF straight into Docs content, sometimes better than the "Open with Google Docs from Drive" trick in your "As editable text" section. Worth a mention because it's often the fastest path for the editable-content case now.

Best,
Garrick
ConvertYard

Link: https://www.slashgear.com/1514386/how-to-add-pdf-to-google-docs/

#WebsiteBuilderExpert

Email: hello@websitebuilderexpert.com

Hi Holly,

Read your video optimization guide on Website Builder Expert (the SEO one that walks through file formats, compression, and HTML5) — the "4 Steps to Prepare Your Website for Video" section is genuinely one of the tighter frameworks I've seen on this topic. Wanted to flag one addition worth considering next time you're back in the doc.

The "Compressing Your Videos" list currently covers FreeConvert, VEED, and Any Video Converter. That's a solid mix, but a third category has grown a lot in the last year: in-browser compressors that run FFmpeg locally via WebAssembly. They sit between the FreeConvert model (upload to a server) and the Any Video Converter model (install a desktop app): no install, no upload, no free-tier cap.

This matters for your target reader — a small-business owner compressing their own product demo or founder video — for a few reasons:

1. Privacy of unreleased content. FreeConvert and VEED both upload the video to their servers. For pre-launch product footage or client work, that's a step people don't think about until after they've done it.
2. Free-tier caps bite fast. FreeConvert paywalls after around 10 files. VEED's free plan caps video length at 10 minutes and adds a watermark for many export options. Any Video Converter's free tier restricts output formats.
3. The exact audience you serve. Website builders using Wix / Squarespace / WordPress often don't have IT support to install desktop apps — a browser tool is a cleaner recommendation for that reader.

I run ConvertYard (https://convertyard.com). Our video tools use the same FFmpeg engine HandBrake does (which you already recommend in the FAQ), just compiled to WebAssembly so it runs in the browser:

- Compress video: https://convertyard.com/compress-video
- Convert to MP4 (relevant for your HTML5 section): https://convertyard.com/mov-to-mp4
- Convert to WebM: https://convertyard.com/mp4-to-webm

If it fits, it'd slot in cleanly as a fourth bullet in your compression list — with the differentiator being "in-browser tools skip both the upload step and the install step." No affiliate link, no tracking parameter.

One small side note: your "Be Mindful of Fonts and Image Files" section mentions "I use Image Compressor!" — if you're looking for a companion browser tool for images that matches the video recommendation (same no-upload behavior, so the advice is consistent across both sections), ConvertYard has https://convertyard.com/compress-image for that too. Totally optional, just flagging.

Best,
Garrick
ConvertYard

Link: https://www.websitebuilderexpert.com/seo/video-optimization-for-your-website/

#DivX - Skip

Link: https://www.divx.com/blog/best-free-avi-to-mp4-converter/

#Bard.Udu
admissions@berlin.bard.edu -- PITCH SENT AUG 27 2026

Hi Helene,

I came across "Mapping the BCB Soundscape" while reading through work on urban sonic ethnography and ended up staying much longer than I planned — the campus maps section and the reflection on Pankow's soundscape are lovely, and the invitation for the BCB community to keep contributing is a nice touch.

One small thing I wanted to flag, in case it's useful for the next cohort of students working with the guide:

In the "How to Post" section you recommend Zamzar and FreeConvert for the m4a → mp3 step. Both work fine, but they're cloud converters, which means the recording gets uploaded to a third-party server before conversion. For a soundscape project that's specifically capturing public space in Berlin, students are often recording identifiable voices, snippets of conversation, kids playing, etc. Under GDPR the safer default is to keep those files local until the student has decided what to share.

I run a small tool at ConvertYard (https://convertyard.com) that does the same m4a → mp3 conversion entirely inside the browser via WebAssembly — the file never leaves the device, there's no account, and it handles batches (helpful for a class that ends up with dozens of clips per student). The relevant page is:

https://convertyard.com/m4a-to-mp3

There's also a broader set of audio and video converters (wav, flac, ogg, mp4, mov, webm, etc.) in case future iterations of the class experiment with formats beyond mp3.

I'm not asking for a link — just thought it was worth mentioning as an option alongside Zamzar and FreeConvert, since the privacy framing fits the spirit of the project. If you ever revisit the post, feel free to add or ignore. Either way, thanks for putting the piece out there; it's the kind of student work that makes me wish more sociology courses ended up online.

Best,
Garrick
ConvertYard

Link: https://blog.berlin.bard.edu/mapping-the-bcb-soundscape/


#wfu.edu

Primary: Simone Parker (Associate Director, Digital) — parkers@wfu.edu -- PITCH SENT AUG 27 2026
She's on the Web and Digital Strategy team that owns the WordPress Guide, and Associate Director level is usually the right altitude for a "small edit to a help doc" note (Senior Director would forward it here anyway).

Backup / cc options if you want more coverage:
- nowakpj@wfu.edu — Pete Nowak, Senior Director, Digital Strategy & Enrollment Marketing (owns the team)
- perrielm@wfu.edu — Lisa Perriello, Associate Director, Digital (peer to Simone)
- umc@wfu.edu — general UMC inbox (safe fallback)

Subject: Small suggestion for the WordPress Guide Photo Editing page

Pitch:

Hi Simone,

I was reading through the WordPress Guide's Photo Editing page and wanted to send a quick note in case it's useful for the refresh you're working on (I saw the survey banner at the top).

The page walks editors through Photoshop for resize, crop, and Save for Web, and mentions TinyJPG as a free alternative for compression. Both work well, but there are a few situations where neither is ideal:

- Student workers, contractors, or alumni maintainers who edit WFU sites but don't have active Adobe CC access
- Anyone on a lower-spec laptop where Photoshop is slow to open for a 30-second resize
- Pages using imagery that shouldn't be uploaded to a third-party server before publication (embargoed announcements, unreleased marketing shots, student photos where the editor is being cautious about consent)

I run ConvertYard (https://convertyard.com), a free set of browser-based image tools that could sit alongside your existing Photoshop and TinyJPG recommendations. Everything runs locally inside the browser via WebAssembly, so files never leave the editor's device. No account, no upload, no queue. If it's helpful, here are the pages that map to each section of your guide:

- Resize to a specific width (your "Photoshop Image Size" section): https://convertyard.com/image-resizer
- Crop to a specific aspect ratio (your "Cropping in Photoshop" section): https://convertyard.com/image-cropper
- Compress before upload, since WFU caps images at 3 MB (your "Save for Web" step): https://convertyard.com/image-compressor
- Convert to WebP for faster page loads: https://convertyard.com/jpg-to-webp

Not asking for a link swap or removal of anything else. Just an option for editors who want something lighter than Photoshop and don't want to hand files to a third party for the compression step. If the framing feels wrong for the guide, ignore me and no hard feelings.

Either way, the guide is genuinely one of the clearer university WordPress docs I've come across, especially the cropping tips for the Featured Image grid. That's the kind of detail most guides skip.

Best,
Garrick
ConvertYard

Link: https://wordpress.wfu.edu/additional-info/photo-editing/


Note: Check links to www.freeconvert.com inside ahrefs.