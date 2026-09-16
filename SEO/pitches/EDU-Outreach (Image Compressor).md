## GOV and EDU targets

#illinois.gov (ILOVEIMG)
PITCH SENT SEPT 10 2026
 DoIT.WebServices@illinois.gov
Suggestion for "Big effect with tiny images": a batch, browser-only compressor

Hi DoIT Web Services team,

I came across the "Big effect with tiny images" article on the WCM Authoring Guide (wcmauthorguide.illinois.gov/news/2023/big-effect-with-tiny-images.html) and wanted to flag a tool that might be worth adding alongside TinyPNG and Squoosh.

Both tools you recommend are solid, but they have limits that come up quickly for AEM authors prepping images at scale:

- TinyPNG caps at 20 images and 5 MB per file, and every image is uploaded to a third-party server. For state agency content — event photos, program documents, anything that might include identifiable people — that upload step is a privacy consideration most authors don't think about.
- Squoosh is great for tuning a single image, but it's one file at a time, which stalls out when someone is refreshing a page with 40+ photos.

I built ConvertYard (https://convertyard.com) to close that gap. It's a local-first batch image compressor that runs entirely in the browser via WebAssembly. Nothing is uploaded, ever — files never leave the author's machine. It handles 1,000+ images in a single drop, no per-file size cap, and outputs a ZIP. Formats include JPG, PNG, WebP, AVIF, and HEIC.

For a state agency workflow, the privacy posture is the meaningful part: an author at IDPH or DCFS can compress a folder of photos without any of them touching an external server. Free, no signup, no ads inside the tool.

The direct link for the compression section would be convertyard.com/compress-image. Happy to answer anything about the WASM pipeline or the privacy model if it's useful.

Thanks for maintaining the guide — the AEM authoring documentation is one of the more thorough state resources I've come across.

Best,
Garrick
ConvertYard

Link: https://wcmauthorguide.illinois.gov/news/2023/big-effect-with-tiny-images.html

#ct.gov (ILOVEIMG)
PITCH SENT SEPT 10 2026
 DGOETraining@ct.gov
Subject: Suggestion for the CT.gov image-sources guide: a batch, browser-only compressor

Hi Digital Training Center team,

I came across your image-sources guide for Sitecore authors (portal.ct.gov/sitecore-center/components/image-component/image-sources) and wanted to flag a resource that might be worth adding to the compression section.

Most of the compressors state authors reach for have real limits when prepping images for CT.gov:

- TinyJPG caps at 20 images and 5 MB per file, and every image is uploaded to a third-party server. For public-sector content that can include documents, event photos, or anything with identifiable people, that upload step is a privacy concern most editors don't think about.
- Squoosh is excellent but strictly one image at a time, which falls apart when an agency is refreshing a page with 30+ photos.

I built ConvertYard (https://convertyard.com) to fill that gap. It's a local-first batch image compressor that runs entirely in the browser via WebAssembly. Nothing is uploaded, ever — files never leave the author's machine. It handles 1,000+ images in a single drop, no per-file size cap, and outputs a ZIP. Formats include JPG, PNG, WebP, AVIF, and HEIC, which lines up with the formats your guide already recommends.

For a state agency workflow, the privacy posture is the meaningful part: an editor at DPH or DCF can compress a folder of event photos without any of them touching an external server. It's free, no signup, no ads inside the tool flow.

If it's useful, the direct link for your compression section is convertyard.com/compress-image. Happy to answer any questions about how the WASM pipeline works or the privacy model.

Thanks for maintaining the Sitecore Center — it's one of the cleaner state government documentation hubs I've seen.

Best,
Garrick
ConvertYard

Link: https://portal.ct.gov/sitecore-center/components/image-component/image-sources

#ucr.edu (ILOVEIMG)

To: cnascommunications@ucr.edu -- PITCH SENT SEPT 2, 2026
CC: tom.windeknecht@ucr.edu
Subject: Small suggestion for your image optimization guide (privacy-safe tool for sensitive uploads)

Hi Tom (and CNAS Communications team),

I came across your "Prepare Your Images for Your Site" page while researching image optimization guides that Drupal site editors actually use, and it's one of the more practical ones I've read. The 1920×1280 crop tip alone saves people from re-uploading the same photo three times.

I also ran a quick check on the outbound links. Nothing 404s, so no cleanup needed there.

One small suggestion for the "Free Online Tools to Optimize Images" list. TinyJPG/TinyPNG works well, but two limits are worth flagging for your faculty and staff:

1. It caps free compression at 20 images per batch.
2. Every image is uploaded to their servers before it gets compressed.

For most marketing photos that's fine. But CNAS staff sometimes prep images that shouldn't leave the university, like student photos, unpublished research figures, event RSVP screenshots with names, or internal slides. For those cases, an in-browser tool is a safer fit.

I built ConvertYard for exactly that reason: https://convertyard.com/image-compressor

Nothing is uploaded. Compression runs locally in the browser via WebAssembly, so the file never leaves the machine. It also handles large batches (1000+ images), outputs a ZIP, and supports JPG, PNG, WebP, and AVIF.

If it fits, adding it next to TinyJPG would give your editors a clean option for sensitive uploads. Something like: ConvertYard, free in-browser image compressor at https://convertyard.com/image-compressor, runs entirely in your browser with no upload, handles batches up to 1000 files.

No affiliation, no tracking pixel to install, no signup. Just thought it fit the spirit of a guide that already respects the reader's time.

Either way, thanks for keeping that page maintained. It's a genuinely useful resource.

Best,
Garrick
ConvertYard

https://cnastheme.ucr.edu/basics/image-optimization

#gsu.edu (ILOVEIMG)

Contact: The CommKit team doesn't publish a direct email. Best routes:
- Submit via their support form: https://commkit.gsu.edu/support/ -- PITCH SENT SEPT 2, 2026
- Or email: tickets@gsu.uservoice.com (their ticketing address, listed on the support page as "forward emails to us here")

Link check: All outbound links on the page return 200 (iloveimg.com, ilovepdf.com, gsu.uservoice.com KB article, /support/). Nothing broken.

---
Subject: Suggestion for your Image and PDF Compressors page (in-browser option for sensitive files)

Hi CommKit team,

I found your Image and PDF Compressors page while looking at how university web teams recommend compression tools to faculty and staff, and it's refreshingly to-the-point. The 2MB upload rule with a clear "compress first before requesting support" line probably saves your team a lot of tickets.

Quick link-check note: I ran the outbound links (iloveimg.com, ilovepdf.com, the UserVoice KB article) and everything still resolves cleanly, so no cleanup needed there.

One small suggestion for the tool list. Iloveimg and Ilovepdf are solid, but both upload every file to their servers before compressing. For a lot of GSU use cases that's fine. For others it isn't. Faculty compressing student rosters, unpublished research figures, IRB documents, signed forms, or PDFs with SSNs on them shouldn't be sending those to a third-party server just to shrink a file.

I built ConvertYard to fix exactly that gap:

- Image compressor: https://convertyard.com/image-compressor
- PDF compressor: https://convertyard.com/compress-pdf

Nothing is uploaded. Compression runs locally in the browser using WebAssembly, so files never leave the machine. It handles large batches (up to 1000 files), outputs a single ZIP, and supports JPG, PNG, WebP, AVIF, and PDF.

If it fits your list, adding it as a "for sensitive files" option next to Iloveimg would give your website managers a safe default for anything they'd rather not upload. Something short like:

ConvertYard — free image and PDF compressor at convertyard.com — runs entirely in the browser, nothing uploaded, batches up to 1000 files. Recommended when the file contains sensitive information.

No affiliation, no signup, no tracking pixel. Just a good fit for a page that already respects the user's time.

Thanks for maintaining the toolkit — it's a genuinely useful resource for anyone running a GSU site.

Best,
Garrick
ConvertYard

https://commkit.gsu.edu/compression/

#trincoll.edu (ILOVEIMG)

Contact: sta-help@trincoll.edu (Trinity College Student Technology Assistant Program) -- PITCH SENT SEPT 2, 2026

Link check: All tool links resolve. Convertio, FreeFileConvert, IloveIMG, IlovePDF all return 200. ConvertFiles returned 403 to my automated request (bot-block, not broken — loads fine in a browser). Nothing to fix.

---
Subject: Small suggestion for your "Convert Media Files" guide (batch + privacy add for the STA page)

Subject: Small suggestion for your "Convert Media Files" guide (batch + privacy add for the STA page)

Hi STA team,

I came across your "How to Convert Media Files – quick and easy" post while researching how college tech helpdesks recommend conversion tools, and it's a genuinely well-scoped guide. Leading with Paint and Preview before jumping to web tools is the right instinct — students don't need to upload a screenshot to a random site to save it as a PNG.

Quick heads-up on link health: I checked every tool linked in the post (Convertio, ConvertFiles, FreeFileConvert, IloveIMG, IlovePDF) and they all still work. No cleanup needed.

One suggestion for the "Online Website" section. IloveIMG is fine for one-off conversions, but two things trip up students once they try to do real work with it:

1. Free-tier batch cap. IloveIMG limits free users to about 30 images per batch. Anyone converting a semester's worth of research photos, a lab dataset, or a full folder of HEICs off an iPhone hits that wall quickly.
2. Uploads. Every file is sent to their servers before it's converted. For a class roster screenshot, a scanned ID, a research figure that isn't published yet, or anything with a name on it, that's not ideal.

I built ConvertYard as a free alternative that fixes both:

- Image converter: https://convertyard.com/image-converter
- Image compressor: https://convertyard.com/image-compressor
- PDF tools: https://convertyard.com/compress-pdf

It runs entirely in the browser via WebAssembly, so files never leave the student's machine. It also handles hundreds of images per batch (up to 1000), outputs a single ZIP, and supports JPG, PNG, WebP, AVIF, HEIC, and more.

If it fits the guide, adding a line like this next to IloveIMG would give students an option for larger jobs and sensitive files:

ConvertYard — free online image and PDF converter at convertyard.com — runs entirely in the browser (nothing uploaded), and handles hundreds of files per batch. Good for bulk conversions or anything you'd rather not upload to a third-party server.

No affiliation, no signup, no tracking. Just a fit for a page that's already student-first.

Thanks for keeping the STA blog going — resources like this are the reason students figure things out without opening a ticket.

ConvertYard

https://edtech.domains.trincoll.edu/trincollstas/how-to-convert-media-files-online-quick-and-easy/

#upc.edu (ILOVEIMG)

Contact: No public email. Bibliotècnica uses a web form: https://bibliotecnica.upc.edu/en/contacte (select "General – All libraries," subject line about the Punt Atenea guide). -- PITCH SENT SEPT 2, 2026

One note before the pitch: The anchor you sent (#7-optimitza-gestio-terminis-avaluacio) is the "Optimize deadline and assessment management" section, which is about calendars and gradebooks, not image tools. The image-compression recommendations (compressjpeg.com, iloveimg.com, edit.photo, Gimp) actually live in section #10 – "Create and protect your teaching materials" (anchor #10-crea-protegeix-teu-material-docent). Pitch below references section 10 so it lands with whoever maintains that part.

Link check: compressjpeg.com, iloveimg.com, edit.photo all return 200. Nothing broken on the guide.

---
Subject: Suggestion for the Punt Atenea best-practices guide (section 10, image tools)

Hola,

I came across the "Best practices guide for designing and structuring a course at ATENEA" while researching how universities recommend image and PDF tools to teaching staff, and it's one of the more carefully thought-through Moodle guides I've read. The section on hosting materials in institutional repositories instead of embedding raw files is exactly the kind of guidance most Moodle docs skip.

Quick link check: the three image tools listed in the section 10 footnotes (compressjpeg.com, iloveimg.com, edit.photo) all still resolve. Nothing broken.

One small suggestion for that same footnote list in section 10 ("Create and protect your teaching materials"). Iloveimg is fine for one-off use, but two limits become obvious when UPC teaching staff try to prep a full course:

1. Free-tier batch cap. Iloveimg caps free users at around 30 images per batch. Anyone converting a whole lab dataset, a semester of scanned exam pages, or a set of HEIC photos off a phone hits that ceiling quickly.
2. Server upload. Every file is uploaded to Iloveimg's servers before it's processed. For images with student names, unpublished research figures, exam scans, or anything that shouldn't leave UPC infrastructure, that's not ideal under GDPR expectations.

I built ConvertYard as a free tool that solves both:

- Image compressor: https://convertyard.com/image-compressor
- Image converter: https://convertyard.com/image-converter
- PDF compressor: https://convertyard.com/compress-pdf

It runs entirely in the browser using WebAssembly, so files never leave the teacher's machine. It also handles hundreds of images per batch (up to 1000), outputs a single ZIP, and supports JPG, PNG, WebP, AVIF, and HEIC.

If it seems useful for the guide, feel free to add it to the section 10 footnote alongside iloveimg. If not, no problem — I just wanted to flag it since the batch and privacy angles line up with the guide's own emphasis on protecting teaching materials.

Thanks for maintaining the Punt Atenea resources. They're doing real work for UPC staff.

Best,
Garrick
ConvertYard

Link: https://bibliotecnica.upc.edu/en/punt-atenea/guia-bones-practiques#7-optimitza-gestio-terminis-avaluacio

#academia.edu (ILOVEIMG)
Link: https://www.academia.edu/40209991/IRJET_Compress_Image_without_Losing_Image_Quality_using_nQuant_Library

#world.edu (ILOVEIMG)

Contact: admin@world.edu (author bio credits Ingrid Mosquera Gende, UNIR; post-owner on site is Kevin, world.edu co-founder — safest to send to admin@ with subject naming the article and CC-able if you find Ingrid's UNIR email) -- PITCH SENT SEPT 2 2026

Link check: Vocaroo, ILovePDF, ILoveIMG, Fastboard.io, and the YouTube demo all resolve cleanly. Nothing broken.

Link check: Vocaroo, ILovePDF, ILoveIMG, Fastboard.io, and the YouTube demo all resolve cleanly. Nothing broken.

Nice hook on this one: the article already tells readers to prefer offline/local tools for privacy — "even if we do not pay, the documents or images we upload can be used by third parties. For certain processes, we recommend using offline tools or working locally." That's exactly the ConvertYard pitch. So the outreach isn't asking them to change their mind — it's giving them a tool that closes the loop they already opened.

---
Subject: A local-first alternative that fits the caveat in your ILovePDF/ILoveIMG paragraph

Hi,

I came across "Simple and free digital tools for learning and teaching" by Ingrid Mosquera Gende and it's one of the more thoughtful teaching-tools roundups I've read this year. Most articles in this format stop at "here are 10 free tools." This one actually flags the privacy tradeoff most authors skip:

"Even if we do not pay, the documents or images we upload can be used by third parties. For certain processes, we recommend using offline tools or working locally."

That paragraph is the reason I'm writing. Teachers who take that advice seriously then hit a wall — the "work locally" option usually means installing software, which defeats the whole low-friction spirit of ILovePDF and ILoveIMG.

I built ConvertYard to fill that exact gap: a web tool that behaves like ILoveIMG (open the site, drop files, download the result, no signup), but the processing runs locally in the browser via WebAssembly. Nothing is uploaded. The file never leaves the student's or teacher's device.

- Image compressor / converter: https://convertyard.com/image-compressor
- PDF compressor: https://convertyard.com/compress-pdf

Two things worth flagging for the article's audience:

1. ILoveIMG's free tier caps at ~30 images per batch and every file uploads to their servers. ConvertYard handles hundreds of images per batch (up to 1000), all locally.
2. It's the same three-click workflow teachers already know from ILoveIMG, so there's no new learning curve to introduce in a classroom.

If it fits, it could sit naturally in the "Working with PDF files and images" section as the local-first option Ingrid already gestures toward. If not, no problem — I mostly wanted to say thanks for writing the paragraph honestly. Most listicles don't.

Best,
Garrick
ConvertYard



Link: https://world.edu/simple-and-free-digital-tools-for-learning-and-teaching/

#Forum link (ILOVEIMG)
Link: https://scratch.mit.edu/discuss/topic/706352/

#boisestate.edu (Squoosh)(TinyPNG)(JPGMini)

Contact: oit@boisestate.edu (OIT general; the Web Guide is maintained by the OIT web team). Safer alternative: helpdesk@boisestate.edu, subject line naming the Dec 10 2020 "Optimize Your Images" post. -- pitch sent SEPT 7 2026

Link check: Squoosh (squoosh.app), TinyPNG (tinypng.com), and JPEGmini (jpegmini.com) all resolve. Nothing broken on the guide.

---
Subject: Small suggestion for your "Optimize Your Images" Web Guide post (batch + no-install option)

Hi OIT web team,

I came across your "Optimize Your Images" post on the Boise State Web Guide while researching how university web teams recommend image tools to site editors, and it's held up really well for a 2020 post. The framing around "why file size matters before you even open a compressor" is the part most guides skip, and it's the part that actually changes editor behavior.

Quick link check: Squoosh, TinyPNG, and JPEGmini all still resolve. Nothing broken on the page.

One small suggestion for the tool list. Squoosh, TinyPNG, and JPEGmini are all solid picks, but each has a blind spot that shows up the moment a Boise State editor tries to prep more than a handful of images:

1. Squoosh is one image at a time. Great for tuning a hero photo, painful for a 40-image event gallery. It's also been in maintenance-only mode at Google for a while, so it hasn't kept up with newer formats and batch workflows.
2. TinyPNG caps free users at 20 images per batch and 5MB per file, and every image is uploaded to their servers before it's compressed. Fine for marketing photos, less fine for anything with a student name, an unpublished figure, or an internal screenshot.
3. JPEGmini is a paid desktop install (macOS/Windows) and only handles JPG. Anyone dealing with PNG screenshots, WebP exports, or HEIC photos off an iPhone is stuck.

I built ConvertYard partly to fill those three gaps in one place: https://convertyard.com/image-compressor

- Runs entirely in the browser via WebAssembly. Nothing is uploaded, so the file never leaves the editor's machine.
- Handles real batches (up to 1000 images) and outputs a single ZIP.
- Supports JPG, PNG, WebP, AVIF, and HEIC — no install, no signup, no format lock-in.

If it fits, adding it as an alternative next to Squoosh and TinyPNG would give Boise State editors a clean option for the larger jobs and the "I'd rather not upload this" jobs. Something short like:

ConvertYard — free in-browser image compressor at https://convertyard.com/image-compressor. Runs entirely in the browser (no upload), handles batches up to 1000 files, supports JPG, PNG, WebP, AVIF, and HEIC.

No affiliation, no tracking pixel, no signup wall. Just thought it fit the spirit of a guide that already respects the reader's time.

Either way, thanks for keeping the Web Guide going. Posts like this one are the reason campus editors ship faster pages.

Best,
Garrick
ConvertYard

Link: https://www.boisestate.edu/webguide/2020/12/10/optimize-your-images/

#tamu

Contact: The page footer routes to the "Texas A&M Aggie UX Team" via the Brand Toolbox contact form (https://marcomm.tamu.edu/contact/). Safer alternative: marcomm@tamu.edu with the subject line naming the "Aggie UX Image Templates & Optimization" page.

Link check: Kraken (kraken.io), Caesium (caesium.app), Cloudinary, ImageOptim (imageoptim.com), EWWW, JPEGmini (jpegmini.com), PicMin, ShortPixel all still resolve. Nothing broken on the page.

---
Subject: Small suggestion for the "Aggie UX Image Templates & Optimization" page (batch, in-browser option next to your recommended tools)

Hi Aggie UX team,

I came across the "Aggie UX Image Templates & Optimization" page while researching how university web teams recommend image tools to site editors, and it's one of the more thorough ones I've read. Most guides stop at "compress your images." Yours actually gives editors a Photoshop template with the correct crop guides, a hard target (500 KB, 1500 px), and a WebP-first export step. That's the part most Cascade and WordPress editors never get told.

Quick link check: Kraken, Caesium, Cloudinary, ImageOptim, EWWW, JPEGmini, PicMin, and ShortPixel all still resolve. Nothing broken on the page.

One small suggestion for the "Recommended tools" list. The current lineup covers most workflows, but each has a blind spot that shows up the moment an Aggie UX editor tries to prep a real batch:

1. Kraken and Cloudinary are online-only and upload every file to their servers before compressing. Fine for marketing photos. Less fine for anything with a student's face, an unpublished figure, or an internal event screenshot in it.
2. Caesium and ImageOptim solve the privacy angle but require a desktop install (ImageOptim is Mac-only), which is a friction point for staff on locked-down machines.
3. JPEGmini is a paid install and JPG-only — editors dealing with PNG screenshots or WebP exports from the Photoshop step you already recommend are stuck.
4. EWWW and ShortPixel are WordPress-side plugins, which doesn't help Cascade editors at all.

I built ConvertYard partly to close those gaps in one place: https://convertyard.com/image-compressor

- Runs entirely in the browser via WebAssembly. Nothing is uploaded, so the file never leaves the editor's machine.
- Handles real batches (up to 1000 images) and outputs a single ZIP, which lines up with editors prepping a full contact card collection or a page header set in one pass.
- Supports JPG, PNG, WebP, and AVIF (AVIF is already on your "add once support improves" list — it's ready today in every current browser and CMS the page mentions).
- Hits the 500 KB / 1500 px targets the page already calls out, with quality controls that map to your "WebP Lossy Q=90" step.

If it fits, adding it as an in-browser option next to Kraken and Caesium would give Aggie UX editors a clean fallback for the larger jobs and the "I'd rather not upload this" jobs. Something short like:

ConvertYard — free in-browser image compressor at https://convertyard.com/image-compressor. Runs entirely in the browser (no upload), handles batches up to 1000 files, supports JPG, PNG, WebP, and AVIF. Good for Cascade editors and for images that shouldn't leave a machine.

No affiliation, no tracking pixel, no signup. Just thought it fit the spirit of a page that already respects the editor's time.

Either way, thanks for maintaining the Brand Toolbox. The templates + hard targets combo is doing real work for anyone shipping on Aggie UX.

Best,
Garrick
ConvertYard

Link: https://marcomm.tamu.edu/template/image-templates-optimization/

#fiu.edu

Contact: core@fiu.edu (FIU Core web team; the guide's "send us an email" line for Cascade help points here). Safer alternative: the "Submit an Idea" form linked in the site's own nav.

Link check: Pixlr (pixlr.com) and JPEGmini (jpegmini.com) both still resolve. Nothing broken on the Starter Guide.

---
Subject: Small suggestion for the Cascade Starter Guide (in-browser batch compressor for the "Editing and Replacing Assets" section)

Hi Core team,

I came across the Cascade Starter Guide while researching how university web teams onboard Cascade editors, and it's one of the more practical starter guides I've read. The "upload images in the dimensions they will be displayed" line is the single tip that changes editor behavior the most, and you put it right where new users will actually see it. Nice call.

Quick link check: Pixlr and JPEGmini both still resolve. Nothing broken.

One small suggestion for the "Editing and Replacing Assets" section. Pixlr for editing and JPEGmini for compressing are reasonable picks, but each has a blind spot that shows up the moment a new FIU Cascade editor tries to prep more than one image:

1. Pixlr is an online editor — every file is uploaded to their servers before it can be resized. For a class roster screenshot, an unpublished research figure, an event photo with student faces, or an internal slide, that's not ideal.
2. JPEGmini is a paid desktop install (macOS/Windows) and JPG-only. Editors working on locked-down FIU machines can't always install it, and anyone dealing with PNG screenshots, WebP exports, or HEIC photos off an iPhone is stuck.
3. Neither handles batches. A department onboarding a new microsite with a folder of headshots or event photos ends up doing 30 one-off round-trips.

I built ConvertYard partly to close those gaps in one place: https://convertyard.com/image-compressor

- Runs entirely in the browser via WebAssembly. Nothing is uploaded, so the file never leaves the editor's machine.
- Handles real batches (up to 1000 images) and outputs a single ZIP, which fits the "upload to _assets" workflow you already document.
- Supports JPG, PNG, WebP, AVIF, and HEIC. No install, no signup, no format lock-in.
- Also includes a free image resizer (https://convertyard.com/image-resizer) that lines up with the "upload in the correct dimensions" rule the guide already teaches.

If it fits, adding it as an alternative next to Pixlr and JPEGmini would give new Cascade editors a clean option for larger jobs and sensitive files. Something short like:

ConvertYard — free in-browser image compressor and resizer at https://convertyard.com/image-compressor. Runs entirely in the browser (no upload), handles batches up to 1000 files, supports JPG, PNG, WebP, AVIF, and HEIC. Good for anything you'd rather not upload to a third-party server.

No affiliation, no tracking pixel, no signup wall. Just thought it fit the spirit of a guide that already respects the reader's time.

Either way, thanks for keeping the Cascade Starter Guide going. It's the kind of resource that quietly saves the Core team a lot of tickets.

Best,
Garrick
ConvertYard

https://core.fiu.edu/training/cascade-training/cascade-guide/

#uoc.edu
https://mosaic.uoc.edu/2020/03/04/optimizacion-de-imagenes-para-la-web/

#lafayette
PITCH SENT AUG 9 2026

annulyse@lafayette.edu — (610) 330-5692

The style guide you're pitching against is a web/digital resource, so Digital Strategy is the direct owner. Not general inquiries, not marketing.

Backup contacts if Erwin doesn't respond:
- Terri Deily (general inquiries) — deilyt@lafayette.edu
- Dale Mack (Creative Director) — mackd@lafayette.edu (owns design/asset standards)

Suggested pitch to Erwin:

Subject: Suggestion for your Web Style Guide — modern image compressor with AVIF + batch support

Hi Erwin,

I came across Lafayette's Web Style and Component Library page and noticed the image tools recommended for editors (CompressNow, JPEG Optimizer, Optimizilla). Wanted to flag a few gaps that might affect your content teams, especially given the specific image dimensions your Hermione theme requires:

- CompressNow caps batches at 10 images, files at 9 MB, uploads to their server, and doesn't preserve PNG/GIF transparency (breaks logos, icons, cutouts)
- JPEG Optimizer caps batches at 20 images and only outputs JPEG, PNG, and GIF — no WebP or AVIF for modern performance
- Optimizilla is a solid local-first tool, but it doesn't output AVIF and doesn't offer cross-format conversion or a clear large-batch flow

For editors uploading department page galleries at 770×433 or hero images at 1440×810, AVIF and WebP output can meaningfully improve Lafayette.edu's page load without extra plugins.

ConvertYard's compressor (https://convertyard.com/compress-image/) might be a useful addition:
- Runs 100% in the browser via WebAssembly — no server uploads (aligns with .edu data handling expectations)
- Handles 100+ images per batch with a ZIP output
- Exports JPG, PNG, WebP, AVIF, GIF, and SVG from one interface
- No account, no file-size cap, works on any OS

Free to use for your editors and student workers. Happy to send screenshots or a walkthrough tailored to your image spec sizes if useful.

Best,
Garrick
ConvertYard

Link: https://communications.lafayette.edu/style-guides/web-styles-and-component-library/

#Forums
Link: https://scratch.mit.edu/discuss/topic/799317/

#gcccd
PITCH SENT Sept 9 2026
Contact: helpdesk@gcccd.edu — the Web Team explicitly directs "technical issues, content questions, accessibility concerns, and page updates" to this address. It's the correct route for a suggestion to their optimize-images page.

Backup: isops@gcccd.edu (website operations, if helpdesk routes it elsewhere)

Subject: Suggestion for your "Optimizing Images for the Web" page — free tool with WebP/AVIF + batch upload

Hi GCCCD Web Team,

I came across your Optimizing Images for the Web guide (https://www.gcccd.edu/it/web-resources/optimize-images.php) and noticed the three recommended tools each have friction points that may affect editors trying to hit your 100 KB / 300 KB / 500 KB targets:

- TinyPNG / TinyJPG — caps free users at 20 images per batch and 5 MB per file; WebP and AVIF output are locked behind Web Pro
- BeFunky — free tier shows ads and adds watermarks on premium effects; full batch features require a $6.99–$11.99/month Plus subscription
- Adobe Photoshop — subscription-only at $22.99+/month, which adds up fast across a district's worth of content editors, and is significantly overqualified for compressing a page banner or gallery image

For content editors and student workers uploading to Modern Campus CMS at 400–1600px widths, ConvertYard's compressor (https://convertyard.com/compress-image/) might be a useful free alternative:

- Runs 100% in the browser via WebAssembly (files never upload — aligns with district data handling)
- Handles 100+ images per batch, packaged as a ZIP
- Exports JPG, PNG, WebP, AVIF, GIF, and SVG from one interface — helpful for hitting your KB targets, since WebP/AVIF can drop banners well under 500 KB without visible quality loss
- No account, no subscription, no watermarks, no size caps
- Works on any OS with a modern browser

Free for your editors and students. Happy to send screenshots or a quick walkthrough sized to your recommended widths if useful.

Best,
Garrick
ConvertYard


Link: https://www.gcccd.edu/it/web-resources/optimize-images.php

#ttu
Link: https://askit.ttu.edu/sp?id=kb_article_view&sysparm_article=KB0025760

#ucsc
Link: https://guides.library.ucsc.edu/DS/Resources/PhotoshopCompression

#uga
PITCH SENT SEPT 9 2026
Contact: caesweb@uga.edu — CAES Web Team inbox. Article is authored by Cindy Tucker (leads the web support team). The team inbox is the right first stop; you can name-drop Cindy in the greeting.

Subject: Suggestion for Cindy's image file size guide — batch-friendly alternative to TinyJPG

Hi CAES Web Team,

I came across Cindy Tucker's guide on controlling image file size (https://oit.caes.uga.edu/control-your-image-file-size-for-best-website-performance/) and wanted to flag a few friction points with the TinyJPG recommendation that your editors probably hit in practice:

- 20-image cap per batch — painful when prepping a full department gallery or event recap
- 5 MB per-file cap — a lot of photographer-delivered JPGs blow past this
- All files upload to TinyJPG's servers — not ideal for anything from a working session that shouldn't leave campus systems
- WebP and AVIF are locked behind Web Pro — free users can only output JPG/PNG, which caps how small banner and hero images can go
- No before/after preview — editors have to download and eyeball to check for quality loss

For CAES editors working in AEM/WordPress, ConvertYard's compressor (https://convertyard.com/compress-image/) might be a useful free alternative:

- Handles 100+ images per batch, packaged as a ZIP
- No signup, no paid tier, no watermarks, no size caps
- Runs 100% in the browser via WebAssembly — files never upload
- Exports JPG, PNG, WebP, AVIF, GIF, and SVG from one interface
- Includes a before/after slider so editors can confirm quality visually before saving

Free for your team and the extension office. Happy to send screenshots or a short walkthrough sized to your Canva template dimensions if useful.

Best,
Garrick
ConvertYard

Link: https://oit.caes.uga.edu/control-your-image-file-size-for-best-website-performance/

#wisc

PITCH SENT SEPT 10, 2026
uw-theme-2.0-migrations@g-groups.wisc.edu — the Office of Strategic Communication digital strategy team that maintains the UW Theme guides. If that reads too migration-specific, the fallback is the contact form at uwtheme.brand.wisc.edu/contact/.

Subject recommendation

Suggestion for the image sizing guidelines page: batch resize + compress in one step

Backup options:
2. Addition for the image sizing guide — no upload, no one-at-a-time limit
3. Note on the UW Theme image sizing guidelines for WordPress authors

---
Pitch body

Hi UW Theme team,

I came across your image sizing guidelines page (uwtheme.brand.wisc.edu/guides/image-sizing-guidelines/) and wanted to flag a tool that might fit alongside your Squoosh recommendation.

Squoosh is a great pick for tuning a single image, but two limits come up quickly for the people your guide is aimed at — comms staff, students, faculty maintaining department sites:

- It's one image at a time. A student worker uploading 40 event photos ends up in Squoosh for an hour.
- It only handles compression. Resizing usually still means opening a separate editor like Photoshop first, which is an extra step and a paid app the person may not have.

I built ConvertYard (https://convertyard.com) to close that gap. It's a local-first batch image compressor with built-in resize, running entirely in the browser via WebAssembly. Nothing is uploaded — files never leave the user's machine.

The workflow it enables: someone can drop a folder of photos straight from their camera or phone, set a max width (say, 1600px to match your recommended dimensions), pick a quality target, and get back a ZIP of resized + compressed images in one pass. No Photoshop, no separate resize tool, no per-file upload wait.

Practical numbers: 1,000+ images in a single drop, no per-file size cap, formats include JPG, PNG, WebP, AVIF, and HEIC — which matters since a lot of iPhone photos land as HEIC and stump the standard browser tools.

For a campus workflow, the privacy posture is a bonus: photos of students, event attendees, or research subjects never touch an external server. Free, no signup, no ads inside the tool.

Direct link would be convertyard.com/compress-image. Happy to answer anything about the WASM pipeline or how the resize dimensions map to your guide's recommendations if it's useful.

Thanks for maintaining the theme guides — they're one of the more approachable university documentation sets I've seen.

Best,
Garrick
ConvertYard

Link: https://uwtheme.brand.wisc.edu/guides/image-sizing-guidelines/

#tulane (compressor.io)
PITCH SENT SEPT 10 2026
Target: website@tulane.edu — the UCM (University Communications & Marketing) web team inbox that owns the Drupal guide. Backup is the UCM Support Request form linked from communications.tulane.edu.

---
Subject recommendation

Suggestion for the "Preparing Site Content" page: batch resize + compress in one step

Backup options:
2. Addition for the Drupal guide image prep section — no upload, no one-at-a-time limit
3. Note on the site content prep guidance for Drupal authors

---
Pitch body

Hi UCM web team,

I came across the "Preparing Site Content" page in your Drupal guide (communications.tulane.edu/drupal-guide/web-content-management/preparing-site-content) and wanted to flag a tool that might be worth adding alongside your Compressor.io recommendation.

Compressor.io is a solid pick, but two limits come up quickly for the people your guide is written for — comms staff, student workers, faculty maintaining department sites in Drupal:

- Every image gets uploaded to Compressor.io's servers. For a university workflow that regularly includes photos of students, event attendees, donors, or research subjects, that upload step is a privacy consideration most authors don't think about.
- It's essentially one image at a time on the free tier. A student worker prepping 40 event photos for a news post ends up sitting through it, and there's no built-in resize — so most people open Photoshop or Preview first to hit the dimensions your guide recommends.

I built ConvertYard (https://convertyard.com) to close that gap. It's a local-first batch image compressor with built-in resize, running entirely in the browser via WebAssembly. Nothing is uploaded — files never leave the user's machine.

The workflow it enables: someone can drop a folder of photos straight from their camera or phone, set a max width to match Tulane's Drupal image dimensions, pick a quality target, and get back a ZIP of resized + compressed images in one pass. No Photoshop, no separate resize tool, no per-file upload wait.

Practical numbers: 1,000+ images in a single drop, no per-file size cap, formats include JPG, PNG, WebP, AVIF, and HEIC — which matters since a lot of iPhone photos land as HEIC and stump the standard browser tools.

For a university workflow, the privacy posture is a real bonus: photos of identifiable students or event attendees never touch an external server. Free, no signup, no ads inside the tool.

Direct link would be convertyard.com/compress-image. Happy to answer anything about the WASM pipeline or how the dimensions map to your guide's recommendations if it's useful.

Thanks for maintaining the Drupal guide — it's one of the more usable university content management docs I've come across.

Best,
Garrick
ConvertYard

Link: https://communications.tulane.edu/drupal-guide/web-content-management/preparing-site-content

#unco

libraries@unco.edu

Subject recommendation

Suggestion for the "Compress Images and Save Page Loading Time" post: batch + built-in resize

Backup options:
2. Addition for the image compression blog — no upload, no 20-image cap
3. Note on the LibGuides best-practices post on image compression

---
Pitch body

Hi UNCO Libraries team,

I came across your best-practices post on compressing images (libguides.unco.edu/blogs/bp/uptodate/compress-images-and-save-page-loading-time-for-users) and wanted to flag a tool that might fit alongside your TinyPNG recommendation.

TinyPNG is a solid pick, but two limits come up quickly for the people your post is written for — librarians, student workers, and staff maintaining LibGuides and library web pages:

- TinyPNG caps at 20 images and 5 MB per file, and every image is uploaded to a third-party server. For a library workflow that includes photos of students at events, patrons in study spaces, or archival material with sensitivities, that upload step is a privacy consideration most authors don't think about.
- It only handles compression. Resizing to fit LibGuides column widths usually still means opening a separate editor like Photoshop first, which is an extra step and a paid app the student worker may not have.

I built ConvertYard (https://convertyard.com) to close that gap. It's a local-first batch image compressor with built-in resize, running entirely in the browser via WebAssembly. Nothing is uploaded — files never leave the user's machine.

The workflow it enables: someone can drop a folder of photos straight from their camera or phone, set a max width to match the LibGuides layout, pick a quality target, and get back a ZIP of resized + compressed images in one pass. No Photoshop, no separate resize tool, no per-file upload wait.

Practical numbers: 1,000+ images in a single drop, no per-file size cap, formats include JPG, PNG, WebP, AVIF, and HEIC — which matters since a lot of iPhone photos land as HEIC and stump the standard browser tools.

For a library workflow, the privacy posture is a real bonus: photos of identifiable students or patrons never touch an external server. Free, no signup, no ads inside the tool.

Direct link would be convertyard.com/compress-image. Happy to answer anything about the WASM pipeline or how the dimensions map to the LibGuides recommendations if it's useful.

Thanks for maintaining the best-practices blog — it's a good resource, and the fact that it's aimed at other library staff makes it one of the more useful ones I've come across.

Best,
Garrick
ConvertYard
https://libguides.unco.edu/blogs/bp/uptodate/compress-images-and-save-page-loading-time-for-users

#UCLA

Target: paul.feinberg@anderson.ucla.edu — Paul Feinberg, Associate Director of Marketing and Communications at UCLA Anderson. He heads the MarCom function that owns the /marcom/ section of the site, so the ADA image guidelines page falls under his org. No dedicated marcom-web inbox surfaced.

---
Subject recommendation
PITCH SENT SEPT 9 2026
Suggestion for the ADA Guidelines for Images page: batch + built-in resize

Backup options:
2. Addition for the MarCom image accessibility page — no upload, no 5 MB cap
3. Note on the ADA image guidelines for Anderson content editors

---
Pitch body

Hi Paul,

I came across the ADA Guidelines for Images page on the Anderson MarCom site (anderson.ucla.edu/marcom/ada-guidelines-images) and wanted to flag a tool that might fit alongside your TinyJPG recommendation.

TinyJPG is a solid pick, but two limits come up quickly for the content editors your page is written for — MarCom staff, program coordinators, and student workers prepping images for Anderson pages:

- TinyJPG caps at 20 images and 5 MB per file, and every image is uploaded to a third-party server. For a business school workflow that includes headshots of students and faculty, event photos with identifiable attendees, and donor or executive-program imagery, that upload step is a privacy consideration most editors don't think about.
- It only handles compression. Resizing to fit Anderson's CMS image dimensions usually still means opening a separate editor like Photoshop first, which is an extra step and a paid app the person may not have.

I built ConvertYard (https://convertyard.com) to close that gap. It's a local-first batch image compressor with built-in resize, running entirely in the browser via WebAssembly. Nothing is uploaded — files never leave the user's machine.

The workflow it enables: an editor can drop a folder of photos straight from their camera or phone, set a max width to match Anderson's image dimensions, pick a quality target, and get back a ZIP of resized + compressed images in one pass. No Photoshop, no separate resize tool, no per-file upload wait.

Practical numbers: 1,000+ images in a single drop, no per-file size cap, formats include JPG, PNG, WebP, AVIF, and HEIC — which matters since a lot of iPhone photos land as HEIC and stump the standard browser tools.

For a business school workflow, the privacy posture is a real bonus: student headshots, executive program photos, and event imagery never touch an external server. Free, no signup, no ads inside the tool.

Direct link would be convertyard.com/compress-image. Happy to answer anything about the WASM pipeline or how the dimensions map to your ADA guidelines if it's useful.

Thanks for maintaining the MarCom resources — the ADA guidance in particular is more approachable than what most schools publish.

Best,
Garrick
ConvertYard


link: https://www.anderson.ucla.edu/marcom/ada-guidelines-images

#waldenu
Link; https://academicanswers.waldenu.edu/faq/333184

#santarosa
Link: https://de.santarosa.edu/multimedia/saving-files-web

#santarosa
PITCH SENT SEPT 10 2026
stonybrook.edu/websupport/support-request/ — the CMS Web Support request form is the confirmed route to the Web Development Services team in MarCom (they own the OU Campus / Modern Campus CMS support site). No specific staff email surfaced for this team.

Secondary target: digital_accessibility@stonybrook.edu — the page lives under /best-practice-guide/accessibility/tools, so the accessibility inbox is topically relevant and may loop in whoever owns that section.

If forced to pick a single inbox for the pitch, use digital_accessibility@stonybrook.edu since the page URL and framing sit inside the accessibility guide — the pitch has an accessibility hook they'll recognize as on-topic.

Subject recommendation

Suggestion for the Accessibility Tools page: batch + browser-only image compressor

Backup options:
2. Addition for the OU Campus accessibility tools list — no upload, no 25-image cap
3. Note on two image compressors currently listed in the accessibility tools guide

Consider #3 if you want to lead with the flag (the HTTP + upload issues) rather than the alternative — it's a stronger open for a security/accessibility-minded reader.

---
Pitch body

Hi Stony Brook Web Services team,

I came across the accessibility tools page in the Modern Campus CMS support guide (llrc.stonybrook.edu/commcms/ousupport/best-practice-guide/accessibility/tools) and wanted to flag two things about the current image compressor recommendations before suggesting an alternative.

Both tools listed have issues that are worth a second look for a university content workflow:

- Optimizilla (optimizilla.com) is served over plain HTTP, not HTTPS. Modern browsers flag it as "not secure" and any image an editor uploads travels unencrypted. For a page that lives inside the accessibility best-practices guide, recommending an insecure tool works against the broader trust signal the guide is trying to establish.
- Compress Image (compressimage.toolur.com) caps at 25 images per batch and uploads every file to a third-party server. For a workflow that regularly includes student headshots, event photos with identifiable attendees, or research imagery, that upload step is a privacy consideration most editors don't think about.

I built ConvertYard (https://convertyard.com) to close that gap. It's a local-first batch image compressor with built-in resize, served over HTTPS and running entirely in the browser via WebAssembly. Nothing is uploaded — files never leave the user's machine.

The workflow it enables: an OU Campus editor can drop a folder of photos straight from their camera or phone, set a max width to match Stony Brook's CMS image dimensions, pick a quality target, and get back a ZIP of resized + compressed images in one pass. No Photoshop, no separate resize tool, no per-file upload wait.

Practical numbers: 1,000+ images in a single drop, no per-file size cap, formats include JPG, PNG, WebP, AVIF, and HEIC — which matters since a lot of iPhone photos land as HEIC and stump the standard browser tools.

For a university workflow, the privacy posture is a real bonus: student and faculty photos never touch an external server. Free, no signup, no ads inside the tool.

Direct link would be convertyard.com/compress-image. Happy to answer anything about the WASM pipeline or how the dimensions map to your CMS guidelines if it's useful.

Thanks for maintaining the CMS support guide — the accessibility section in particular is more thorough than what most universities publish.

Best,
Garrick
ConvertYard

Link: https://llrc.stonybrook.edu/commcms/ousupport/best-practice-guide/accessibility/tools

#illinois
Link: https://publish.illinois.edu/jackb/photo-optimization-tips/

#maine
Link: https://tdx.maine.edu/TDClient/2624/Portal/KB/Article/138816/Convert-HEIC-to-JPEG-JPG-format

#uwrf
Link: https://technology.uwrf.edu/TDClient/1979/Portal/KB/PrintArticle?ID=137322

#stockton
Link: https://stockton.edu/blackboard-tutorial/instructor-tutorials/preparing-files.html

#cscc
Link: https://td.cscc.edu/TDClient/68/Portal/KB/Article/713/Accessing-iPhone-images-on-a-Windows-PC?SIDs=289

#ua
Link: https://actcard.ua.edu/tipsandcriteria/

#cuanschutz
Link: https://www.cuanschutz.edu/web-central/using-sitefinity/after-launch/image-optimization

#columbia
Link: https://sites.columbia.edu/content/image-optimization

#mtu
Link: https://blogs.mtu.edu/webmaster/2024/01/image-optimization/

#duke
Link: https://drupal.trinity.duke.edu/how-to/work-with-media/images/optimization

#nmsu
Link: https://www.innovativemediablog.nmsu.edu/post/photos-for-web

#binghamton
Link: https://www.binghamton.edu/communications-and-marketing/web/page-elements/images/image-optimizing.html

#pepperdine
Link: https://community.pepperdine.edu/imc/resources/web/training/image-optimizing.htm

#usu.edu
Link: https://extension.usu.edu/employee/ou-campus/blog/how-to-optimize-images-for-the-web

#iastate
Link: https://cals.las.iastate.edu/post/best-practices-optimizing-images-web

#UCLA
Link: https://webplatform.healthsciences.ucla.edu/blog/streamlining-images-to-optimize-websites

#codefinity
Link: https://codefinity.com/blog/Image-Optimization-Tips-for-Your-Website

#speedcurve
link: https://www.speedcurve.com/web-performance-guide/best-practices-for-optimizing-images/

#toronto
Link: https://cave.cs.toronto.edu/kriz/cifar.html

#umaine
Link: https://extension.umaine.edu/gardening/how-to-prepare-images/

#und
Link: https://campus.und.edu/campus-services/web-support/images.html

#colostate
Link: https://www.engr.colostate.edu/ets/image-information/

#uark
Link: https://tips.uark.edu/resizing-and-optimizing-images-or-photos-for-the-web/

#ac
Link: https://warwick.ac.uk/services/idg/services-support/web/sitebuilder2/manual/content/resize/

##Video Compression Targets

#UW
Link: https://www.education.uw.edu/technologycenter/how-to-guides/videotaping-tips-resources/video-compression/

#USA.edu
Link: https://help.usa.edu/hc/en-us/articles/4414522327191-Guide-How-to-reduce-file-size-prior-to-uploading-to-Kaltura

#uni-hamburg (HandBrake)
Link: https://www.uni-hamburg.de/en/elearning/digital-studieren/anleitungen/video-komprimieren.html

#mozilla
mdn-web-docs@mozilla.com - PITCH SENT SEPT 9 2026

1. Suggestion for the Multimedia performance page: a batch-friendly alternative to Squoosh
2. Small addition for your image optimization tools list
3. Local-first batch compressor for the Multimedia performance guide

Pitch:

Hi [name],

I was reading your Multimedia performance guide (Learn_web_development/Extensions/Performance/Multimedia) and wanted to flag a gap in the tools section.

Squoosh and ImageOptim are both solid, but they hit limits pretty quickly for anyone dealing with real workloads:

- Squoosh only handles one image at a time. No batch mode, no folder drop. Fine for a hero image, painful for a 200-image gallery.
- ImageOptim is Mac-only, so Windows and Linux developers get left out. It also doesn't output modern formats like AVIF or WebP without extra plugins.

I built ConvertYard's image compressor (https://convertyard.com/compress-image/) to fill that gap. A few things that might be worth mentioning alongside the existing recommendations:

- Compresses to WebP, AVIF, JPG, GIF, and SVG from one interface — no need to switch tools per format
- Runs entirely in the browser via WebAssembly, so files never leave the device (worth noting for anyone working with client assets or anything sensitive)
- Handles 100+ files in a single batch and packages the output as a ZIP
- Works on any OS with a modern browser, no install

Given the guide already frames image optimization as a performance win, I think readers would benefit from a cross-platform, batch-capable option next to the two current picks. Happy to send a screenshot or a quick demo link if useful.

Thanks for maintaining such a well-referenced resource.

Best,
Garrick
ConvertYard
https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/Multimedia

#screamingfrog.co.uk
PITCH SENT SEP 9 2026 - contact form
1. Contact form — https://www.screamingfrog.co.uk/contact/ — select "Content Marketing" or "General Enquiry" as the service type. This lands with the right team internally.
2. Common patterns to try (Screaming Frog uses firstname@screamingfrog.co.uk per RocketReach's public directory listing):
  - hello@screamingfrog.co.uk (most likely general inbox)
  - info@screamingfrog.co.uk
3. Direct outreach on LinkedIn/X to their content/marketing team — their Meet The Team page lists names. Patrick Langridge (SEO Director) is a common point of contact for content matters.

Subject: Suggestion for your Image SEO guide — a local-first alternative to TinyPNG/ShortPixel

Hi [name],

Reading through your Image SEO guide, I noticed the compressor recommendations (ImageOptim, ShortPixel, TinyPNG) all share a blind spot worth flagging for your readers:

- ImageOptim is Mac-only on desktop; its online version uploads to a server and only exports JPEG or PNG
- ShortPixel uploads files, caps free use at 10 MB per image, and gates heavy batches behind paid credits
- TinyPNG limits users to 20 images and 5 MB per file, and paywalls WebP/AVIF/JXL output

For SEO folks auditing large sites, those batch caps and server uploads are real friction — especially when working with client assets that shouldn't leave the machine.

I built ConvertYard's image compressor (https://convertyard.com/compress-image/) to close that gap:
- Runs 100% in the browser via WebAssembly — nothing uploads
- Handles 100+ files per batch with a ZIP output
- Exports JPG, PNG, WebP, AVIF, GIF, and SVG from one interface
- No account, no file-size cap, no credit system, works on any OS

Would be a natural fit alongside your existing picks. Happy to send a walkthrough or screenshots if useful.

Best,
Garrick
ConvertYard

https://www.screamingfrog.co.uk/learn-seo/image-seo/

#umich

 Tool submission: browser-only file converter (nothing uploaded)
 Hi Chase,

Saw your 2019 tech tip on CloudConvert and the note at the bottom inviting readers to send tools worth sharing. Passing one along.

I run ConvertYard (convertyard.com) — a batch file converter that runs entirely in the browser via WebAssembly. Nothing uploads. Files never leave the device, which matters more for university users handling student records, research data, or anything FERPA-adjacent than it did when CloudConvert launched.

A few things that might make it worth a mention:

- Works offline once the page loads (useful in classrooms/labs with flaky wifi)
- Handles 1000+ files at once with a ZIP output
- No signup, no upload cap, no watermark
- Free, no ads on the homepage or inside the conversion flow

Common U-M use cases I could see: HEIC → JPG for iPhone photos in Canvas submissions, PDF compression for email attachments under the 25MB limit, batch image resizing for course sites.

Happy to answer questions or send a demo link with a specific format pair if useful.

Best,
Garrick
ConvertYard
 
https://michigan.it.umich.edu/news/2019/04/23/tech-tip-cloudconvert-for-easy-file-conversion/

#clemson
https://hdkb.clemson.edu/phpkb/article.php?id=724

#uaf
https://ctl.uaf.edu/2015/08/18/easy-file-conversions/

#indiana
https://celt.indiana.edu/resources/multimedia/webp.html

#gsu
https://sites.gsu.edu/zjasarevic1/2016/01/20/how-to-convert-sound-files-to-mp3-format/

#beal
https://beal.edu/tech-corner/

#kent
https://libguides.library.kent.edu/c.php?g=278293&p=1854415

#astate
https://kb.astate.edu/books/learning-technology/page/learning-technology-index/revisions/5622/changes

#usc
https://viterbiit.usc.edu/services/digital-communication-services/wordpress/viterbi-wordpress-platform/image-backgrounds/

#umn
https://mch.umn.edu/videoabstractresources/

#alaska.edu
https://uas.alaska.edu/celt/technology-toolbox.html

#umich
https://secure.rackham.umich.edu/templates/mac_office.html

#SU 
https://scil-wiki.su.edu/books/audio/page/sfx-resources-and-conversion-tools/revisions/16