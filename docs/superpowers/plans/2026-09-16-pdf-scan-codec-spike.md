# PDF Scan-Codec WASM Feasibility Spike — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a defensible go/no-go decision on emitting JBIG2 and CCITT Group 4 image streams inside PDFs entirely in-browser, so the P0 keep-text compress-PDF spec can be written on facts.

**Architecture:** Investigation + throwaway prototypes on branch `spike/pdf-scan-codecs`. No production code touched. Deliverable is a report at `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md` and a reproducible prototype branch. Nothing merges to `main`.

**Tech Stack:** Next.js/TypeScript (existing repo), Node scripts for prototyping (spike-only, not runtime), candidate WASM libraries: jbig2enc (Emscripten build), libtiff-wasm, mupdf-wasm, pdf-lib.

**Timebox:** 2 working days. If day 2 ends without a clear JBIG2 verdict, default JBIG2 to no-go and ship the report with CCITT-only recommendation.

**Spec:** `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-design.md`

## Amendment 2026-09-16 (after Task 3 library survey)

No prebuilt jbig2enc-wasm exists on npm or in any maintained fork. Building one from source via Emscripten + Leptonica is a full day of build tooling alone and risks consuming the entire spike timebox before any measurement.

**Scope split (approved by user):**
- **CCITT Group 4 (Task 5):** unchanged — full in-browser WASM prototype (libtiff via Emscripten or existing WASM wrapper).
- **JBIG2 (Tasks 6–7):** measurement-only pass on native/Docker jbig2enc. Goal: answer "does JBIG2 give meaningful compression on our fixtures?" If yes → follow-up spike will address WASM shippability. If no → JBIG2 dropped from P0 with numbers backing the decision.
- **Task 8:** bundle-cost measurement only for CCITT. JBIG2 bundle cost is explicitly deferred to the follow-up spike (mark as N/A in the report with reason).
- **Task 9 report:** JBIG2 verdict is one of {compression-viable pending WASM, compression-not-viable dropped, blocked}. Do not conflate compression viability with WASM shippability.

---

## Task 1: Set up spike branch and workspace

**Files:**
- Create: `spike/README.md` (spike-branch only, do not merge)
- Create: `fixtures/pdf-scan-codec-spike/.gitkeep`

- [ ] **Step 1: Create and checkout spike branch**

```bash
git checkout -b spike/pdf-scan-codecs
```

- [ ] **Step 2: Scaffold spike workspace**

Create directory `spike/` at repo root. Create `spike/README.md` with:

```markdown
# PDF Scan-Codec Spike (throwaway)

Branch: `spike/pdf-scan-codecs`. Do not merge to main.
See `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-design.md`.

Scripts live under `spike/scripts/`. Fixtures under `fixtures/pdf-scan-codec-spike/`.
Run with `npx tsx spike/scripts/<name>.ts`.
```

Create empty `fixtures/pdf-scan-codec-spike/.gitkeep`.

- [ ] **Step 3: Commit scaffolding**

```bash
git add spike/README.md fixtures/pdf-scan-codec-spike/.gitkeep
git commit -m "spike: scaffold pdf scan-codec spike workspace"
```

---

## Task 2: Assemble fixture set

**Files:**
- Create: `fixtures/pdf-scan-codec-spike/bitonal-certificate.pdf`
- Create: `fixtures/pdf-scan-codec-spike/grayscale-contract.pdf`
- Create: `fixtures/pdf-scan-codec-spike/color-mixed.pdf`
- Create: `fixtures/pdf-scan-codec-spike/already-jbig2.pdf`
- Create: `fixtures/pdf-scan-codec-spike/large-500p.pdf`
- Create: `fixtures/pdf-scan-codec-spike/README.md`

- [ ] **Step 1: Source fixtures**

Only use non-PII, redistributable sources: public JoSAA blank forms, SF-1199a, public court sample filings, or synthetic scans generated from public documents (print → scan).

Required fixtures:
- `bitonal-certificate.pdf` — 1–5 page bitonal scan (typical exam/govt scan)
- `grayscale-contract.pdf` — ~20 page grayscale scan
- `color-mixed.pdf` — color scan mixing photos + text
- `already-jbig2.pdf` — a scan already compressed by Acrobat with JBIG2 (produce with local Acrobat if available; else document as "unavailable" in README)
- `large-500p.pdf` — 500+ page scan for memory/time ceiling

- [ ] **Step 2: Document each fixture**

Create `fixtures/pdf-scan-codec-spike/README.md` listing per file:
- Source (URL or origin), license, page count, byte size, dominant type (bitonal/grayscale/color).

- [ ] **Step 3: Commit fixtures**

```bash
git add fixtures/pdf-scan-codec-spike/
git commit -m "spike: add pdf scan-codec fixture set"
```

Note: if any fixture is over ~25 MB, prefer external download instructions in the README over committing the binary.

---

## Task 3: Library survey

**Files:**
- Create: `spike/notes/01-library-survey.md`

- [ ] **Step 1: Survey candidate libraries**

For each candidate, record: repo URL, license, last commit date, WASM build available (yes/no/would-need-to-build), encode capability (encode/decode/both), maintenance signal.

Candidates to evaluate:
- `jbig2enc` (github.com/agl/jbig2enc)
- `mupdf-wasm` / `mutool` — inspect current npm build for encode entry points
- `libtiff` via Emscripten (CCITT G4)
- `ghostscript-wasm` (github.com/ochachacha/ps-wasm and forks)
- `pdfcpu` (Go → WASM feasibility)
- Any candidate found during search

- [ ] **Step 2: Write survey note**

Create `spike/notes/01-library-survey.md` with a table of the above and a shortlist section: which candidates advance to prototyping and why the others are dropped.

- [ ] **Step 3: License read**

For each shortlisted candidate, capture license text and note compatibility with ConvertYard's static hosting (Cloudflare Pages, no server-side execution). Flag AGPL as red until it can be reasoned about.

- [ ] **Step 4: Commit**

```bash
git add spike/notes/01-library-survey.md
git commit -m "spike: library survey and shortlist"
```

---

## Task 4: Bitonal / grayscale / color per-page classifier prototype

**Files:**
- Create: `spike/scripts/classify-pages.ts`
- Create: `spike/notes/02-classifier.md`

- [ ] **Step 1: Prototype the classifier**

Write `spike/scripts/classify-pages.ts` that:
1. Takes a PDF path as argv.
2. Uses `pdfjs-dist` (already in the repo — check `package.json` before adding) to rasterize each page at 150 DPI to a canvas/ImageData.
3. Samples ~5000 pixels per page. Classifies:
   - bitonal: >99% of sampled pixels are near-black or near-white (threshold ~16 on each channel)
   - grayscale: R≈G≈B within ±8 for >99% of samples
   - color: otherwise
4. Prints per-page verdict and time taken.

- [ ] **Step 2: Run against fixtures**

```bash
npx tsx spike/scripts/classify-pages.ts fixtures/pdf-scan-codec-spike/bitonal-certificate.pdf
npx tsx spike/scripts/classify-pages.ts fixtures/pdf-scan-codec-spike/grayscale-contract.pdf
npx tsx spike/scripts/classify-pages.ts fixtures/pdf-scan-codec-spike/color-mixed.pdf
```

Record per-page verdicts and total time in `spike/notes/02-classifier.md`. Expected: bitonal fixture classified bitonal on ≥95% of pages; grayscale fixture grayscale on ≥95%; color fixture color on ≥95%.

- [ ] **Step 3: Note accuracy failures**

If the classifier misclassifies, log which pages and why. Do NOT tune beyond one iteration — the goal is feasibility, not a shipping classifier.

- [ ] **Step 4: Commit**

```bash
git add spike/scripts/classify-pages.ts spike/notes/02-classifier.md
git commit -m "spike: per-page bitonal/grayscale/color classifier prototype"
```

---

## Task 5: CCITT Group 4 encode prototype

**Files:**
- Create: `spike/scripts/encode-ccitt.ts`
- Create: `spike/notes/03-ccitt.md`
- Create: `spike/out/ccitt/` (git-ignored, holds outputs for inspection)

- [ ] **Step 1: Add `.gitignore` entry**

Append `spike/out/` to root `.gitignore` if not already excluded.

- [ ] **Step 2: Prototype CCITT G4 encoding**

Write `spike/scripts/encode-ccitt.ts` that:
1. Takes a PDF path as argv.
2. Rasterizes each page at 300 DPI to a bitonal bitmap.
3. Encodes the bitmap as CCITT Group 4 using the shortlisted library (libtiff-wasm or equivalent).
4. Uses `pdf-lib` to embed each encoded stream as an `/Image` XObject with `/Filter /CCITTFaxDecode` and appropriate `/DecodeParms` (`K -1`, `Columns`, `Rows`).
5. Emits a new PDF at `spike/out/ccitt/<original-name>.pdf`.

If the shortlisted library cannot be loaded from Node (Emscripten env issues), document the exact error and try one alternative before giving up.

- [ ] **Step 3: Measure**

For `bitonal-certificate.pdf` and `grayscale-contract.pdf` (grayscale forced to bitonal via threshold):
- Bytes in vs bytes out
- Encode time per page
- Compare to current JPEG rasterize path from `lib/converters/pdf.ts` (`compressPdfToTargetSize` step 3 output at 200 DPI)

Log to `spike/notes/03-ccitt.md`.

- [ ] **Step 4: Viewer compatibility**

Open each output PDF in: Acrobat Reader, Chrome built-in viewer, macOS Preview. Record pass/fail + any rendering artifacts.

- [ ] **Step 5: Commit**

```bash
git add .gitignore spike/scripts/encode-ccitt.ts spike/notes/03-ccitt.md
git commit -m "spike: ccitt g4 encode prototype + measurements"
```

---

## Task 6: JBIG2 encode prototype (lossless)

**Files:**
- Create: `spike/scripts/encode-jbig2-lossless.ts`
- Create: `spike/notes/04-jbig2-lossless.md`

- [ ] **Step 1: Obtain or build jbig2enc WASM**

Check npm for existing builds (`jbig2-wasm`, `@bindings/jbig2enc`, etc.). If none work in Node ≥18, document the attempted commands and error output in the notes file. If unable to obtain a working WASM build within 2 hours, mark JBIG2 lossless as **blocked**, write the note, skip to Task 8, and stop.

- [ ] **Step 2: Prototype lossless JBIG2 encoding**

Write `spike/scripts/encode-jbig2-lossless.ts` that:
1. Rasterizes each bitonal page to a 1-bit bitmap.
2. Encodes with jbig2enc in lossless mode (no symbol substitution).
3. Embeds via `pdf-lib` with `/Filter /JBIG2Decode` and a shared `/JBIG2Globals` stream if the encoder emits one.
4. Emits to `spike/out/jbig2-lossless/`.

- [ ] **Step 3: Measure**

Same measurements as Task 5 (bytes in/out, encode time, viewer compatibility on Acrobat / Chrome / Preview). Log to `spike/notes/04-jbig2-lossless.md`.

- [ ] **Step 4: Commit**

```bash
git add spike/scripts/encode-jbig2-lossless.ts spike/notes/04-jbig2-lossless.md
git commit -m "spike: jbig2 lossless encode prototype + measurements"
```

---

## Task 7: JBIG2 encode prototype (lossy, symbol substitution)

**Files:**
- Create: `spike/scripts/encode-jbig2-lossy.ts`
- Create: `spike/notes/05-jbig2-lossy.md`

Skip this task if Task 6 was blocked.

- [ ] **Step 1: Prototype lossy JBIG2 encoding**

Copy Task 6 script, enable symbol substitution with a conservative threshold (jbig2enc `-s -t 0.85`). Emit to `spike/out/jbig2-lossy/`.

- [ ] **Step 2: Measure and inspect for the Xerox bug**

Same measurements plus: manually inspect at least 3 pages in each output for character substitution errors (the "8 vs 6" Xerox scanner bug). If any substitution is found, record which fixture and which page, and mark lossy JBIG2 as **caveat: substitution risk** in the notes.

Log to `spike/notes/05-jbig2-lossy.md`.

- [ ] **Step 3: Commit**

```bash
git add spike/scripts/encode-jbig2-lossy.ts spike/notes/05-jbig2-lossy.md
git commit -m "spike: jbig2 lossy encode prototype + measurements"
```

---

## Task 8: Bundle-cost and memory-ceiling checks

**Files:**
- Create: `spike/notes/06-bundle-and-memory.md`

- [ ] **Step 1: Bundle cost**

For each library that would ship to the browser (not Node-only), measure:
- Raw `.wasm` file size
- gzipped `.wasm` size
- Any required JS glue file size (raw + gzip)

Record per-library totals.

- [ ] **Step 2: Memory ceiling — run on `large-500p.pdf`**

For the winning CCITT and JBIG2 scripts, run against `fixtures/pdf-scan-codec-spike/large-500p.pdf`. Record:
- Peak RSS (use `/usr/bin/time -l` on macOS)
- Total wall-clock time
- Whether the run completed or OOM'd

Simulate browser tab limits: any run over ~2 GB peak RSS is a red flag for mobile Safari (typical ~1 GB tab budget).

- [ ] **Step 3: Commit**

```bash
git add spike/notes/06-bundle-and-memory.md
git commit -m "spike: bundle-size and memory-ceiling measurements"
```

---

## Task 9: Synthesize the report

**Files:**
- Create: `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md`

- [ ] **Step 1: Write the report**

Structure required by the spec:

```markdown
# PDF Scan-Codec WASM Feasibility Spike — Report

**Date:** 2026-09-16 (adjust)
**Spec:** docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-design.md
**Prototype branch:** spike/pdf-scan-codecs

## Verdict summary

| Codec | Verdict | Recommended P0 role |
|---|---|---|
| CCITT Group 4 | go / go-with-caveats / no-go | primary / opt-in / dropped |
| JBIG2 lossless | ... | ... |
| JBIG2 lossy | ... | ... |

## Per-codec detail

### CCITT Group 4
- Chosen library, license, bundle cost (raw + gzip)
- Encode time (ms/page) at n=10, n=100, n=1000
- Output size vs current JPEG rasterize baseline
- Viewer compatibility matrix (Acrobat / Chrome / Preview)
- Known limits
- Recommended role in P0 with justification

### JBIG2 lossless
(same structure)

### JBIG2 lossy
(same structure, plus substitution-risk note)

## Per-page classifier
- Accuracy vs fixture set
- Time per page
- Recommended: keep in P0 / needs work / drop

## Bundle and memory
- Total added bundle if all shipped
- Lazy-load recommendation
- 500-page fixture: peak memory + wall-clock

## Recommendation for P0 spec

One of:
1. "Scan codecs are P0. Use library X for JBIG2 and library Y for CCITT. Budget Zkb added bundle, N ms/page."
2. "CCITT only in P0; JBIG2 deferred because [reason]."
3. "Neither viable in-browser today. P0 keep-text ships without scan codecs; reframe pitch."

## Open questions for the P0 spec

- ...
```

Fill every section with the numbers and observations from Tasks 3–8. No placeholders.

- [ ] **Step 2: Commit report**

```bash
git add docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md
git commit -m "spike: pdf scan-codec feasibility report"
```

---

## Task 10: Wrap-up

- [ ] **Step 1: Push spike branch**

```bash
git push -u origin spike/pdf-scan-codecs
```

Do not open a PR to merge — the branch is a research artifact.

- [ ] **Step 2: Return to main**

```bash
git checkout main
```

- [ ] **Step 3: Hand off**

The report at `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md` is the input for the next design spec: P0 keep-text target-size compress-PDF. Do not start that spec inside this plan.

---

## Verification checklist (before declaring the spike done)

- [ ] `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md` exists with no placeholders
- [ ] Every codec listed in the report has a verdict, or is explicitly marked "blocked — see notes/NN.md"
- [ ] `spike/pdf-scan-codecs` branch is pushed to origin
- [ ] All measurements in the report trace back to a script + fixture that can be re-run
- [ ] No changes on `main`; no changes to `lib/converters/pdf.ts`, `components/pdf/*`, or `app/(tools)/compress-pdf/*`
- [ ] Timebox honored: if 2 days elapsed without JBIG2 clarity, JBIG2 defaulted to no-go per the spec
