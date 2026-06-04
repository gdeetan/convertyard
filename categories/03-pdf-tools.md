# Cluster 03 — PDF Tools

## Seed keyword

**Primary seed:** `pdf converter`

Hub page targets this. Individual PDF tools target specific
operations (merge, split, compress, etc.).

**Why this seed:** Captures the broad category. Be realistic — head
PDF terms are owned by iLovePDF, SmallPDF, PDF24, Adobe. Compete on
the wedge (local-first) rather than trying to outrank on volume.

**Alternate seed worth considering:** `local pdf converter` or
`offline pdf tools` — much lower volume but aligned with the wedge
and the SERPs are wide open.

## Secondary anchor keywords

- `merge pdf` (~200K vol, KD ~60)
- `compress pdf` (~150K vol, KD ~60)
- `pdf to jpg` (~100K vol, KD ~55)
- `jpg to pdf` (~120K vol, KD ~55)
- `pdf to word` (~300K vol, KD ~70)
- `split pdf` (~80K vol, KD ~55)

## Cluster priority

**#3** — Build after image clusters. PDF is the most competitive
category online but the local-first angle is *especially* compelling
here (contracts, medical records, financials).

## Cluster traffic estimate at maturity

**20,000–30,000 monthly visits**

Realistic ceiling. Head terms dominated by incumbents; we win on the
medium-tail with privacy positioning.

## Tools to build (12)

| Tool | Slug | Target keyword | Est. volume | KD |
|---|---|---|---|---|
| Merge PDF | merge-pdf | merge pdf | 200K | 60 |
| Split PDF | split-pdf | split pdf | 80K | 55 |
| Compress PDF | compress-pdf | compress pdf | 150K | 60 |
| PDF to JPG | pdf-to-jpg | pdf to jpg | 100K | 55 |
| JPG to PDF | jpg-to-pdf | jpg to pdf | 120K | 55 |
| PDF to Word | pdf-to-word | pdf to word | 300K | 70 |
| Word to PDF | word-to-pdf | word to pdf | 200K | 65 |
| Rotate PDF pages | rotate-pdf | rotate pdf | 30K | 45 |
| Reorder PDF pages | reorder-pdf-pages | reorder pdf pages | 5K | 30 |
| PDF redaction (real) | redact-pdf | redact pdf | 8K | 35 |
| PDF to CSV (tables) | pdf-to-csv | pdf to csv | 6K | 35 |
| Fill PDF forms | fill-pdf-form | fill pdf form | 15K | 45 |

## Build order

1. Merge PDF (highest-volume "easy" PDF task)
2. Compress PDF
3. PDF to JPG
4. JPG to PDF
5. Split PDF
6. Rotate PDF
7. PDF redaction (high differentiation — true redaction, not black boxes)
8. PDF to CSV (underserved, high-value)
9. Reorder pages
10. Fill PDF forms
11. PDF to Word (hard, save for later — use mupdf-wasm)
12. Word to PDF (requires more complex rendering)

## Supporting articles (10)

| Article | Target long-tail | Est. vol | KD |
|---|---|---|---|
| How to redact a PDF so data is gone | "true pdf redaction" | 500 | 20 |
| Local PDF tools for sensitive documents | "offline pdf tools" | 1K | 25 |
| PDF compression compared | "compress pdf without losing quality" | 3K | 35 |
| How to extract tables from PDF to Excel | "extract table from pdf" | 5K | 40 |
| Why not to upload contracts to free PDF tools | "are online pdf tools safe" | 800 | 25 |
| Legal/medical PDF workflow guide | "secure pdf tools" | 600 | 20 |
| PDF to Word: what preserves formatting | "best pdf to word converter" | 8K | 50 |
| How to merge 100 PDFs in order | "merge multiple pdfs order" | 2K | 30 |
| Batch PDF compression for email | "compress pdf for email" | 4K | 35 |
| Filling and flattening PDF forms | "flatten pdf form" | 1K | 25 |

## Internal linking strategy

- Every PDF tool links to 3 sibling PDF tools
- Image-to-PDF and PDF-to-image link cross-cluster to Image Conversion
- Cluster hub `/pdf-converter` aggregates all 12
- Strong "trust" content (redaction, secure workflows) cross-links to
  the homepage wedge explanation

## Wedge-specific notes

- **Local-first matters most in this cluster.** Audience includes
  lawyers, doctors, accountants, HR professionals handling confidential
  documents. The "we never see your file" pitch is uniquely powerful here.
- **PDF redaction is the killer differentiator.** Most free tools draw
  black rectangles over text — the underlying text is still extractable.
  True redaction (removing the actual text/image data) is rare and
  high-trust. Lead with this.
- **PDF to CSV (table extraction)** is severely underserved. Data
  analysts manually re-key tables every day. A clean tool here gets
  shared in Slack/Twitter.
- Use pdf-lib for simple operations, mupdf-wasm for complex rendering
  and conversion.

## SERP context

- Head terms: iLovePDF, SmallPDF, PDF24, Adobe own page 1 — unrealistic
  to displace in <2 years
- Medium-tail "secure" / "local" / "private" / "without upload" terms
  much softer SERPs
- "PDF to CSV" and "true PDF redaction" are genuine gaps in the market

## Watch list

- WASM PDF libraries are improving fast — re-benchmark every 3 months
- AI-powered PDF tools (semantic search, summarization) are emerging —
  belongs in Cluster 07 (AI Tools), not here
