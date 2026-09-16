# PDF Scan-Codec Spike (throwaway)

Branch: `spike/pdf-scan-codecs`. Do not merge to main.

See:
- Spec: `docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-design.md`
- Plan: `docs/superpowers/plans/2026-09-16-pdf-scan-codec-spike.md`

## Layout
- `spike/scripts/` — throwaway prototype scripts, run with `npx tsx spike/scripts/<name>.ts`
- `spike/notes/` — investigation notes per subtask
- `spike/out/` — generated PDFs, git-ignored
- `fixtures/pdf-scan-codec-spike/` — inspection inputs (real scans)

## Timebox
2 working days. If day 2 ends without JBIG2 clarity, JBIG2 defaults to no-go.

## Deliverable
`docs/superpowers/specs/2026-09-16-pdf-scan-codec-spike-report.md`
