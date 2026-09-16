# PDF scan-codec measurement report

Generated: 2026-09-16T08:20:27Z
Host: Linux 6.17.0-1022-azure
Tool versions:
  - jbig2enc: jbig2enc 0.32
  - tiffcp:   LIBTIFF, Version 4.5.1
  - pdfimages: pdfimages version 24.02.0

## Per-fixture results

### public-already-jbig2.pdf

- Original PDF: 40259035 bytes (39315 KB), 494 pages
- Extracted images (native): 144 files, 1632887102 bytes
- Extracted images (tif): 144 files, 582146224 bytes

| Codec | Total bytes | Ratio vs tif | Ratio vs orig | Encode ms | Notes |
|---|---|---|---|---|---|
| CCITT G4 (tiffcp) | 3653544 | 0.01x | 0.09x | 874 | 97 files failed |
| JBIG2 lossless (jbig2enc) | 0
0 | 0.00x | 0.00x | 23 | |
| JBIG2 lossy (-s -t 0.85) | 2800699 | 0.00x | 0.07x | 10457 | |

### public-bitonal-certificate.pdf

- Original PDF: 526254 bytes (513 KB), 2 pages
- Extracted images (native): 2 files, 3090481 bytes
- Extracted images (tif): 2 files, 3093192 bytes

| Codec | Total bytes | Ratio vs tif | Ratio vs orig | Encode ms | Notes |
|---|---|---|---|---|---|
| CCITT G4 (tiffcp) | 573632 | 0.19x | 1.09x | 54 | 0 files failed |
| JBIG2 lossless (jbig2enc) | 0
0 | 0.00x | 0.00x | 68 | |
| JBIG2 lossy (-s -t 0.85) | 286651 | 0.09x | 0.54x | 689 | |

### public-color-mixed.pdf

- Original PDF: 73740339 bytes (72012 KB), 270 pages
- Extracted images (native): 150 files, 2681785092 bytes
- Extracted images (tif): 150 files, 931246632 bytes

| Codec | Total bytes | Ratio vs tif | Ratio vs orig | Encode ms | Notes |
|---|---|---|---|---|---|
| CCITT G4 (tiffcp) | 6148202 | 0.01x | 0.08x | 1127 | 100 files failed |
| JBIG2 lossless (jbig2enc) | 0
0 | 0.00x | 0.00x | 89 | |
| JBIG2 lossy (-s -t 0.85) | 9055970 | 0.01x | 0.12x | 337303 | |

### public-grayscale-contract.pdf

- Original PDF: 5287376 bytes (5163 KB), 60 pages
- Extracted images (native): 150 files, 1953662848 bytes
- Extracted images (tif): 150 files, 1955214344 bytes

| Codec | Total bytes | Ratio vs tif | Ratio vs orig | Encode ms | Notes |
|---|---|---|---|---|---|
| CCITT G4 (tiffcp) | 6512346 | 0.00x | 1.23x | 1032 | 100 files failed |
| JBIG2 lossless (jbig2enc) | 0
0 | 0.00x | 0.00x | 23 | |
| JBIG2 lossy (-s -t 0.85) | 3581147 | 0.00x | 0.68x | 18043 | |

### public-large-500p.pdf

- Original PDF: 88176782 bytes (86110 KB), 725 pages
- Extracted images (native): 50 files, 129502100 bytes
- Extracted images (tif): 50 files, 129608600 bytes

| Codec | Total bytes | Ratio vs tif | Ratio vs orig | Encode ms | Notes |
|---|---|---|---|---|---|
| CCITT G4 (tiffcp) | 7133008 | 0.06x | 0.08x | 967 | 0 files failed |
| JBIG2 lossless (jbig2enc) | 0
0 | 0.00x | 0.00x | 90 | |
| JBIG2 lossy (-s -t 0.85) | 2506565 | 0.02x | 0.03x | 34264 | |

## Interpretation notes

- **Extracted images (tif)** is the fair 'raw' baseline for re-encode comparison.
- **Ratio vs orig** compares encoded-only-images to full PDF file size (includes text layer, metadata, structure).
- CCITT G4 failures usually mean the source page was grayscale or color (tiffcp -c g4 requires 1-bit).
- JBIG2 lossy uses default symbol-substitution threshold 0.85. Higher = more aggressive.
- Timings include all pages in the fixture — divide by page count for per-page average.

