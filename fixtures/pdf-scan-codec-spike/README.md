# PDF scan-codec spike fixtures

Public-domain / government scanned PDFs for the JBIG2 + CCITT Group 4
feasibility spike. All files are actual bitmap-page scans (verified by
presence of `/JBIG2Decode`, `/CCITTFaxDecode`, or `/JPXDecode` filters).

Do not commit binaries into any code path; these live under `fixtures/`
for local use only.

**Only files ≤25 MB are tracked in git** (see `.gitignore` rules). Larger
fixtures must be re-downloaded from the source URLs below on a fresh
clone. Run `spike/scripts/fetch-fixtures.sh` (not yet written) or
manually curl the URLs to reconstitute.

| File | Source URL | License | Pages (approx) | Size | Dominant type | Scan confidence |
|------|-----------|---------|----------------|------|---------------|-----------------|
| `public-bitonal-certificate.pdf` | https://www.irs.gov/pub/irs-prior/f1040--1990.pdf | US federal government work — public domain | 2 | 0.53 MB | Bitonal (CCITTFaxDecode / Group 4) | HIGH — `/CCITTFaxDecode` present |
| `public-grayscale-contract.pdf` | https://archive.org/download/reportofcommissi00unit_5/reportofcommissi00unit_5.pdf | Pre-1928 US gov commission report — public domain | 60 | 5.29 MB | Grayscale scan (JBIG2 + JPX pages) | HIGH — `/JBIG2Decode` + `/JPXDecode` present |
| `public-color-mixed.pdf` | https://archive.org/download/sim_popular-science_1958-01_172_1/sim_popular-science_1958-01_172_1.pdf | Popular Science 1958 issue — archive.org (public domain per pre-1964 non-renewal) | 270 | 73.74 MB | Color magazine scan (JPX + JBIG2 mix) | HIGH — mixed scan filters, 273 KB/page |
| `public-already-jbig2.pdf` | https://archive.org/download/poemsofalfredten00tenn/poemsofalfredten00tenn_bw.pdf | Tennyson poems, archive.org `_bw.pdf` B&W scan — public domain | 494 | 40.26 MB | Bitonal book scan already encoded as JBIG2 | HIGH — `/JBIG2Decode` present |
| `public-large-500p.pdf` | https://archive.org/download/warandpeace030164mbp/warandpeace030164mbp.pdf | War and Peace (Tolstoy, pre-1928 English translation) — public domain | 725 | 88.18 MB | Bitonal/grayscale book scan (JBIG2) | HIGH — `/JBIG2Decode`, 122 KB/page |

## Verification

Run:

```
npx tsx spike/scripts/inspect-fixtures.ts
```

Real scans should show >100 KB/page or `/JBIG2Decode` / `/CCITTFaxDecode`
filters. All five fixtures above satisfy the codec check (bytes/page is
lower on JBIG2-encoded files precisely because JBIG2 compresses
aggressively; the filter presence is the primary signal).

## Notes on sourcing

- Archive.org intermittently returned 401/403/503 for `_bw.pdf`
  variants on several items during collection; the ones listed above
  downloaded cleanly via the `iaNNNNNN.us.archive.org` datanode hosts.
- No fixture was synthesized. Files were downloaded as-is from their
  upstream sources listed in the table.
- Large fixture stayed under the 100 MB cap (88 MB). No deferral was
  required.
