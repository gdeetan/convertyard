# Compress-PDF P0 keep-text — design

**Status:** Approved 2026-09-16
**Owner:** ConvertYard
**Feeds:** Implementation plan at `docs/superpowers/plans/2026-09-16-compress-pdf-p0-keep-text.md` (to be written next).
**Preceding docs:**
- Brief: `specs/Compress-PDF-improvement-prompt.md`
- Spike report: `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md`

## Goal

Make `/compress-pdf` hit an exact size target without silently turning the PDF into an unsearchable image. Ship the smallest useful slice that closes the biggest product hole (target-size mode currently rasterizes the whole document once JPEG passes exhaust) and remove three integrity gaps that hurt reviewer credibility.

## Non-goals for P0

Deferred to follow-up specs:
- Shareable local compression report
- Live size estimate as options change (only a post-run "best possible" size ships in P0)
- Real linearize / Fast Web View
- Real font subsetting
- JBIG2 / CCITT scan codecs (blocked on the WASM shippability spike)
- Portal preflight (Common App / JoSAA / etc.)
- Per-page heat map, SSIM diff, per-file batch overrides

## Scope

### In P0

1. **Keep-text target-size pipeline.** New function `compressPdfKeepText` runs structural cleanup → real image downsample (JPEG + Flate/PNG) → optional grayscale → measure. It never rasterizes.
2. **Real Flate/PNG image downsample.** Match the existing JPEG path so `/FlateDecode` `/DeviceRGB` and `/DeviceGray` images get decoded, downsampled, and re-encoded. `/DCTDecode` continues to use the existing JPEG path. `/JPXDecode`, `/JBIG2Decode`, `/CCITTFaxDecode` are preserved as-is with a per-image diagnostic ("preserved: unsupported codec in P0").
3. **Unachievable-target inline UI.** When phase 1 exceeds the target, render `UnachievableTargetCard` with "Best possible: N KB. Target: M KB." and two actions: **Keep as N KB** and **Rasterize anyway (breaks searchable text)**. Rasterize only runs if the user chooses it — never as a silent fallback.
4. **Integrity fixes.**
   - Remove the linearize toggle from Advanced options.
   - Remove the font-subset control from Advanced options.
   - Strip "linearize", "font subsetting", and "per-image-type quality" claims from `CompressorComparisonTable`.
   - Rewrite any surface copy that mentioned these to reflect what actually runs.

### Out of P0

See "Non-goals" above.

## Architecture

```
┌─────────────────────────────────────────┐
│ Phase 1: compressPdfKeepText            │
│  1. Structural cleanup (existing)       │
│  2. Real image downsample (NEW)         │
│     - JPEG: existing path               │
│     - Flate/PNG: decode → downsample →  │
│       re-encode                         │
│     - Others: preserve + diagnostic     │
│  3. Grayscale (if opted)                │
│  4. Measure. Under target? → DONE       │
└──────────┬──────────────────────────────┘
           │  over target
           ▼
┌─────────────────────────────────────────┐
│ Gate: UnachievableTargetCard            │
│  "Best possible: N KB. Target: M KB."   │
│  [Keep as N KB]  [Rasterize anyway]     │
└──────────┬──────────────────────────────┘
           │  user chooses rasterize
           ▼
┌─────────────────────────────────────────┐
│ Phase 2: rasterizeToTargetSize          │
│  (existing 200 DPI → 72 DPI → grayscale │
│  passes, unchanged)                     │
└─────────────────────────────────────────┘
```

Rasterize is a **separate function call**, invoked only when the user clicks "Rasterize anyway." There is no implicit fallback from phase 1 to phase 2.

## Files

- `lib/converters/pdf.ts`
  - Split `compressPdfToTargetSize` into `compressPdfKeepText` (phase 1) and `rasterizeToTargetSize` (phase 2).
  - The old exported name may stay as a deprecated thin adapter during the refactor commit only; it MUST be deleted before the PR merges. No shipping code retains the old silent-rasterize semantics.
- `lib/pdf/image-downsample.ts` **(new)** — shared Flate/PNG + JPEG downsample logic. Pure function, unit-testable in isolation. Called by both target-size and non-target compress paths.
- `components/pdf/UnachievableTargetCard.tsx` **(new)** — the warning card. Two buttons. No other UI in P0.
- `app/(tools)/compress-pdf/page.tsx` — replace the current target-size handler with the phase-1 / gate / phase-2 flow.
- `components/pdf/CompressorComparisonTable.tsx` — remove rows / cells claiming linearize, font subsetting, per-image-type quality.
- Advanced options component (find via code search: search for "linearize" and "font subset" in `components/pdf/`) — remove those two controls.

Any surface copy referencing linearize or font subsetting (search the repo) is rewritten or deleted in the same PR.

## Types

```typescript
type TargetSizeResult =
  | { ok: true; blob: Blob; bytes: number; passesRun: string[] }
  | {
      ok: false;
      reason: 'unachievable-keep-text';
      bestBlob: Blob;
      bestBytes: number;
      targetBytes: number;
    };
```

`passesRun` is a short array of human-readable strings (`["structural-cleanup", "image-downsample", "grayscale"]`) — used by the compression report follow-up spec later; in P0 it's populated but not surfaced in UI.

## Error handling

- Malformed input PDF → thrown error, caught by existing `ToolShell` pattern. No new error surface.
- PDF with no `/Image` XObjects → phase 1 still runs structural cleanup and grayscale; may still exceed target → same unachievable-card path.
- User cancels mid-pass → aborted via the existing tool cancellation signal. Verify in Task 1 of the plan that this signal exists and is honored by phase 1's per-image loop; if not, wire it in.
- Unsupported codec on an image → skip that image, add to `preservedImages: string[]` diagnostic returned alongside the result. Do NOT throw.

## Testing

Test framework matches the rest of the repo (verify Vitest or Jest during plan writing).

1. **Unit — image-downsample.ts.** Synthetic PDF with one Flate/RGB image at 300 DPI. Downsample to 150 DPI ceiling. Assert output bytes < input bytes and stream is a valid image XObject.
2. **Unit — compressPdfKeepText.** Fixture that hits target → returns `ok: true`. Fixture that can't → returns `ok: false` with populated `bestBytes` and `bestBlob`.
3. **Unit — no silent rasterize.** Given an input where phase 1 exceeds target, assert the returned blob's `/Contents` streams still contain text operators (Tj, TJ, ') — not just image XObjects.
4. **Integration (Playwright or manual smoke).**
   - Load `/compress-pdf`. Drop `public-bitonal-certificate.pdf` (or a small text-heavy fixture). Set target 100 KB. Confirm `UnachievableTargetCard` appears with the best-possible size.
   - Click "Rasterize anyway." Confirm final download is under 100 KB.
   - Click "Keep as N KB" instead. Confirm download is the phase 1 output and text is still selectable when opened in Preview or Chrome.
5. **Regression.** Existing target-size landings (`content/size-targets/compress-pdf-to-*.ts`) must continue producing files within the named cap when the user opts into rasterize. Any regression on those fixtures is a blocker.
6. **Integrity fix verification.** Grep the repo for "linearize" and "font subset" — no user-facing surface (JSX, copy files, JSON-LD FAQ) may claim either capability after the PR.

## Verification checklist (used at PR time)

- [ ] `compressPdfKeepText` never rasterizes under any input.
- [ ] `rasterizeToTargetSize` only runs after explicit user action.
- [ ] `UnachievableTargetCard` renders only in the `ok: false` path.
- [ ] Rasterize output for the existing size-target fixtures is unchanged (regression check).
- [ ] `CompressorComparisonTable` no longer advertises linearize, font subsetting, or per-image-type quality control.
- [ ] Linearize and font-subset controls removed from Advanced options.
- [ ] `grep -ri "linearize" app components lib content` returns no user-facing claims.
- [ ] Manual smoke on a text-heavy PDF: output text is still selectable in Preview + Chrome after phase 1 with target unhit → user picks "Keep as N KB."
- [ ] No new dependency added to the tool page bundle (WASM stack unchanged).

## Success criteria

The current 500 KB / 1 MB / 5 MB size-target landings work end-to-end WITHOUT silently rasterizing text-heavy PDFs. When a PDF cannot hit the target without rasterizing, the UI says so and offers the choice instead of doing it behind the user's back. The comparison table no longer claims capabilities the tool does not have.

## Next step after this spec

Approval → write the implementation plan at `docs/superpowers/plans/2026-09-16-compress-pdf-p0-keep-text.md` and hand off to `superpowers:subagent-driven-development`.
