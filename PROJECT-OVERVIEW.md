# ConvertYard — Project Overview

## What this is

ConvertYard is a network of browser-based, local-first file conversion
and utility tool pages. The wedge is **local-first batch processing**:
all file handling happens client-side via WebAssembly, nothing uploads
to a server, and every tool is designed to handle large batches
(1000+ files).

## Brand

- **Name:** ConvertYard
- **Domain:** convertyard.com
- **Tagline:** Local-first conversion, built for batches.
- **Positioning:** The workshop for batch file conversion. The
  upload-free alternative to iLovePDF, Convertio, SmallPDF, remove.bg.

## Why this wedge

Most online converter sites are interchangeable: upload, convert,
download. They share three weaknesses:

1. They upload user files to servers (privacy concern, especially for
   PDFs, contracts, medical scans, personal photos)
2. They choke past 20 files or force one-by-one downloads
3. They are ad-choked and add signup walls

ConvertYard is built directly against those three failures. Local-only
processing (privacy), batch-first UX (scale), no signup or ads in tools
(trust).

## Target traffic

**Goal:** 100K monthly visits within 12–18 months.

**Approach:** Roughly 60 tools across 7 clusters + ~200 supporting
articles. Each cluster has a dedicated brief in `/categories/`.

**Combined cluster potential at maturity:** 111K–164K monthly visits.

## Tool clusters

See individual category briefs in `/categories/` for full detail:

1. **Image conversion** — JPG/PNG/WebP/AVIF/HEIC in all directions
2. **Image editing** — Resize, compress, crop, watermark, BG remove
3. **PDF tools** — Merge, split, compress, convert, redact
4. **Video & audio** — MP4/MP3 conversions, compression, trimming
5. **Developer utilities** — JSON, Base64, regex, encoding tools
6. **Web/brand utilities** — Favicons, OG images, QR, color tools
7. **AI-powered tools** — Alt text, BG removal, upscaling, transcription

## Stack

- **Framework:** Next.js (static export)
- **Hosting:** Cloudflare Pages (connected to GitHub)
- **Domain registrar:** Cloudflare Registrar
- **WASM libraries:** libvips, ffmpeg.wasm, pdf-lib, mupdf-wasm,
  transformers.js
- **Analytics:** Cloudflare Web Analytics

## Launch sequence

**Day-one homepage (12–15 tools):**

Images:
- HEIC to JPG (biggest single keyword, ~200K monthly volume)
- JPG to WebP (hero converter demo on homepage)
- PNG to WebP
- WebP to JPG
- Bulk image compressor
- Batch image resizer

PDF:
- Merge PDF
- Compress PDF
- PDF to JPG

Video/Audio:
- MP4 to MP3

Developer:
- JSON formatter
- Base64 encoder/decoder

AI:
- Alt text generator (batch)
- Background remover (batch)

**Months 2–6:** Ship roughly one new tool per week, plus 3–5 supporting
articles per tool. By month 6: ~40 tools live.

**Months 6–12:** Fill out remaining clusters, programmatic SEO for
format combinations, link building intensifies.

**Months 12–18:** Optimize top 30 pages, multilingual versions of
top 10 tools, push to 100K+ monthly visits.

## Marketing milestones

- **Month 3–4:** Product Hunt launch (main site)
- **Month 6:** Open-source converter components on GitHub for backlinks
- **Month 8:** Product Hunt launch (PDF tools or AI tools sub-launch)
- **Month 12:** Product Hunt launch (API or major version)

## Decisions locked

- Domain: convertyard.com ✓
- Tagline: "Local-first conversion, built for batches." ✓
- Hosting: Cloudflare Pages + GitHub ✓
- Stack: Next.js static export ✓
- Wedge: Local-first + batch ✓
- Tool count for launch: 12–15 ✓

## Decisions open

- Visual identity (color, type, logo direction)
- Whether to open-source converter components from day one or hold
- Whether to add a paid tier later (API access, higher batch limits)
- Multilingual rollout timing
