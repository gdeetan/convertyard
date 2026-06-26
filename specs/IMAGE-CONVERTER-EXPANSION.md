# Image Converter Expansion — Deployment Plan

**Date:** 2026-06-26  
**Goal:** Fill format gaps in ConvertYard's image converter lineup using low-competition keyword opportunities.

---

## Current Coverage

| From → To | JPG | PNG | WebP | AVIF | HEIC | BMP | TIFF | SVG | GIF | ICO |
|-----------|-----|-----|------|------|------|-----|------|-----|-----|-----|
| **JPG**   | —   | ❌  | ✅   | ✅   | —    | ❌  | ❌   | —   | ❌  | —   |
| **PNG**   | ❌  | —   | ✅   | ✅   | —    | ❌  | ❌   | —   | ❌  | ❌  |
| **WebP**  | ✅  | ✅  | —    | ❌   | —    | ❌  | ❌   | —   | ❌  | —   |
| **AVIF**  | ✅  | ✅  | ❌   | —    | —    | ❌  | ❌   | —   | ❌  | —   |
| **HEIC**  | ✅  | ✅  | ❌   | ❌   | —    | —   | —    | —   | —   | —   |
| **BMP**   | ❌  | ❌  | ❌   | ❌   | —    | —   | ❌   | —   | ❌  | —   |
| **TIFF**  | ❌  | ❌  | ❌   | ❌   | —    | ❌  | —    | —   | ❌  | —   |
| **SVG**   | ❌  | ❌  | ❌   | ❌   | —    | —   | —    | —   | —   | —   |
| **GIF**   | ❌  | ❌  | ❌   | ❌   | —    | —   | —    | —   | —   | —   |

✅ = live | ❌ = missing opportunity | — = not applicable or out of scope

---

## Keyword Opportunities by Competition Tier

### Tier 1 — Very Low Competition (ship first)

These formats are underserved. Competitors either don't have them or have poor UX. Quick wins.

| Tool Slug | Target Keyword | Est. Monthly Searches | Competition | Notes |
|-----------|---------------|----------------------|-------------|-------|
| `bmp-to-jpg` | "bmp to jpg" | 15K–30K | Very Low | Windows Paint output; users need JPG for web/email |
| `bmp-to-png` | "bmp to png" | 8K–15K | Very Low | Lossless alternative; same audience |
| `bmp-to-webp` | "bmp to webp" | 1K–3K | Very Low | Easy add once BMP pipeline exists |
| `tiff-to-jpg` | "tiff to jpg" | 20K–40K | Low | Photographers, scanners, medical imaging |
| `tiff-to-png` | "tiff to png" | 10K–20K | Low | Designers, print-to-web workflows |
| `png-to-ico` | "png to ico" | 15K–25K | Low | Developers making favicons without Figma |
| `ico-to-png` | "ico to png" | 5K–10K | Low | Extracting icons from Windows apps |
| `heic-to-webp` | "heic to webp" | 5K–12K | Low | HEIC coverage is thin; WebP is the web target |
| `avif-to-webp` | "avif to webp" | 1K–3K | Very Low | Emerging; first-mover advantage |
| `webp-to-avif` | "webp to avif" | 1K–3K | Very Low | Same |
| `gif-to-png` | "gif to png" | 8K–15K | Low | Extracting first frame or static version |
| `gif-to-webp` | "gif to webp" | 3K–8K | Very Low | Animated WebP support growing |

**Rationale:** BMP and TIFF are the biggest gaps — nobody builds for these formats because they're "old," but Windows users and photographers use them constantly. ICO converters are used daily by developers but most tools are terrible.

---

### Tier 2 — Low-Medium Competition (high volume, worth the fight)

| Tool Slug | Target Keyword | Est. Monthly Searches | Competition | Notes |
|-----------|---------------|----------------------|-------------|-------|
| `png-to-jpg` | "png to jpg" | 60K–120K | Medium | Massive volume; existing ToolShell infra makes this trivial to build |
| `jpg-to-png` | "jpg to png" | 40K–80K | Medium | Same; pair with png-to-jpg |
| `svg-to-png` | "svg to png" | 30K–60K | Medium | Designers export assets from Figma/Illustrator; high-intent |
| `svg-to-jpg` | "svg to jpg" | 15K–30K | Low-Med | Same audience |
| `tiff-to-webp` | "tiff to webp" | 3K–8K | Very Low | Easy add once TIFF pipeline exists |
| `tiff-to-avif` | "tiff to avif" | 1K–3K | Very Low | Same |
| `gif-to-jpg` | "gif to jpg" | 10K–20K | Low | Extract first frame as JPG |
| `gif-to-mp4` | "gif to mp4" | 20K–40K | Low-Med | Would require ffmpeg.wasm; video category |

**Note on `png-to-jpg` and `jpg-to-png`:** These look obvious but ConvertYard has been skipping them because of competition. The gap is real but the search volume is so large that even 1% market share is meaningful. Ship them as batch tools (same ToolShell pattern, trivial to implement).

---

### Tier 3 — Medium Competition (defer unless traffic grows)

| Tool Slug | Target Keyword | Est. Monthly Searches | Competition | Notes |
|-----------|---------------|----------------------|-------------|-------|
| `jpg-to-gif` | "jpg to gif" | 8K–15K | Medium | Low quality searches; not the audience we want |
| `png-to-gif` | "png to gif" | 5K–10K | Medium | Same |
| `svg-to-webp` | "svg to webp" | 2K–5K | Low | Easy once SVG pipeline exists |
| `bmp-to-avif` | "bmp to avif" | 500–1K | Very Low | Long tail; add after bmp-to-png ships |
| `heic-to-avif` | "heic to avif" | 2K–5K | Low | Makes sense once HEIC→WebP exists |

---

## Implementation Notes by Format

### BMP (Tier 1 — ship first)

**Library:** libvips-wasm (already in codebase) supports BMP read/write natively.  
**Converter pattern:** Copy `lib/converters/image.ts` pattern. BMP → `vips.jpegsave()` for JPG, `vips.pngsave()` for PNG, `vips.webpsave()` for WebP.  
**Tools to ship:** `bmp-to-jpg`, `bmp-to-png`, `bmp-to-webp`  
**Effort:** Low — 1 converter function handles all 3 targets.

### TIFF (Tier 1 — ship first)

**Library:** libvips-wasm reads multi-page TIFF. If multi-page, each page → separate output file (same as PDF to JPG pattern).  
**Nuance:** TIFF files from scanners are often 300+ DPI. The converter should preserve or let users set output DPI.  
**Tools to ship:** `tiff-to-jpg`, `tiff-to-png`, `tiff-to-webp`, `tiff-to-avif`  
**Effort:** Low-Medium — handle multi-page TIFFs gracefully.

### ICO (Tier 1)

**PNG → ICO:** ICO format is a container of multiple BMP/PNG sizes. Use a pure JS library (`icojs` or custom) to pack 16×16, 32×32, 48×48, 64×64, and 128×128 sizes from the input PNG.  
**ICO → PNG:** Extract largest size from ICO container. `icojs` handles parsing.  
**Effort:** Medium — needs a separate ICO library, not libvips.

### SVG (Tier 2)

**SVG → PNG/JPG:** Render via browser Canvas API — load SVG into an `<img>` tag, draw to canvas, export. No WASM needed. Handles most SVGs; complex filters or external refs may fail gracefully.  
**Nuance:** SVG is resolution-independent. Let users set output width/height (default: SVG's `viewBox` dimensions or 1024px wide).  
**Tools to ship:** `svg-to-png`, `svg-to-jpg`, `svg-to-webp`  
**Effort:** Medium — Canvas approach is clean but needs a resize option UI.

### GIF (Tier 1-2)

**Static output (gif-to-png, gif-to-jpg):** libvips reads GIF, extracts frame 0 as static image. Trivial.  
**Animated output (gif-to-webp):** libvips can write animated WebP from animated GIF. Check libvips-wasm animated write support.  
**GIF-to-MP4:** Requires ffmpeg.wasm — heavier, already used in video tools. Ship last.  
**Effort:** Low for static; Medium for animated.

### Missing WebP/AVIF pairs (Tier 1)

**heic-to-webp, avif-to-webp, webp-to-avif:** All trivially added to `lib/converters/image.ts` — libvips handles all these format pairs. Mostly config + new tool entry.  
**Effort:** Very Low — each is ~20 lines of converter + tool config.

### PNG ↔ JPG (Tier 2)

**Implementation:** Trivial — already have the infrastructure. `vips.jpegsave()` / `vips.pngsave()`.  
**Why we haven't shipped:** Competition from Squoosh, TinyPNG, etc. But ConvertYard's batch + local-first angle is differentiated. Ship them.  
**Effort:** Very Low.

---

## Recommended Ship Order

### Sprint 1 — Easy wins (1-2 days)
1. `png-to-jpg` + `jpg-to-png` — trivial, high volume
2. `heic-to-webp` — trivial, extends HEIC coverage
3. `avif-to-webp` + `webp-to-avif` — trivial, new format pairs
4. `bmp-to-jpg` + `bmp-to-png` + `bmp-to-webp` — one converter, 3 tools

### Sprint 2 — TIFF + GIF static (1-2 days)
5. `tiff-to-jpg` + `tiff-to-png` + `tiff-to-webp` — photographers target
6. `gif-to-png` + `gif-to-jpg` — simple first-frame extraction

### Sprint 3 — ICO + SVG (2-3 days)
7. `png-to-ico` + `ico-to-png` — needs icojs, medium effort
8. `svg-to-png` + `svg-to-jpg` — Canvas API approach

### Sprint 4 — Animated + long tail (2-3 days)
9. `gif-to-webp` (animated) — if libvips-wasm supports it
10. `tiff-to-avif`, `bmp-to-avif`, `heic-to-avif` — long-tail additions
11. `gif-to-mp4` — ffmpeg.wasm, separate video category

---

## Content Plan

For each new tool, write 3-5 supporting articles targeting long-tail keywords:
- "How to convert BMP to JPG without losing quality"
- "Why photographers should convert TIFF to PNG for web"
- "Convert SVG to PNG: preserving transparency"
- "Batch convert TIFF files — 1000 files at once"

Article content is the real SEO lever for low-competition terms — the tool pages rank quickly, but articles capture "how to" searches and build internal link equity.

---

## Tracking

Add to `content/tool-catalog.ts` as each tool ships. Update the table at the top of this doc to reflect live status.

**Target:** 30+ image tools live by end of Q3 2026.
