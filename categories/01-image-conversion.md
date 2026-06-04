# Cluster 01 — Image Conversion

## Seed keyword

**Primary seed:** `image converter`

This is the broadest anchor term for the cluster. The internal-linking
structure should point related pages back toward this and toward the
two highest-volume specific converters (HEIC to JPG, WebP to JPG).

**Why this seed:** It captures the category-level intent. The cluster's
identity is "the place to convert images." All specific converters
internally link to a hub page targeting this seed.

## Secondary anchor keywords

- `heic to jpg` (~200K vol, KD ~50)
- `webp to jpg` (~90K vol, KD ~50)
- `webp to png` (~60K vol, KD ~50)
- `jpg to webp` (~40K vol, KD ~60)
- `png to webp` (~30K vol, KD ~55)
- `avif to jpg` (~5K vol, KD ~35) — rising fast
- `jpg to avif` (~3K vol, KD ~35) — rising fast

## Cluster priority

**#1** — Build first. Biggest combined volume, wedge applies cleanly
(batch + local), same WASM engine ships every tool.

## Cluster traffic estimate at maturity

**30,000–40,000 monthly visits**

## Tools to build (15)

| Tool | Slug | Target keyword | Est. volume | KD |
|---|---|---|---|---|
| HEIC to JPG | heic-to-jpg | heic to jpg | 200K | 50 |
| HEIC to PNG | heic-to-png | heic to png | 20K | 35 |
| HEIC to WebP | heic-to-webp | heic to webp | 5K | 30 |
| JPG to WebP | jpg-to-webp | jpg to webp | 40K | 60 |
| PNG to WebP | png-to-webp | png to webp | 30K | 55 |
| WebP to JPG | webp-to-jpg | webp to jpg | 90K | 50 |
| WebP to PNG | webp-to-png | webp to png | 60K | 50 |
| JPG to AVIF | jpg-to-avif | jpg to avif | 3K | 35 |
| AVIF to JPG | avif-to-jpg | avif to jpg | 5K | 35 |
| PNG to AVIF | png-to-avif | png to avif | 2K | 30 |
| AVIF to PNG | avif-to-png | avif to png | 4K | 30 |
| WebP to AVIF | webp-to-avif | webp to avif | 1K | 25 |
| AVIF to WebP | avif-to-webp | avif to webp | 1K | 25 |
| SVG to PNG | svg-to-png | svg to png | 15K | 40 |
| PNG to SVG | png-to-svg | png to svg | 8K | 35 |

## Build order

1. JPG to WebP (hero converter for homepage demo)
2. HEIC to JPG (biggest single-keyword volume)
3. WebP to JPG (Safari pain, high intent)
4. PNG to WebP
5. WebP to PNG
6. AVIF cluster (jpg-to-avif, avif-to-jpg first — rising trajectory)
7. HEIC variants
8. SVG converters last

## Supporting articles (12)

Each links above-the-fold to its primary tool. Target long-tail KW
column shows the keyword the article ranks for.

| Article | Target long-tail | Est. vol | KD |
|---|---|---|---|
| WebP vs AVIF vs JPEG in 2026 | "webp vs avif" | 3K | 20 |
| Why is my WebP larger than my JPG | "why is webp larger than jpg" | 200 | 10 |
| Best WebP/AVIF quality settings | "best webp quality" | 300 | 20 |
| AVIF browser support in 2026 | "avif browser support" | 2K | 25 |
| Bulk convert images for WordPress | "convert images wordpress" | 500 | 25 |
| HEIC explained: iPhone's format | "what is heic" | 5K | 30 |
| Lossless vs lossy: when each makes sense | "lossless vs lossy" | 1K | 25 |
| Preserve EXIF when converting | "preserve exif convert" | 400 | 20 |
| ICC color profiles in WebP | "icc profile webp" | 200 | 15 |
| Complete guide to web image formats | "image formats for web" | 2K | 30 |
| Convert images locally vs cloud | "local image converter" | 300 | 15 |
| How to convert 1000 images without uploading | "batch convert images" | 1K | 25 |

## Internal linking strategy

- Every converter links to 3 sibling converters in the same format family
  (e.g., JPG to WebP links to PNG to WebP, WebP to JPG, JPG to AVIF)
- Every converter links to 2 supporting articles from the table above
- All converters link "up" to the cluster hub (`/image-converter`)
- Cluster hub links "down" to all 15 converters

## Wedge-specific notes

This is the most natural cluster for the local-first + batch wedge:

- Image conversion is the #1 reason people upload files to converters
  — privacy is genuinely at stake (personal photos, ID cards, medical
  scans)
- HEIC users in particular are converting iPhone photos that often
  contain location/face data
- Batch matters disproportionately: photographers, e-com sellers, and
  web devs regularly need 100+ image conversions at once
- Hero demo on homepage uses this cluster's flagship (JPG to WebP)

## SERP context

- Head terms (jpg-to-webp, png-to-webp) dominated by Convertio,
  CloudConvert, iLovePDF Image, Adobe — hard to displace
- Medium-tail (heic-to-png, avif variants) much weaker SERPs, winnable
- AVIF specifically is a "blue ocean" right now — KD will climb sharply
  through 2026–2027, so rank early

## Watch list

- AVIF adoption trajectory — search volume should 2–3x by late 2027
- WebP 2 / JPEG XL — if either gains real browser support, build
  converters within 30 days of the news
