# Task 3 — Library Survey: JBIG2 / CCITT G4 Encoders for the Browser

Spike: `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-design.md`
Branch: `spike/pdf-scan-codecs`
Date: 2026-09-16

Goal: identify libraries that could **encode** (not just decode) JBIG2
and/or CCITT Group 4 image streams inside a PDF, running entirely in the
browser via WASM. ConvertYard is static-hosted and never uploads user
files, so any candidate must ship its runtime to end users.

## Candidate matrix

| Candidate | Repo | License (SPDX) | Last activity | WASM build status | Encode / Decode | Maintenance | Notes |
|---|---|---|---|---|---|---|---|
| jbig2enc (upstream) | https://github.com/agl/jbig2enc | Apache-2.0 (COPYING); depends on Leptonica (BSD-2-Clause-ish) | 2026-09-01 (pushed) | No official WASM. No `*-wasm` fork found on GitHub search or npm. Buildable via Emscripten in principle (pure C++ + Leptonica, both portable). No known prior art shipped. | Encode (JBIG2 only) | Active — CI badges for autotools/msys2/meson/cmake all green; commits in 2026 | Requires Leptonica ≥ 1.74 as hard dep — must also cross-compile Leptonica (which itself pulls libpng/libjpeg/libtiff optionally; can be stripped). Known "refinement coding crashes Acrobat" bug — must default `-r` off. 77 stars, small footprint. Used by OCRmyPDF in prod (native). |
| mupdf.js (npm `mupdf`) | https://github.com/ArtifexSoftware/mupdf (mirror), https://www.npmjs.com/package/mupdf | AGPL-3.0-or-later (or commercial) | 2026-09-06 npm (`1.28.1`); upstream pushed 2026-09-15 | Ships as WASM on npm today (~14 MB unpacked). Encode entry points for JBIG2/G4 are **not** exposed in the JS API — the underlying native `mutool clean --compress-fonts` / `-c` flags accept `jbig2` and `fax` via C API `pdf_write_options.do_compress_images` + `image_recompress` hooks. Exposing them in JS would require patching `platform/wasm/lib/*.c` and rebuilding. | Both, natively; JS surface = decode + PDF read/write + limited image re-encode | Active — Artifex commercial project | AGPL is the blocker for us: ConvertYard ships the WASM to visitors, which is "distribution" and triggers AGPL's network-clause-adjacent viral terms. Would need Artifex commercial license. |
| libtiff via Emscripten | https://gitlab.com/libtiff/libtiff (upstream); forks: https://github.com/aviklai/libtiffjs, https://github.com/discere-os/libtiff.wasm, https://github.com/woohp/libtiff.wasm | libtiff (BSD-like, "MIT-CMU-ish"; SPDX `libtiff`) | upstream active; aviklai/libtiffjs 2023-01, discere-os 2025-10, woohp 2017 | No maintained npm package (`libtiff-wasm`, `tiff-wasm`, `@jsquash/tiff` all 404). All three forks are decode-first / read-focused; none expose G4 **encode** in JS. Emscripten build of libtiff with `--enable-ccitt` is straightforward — libtiff's `TIFFWriteEncodedStrip` with `COMPRESSION_CCITTFAX4` is battle-tested. Timebox ~1 day to produce a WASM that emits a `.tif` with G4-encoded strips; extracting the raw G4 bitstream is easy (strip has fixed header + Modified Modified READ payload). | Both natively; needs custom JS bindings to expose encode | Upstream active; browser forks dormant | Cleanest permissive-license path for **G4**. Does not help with JBIG2. Adds ~500 KB WASM. |
| Ghostscript (ps-wasm / laurentmmeyer fork) | https://github.com/ochachacha/ps-wasm, https://github.com/laurentmmeyer/ghostscript-pdf-compress.wasm | AGPL-3.0 (Ghostscript is Artifex AGPL) | ps-wasm: 2025-06; laurentmmeyer: 2026-01 | Working WASM (~10+ MB); Chrome-only per README | Both (Ghostscript writes PDFs with `/CCITTFaxDecode` and `/JBIG2Decode` filters via `-dPDFSETTINGS`) | ps-wasm semi-active; downstream fork dormant | AGPL — same blocker as MuPDF; needs commercial license from Artifex. Also huge binary. |
| pdfcpu (Go → WASM) | https://github.com/pdfcpu/pdfcpu; browser demos: https://github.com/wcchoi/go-wasm-pdfcpu (2024-07), https://github.com/LaserKaspar/go-wasm-pdfcpu (2024-05) | Apache-2.0 | pdfcpu upstream 2026-09-14; browser demos dormant since 2024 | Compiles to Go WASM (~10 MB `pdfcpu.wasm`); demo works in browser | **Neither** JBIG2 nor CCITT G4 encoding are implemented in pdfcpu's optimizer. pdfcpu can rewrite/optimize PDFs but re-encodes images only as JPEG/Flate/JPX. Source: pdfcpu `pkg/pdfcpu/model/write*.go` — no JBIG2 writer, no CCITTFaxEncode writer. | Active upstream, dormant demos | Not viable for scan-codec goal. |
| jbig2dec (Artifex) | https://github.com/ArtifexSoftware/jbig2dec | AGPL-3.0 | active | Decoder only. | Decode only | active | Not viable — no encoder. Listed for completeness because it shows up in searches. |
| jbig2-imageio / Rust `jbig2enc` crate | https://crates.io/crates/jbig2enc | (Rust wrapper of C jbig2enc; Apache-2.0 inherited) | 2024 | Rust → WASM viable in theory; wraps same C code (still needs Leptonica). No published wasm-pack npm artifact found. | Encode | Low signal | Same underlying code as agl/jbig2enc; the wrapper doesn't remove the Leptonica dependency. Marginal value over building the C directly. |

Sources spot-checked via GitHub REST API (pushed_at, license, archived) on
2026-09-16 and npm registry (`registry.npmjs.org`) for `mupdf`,
`libtiff-wasm`, `tiff-wasm`, `jbig2-wasm`, `jbig2`, `jbig2enc-wasm`,
`wasm-jbig2`, `@jsquash/tiff` (all 404 except `mupdf`).

## Shortlist

Advancing to Tasks 5–7 (prototype builds):

1. **jbig2enc + Leptonica, built with Emscripten from source** — the only
   permissively-licensed JBIG2 encoder in existence. Apache-2.0 removes
   the AGPL problem that kills MuPDF and Ghostscript. Prior art for
   Leptonica-in-Emscripten exists (via OCRmyPDF-adjacent projects and
   Tesseract's naptha fork) so the toolchain is proven, even though no
   prebuilt `jbig2enc-wasm` npm package is currently maintained. Expected
   binary size: ~1.5–3 MB WASM after `-Os` + `--closure 1` (Leptonica
   dominates). This is the highest-risk, highest-reward candidate.

2. **libtiff, built with Emscripten from source, exposing `COMPRESSION_CCITTFAX4`
   write path** — permissive `libtiff` license, small binary
   (~500 KB), well-understood G4 write API. Deliverable is a JS function
   that takes a 1-bpp bitmap and returns the raw G4 bitstream suitable
   for wrapping in a PDF `/CCITTFaxDecode` filter. Fallback codec if
   jbig2enc bring-up slips the timebox.

Dropped, with reason:

- **mupdf.js / MuPDF** — AGPL-3.0-or-later. ConvertYard distributes the
  WASM to every visitor; AGPL§13 (network clause) plus §5 (conveying
  modified sources) would require open-sourcing the entire site under
  AGPL, or an Artifex commercial license. Not compatible with our model.
  We already ship `mupdf-wasm` for viewing/decoding under a scoped
  interpretation, but expanding to encoder use would materially increase
  our AGPL exposure and pin us on Artifex terms. Drop unless leadership
  explicitly opts in to a commercial license.
- **Ghostscript (ps-wasm and forks)** — same AGPL issue as MuPDF, plus
  Chrome-only WASM per ps-wasm README, plus 10+ MB binary. Drop.
- **pdfcpu (Go WASM)** — does not implement JBIG2 or CCITT G4 encoders.
  Cannot solve the spike question regardless of WASM feasibility. Drop.
- **jbig2dec** — decoder only. Drop.
- **Rust `jbig2enc` crate** — wraps the same C library; wasm-pack build
  would still need Leptonica. Building the C directly with Emscripten is
  more direct and gives us a smaller surface. Drop as a candidate;
  revisit only if C++ Emscripten build blows up on ABI issues.

## License read (shortlist only)

### jbig2enc (Apache-2.0) + Leptonica (BSD-2-Clause-style)

- `agl/jbig2enc` `COPYING` states "Licensed under the Apache License,
  Version 2.0" (Google copyright, 2006). Confirmed by fetching
  raw.githubusercontent.com. There is also a `doc/PATENTS.md` note —
  the JBIG2 spec itself had patent claims that expired around 2017;
  the Apache-2.0 patent grant covers Google's contributions.
- Leptonica: BSD-2-Clause per `leptonica-license.txt` (Copyright
  2001-2020 Leptonica; redistribution in source/binary permitted with
  notice retention). SPDX identifier "BSD-2-Clause" is acceptable.
- Net: shipping a WASM built from these two, plus attribution in
  `/legal/oss-notices`, is compatible with ConvertYard's site license.
  No copyleft, no source-disclosure requirement.

### libtiff (SPDX `libtiff` — MIT/BSD-style, sometimes called Sam Leffler license)

- Permissive; requires attribution ("Permission to use, copy, modify,
  distribute, and sell this software and its documentation for any
  purpose is hereby granted..."). Compatible with ConvertYard shipping
  the WASM to visitors. No copyleft. Attribution goes into
  `/legal/oss-notices`.

### AGPL note

Both dropped candidates (MuPDF, Ghostscript) are AGPL-3.0. ConvertYard's
model — a static site that transmits a JS+WASM bundle to every visitor
who loads a tool page — is exactly the "conveying" scenario AGPL§5
covers, plus AGPL§13's "remote network interaction" clause makes it
extra-viral for hosted apps even when computation is client-side (the
receiver of the modified library, i.e. the visitor's browser, would be
entitled to complete corresponding source under AGPL). We do not intend
to open-source ConvertYard's application code, so any AGPL runtime is a
non-starter without a commercial license.
