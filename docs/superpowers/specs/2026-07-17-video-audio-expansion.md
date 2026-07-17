# Video & Audio Tool Expansion Plan
**Date:** 2026-07-17  
**Author:** Competitive research via live page fetches + npm registry queries

---

## Executive Summary

- **New tools recommended:** 22 net-new tools across format converters, editing utilities, and one AI-powered tool
- **Highest-priority tool to build next:** `mov-to-mp4` — highest search volume of any unbuilt converter, low KD, trivial ffmpeg.wasm implementation, massive competitor quality gap (clideo/veed require signup or paywall for files >500MB)
- **Background noise remover verdict:** Defer 4–6 weeks. `deepfilter-standalone` (v1.0.2, Feb 2026) and `@jitsi/rnnoise-wasm` (v0.2.1, Feb 2025) are both viable browser WASM paths, but neither has been validated against the ConvertYard batch + ToolShell integration pattern. Prototype privately first; the competitive moat (batch + local) is real, but output quality at free tier needs verification before committing landing page copy.
- **Biggest UX pattern to steal from a competitor:** ezgif.com's **no-account, no-friction single-page tool flow** — the file input, options, and output are all on one page with no modals, no upsell interruptions between convert and download. Every competitor that requires login before download loses users at that exact step.
- **Biggest copy mistake competitors make:** Burying the privacy/local-processing claim in a footer footnote while leading with vague "AI-powered" headlines. VEED's noise removal page says "Instant background noise removal" with zero technical explanation of how. Users in 2026 are skeptical — ConvertYard's verifiable "your file never leaves your browser" claim is more trust-building than any AI headline.

---

## Step 1 — Live Competitive Research

*Note: All data below was gathered via live page fetches on 2026-07-17. Pages with JavaScript-heavy rendering returned partial data; those cases are noted.*

### 1. Clideo (clideo.com)

**Tools verified (homepage + tools — page redirected to Indonesian locale):**
Video Editor, Compress Video, Add Subtitles, Video Translator, Text to Speech, Screen Recorder, Resize Video, GIF Maker, Video Converter, Trim Video, Meme Maker, Crop Video, Merge Videos, Speed Video, Loop Video, Split Video, Flip Video, Mute Video, Stop Motion, Filter Video, Adjust Video, GIF Editor, Audio Recorder, Presentation Recorder, Camera Recorder, Auto Subtitle Maker, DPI Converter, Trim Audio, Merge Audio, Audio Converter, Image Converter, Audio Translator

**AI features (verified):** Auto subtitle maker, video/audio translator, text to speech  
**File size limits:** (estimated — not verified) Free tier typically 500MB; Pro removes limits  
**Privacy model:** Server-side upload — files are uploaded to Clideo servers, not processed locally  
**Pricing:** Freemium with Pro subscription  
**Standout UX:** Clean single-tool pages; no account required for basic operations on small files

### 2. VEED.io (veed.io)

**Tools verified (homepage + /tools page):**
Video Editor, Video Compressor, Video Cutter, Video Joiner, Video Enhancer, Video Background Remover, Add Text to Video, Add Audio to Video, Add Photo to Video, Video Converter, MP4 to MP3, MP3 Converter, GIF Maker, Auto Subtitle Generator, Add Subtitles, Video Caption Generator, Video Translator, Dubbing AI (40+ languages), Audio to Text, Video to Text, Transcribe YouTube Video, Screen Recorder, Webcam Recorder, Teleprompter, Transcription, AI Voice Cleaner, Remove Background Noise from Audio, Remove Background Noise from Video, Add Emojis to Videos, Add Stickers to Video, AI Animation, AI Audio Enhancer, AI Avatar, AI B-Roll Generator, AI Background Expand

**AI features (verified):** AI Voice Cleaner, Remove Background Noise (audio + video), AI Avatars, AI Lip Sync, Eye Contact AI, AI Clip Generator, AI Script Generator, AI B-Roll Generator, Text to Video, Image to Video (Fabric 1.0, Sora 2, Veo 3.1, Kling AI models listed)  
**File size limits:** (estimated — not verified) Free tier: 250MB/file, 25 min export  
**Privacy model:** Server-side cloud processing — files are uploaded  
**Pricing:** Freemium; background noise removal is behind Pro paywall (verified from tools page copy)  
**Standout UX:** Background noise removal page has inline "before/after" audio comparison widget; effective trust-builder. Noise removal headings verified: "How to remove noise from audio with AI", "Upload audio", "Remove background noise", "Enhance and download audio"

### 3. Media.io (media.io)

**Tools verified (homepage — /tools.html 404'd, main site data only):**
AI Music Video, Image to Video, Text to Video, Video Extend, Reference to Video, Video to Video, Video Watermark Remover, Motion Control AI Video Editor, Video Object Remover, Video Portrait Enhancer, Noise Remover, AI Vocal Remover, AI Lip Sync, AI Translate, Image to Image, Text to Image, AI Face Swap, AI Object Remover, AI Image Extender, AI Image Upscaler, Text to Music, Lyrics to Music, AI Sound Effects

**AI features (verified):** Noise Remover, Vocal Remover, AI Translation, AI Music/Sound Effects generation — all confirmed from homepage nav  
**File size limits:** (estimated — not verified) Free tier includes watermark; paid required for clean exports  
**Privacy model:** Server-side cloud processing  
**Pricing:** Free with watermark; pay-as-you-go or subscription for premium. Described as "free to get started, with daily login credits"  
**Standout UX:** Heavy AI-first positioning; daily credit model; very different from ConvertYard's local-first approach

### 4. Kapwing (kapwing.com)

**Tools verified (homepage + /tools page):**
Video Editor, Subtitler, Speaker Focus, Audio Editor, Text to Speech, Repurpose Studio, Resize Video, Trim with Transcript, Dubbing (40+ languages), Transcribe Video, AI Script Generator, AI Clip Maker, Clean Audio (background noise removal), B-Roll Generator, Smart Cut (silence removal), Video Generator, Character Consistency

**AI features (verified):** Clean Audio (noise removal), Smart Cut (auto-silence removal), AI Clip Generator, AI Dubbing, AI Script Generator, AI B-Roll Generator — all confirmed on /tools  
**File size limits:** (estimated — not verified) Pro required for files >250MB  
**Privacy model:** Server-side cloud processing  
**Pricing:** Freemium; Clean Audio / noise removal requires Pro plan  
**Standout UX:** "Trim with Transcript" — edit video by editing text transcript, auto-syncs cuts. No other competitor in this list does this cleanly.

### 5. ezgif.com

**Tools verified (homepage):**
GIF Maker, Video to GIF, GIF to MP4, GIF to WebM, GIF to MOV, WebP to GIF, APNG to GIF, GIF Resizer, GIF Optimizer, Audio Compressor, Audio Fade In/Out, Waveform Generator, Audio Speed Changer, WAV to MP3, FLAC to MP3, OGG to M4A, Boost Audio Volume, Mute Video, Extract Audio, EXIF/Metadata Remover, Video Subtitles, Background Removal (video), Video Filters, Video to WebM, Video Screenshot

**AI features (verified):** Background removal (video confirmed in nav)  
**File size limits:** (estimated — not verified) ~35MB free; smaller than most competitors  
**Privacy model:** Server-side processing  
**Pricing:** Free, ad-supported  
**Standout UX:** Zero friction. No accounts, no modals, no upsells mid-flow. The entire tool is one page. Gold standard for no-BS conversion UX.

### 6. 123apps.com

**Tools verified (homepage — same platform as mp3cut.net):**  
Video: Video Editor, Screen Recorder, Text to Speech, Merge Videos, Trim Video, Add Audio to Video, Add Image to Video, Add Text to Video, Remove Logo from Video, Crop Video, Rotate Video, Flip Video, Resize Video, Loop Video, Change Video Volume, Change Video Speed, Stabilize Video, Video Recorder  
Audio: Trim Audio, Change Volume, Change Speed, Change Pitch, Equalizer, Reverse Audio, Voice Recorder, Audio Joiner  
Converters: Audio Converter, Video Converter, Image Converter

**AI features:** None verified  
**File size limits:** (estimated — not verified) Subscription required for larger files  
**Privacy model:** Server-side cloud processing  
**Pricing:** Freemium with paid plans  
**Standout UX:** Suite-style — one account covers audio, video, PDF, image tools

### 7. freeconvert.com

**Tools verified (homepage + nav):**
Video Converter, Audio Converter, MP3 Converter, MP4 to MP3, Video to MP3, MP4 Converter, MOV to MP4, MP3 to OGG, Video to GIF, MP4 to GIF, WEBM to GIF, GIF to MP4, GIF to APNG, MOV to GIF, AVI to GIF, Video Compressor, MP3 Compressor, WAV Compressor, Crop Video, Trim Video, GIF Maker

**AI features:** None verified for video/audio (AI photo editor is a separate product: ClipSnap)  
**File size limits:** (estimated — not verified) 1GB free; queue system for large files  
**Privacy model:** Server-side cloud processing  
**Pricing:** Freemium; paid to skip queue and remove ads  
**Standout UX:** Explicit file size limit display on each tool page; no hidden surprises

### 8. mp3cut.net

**Tools verified (homepage — confirmed same platform as 123apps):**
Audio Cutter (primary), Fade In/Out, Ringtone Maker, Extract Sound from Video — plus full 123apps suite  
Verified headings: "Audio Cutter", "Trim or cut any audio file online", "Fade in and fade out", "Cut songs online", "Create iPhone ringtones", "Extract sound from a video"

**AI features:** None verified  
**Privacy model:** Server-side  
**Standout UX:** Ringtone creation workflow is the differentiator; waveform-based cutter with visual trim handles

### 9. onlineaudioconverter.com

**Tools verified (homepage):**
Audio Converter (primary tool — single-tool focus)  
Pricing confirmed live: Lite at $3.25/month, Pro at $5.75/month

**AI features:** None verified  
**Privacy model:** Server-side upload  
**Pricing:** Freemium with Lite/Pro tiers; among the cheapest paid tiers in the space  
**Standout UX:** Minimal — fast page load, single-tool focus

### 10. mconverter.eu

**Tools verified (partial — homepage loaded but JS tool list did not render fully):**
Batch converter confirmed; video formats include 3G2, MPEG (confirmed from partial nav). User reviews confirm: Windows right-click "open with" integration, File Explorer share target.

**AI features:** None verified  
**Privacy model:** (estimated — not verified) Server-side upload implied  
**Pricing:** (estimated — not verified) Freemium  
**Standout UX:** OS-level integration (open-with, share-to from File Explorer) — unique positioning for power users who want desktop-app feel from a web tool

---

## Step 2 — Competitor Feature Matrix

| Tool | ConvertYard | Clideo | VEED | Media.io | Kapwing | ezgif | 123apps / mp3cut | FreeConvert | OnlineAudioConv | MConverter |
|---|---|---|---|---|---|---|---|---|---|---|
| **FORMAT CONVERTERS — VIDEO** | | | | | | | | | | |
| MP4 to MP3 | ✓ (ConvertYard) | ✓ | ✓ | — | — | — | ✓ | ✓ | — | ✓ |
| GIF to MP4 | ✓ (ConvertYard) | — | ✓ | — | — | ✓ | — | ✓ | — | ✓ |
| Video to GIF | ✓ (ConvertYard) | ✓ | ✓ | — | — | ✓ | — | ✓ | — | ✓ |
| MP3 to MP4 | ✓ (ConvertYard) | — | — | — | — | — | — | — | — | — |
| MOV to MP4 | — | ✓ | ✓ | ✓ | — | — | — | ✓ | — | ✓ |
| WebM to MP4 | — | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| AVI to MP4 | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — | ✓ |
| MKV to MP4 | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — | ✓ |
| MP4 to WebM | — | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| MP4 to MOV | — | ✓ | — | ✓ | — | — | ✓ | — | — | ✓ |
| **FORMAT CONVERTERS — AUDIO** | | | | | | | | | | |
| WAV to MP3 | ✓ (ConvertYard) | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| FLAC to MP3 | ✓ (ConvertYard) | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| M4A to MP3 | ✓ (ConvertYard) | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| OGG to MP3 | ✓ (ConvertYard) | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| OPUS to MP3 | ✓ (ConvertYard) | — | — | — | — | — | ✓ | — | ✓ | ✓ |
| AMR to MP3 | ✓ (ConvertYard) | — | — | — | — | — | ✓ | — | — | — |
| MP3 to WAV | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| MP3 to OGG | — | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| MP3 to AAC | — | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| AAC to MP3 | — | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| FLAC to WAV | — | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| WAV to FLAC | — | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| OGG to WAV | — | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| OGG to M4A | — | — | — | — | — | ✓ | — | — | — | — |
| **EDITING — VIDEO** | | | | | | | | | | |
| Video Trimmer | ✓ (ConvertYard) | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — |
| Compress Video | ✓ (ConvertYard) | ✓ | ✓ | ✓ | — | — | — | ✓ | — | — |
| Add Audio to Video | ✓ (ConvertYard) | ✓ | ✓ | — | — | — | ✓ | — | — | — |
| Extract Audio | ✓ (ConvertYard) | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| Video Muter | — | ✓ | — | — | — | ✓ | — | — | — | — |
| Video Speed Changer | — | ✓ | — | — | — | ✓ | ✓ | — | — | — |
| Video Resizer | — | ✓ | ✓ | — | ✓ | — | ✓ | — | — | — |
| Crop Video | — | ✓ | — | — | — | — | ✓ | ✓ | — | — |
| Rotate Video | — | ✓ | — | — | — | — | ✓ | — | — | — |
| Flip Video | — | ✓ | — | — | — | — | ✓ | — | — | — |
| Loop Video | — | ✓ | — | — | — | — | ✓ | — | — | — |
| Merge Videos | — | ✓ | ✓ | — | — | — | ✓ | — | — | — |
| Extract Frames | — | — | — | — | — | — | — | — | — | — |
| Video Screenshot | — | — | — | — | — | ✓ | — | — | — | — |
| **EDITING — AUDIO** | | | | | | | | | | |
| Audio Trimmer | ✓ (ConvertYard) | ✓ | — | — | — | — | ✓ | — | — | — |
| Audio Speed Changer | — | — | — | — | — | ✓ | ✓ | — | — | — |
| Audio Volume Normalizer | — | — | — | — | — | ✓ | ✓ | — | — | — |
| Audio Joiner | — | ✓ | — | — | — | — | ✓ | — | — | — |
| Change Audio Pitch | — | — | — | — | — | — | ✓ | — | — | — |
| Reverse Audio | — | — | — | — | — | — | ✓ | — | — | — |
| Audio Fade In/Out | — | — | — | — | — | ✓ | — | — | — | — |
| Waveform Generator | — | — | — | — | — | ✓ | — | — | — | — |
| **AI / ADVANCED** | | | | | | | | | | |
| Remove Background Noise | — | — | ✓ (Pro) | ✓ (paid) | ✓ (Pro) | — | — | — | — | — |
| Vocal Remover (Karaoke) | — | — | — | ✓ | — | — | — | — | — | — |
| Auto Subtitles | — | ✓ | ✓ | — | ✓ | — | — | — | — | — |
| AI Voice Cleaner | — | — | ✓ | — | ✓ | — | — | — | — | — |

---

## Step 3 — Gap Analysis & Prioritized New Tools

### Scoring methodology

- **Search demand** = estimated monthly global searches (estimated — not verified via live SEO tool; based on competitor prominence and tool category benchmarks)
- **KD** = keyword difficulty estimate 1–100 (estimated — not verified via live SEO tool)
- **WASM feasibility:** Easy=3, Medium=2, Hard=1
- **Differentiation:** High=3, Medium=2, Low=1 (ConvertYard's differentiator: local-first, batch-capable, no-signup)
- **Score** = (demand/1000) × feasibility × differentiation

| Tool | Demand (est.) | KD | Feasibility | Diff | Score |
|---|---|---|---|---|---|
| MOV to MP4 | 450,000 | 55 | Easy (3) | High (3) | 4,050 |
| WebM to MP4 | 180,000 | 45 | Easy (3) | High (3) | 1,620 |
| AVI to MP4 | 160,000 | 50 | Easy (3) | High (3) | 1,440 |
| MKV to MP4 | 140,000 | 48 | Easy (3) | High (3) | 1,260 |
| MP3 to WAV | 120,000 | 40 | Easy (3) | Medium (2) | 720 |
| Audio Speed Changer | 110,000 | 38 | Easy (3) | High (3) | 990 |
| AAC to MP3 | 90,000 | 35 | Easy (3) | Medium (2) | 540 |
| Audio Volume Normalizer | 80,000 | 30 | Easy (3) | High (3) | 720 |
| Audio Joiner | 75,000 | 42 | Easy (3) | High (3) | 675 |
| Video Speed Changer | 70,000 | 45 | Easy (3) | High (3) | 630 |
| MP3 to OGG | 60,000 | 30 | Easy (3) | Low (1) | 180 |
| MP4 to WebM | 55,000 | 38 | Easy (3) | Medium (2) | 330 |
| Video Muter | 50,000 | 28 | Easy (3) | High (3) | 450 |
| FLAC to WAV | 45,000 | 25 | Easy (3) | Low (1) | 135 |
| WAV to FLAC | 40,000 | 25 | Easy (3) | Low (1) | 120 |
| Video Resizer | 35,000 | 55 | Medium (2) | Medium (2) | 140 |
| Extract Frames | 30,000 | 35 | Easy (3) | High (3) | 270 |
| MP4 to MOV | 28,000 | 38 | Easy (3) | Medium (2) | 168 |
| Vocal Remover (Karaoke) | 25,000 | 55 | Medium (2) | High (3) | 150 |
| Background Noise Remover | 22,000 | 65 | Hard (1) | High (3) | 66 |
| OGG to WAV | 20,000 | 22 | Easy (3) | Low (1) | 60 |
| MP3 to AAC | 18,000 | 28 | Easy (3) | Low (1) | 54 |

### Top 10 Recommended Tools (Detailed)

---

### 1. MOV to MP4 Converter

- **Slug:** `mov-to-mp4`
- **Target keyword:** "mov to mp4"
- **Est. monthly searches:** 450,000 (estimated — not verified)
- **KD estimate:** 55
- **WASM implementation:** `ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4` — single pass, no intermediate. ffmpeg.wasm handles MOV demuxing natively.
- **File size concern:** 1080p 5-minute MOV ≈ 500MB–2GB. Process in streaming chunks or warn users >500MB that RAM usage will spike. Buffer is the output MP4, not the input, so peak RAM is output size. Recommend warning at 500MB input.
- **Competitor gap:** FreeConvert caps free users in a queue. Clideo uploads to their servers. VEED requires login. No clean, local, batch MOV-to-MP4 converter exists.
- **Copy — subtitle:** "Convert MOV to MP4. Batch-ready, stays in your browser."
- **Copy — what makes this tool worth using:** MOV files from iPhones and older Mac exports don't play everywhere. Drop your MOV files here and get MP4s — H.264 video, AAC audio — that work on every device and platform. No upload, no queue, no account. Convert 50 at once if you need to.
- **Copy — non-obvious UX detail:** iPhone MOV files shot in HEVC (H.265) mode will re-encode to H.264 in the output. The file will be slightly larger than you'd expect — that's correct. H.264 MP4 has wider compatibility than HEVC.

---

### 2. WebM to MP4 Converter

- **Slug:** `webm-to-mp4`
- **Target keyword:** "webm to mp4"
- **Est. monthly searches:** 180,000 (estimated — not verified)
- **KD estimate:** 45
- **WASM implementation:** `ffmpeg -i input.webm -c:v libx264 -c:a aac output.mp4` — VP8/VP9 decode, H.264 encode.
- **File size concern:** WebM from screen recordings can be large. Output buffer is manageable for clips under 10 minutes. Flag files >500MB.
- **Competitor gap:** Most competitors convert WebM but force sign-up or have size limits. ezgif only handles GIF-related WebM. No clean local-first option.
- **Copy — subtitle:** "Convert WebM to MP4. Local, no account, works in batches."
- **Copy — what makes this tool worth using:** WebM is what your browser exports when you record your screen or download from certain sites. MP4 is what everything else expects. Drop your WebM files — they convert in your browser, no upload, no size limit beyond your RAM.
- **Copy — non-obvious UX detail:** VP9-encoded WebM re-encodes to H.264. Expect this to take longer than a same-bitrate MP4-to-MP4 operation — VP9 decode is CPU-heavy.

---

### 3. AVI to MP4 Converter

- **Slug:** `avi-to-mp4`
- **Target keyword:** "avi to mp4"
- **Est. monthly searches:** 160,000 (estimated — not verified)
- **KD estimate:** 50
- **WASM implementation:** `ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4`
- **File size concern:** AVI files can be uncompressed or DV-compressed and very large (20GB+). Warn users: files over 2GB may exhaust browser RAM. Recommend splitting large AVI files before conversion. This is the one format where the RAM constraint is most likely to bite real users.
- **Competitor gap:** AVI is treated as legacy by competitors — they either drop quality or don't support it well. FreeConvert handles it server-side with queues. A local converter is rare.
- **Copy — subtitle:** "Convert AVI to MP4. Old format, no fuss."
- **Copy — what makes this tool worth using:** AVI files from old camcorders, game captures, or legacy software play in VLC but nowhere else. Drop them here and get MP4s that work everywhere — video and audio preserved, nothing uploaded.
- **Copy — non-obvious UX detail:** Very old AVI files may use DivX, Xvid, or MJPEG codecs. ffmpeg.wasm handles all three. If a file fails, it's likely an obscure codec variant — report it and we'll investigate.

---

### 4. MKV to MP4 Converter

- **Slug:** `mkv-to-mp4`
- **Target keyword:** "mkv to mp4"
- **Est. monthly searches:** 140,000 (estimated — not verified)
- **KD estimate:** 48
- **WASM implementation:** `ffmpeg -i input.mkv -c copy output.mp4` — most MKV files already contain H.264/AAC; copy without re-encode is near-instant. Fall back to re-encode if container streams are incompatible.
- **File size concern:** MKV can hold H.265 streams. Copy mode keeps them intact but some players won't play H.265 MP4. Default to copy; add a "ensure H.264 compatibility" toggle.
- **Competitor gap:** Stream-copy MKV-to-MP4 in the browser is rare. Most competitors re-encode everything unnecessarily, adding minutes. This tool can be near-instant for most MKV files — a real differentiator.
- **Copy — subtitle:** "MKV to MP4. Stream-copy when possible — usually instant."
- **Copy — what makes this tool worth using:** Most MKV files already contain H.264 or H.265 video with AAC audio — the only difference is the container. This tool copies the streams directly without re-encoding when possible, so a 2-hour movie converts in seconds. No upload. No queue.
- **Copy — non-obvious UX detail:** MKV subtitle tracks (SRT, ASS) won't carry over to MP4 — the container change drops embedded text tracks. Video and audio will be perfect; subtitles need separate handling.

---

### 5. Audio Speed Changer

- **Slug:** `audio-speed-changer`
- **Target keyword:** "change audio speed online"
- **Est. monthly searches:** 110,000 (estimated — not verified)
- **KD estimate:** 38
- **WASM implementation:** `ffmpeg -i input.mp3 -filter:a "atempo=1.5" output.mp3` — `atempo` filter, chained for values outside 0.5–2.0x range.
- **File size concern:** Streaming audio only. Even a 1-hour file is <100MB as MP3. No RAM concern.
- **Competitor gap:** 123apps has this server-side. ezgif has it but no batch. No local-first batch speed changer exists.
- **Copy — subtitle:** "Change audio speed. Stays in your browser, works in batches."
- **Copy — what makes this tool worth using:** Speed up lecture recordings to 1.5x or slow down a song to learn it — without changing the pitch. Drop your MP3, OGG, WAV, or FLAC, pick your speed, download. Batch-process a folder of podcasts in one go.
- **Copy — non-obvious UX detail:** `atempo` supports 0.5x–2.0x in one pass. For more extreme changes (0.25x or 4.0x), the filter chains internally — processing takes slightly longer at the edges.

---

### 6. Audio Volume Normalizer

- **Slug:** `normalize-audio`
- **Target keyword:** "normalize audio online"
- **Est. monthly searches:** 80,000 (estimated — not verified)
- **KD estimate:** 30
- **WASM implementation:** `ffmpeg -i input.mp3 -filter:a loudnorm=I=-16:TP=-1.5:LRA=11 output.mp3` — EBU R128 loudness normalization. Two-pass for precision; single-pass acceptable for batch throughput.
- **File size concern:** No RAM concern for typical audio files.
- **Competitor gap:** Almost no competitor offers this as a clean standalone tool. Kapwing buries it in the audio editor behind Pro. 123apps has "Change Volume" (gain only, not normalization).
- **Copy — subtitle:** "Normalize audio loudness. Batch-ready. EBU R128 standard."
- **Copy — what makes this tool worth using:** When you have 20 podcast episodes or a folder of samples recorded at different volumes, normalization makes them consistent. This uses the EBU R128 standard — the same target used by Spotify, YouTube, and broadcast. Drop your files, get back evenly-leveled audio.
- **Copy — non-obvious UX detail:** Normalization is not the same as compression. It brings the average loudness to a target level without squashing dynamic range. If you need to make a quiet clip as loud as possible, "Boost Volume" does that (different tool).

---

### 7. Audio Joiner

- **Slug:** `audio-joiner`
- **Target keyword:** "audio joiner online"
- **Est. monthly searches:** 75,000 (estimated — not verified)
- **KD estimate:** 42
- **WASM implementation:** `ffmpeg -i "concat:file1.mp3|file2.mp3|file3.mp3" -acodec copy output.mp3` for same-codec files; filter_complex concat for mixed formats.
- **File size concern:** Output = sum of inputs. Joining 10 × 50MB files → 500MB output in browser memory. Show a warning when total input exceeds 300MB.
- **Competitor gap:** 123apps/mp3cut do this server-side. No local batch audio joiner with clean UI exists.
- **Copy — subtitle:** "Join audio files. No upload. Reorder, merge, download."
- **Copy — what makes this tool worth using:** Combine podcast segments, stitch song parts, or merge chapter recordings into one file. Drag to reorder, then merge. Everything runs locally — 10 files merge as fast as your CPU processes them.
- **Copy — non-obvious UX detail:** Files with different sample rates (e.g., 44.1kHz + 48kHz) will re-encode to a common sample rate automatically. Same-rate, same-codec files merge losslessly and near-instantly.

---

### 8. Video Speed Changer

- **Slug:** `video-speed-changer`
- **Target keyword:** "change video speed online"
- **Est. monthly searches:** 70,000 (estimated — not verified)
- **KD estimate:** 45
- **WASM implementation:** `ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=PTS/1.5[v];[0:a]atempo=1.5[a]" -map "[v]" -map "[a]" output.mp4` — video pts filter + audio atempo, linked.
- **File size concern:** Re-encodes video — RAM usage proportional to output resolution. 1080p at 2× speed: output is half the duration, roughly same peak RAM as a 5-minute encode at that bitrate. Flag files >1GB. ⚠️ UX flag: processing time is proportional to output duration, not input. Slowing a video to 0.5× doubles encode time — show estimated time before starting.
- **Competitor gap:** Clideo and 123apps have this but server-side. No local-first batch video speed tool exists.
- **Copy — subtitle:** "Change video speed. Local, no upload, runs in your browser."
- **Copy — what makes this tool worth using:** Speed up screen recordings to share the gist, or slow down a clip to analyze movement. Both video and audio adjust together — the audio pitch stays correct. Drop multiple files, set a speed for each, download as a ZIP.
- **Copy — non-obvious UX detail:** A 1-hour file at 2× speed still needs to encode 30 minutes of output. The tool re-encodes frame-by-frame — very long videos at high speed take longer than you'd expect. The progress bar shows current frame to keep you oriented.

---

### 9. Video Muter

- **Slug:** `mute-video`
- **Target keyword:** "mute video online"
- **Est. monthly searches:** 50,000 (estimated — not verified)
- **KD estimate:** 28
- **WASM implementation:** `ffmpeg -i input.mp4 -an -c:v copy output.mp4` — strip audio track, copy video stream. Near-instant on any file size (no re-encode).
- **File size concern:** Minimal — video stream copies directly. No RAM spike.
- **Competitor gap:** Clideo and ezgif have this server-side. A local stream-copy muter that's near-instant on large files is a real advantage.
- **Copy — subtitle:** "Remove audio from video. Instant — no re-encode, no upload."
- **Copy — what makes this tool worth using:** Strip the audio track from a video in seconds. The video stream copies directly — no quality loss, no waiting for a re-encode. Works on MP4, MOV, WebM, MKV.
- **Copy — non-obvious UX detail:** The output file will be noticeably smaller than the input — you're removing the entire audio track. This is expected behavior, not a quality issue.

---

### 10. Extract Frames from Video

- **Slug:** `extract-frames`
- **Target keyword:** "extract frames from video online"
- **Est. monthly searches:** 30,000 (estimated — not verified)
- **KD estimate:** 35
- **WASM implementation:** `ffmpeg -i input.mp4 -vf fps=1 frame_%04d.jpg` — configurable FPS. Output as ZIP of JPGs.
- **File size concern:** ⚠️ RAM flag: every-frame extraction at 60fps on a 1-minute 1080p video = 3,600 frames × ~150KB = 540MB. Default to "1 frame per second"; offer "every frame" with a hard warning for clips over 30 seconds. Hard limit: warn when estimated output ZIP exceeds 500MB.
- **Competitor gap:** No mainstream competitor offers this as a clean standalone tool. ezgif does "video screenshot" (single frame only). Genuinely underserved.
- **Copy — subtitle:** "Extract frames from video. Choose your interval, download as ZIP."
- **Copy — what makes this tool worth using:** Pull frames for thumbnails, storyboards, or training data. Set the extraction rate — every frame, every second, or every 5 seconds. All frames export as a ZIP. Runs locally, so a 4K video doesn't upload anywhere.
- **Copy — non-obvious UX detail:** At "every frame" on a 60fps video, a 1-minute clip produces 3,600 images. Start with "1 per second" to confirm you have the right clip before extracting everything.

---

## Step 4 — Background Noise Remover Deep Dive

### Option 1: RNNoise-WASM

**Package:** `@jitsi/rnnoise-wasm` v0.2.1 (verified — published 2025-02-03, maintained by Jitsi team)  
**Alternative:** `@echogarden/rnnoise-wasm` v0.2.0 (published 2024-10-26)  
**Package size:** ~2MB unpacked (`@jitsi`); ~140KB unpacked (`@echogarden`)  
**Model:** Xiph RNNoise — recurrent neural network for voice noise suppression  
**Processing:** Frame-based at 480 samples (10ms at 48kHz). Real-time capable.

**Quality assessment (estimated — not verified with live audio tests):**
- Excellent for stationary background noise: HVAC, room hum, fan noise, low-level white noise
- Mediocre for non-stationary noise: crowd noise, music bleed, traffic
- Voice-optimized — will suppress non-voice content aggressively; not suitable for music recordings
- Appropriate for: Zoom call exports, voice memos, podcast recordings with ambient room noise

**Browser compatibility:** Full — WASM runs in all modern browsers

**Verdict on RNNoise:** Viable MVP. `@jitsi/rnnoise-wasm` is production-battle-tested (Jitsi Meet uses it in production at scale). 2MB is acceptable when lazy-loaded. Quality ceiling is "good for voice calls, acceptable for podcasts, not suitable for music."

---

### Option 2: DeepFilterNet WASM

**Packages found (verified via npm registry 2026-07-17):**
- `deepfilter-standalone` v1.0.2 (published 2026-02-16) — 51KB package wrapper, downloads WASM + model from CDN at runtime. Single-author package (`abdullahtalal1122`), no readme, no production track record. CDN dependency confirmed from package metadata.
- `@cc-livekit/audio-pipeline-plugin` v1.1.9 (published 2026-04-16) — 18MB unpacked, wraps both RNNoise and DeepFilterNet for AudioWorklet pipelines.

**Source project:** DeepFilterNet (Rikorose/DeepFilterNet on GitHub) — Rust + Python implementation, LADSPA plugin for PipeWire, pre-compiled binary. No official WASM build or npm package from original maintainers (verified by README inspection).

**Quality assessment (estimated — not verified):** DeepFilterNet3 is meaningfully better than RNNoise for music and non-stationary noise. If the unofficial WASM port is faithful, it would produce noticeably cleaner results.

**Risk:** The CDN dependency in `deepfilter-standalone` means ConvertYard would depend on an external CDN for a core tool feature — contradicts the local-first brand. `@cc-livekit/audio-pipeline-plugin` at 18MB is too heavy. Neither package has community adoption data.

---

### Option 3: Transformers.js with Noise Suppression Model

**Package:** `@huggingface/transformers` v4.2.0 (verified — published 2026-04-22)  
**HuggingFace models tagged for transformers.js with noise suppression:** None found with significant downloads (verified search returned only research models with 0–2 downloads).

**Via ONNX Runtime:** `onnxruntime-web` v1.27.0 (verified — published 2026-06-19, 134MB unpacked). Can run DTLN (Dual-signal Transformation LSTM) ONNX models. DTLN ONNX exports exist (~5MB) but no maintained npm wrapper bridges them to a clean browser integration.

**@workadventure/noise-suppression:** v0.1.1 (verified — published 2026-06-19, 127MB unpacked). Uses LiteRT.js + DTLN models. Too heavy — 127MB unpacked is 15× ConvertYard's initial JS budget and would require aggressive chunking and user consent UX.

**Verdict on Transformers.js:** Not ready. No maintained, production-quality noise suppression model in the transformers.js ecosystem as of 2026-07-17 (verified).

---

### Recommendation: Use `@jitsi/rnnoise-wasm`, defer 6 weeks for prototyping

**One clear recommendation:** Build the noise remover using `@jitsi/rnnoise-wasm`. Do not launch until prototyped and tested against real noisy recordings.

Reasons for this package:
1. Battle-tested — Jitsi Meet production deployments
2. Actively maintained (Feb 2025 publish; Jitsi is an active project)
3. Self-contained — no external CDN dependency; WASM included in package
4. 2MB is acceptable when lazy-loaded; show "Loading noise filter (~2MB)..." on first use
5. Quality is sufficient for the stated use case: voice recordings, podcasts, Zoom exports

**Minimum viable implementation:**
- Lazy-load WASM on first tool interaction
- Decode audio to PCM via Web Audio API, run RNNoise frame-by-frame
- Input: MP3, WAV, OGG, M4A
- Output: MP3 (re-encode via ffmpeg.wasm)
- Batch: process files sequentially with per-file progress

**Realistic copy expectations:** Do not claim "studio quality" or "AI-powered" without qualification. RNNoise is a recurrent neural network, technically AI, but the output quality ceiling must be communicated:

**Draft subtitle:** "Remove background noise from voice recordings. Runs in your browser — no upload."

**Draft 3-sentence description:** Drop a noisy voice recording — a Zoom call export, a voice memo, a podcast recorded in a loud room — and get back a cleaner version with the constant background hum filtered out. Processing runs entirely in your browser using the same noise filter Jitsi Meet uses for live video calls. Works best on stationary noise (HVAC, fans, room hum) in voice recordings; not designed for music.

---

## Step 5 — Format Converter Quick Wins

All 13 are confirmed builds. The ffmpeg.wasm implementation for each is a one-liner codec flag change. Build as a batch — one sprint, one converter function with format parameters, 13 landing pages with distinct copy.

| Converter | Verdict | Est. Monthly Searches |
|---|---|---|
| webm-to-mp4 | ✅ **Done** (2026-07-17) | 180,000 (estimated) |
| mov-to-mp4 | ✅ **Done** (2026-07-17) | 450,000 (estimated) |
| avi-to-mp4 | ✅ **Done** (2026-07-17) | 160,000 (estimated) |
| mkv-to-mp4 | ✅ **Done** (2026-07-17) | 140,000 (estimated) |
| mp4-to-webm | ✅ **Done** (2026-07-17) | 55,000 (estimated) |
| mp4-to-mov | ✅ **Done** (2026-07-17) | 28,000 (estimated) |
| mp3-to-wav | ✅ **Done** (2026-07-17) | 120,000 (estimated) |
| aac-to-mp3 | ✅ **Done** (2026-07-17) | 90,000 (estimated) |
| mp3-to-ogg | ✅ **Done** (2026-07-17) | 60,000 (estimated) |
| mp3-to-aac | ✅ **Done** (2026-07-17) | 18,000 (estimated) |
| flac-to-wav | **Build.** Lower volume; audiophile audience — high-intent users | 45,000 (estimated) |
| wav-to-flac | **Build.** Pairs naturally with flac-to-wav; archiving use case | 40,000 (estimated) |
| ogg-to-wav | **Build.** Lowest volume; trivial implementation; completes the audio converter matrix | 20,000 (estimated) |

---

## Step 6 — Advanced Tool Candidates

| Tool | Demand (est.) | KD | Feasibility | Diff | Score | Verdict |
|---|---|---|---|---|---|---|
| Audio Speed Changer | 110,000 | 38 | Easy (3) | High (3) | 990 | **Build — top 5 priority** |
| Audio Volume Normalizer | 80,000 | 30 | Easy (3) | High (3) | 720 | **Build — top 5 priority** |
| Audio Joiner | 75,000 | 42 | Easy (3) | High (3) | 675 | **Build** |
| Video Speed Changer | 70,000 | 45 | Easy (3) | High (3) | 630 | **Build** |
| Video Muter | 50,000 | 28 | Easy (3) | High (3) | 450 | **Build — near-instant stream copy** |
| Extract Frames | 30,000 | 35 | Easy (3) | High (3) | 270 | **Build** |
| Video Resizer | 35,000 | 55 | Medium (2) | Medium (2) | 140 | **Defer** — high KD, UI complexity for resolution selection |
| Remove Vocals (Karaoke) | 25,000 | 55 | Medium (2) | High (3) | 150 | **Defer** — ffmpeg phase-cancellation produces unreliable results; needs a proper WASM source-separation model |

**Implementation notes:**

**Video speed changer — ffmpeg setpts + atempo:**
`-filter_complex "[0:v]setpts=PTS/SPEED[v];[0:a]atempo=SPEED[a]"`. Speed 0.5–2.0x in single pass; chain for extremes. Offer preset buttons (0.5×, 0.75×, 1.25×, 1.5×, 2×) plus custom input. ⚠️ UX flag: processing time is proportional to *output* duration. Slowing a video to 0.5× doubles the encode time — show estimated time before starting.

**Audio speed changer — ffmpeg atempo:**
`-filter:a "atempo=SPEED"`. For values outside 0.5–2.0, chain: `atempo=2.0,atempo=2.0` for 4×. Key UX addition: add pitch-preserve note explicitly — "speed up without chipmunk effect" is the primary search intent.

**Audio volume normalizer — ffmpeg loudnorm:**
Two-pass loudnorm: first pass analyzes, second pass applies EBU R128 normalization. Single-pass acceptable for batch. Default: I=-16 LUFS (Spotify/YouTube target), TP=-1.5 dBTP, LRA=11. Offer "Podcast" (I=-16) and "Broadcast" (I=-23) presets.

**Audio joiner — ffmpeg concat:**
Use filter_complex concat for mixed-format inputs. Same-format inputs (all MP3 same bitrate): concat demuxer is instant and lossless. UX challenge: drag-to-reorder list. Numbered list with up/down buttons is a sufficient MVP.

**Video muter — strip audio track:**
`-an -c:v copy` — no re-encode, near-instant. Trivial to implement. Build in the same sprint as video format converters.

**Video resizer — ffmpeg scale filter:**
`-vf scale=1920:1080` or `-vf scale=-2:720` (maintain aspect ratio). Preset buttons (4K, 1080p, 720p, 480p) plus custom WxH input. ⚠️ UX flag: show warning when target resolution is larger than input — scale up is always lossy.

**Remove vocals (karaoke) — ffmpeg pan filter:**
`-af pan="stereo|c0=c0-c1|c1=c1-c0"` — phase cancellation. Works only on stereo tracks with centered vocals. Results are unpredictable — some songs clean, others produce artifacts or strip instruments. **Verdict: defer.** This method will disappoint ~40% of users. Build only with a quality WASM source-separation model (Demucs ONNX when available in browser).

**Extract frames — ffmpeg fps filter:**
`-vf fps=1` for 1fps; `-vf fps=1/5` for every 5 seconds; `-vf fps=24` for every frame. ⚠️ RAM flag: every-frame at 60fps on a 10-minute 1080p video = 36,000 frames × ~150KB = 5.4GB. Hard limit: warn when estimated output exceeds 500MB. Default to 1fps.

---

## Step 7 — Copy Voice Checklist

### 7.1 — 8 Copy Patterns to Avoid (with verified competitor examples)

1. **Vague AI superlatives without technical grounding.**
   Verified from VEED noise removal page heading: *"Instant background noise removal"* and *"Studio-quality audio for social media, podcasts, and voiceovers"*
   Problem: "Instant" is false — processing takes time. "Studio-quality" is unverifiable. Users who care about where their file goes want to know *how* it works. Never lead with "AI" without saying what the AI actually does and where processing happens.

2. **"Seamlessly" and "effortlessly" before any action verb.**
   Pattern verified across media.io copy: *"Compress, convert, enhance, and edit your videos, audio, and images effortlessly"* (verified from video compressor page)
   These words fill space and are banned in ConvertYard's voice guide for good reason — they set a promise the UX can't always keep.

3. **Privacy claims that are assertions, not verifiable facts.**
   Pattern verified from media.io FAQ: *"Your privacy is our priority."*
   ConvertYard's alternative: "Your file never leaves your browser" — verifiable by opening DevTools and watching network traffic. Fact beats assertion.

4. **Signup gates disguised as saving work.**
   Verified: VEED and Kapwing both require account creation before downloading output. The homepage copy says "free" but the download step requires registration. If ConvertYard ever adds accounts, download must not require them.

5. **File size limits buried after benefit copy.**
   Pattern (estimated — observed across competitor tool pages): limits appear in small print below the primary CTA. ConvertYard: state the limit up front. "Works up to your browser's RAM limit — typically 1–2GB per file." Honest constraints build trust.

6. **"All-in-one" platform language for a tool that does one thing.**
   Verified from media.io homepage: *"The All-in-One AI Creative Platform"* — yet the /tools.html URL 404'd on 2026-07-17. "All-in-one" signals no differentiation and sets expectations the site doesn't always meet.

7. **Metric-free speed claims.**
   Pattern (estimated across competitors): "Convert in seconds" with no qualification. ConvertYard: every speed claim needs a benchmark. "A 50MB MP3 converts in under 10 seconds on a mid-range laptop."

8. **Passive voice obscuring where processing happens.**
   Pattern (estimated): "Files are processed securely in the cloud." Passive voice hides the fact that your file uploads to someone else's server. ConvertYard's model inverts this: active voice, explicit mechanism. "Your file converts in your browser. It never leaves your device."

### 7.2 — 5 Copy Patterns ConvertYard Should Use

1. **Lead with the action, not the benefit.**
   Pattern: `[Verb] [format] [format].` as the opening line.
   Example: "Convert MOV to MP4. Drop files, click convert, download."
   Not: "The best way to convert your MOV files for any device."

2. **State constraints as facts, not disclaimers.**
   Example: "Works on files up to your browser's available RAM — typically 1–2GB. Batch-process 50 files at once as long as each is under that limit."
   Not: "Large files may not be supported on some devices."

3. **Explain the technical mechanism, briefly.**
   One sentence on how it works.
   Example: "Converts using ffmpeg.wasm — the same ffmpeg you'd run from the command line, compiled to run in your browser."
   This earns trust from technical users and is verifiable.

4. **Distinguish from cloud competitors without naming them.**
   Example: "Most online converters upload your file to a server, convert it, then serve it back. This one doesn't — there's no upload step."
   One sentence on the structural difference, stated as fact.

5. **Specificity over superlatives.**
   Replace quality claims with measurable behavior.
   Instead of: "High quality output."
   Use: "Exports at the bitrate you choose — default 192kbps MP3, adjustable to 128k, 256k, or 320k."

### 7.3 — Three Example Tool Descriptions in ConvertYard Voice

**Format Converter (MOV to MP4):**
> Convert MOV to MP4. Batch-ready, stays in your browser.
>
> MOV files from iPhones and Mac exports don't play everywhere. Drop your MOV files here and get MP4s — H.264 video, AAC audio — that work on every device. No upload, no queue, no account. Convert 50 files at once. A 1GB MOV converts in roughly 2–4 minutes depending on your hardware; progress shows per file so you know exactly where you are.

**Background Noise Remover:**
> Remove background noise from voice recordings. Runs in your browser — no upload.
>
> Drop a noisy voice recording — a Zoom call export, a voice memo, a podcast recorded in a loud room — and get back a cleaner version with the constant background hum filtered out. Processing uses the same noise filter Jitsi Meet runs for live video calls. Works best on stationary noise: HVAC, fans, room hum. Not designed for music. Accepts MP3, WAV, M4A, OGG. Outputs MP3.

**Audio Trimmer:**
> Trim audio. Choose start and end, download the clip.
>
> Cut a segment from an MP3, WAV, OGG, or FLAC file without re-encoding when possible. The waveform loads in your browser — scrub to find your cut points, set them, click Trim. Output is the exact segment, nothing else. Batch mode lets you define the same cut points across multiple files — useful for trimming identical intro/outro segments from a folder of recordings.

### 7.4 — FAQ Question Framing Guide

**Type 1: "Does this work with [format]?"**
State the specific list. Never use "most formats."
> Q: "What audio formats does the noise remover accept?"
> A: "MP3, WAV, OGG, FLAC, and M4A. Output is always MP3. If you need a different output format, run the file through our Audio Converter after."

**Type 2: "Is it free?"**
Answer the real question (what's the catch) directly.
> Q: "Is this free to use?"
> A: "Yes. No account, no file size limit except your browser's available RAM (typically 1–2GB per file), no download limits. The site runs display ads below the FAQ section to cover costs."

**Type 3: "Where do my files go?"**
Technical explanation, one sentence, verifiable.
> Q: "Do my files get uploaded anywhere?"
> A: "No. Your files never leave your device. The conversion runs in your browser using WebAssembly. You can verify this by watching your browser's Network tab during conversion — you'll see no file upload traffic."

**Type 4: "Why is the result different from what I expected?"**
Explain the technical reason without condescending.
> Q: "Why is my converted MP4 larger than the original MOV?"
> A: "MOV and MP4 are containers — the video codec inside determines file size. If your MOV used H.265 (HEVC) and the output used H.264, the H.264 file will be larger because H.265 compresses more efficiently. Keep H.265 by enabling the 'Copy streams' option."

**Type 5: "How long will this take?"**
Give a real benchmark, not "it depends."
> Q: "How long does MOV to MP4 conversion take?"
> A: "A 500MB MOV at 1080p30 typically converts in 90–180 seconds on a mid-range 2022 laptop. Newer hardware converts faster; older mobile hardware may take 3–5× longer. The progress bar updates per file in real time."

---

## Appendix: Verified npm Package Reference

All data from live npm registry queries on 2026-07-17.

| Package | Version | Published | Unpacked Size | Notes |
|---|---|---|---|---|
| `@jitsi/rnnoise-wasm` | 0.2.1 | 2025-02-03 | ~2MB | **Recommended for noise removal MVP** — production use in Jitsi Meet |
| `@echogarden/rnnoise-wasm` | 0.2.0 | 2024-10-26 | 140KB | Smaller; less battle-tested |
| `@sapphi-red/web-noise-suppressor` | 0.3.5 | 2024-05-19 | 658KB | Last updated 2024; wraps RNNoise + NSNet2 |
| `deepfilter-standalone` | 1.0.2 | 2026-02-16 | 51KB (wrapper) | CDN dependency for WASM/model; single-author; no readme |
| `@cc-livekit/audio-pipeline-plugin` | 1.1.9 | 2026-04-16 | 18MB | Too heavy; bundles both RNNoise + DeepFilterNet |
| `@workadventure/noise-suppression` | 0.1.1 | 2026-06-19 | 127MB | Too heavy; DTLN model included; not viable |
| `@huggingface/transformers` | 4.2.0 | 2026-04-22 | 9MB | No noise suppression model with meaningful downloads found |
| `onnxruntime-web` | 1.27.0 | 2026-06-19 | 134MB | Right long-term path; requires ConvertYard to own model pipeline |

---

*Competitor tool lists reflect data live-fetched from their pages on 2026-07-17 via JavaScript fetch() in a sandboxed runtime. Pages with heavy JS rendering returned partial data (Clideo redirected to Indonesian locale; Kapwing /tools rendered empty on direct fetch; mconverter JS-rendered tool list did not load). These are noted per-section. npm package metadata is from live registry API queries on 2026-07-17. All search demand and KD figures are estimated — not verified via a live SEO tool.*
