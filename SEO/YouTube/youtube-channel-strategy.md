# ConvertYard YouTube Strategy

**Last updated:** 2026-08-18  
**Status:** Decision recorded — do not treat this as a weekly channel to grow.  
**Production model:** Faceless screen recordings + ElevenLabs voiceover.  
**Existing asset:** `Video/Convert JPG to WebP in Minutes.mp4`

This note captures the marketing judgment and the production rules so a future session does not re-litigate the idea.

---

## Verdict

YouTube how-to videos are a **good supporting tactic** and a **bad primary marketing project**.

Treat YouTube as a **search landing page factory** for 8–12 high-intent jobs, not as a second product that needs weekly uploads, a personality, or subscriber growth.

A dead channel with four interchangeable videos looks worse than no channel.

### Why it fits ConvertYard

- People already search these jobs on YouTube: HEIC to JPG, compress PDF to 2MB, compress video for WhatsApp.
- The product *is* the demo. Drop files, convert, download.
- Unique on-camera proof: open DevTools → convert → Network tab stays empty.
- Videos can be embedded on matching tool pages. That helps the site even if the video never gets 10k views.
- A mention on an existing exam-prep / photography / Windows-tips channel beats 20 of our own videos.

### Why it is a trap if framed as “start a channel”

- Solo founder, ~3 hours/week. SEO plan already uses that time for directories, community, and outreach (`SEO/SEO-PLAN.md`).
- YouTube is a consistency game. Generic “how to convert X” is saturated (Wondershare, Adobe, Handbrake, faceless spam).
- Views ≠ conversions. People watch and use the first tool they see.
- Production tax: record, edit, thumbnail, title, description, captions, end card.
- A branded ConvertYard channel that only does product tours feels like an ad. YouTube and viewers punish that.
- YouTube links barely help domain authority. Directories → community → niche outreach remain higher-ROI for a new domain.

### Priority vs other marketing

1. Keep outreach / directories / community as the main marketing hour.
2. YouTube is leftover time, not a replacement.
3. Ship 8–12 search videos, then stop.
4. If one video gets traction, make two siblings of that *job* — not a new format pair.
5. Pitch 5 existing creators (exam-photo coaches, Windows/iPhone tip channels, photography channels) instead of chasing subscribers.

**If only one video ships this month:** the DevTools proof. Convert a file, show the Network tab stay empty. That is the only ConvertYard video that is not interchangeable with every other converter.

---

## Production model (decided)

Faceless. Screenshot / screen recording. ElevenLabs voiceover.

This is the correct production model **if** the videos stay short and problem-first. The risk is not “faceless.” The risk is 40 videos that are the same dropzone, a different title, and a stock ElevenLabs voice.

### YouTube policy (as of 2026)

- Faceless + AI voice is allowed.
- YouTube’s **inauthentic / repetitious content** rules target mass-produced, low-value, near-duplicate uploads (same footage, swapped keyword, no new information).
- AI disclosure is for realistic fake people / events / cloned likeness, not for a synthetic narrator over a screen recording.
- Do not brand this as an “AI channel.” Do not pretend a human is on camera.
- Monetization is not the goal. A how-to that sends 200 people to `/heic-to-jpg` is worth more than a channel that makes $12 from ads.

A converter farm of 93 near-identical clips will get ignored and can later get the channel limited. Ten distinct jobs, each with a real problem on screen, will not.

---

## Rules

### Do

- Title = the Google / YouTube query, not “ConvertYard Tutorial #4.”
- 45–90 seconds. Hard cuts. No intro music. No face required.
- First 3–5 seconds = the pain, **not** the ConvertYard homepage.
- Show proof: before/after file size on screen. Once per video, 5 seconds of “this never left the browser.”
- One video does the Network-tab walkthrough in full.
- Spoken URL + on-screen URL + description link to the **exact tool**, not the homepage.
- Embed each video on the matching tool page the same day it goes up.
- One voice, forever. Slightly slower than you think. No smile in the voice.
- Write scripts by hand in ConvertYard voice. If you would not put the sentence on the site, do not say it.
- Cap the series at 8–12, then stop.

### Do not

- One video per tool. 90+ tools, same dropzone. Looks like spam.
- “Welcome to ConvertYard, like and subscribe.”
- 8-minute videos with intro music or talking-head brand content.
- Default “YouTube narrator” ElevenLabs voice.
- “Hey guys,” “don’t forget to like and subscribe,” “in today’s digital world.”
- Versus-iLovePDF rants (use written comparison pages instead).
- A video for every format pair (BMP to AVIF, TIFF to WebP, etc.). Same footage, no new search job.
- “93 tools in 10 minutes” trailers.
- Competing with 8-minute Handbrake / Acrobat tutorials. Lose that format. Win on speed, no install, no upload, exact size targets.
- Fake subscribe animations, stock “success” music at full volume.
- Filling the channel because a new tool shipped.

---

## Channel setup

Name it **ConvertYard**, not “Quick File Tips” or “Convert Anything Fast.”

This is not a faceless media company. These are search clips that exist to feed the site. If the channel looks official, the videos have to look official: clean capture, no junk end screens, URL on screen at the end.

---

## Visual format

Record at 1080p. Cursor visible. No zoom-around-the-mouse unless a button is actually small. Leave ~0.4s of silence at the start so the first word is not clipped.

**Do not start on the ConvertYard homepage.** Open on the problem:

- Windows “can’t open this HEIC”
- Gmail / job portal “file too large”
- WhatsApp “video not sent”
- A form that says “photo must be under 100KB”
- Explorer full of `.HEIC` files

Then cut to ConvertYard. Same voiceover shape, different opening shot, and each video is actually a different video.

Thumbnail: the error message or a size change (`2.4 MB → 480 KB`), not a logo.

Captions on, large, keyword in the first caption.

---

## Script template (~55 seconds)

Swap the job. Keep the voice.

> Windows will not open this iPhone photo. It is a HEIC file.  
> Open convertyard.com/heic-to-jpg.  
> Drop the files. One or a hundred. Nothing uploads — this runs in your browser.  
> Click convert. Download the JPGs.  
> Same photos, now they open on Windows.

That is the whole video. Burn the URL and the size change on screen.

Voice: direct, no fluff. Lead with the action. Trust as facts, not claims (“files never leave your browser,” not “we respect your privacy”).

### ElevenLabs settings that matter

- One voice for the whole channel. Prefer a clone of a real voice over a default library voice.
- Stability high. Style exaggeration near zero.
- One take per video. Do not stitch three emotional reads.
- Pronunciation notes:
  - **HEIC** — “heek”
  - **WebP** — “wepp”
  - **AVIF**
  - **ConvertYard** — same every time
- Paid ElevenLabs plan if anything is ever monetized (commercial license).

---

## Batch workflow (one afternoon)

1. Write 10 scripts in a single doc, all in the template voice.
2. Capture all problem-state openings first (the error dialogs).
3. Capture each ConvertYard flow second.
4. Generate all 10 voiceovers in one ElevenLabs session.
5. Edit with the same caption style and end card.
6. Upload: title = search query; description = 3 lines + the exact tool URL.
7. Embed the video on that tool page the same day.

---

## Video ideas

### Record these first

Search demand + ConvertYard actually wins.

| # | Title to rank for | Why it works |
|---|-------------------|--------------|
| 1 | How to convert HEIC to JPG on Windows (without paying for the codec) | Evergreen iPhone → PC pain. Already used in outreach. |
| 2 | Compress a PDF to under 2MB / 5MB / 10MB for email or a job portal | Size-target searches convert. Matching pages already exist. |
| 3 | Compress a video for WhatsApp / under 25MB / 100MB | Same pattern, video cluster. |
| 4 | Compress an image to 50KB / 100KB / 200KB for a government form | Exam + visa + job portals. High intent in IN/US. |
| 5 | Crop a photo for DS-160 / UPSC / NEET / JEE (exact px + KB) | Vertical pages exist. Coaching channels will share this. |
| 6 | Convert 100 iPhone photos to JPG at once | Batch is the product. Most competitors do one file. |
| 7 | Merge PDFs without uploading them | Privacy hook; lawyers and students. |
| 8 | Extract audio from an MP4 / Zoom recording | Simple, high search, one-take demo. |
| 9 | Convert MOV (iPhone) to MP4 on Windows | Same job as HEIC, video version. |
| 10 | Convert JPG to WebP for a website (batch) | Footage already exists in `Video/`. Re-cut to ~60s and embed. |

### Next wave (same format, still problem-first)

11. Convert Word to PDF without Microsoft Word  
12. Unlock / password-protect a PDF locally  
13. OCR a scanned PDF or handwritten notes without uploading  
14. Remove a product-photo background without sending it to a server  
15. Convert MP3 to MP4 for a YouTube / podcast upload  
16. Turn a video into a GIF or animated WebP  
17. HEIC to PDF so you can email a set of iPhone photos  
18. Flatten or redact a PDF before you send it  
19. Batch convert images to AVIF / WebP and compare file sizes on screen  
20. “Does this converter upload my file?” — DevTools walkthrough on ConvertYard vs a cloud converter  

### Skip

- Every format pair on the site
- Channel trailers and “welcome to the channel”
- Personality / weekly schedule / ring light
- Competitor-attack videos

---

## Description / packaging checklist

For each upload:

- [ ] Title is the search query (include year only if it helps, e.g. Windows 11)
- [ ] First 3 seconds are the error / rejected file, not the homepage
- [ ] URL spoken and on screen
- [ ] Before/after size on screen
- [ ] Description: 3 factual lines + exact tool URL + 2 related tool URLs
- [ ] Chapters only if the video is over ~90s (most should not be)
- [ ] End card: tool URL, not “subscribe”
- [ ] Embedded on the matching ConvertYard tool page the same day
- [ ] Captions burned or uploaded (keyword in the first caption)

---

## Creator outreach (higher leverage than our own subscribers)

Do not only compete with existing how-to channels. Pitch them:

- Indian exam-prep channels (UPSC / NEET / JEE photo requirements)
- Windows / iPhone tip channels (HEIC, MOV)
- Photography gear channels (batch convert, compress without upload)

One mention on a 100k-sub channel beats a stack of our own uploads.

Related written pitches live in `SEO/pitches/`. Exam verticals live under `content/verticals/`.

---

## Related files

- `SEO/SEO-PLAN.md` — time budget and primary growth sequence
- `docs/superpowers/specs/2026-07-16-convertyard-outreach-copy-design.md` — voice, origin story, building-block claims
- `Video/Convert JPG to WebP in Minutes.mp4` — first cut to re-edit
- Tool size-target pages: `content/size-targets/`
- Exam / visa photo pages: `content/verticals/`
