# Shutterbug pitch — Batch converting the HEIC files photographers already have

**Target article:** "Annoyed by Your iPhone's Default Photo Settings? So are we."
**Author:** Jon Sienkiewicz (confirmed — Jon Sienkiewicz Blog on Shutterbug)
**Published:** January 6, 2023
**URL:** https://www.shutterbug.com/content/annoyed-your-iphones-default-photo-settings-so-are-we

**Publisher:** AVTech Media Americas Inc. (Shutterbug is no longer under Madavor Media — the copyright footer as of at least 2023 reads "© Shutterbug, AVTech Media Americas Inc., USA")

## What the article actually says (verified from the page)

1. Walks through the iPhone settings path to shoot JPEG going forward: **Settings → Camera → Format → Most Compatible**
2. Walks through cancelling Live Photo default: **Settings → Camera → Preserve Settings → Live Photo**
3. **Explicitly defends HEIC** in a section titled *"We All May Learn to Love HEIC/HEIF More than JPEG"* — better compression, higher quality at half the file size, transparency, wider dynamic range
4. Concludes *"Compatibility is about the only issue. But it's a big issue. Anything and everything can open a JPEG. But some printer drivers, old versions of Mac OS, Windows 8 and possibly some online printing services don't recognize the HEIC/HEIF format."*
5. **The exact sentence that is your pitch's whole reason to exist:** *"The change begins with your next shot and does not affect images previously saved."*

Jon himself opens the door — he tells the reader the settings fix is forward-only and doesn't touch the existing library. He never closes the loop on what to do about those old files. That's the piece.

---

## Submission channel

**Primary:** `editorial@shutterbug.com` (confirmed from the site's own "Help!" contact page — https://www.shutterbug.com/content/help-11 — which uses it for reader letters and general editorial correspondence).

**Publisher-level:** Shutterbug is published by **AVTech Media Americas Inc.** There is no separate AVTech pitch address — go through `editorial@shutterbug.com`. If you want a corporate mailing address for the reference file, check the current site footer, but do not send a pitch there.

**Do not use shutterbug.net** — different site, not the magazine.

**Do not cite Madavor Media** — outdated ownership.

---

## Revised pitch (send this)

**Subject:** Follow-up angle to Jon's iPhone HEIC piece — converting the backlog he mentioned - Pitch Sent Aug 14, 2026

Hi Jon (and the Shutterbug editorial team),

Your January 2023 piece on iPhone's default photo settings is one of the more honest ones out there — the *"We All May Learn to Love HEIC/HEIF More than JPEG"* section actually defends the format instead of just yelling at it. That's what made me want to pitch a companion piece rather than a rewrite.

Two lines in your article do most of the work of setting mine up:

> *"The change begins with your next shot and does not affect images previously saved."*

> *"Compatibility is about the only issue. But it's a big issue. Anything and everything can open a JPEG. But some printer drivers, old versions of Mac OS, Windows 8 and possibly some online printing services don't recognize the HEIC/HEIF format."*

So a reader who takes your advice, switches to Most Compatible mode, and *also* keeps their HEIC library (because you convinced them it's actually the better format) still has a real problem the moment they need to email 40 shots to a client on Windows or send a batch to a print lab that only accepts JPEG. The settings fix doesn't touch that.

**Proposed piece: *"You Loved HEIC After Jon Convinced You. Now Convert a Batch to JPEG Only When You Have To."***

800–1200 words, plain photographer voice, aimed at your existing reader — someone who's already read Jon's piece and gets why HEIC is technically better.

Rough outline:

1. **When it's actually worth converting** — the exact scenarios from Jon's own list (printer drivers, old Mac OS, Windows 8, online print services) plus two more that show up in 2026 (client email attachments, upload to legacy CMS platforms). And one strong argument for *not* converting — keep the library HEIC, convert only what you need to send.
2. **Four methods that work in 2026, with tradeoffs** —
   (a) Apple's built-in "Automatic" transfer to Mac/PC (silently converts on copy — most people don't know this exists),
   (b) Preview.app batch export on Mac,
   (c) Browser-based converter (nothing to install, files never leave the device — the privacy-respecting option),
   (d) Desktop apps like GraphicConverter or XnConvert.
3. **The metadata-survival table** — which method preserves EXIF (camera, lens, GPS), ICC profile, HDR gain map, capture date, and orientation. This is the section I've never seen written properly, and it's the one that matters most to Shutterbug's audience.
4. **The Live Photo problem** — Jon's article walks through disabling Live Photo. Most conversion methods silently drop the motion component of existing Live Photos. If a reader wants to keep it, what actually works.
5. **The "just install a viewer" alternative** — for the Windows-family-member case, sometimes `HEIF Image Extensions` from the Microsoft Store is the right answer instead of conversion. Free, five minutes, done.

**Why me:** I built ConvertYard (convertyard.com), which includes a browser-based HEIC-to-JPEG batch converter that runs entirely on the reader's device — no upload, no signup. I'd mention it once as one option in the four-method comparison in section 2, not as the answer. The metadata-survival table (section 3) is drawn from real testing, not marketing.

Happy to send a full outline and a sample paragraph if the angle fits your calendar.

— Garrick Dee Tan
convertyard.com
gdtwebmaster@gmail.com

---

## Notes for follow-up

- Byline **confirmed** as Jon Sienkiewicz — safe to use "Jon" in the greeting.
- The two Jon quotes above are the whole pitch. Do not cut them.
- If no reply in 10–14 days, one polite nudge to the same address. Do not go around to social DMs — Jon's Shutterbug bio suggests he's not a heavy social-media presence, and cold DMs on a personal channel would read wrong.
- Tone: photographer voice, no dev jargon. The freeCodeCamp version can talk about libheif and COOP/COEP; this one talks about print labs and Windows 8.
- The metadata-survival table (section 3) is your strongest differentiator. If length is a concern, cut section 5 before you cut that.
- If Shutterbug accepts, offer a screenshot of the four methods side-by-side and a real EXIF diff before/after — Shutterbug's audience likes visual proof more than benchmark charts.
