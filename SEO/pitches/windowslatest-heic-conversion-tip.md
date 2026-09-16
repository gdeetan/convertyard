# Windows Latest pitch — Tip for a HEIC-on-Windows post (JPEG-XL article parallel)

**Reference article:** "Turn on JPEG-XL (.jxl) in Windows 11 24H2, a secret new feature"
**URL:** https://www.windowslatest.com/2025/03/05/turn-on-jpeg-xl-jxl-in-windows-11-24h2-a-secret-new-feature/
**Author:** Abhijith M B (contributing editor)
**Published:** March 5, 2025

## Site verification

- Very active — homepage posts dated Aug 14, 2026 (today)
- Abhijith is still an active contributing editor (his author page bio: Electronics & Communications Engineering, focus on Windows/Edge)
- Publisher: based in Chennai, India

## Contact channel (decoded from Cloudflare obfuscation)

- **`contact@windowslatest.com`** — single address for all editorial and business inquiries (per their Contact Us page)
- No separate tips/editorial/press aliases — everything routes through contact@

## What Abhijith already wrote about HEIC/HEIF (leverage this)

> *"As opposed to some of the newer image file formats like HEIC, AVIF and webp, JPEG XL was specifically designed as an image format to give more control to photographers."*

> *"A similar story occurred at the beginning of 2018 when Microsoft added support for HEIF and HEVC file formats just a few months after Apple made them default in iOS 11."*

He already knows the HEIF/HEIC story and Microsoft's Store-extension model for handling Apple formats. That's your anchor.

## Corrections to the original pitch

1. **"Windows users still can't open HEIC without a Store codec"** is overstated. Windows 11 24H2 ships HEIF Image Extension pre-installed on many builds; Windows 10 has had it via Store since 2018 (per Abhijith's own article). Tight framing: **the reader who can't install anything** — corporate/school Windows machines with Store blocked by IT policy. Windows Latest's readership skews IT-heavy, so this is a real reader, not a hypothetical.
2. **Address Abhijith by name.** He wrote the piece and drew the HEIF parallel himself — using his voice as the bridge makes the pitch feel like a genuine read.
3. **Lean into the parallel he set up.** JPEG-XL and HEIF are both Store-extension formats on Windows. Same reader problem (locked-down PC), same fix (browser-based tool). His article set up the parallel; your tip closes it.
4. Send as a **tip for a new post**, not an edit to the JPEG-XL article — the JPEG-XL piece is on-topic for its own format and shouldn't be diluted with HEIC content.

---

## Revised pitch (send to `contact@windowslatest.com`)

**Subject:** Tip for a Windows how-to: opening HEIC files on locked-down PCs where Store is blocked

Hi Abhijith,

Read your March 2025 JPEG-XL 24H2 walkthrough — the honest note at the end that the Photos app doesn't actually open JXL files yet, even after installing the extension, is the kind of detail most format announcements skip. Appreciated.

Sending this as a tip for a possible follow-up post on the HEIC/HEIF side, which you already drew the parallel to in the JPEG-XL piece ("A similar story occurred at the beginning of 2018 when Microsoft added support for HEIF and HEVC...").

The reader I'm suggesting a post for: someone on a **corporate or school Windows machine where the Microsoft Store is disabled by IT policy**. That reader can't install HEIF Image Extensions, can't install JPEG-XL Image Extension, can't install CopyTrans, can't install anything from the Store or admin-restricted installers. They open the HEIC email attachment from a colleague's iPhone and hit a wall.

The tip: **browser-based converters running entirely in the tab via WebAssembly bypass the Store requirement entirely.** No install, no admin rights, no upload to any server. Works on any Windows machine, including the locked-down corporate laptop where every install path is blocked.

I built one at ConvertYard (https://convertyard.com/heic-to-jpg):
- WebAssembly conversion runs in the browser tab — nothing uploaded, no server sees the files
- Handles 1000+ file batches, ZIP output
- Free, no signup
- Works on Windows 10 and 11 (both), Chrome/Edge/Firefox, no admin rights required

Why it's a Windows Latest fit:
- Your reader skews IT-aware — this is the exact "workaround for locked-down PC" content they search for
- It parallels the JPEG-XL / HEIF Store-extension story you already covered — same problem, different format, same fix
- The current top guides for HEIC on Windows (Apple Toolbox, iGeeksBlog, etc.) all assume the reader can install something; the "you literally cannot install anything" case doesn't have a clean write-up yet

Suggested post angle: "How to Open HEIC Files on Windows When IT Won't Let You Install the Store Extension" — or however your team frames it.

Happy to send screenshots of the workflow on a Windows PC, sample HEIC batches for testing, or technical detail on the WebAssembly stack. Or nothing at all if it's not a fit — no worries either way.

— Garrick Dee Tan
ConvertYard · convertyard.com
gdtwebmaster@gmail.com

---

## Notes for follow-up

- Send to `contact@windowslatest.com`. That's their single inbox — no separate tips@ alias exists.
- Address Abhijith directly but understand contact@ routes to the editorial team; an editor may assign the tip to a different reporter.
- If no reply in 2-3 weeks, ONE polite nudge to the same address. Do not push after.
- Windows Latest posts 3-5 news items per day — they move fast. If they respond with "we'll take it," send the screenshots and technical notes within 24 hours or the story goes stale.
- The site's IT-heavy audience is your best value target from this batch — the "locked-down corporate PC" reader is *their reader*, and no other pitched publication owns that reader as cleanly.
- If accepted, DO NOT ask for backlink placement in the article body. Their editorial standards mean they'll link naturally if the tool is central to the post. Pushing for anchor text is a mistake here.
- Reserve angle for future: JPEG-XL is still Chromium-flag-only in browsers, so a companion tip "how to open JXL files in a browser without waiting for Chrome/Edge" could be a second tip 6 months from now if the first one lands.
