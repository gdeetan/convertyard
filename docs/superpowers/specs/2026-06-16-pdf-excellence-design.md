# PDF Excellence — Compress PDF Moat Features

**Date:** 2026-06-16
**Prompt:** 22
**Status:** Approved

## Context

Every free PDF compressor offers Low/Medium/High presets. Adobe exposes professional controls but only behind a Pro subscription. This spec adds 5 features to `/compress-pdf/` that no free browser-based tool currently offers together: a visual before/after preview, a PDF file analyzer with live savings estimates, an advanced settings panel with professional-grade controls, preset profiles, and a competitor comparison table.

Pre-condition: Prompt 21 (compress-pdf bug fixes) must be verified working in production before implementation begins.

---

## Architecture

**Approach: Slot-based ToolConfig extension**

Two new fields added to `ToolConfig` in `/lib/types.ts`:

```ts
previewPanel?: (props: { files: File[]; results: File[] }) => React.ReactNode
advancedOptions?: ToolOption[]
```

ToolShell render order (updated):
1. Dropzone
2. `previewPanel({ files, results })` — rendered when `files.length > 0`
3. Options panel (existing)
4. `advancedOptions` collapsible — `<details>` block with "Advanced settings" label
5. Convert button + progress
6. Result list

This pattern is reusable — any tool can add a preview panel or advanced options via config without touching ToolShell internals.

---

## Feature 1: Before/After Preview

### New files
- `/components/ui/ComparisonSlider.tsx`
- `/components/pdf/CompressionPreview.tsx`

### ComparisonSlider
Generic draggable divider component. Takes two `ReactNode` children (left/right), clips each using CSS `clip-path` based on a `position` state (0.0–1.0). Pointer + touch events move the handle. No external dependency.

### CompressionPreview
Rendered via the `previewPanel` slot. Receives `{ files: File[], results: File[] }`.

**File switcher** (shown when `files.length > 1`):
```
◄  report.pdf  (1 of 4)  ►
```
Switching index re-renders both canvases and re-triggers analyzer for that file.

**State machine:**
```
idle → rendering-original → ready-original → rendering-compressed → ready-both
```

**Rendering:**
- Left canvas: `mupdfClient.renderPagePng(file, 1, 96)` on drop, capped at 800px width
- Right canvas: same call on compressed `File` once `results[index]` is available
- Cache both as `ImageBitmap` — slider drag is pure CSS clip-path, no re-render
- Right panel shows spinner + "Compress to see result" hint while `idle` or `rendering-original`

**Mobile:** Stack vertically, no slider handle (ComparisonSlider hidden on `< md`; both images shown stacked)

---

## Feature 2: PDF File Analyzer

### New files
- `/lib/pdf/analyzer.ts`
- `/lib/pdf/savings-estimator.ts`
- `/components/pdf/PdfAnalyzerPanel.tsx`

### Types

```ts
// lib/pdf/analyzer.ts
interface PdfAnalysis {
  pageCount: number
  images: {
    count: number
    totalEstimatedBytes: number
    avgDpi: number
    highDpiCount: number      // images above 150 DPI — downsample candidates
  }
  fonts: {
    count: number
    unsubsettedCount: number
    estimatedBytes: number
  }
  hasMetadata: boolean
  hasAnnotations: boolean
  hasBookmarks: boolean
  hasJS: boolean
  hasEmbeddedFiles: boolean
}

// lib/pdf/savings-estimator.ts
interface SavingsEstimate {
  technique: string
  estimatedBytes: number
  enabled: boolean            // true = current settings will apply this
}
```

### How analysis works

Uses existing mupdf-client API — no new worker messages needed:
- `extractStructuredText()` → font names, embedded flags, sizes per page
- `getPageSizes()` → page dimensions for DPI estimation (pixel dims of images vs page size)
- Raw `ArrayBuffer` byte scan with regex → count `/Subtype /Image`, check for `/JS`, `/Annots`, `/Names /EmbeddedFiles`, `/AcroForm`
- Image byte estimate: total file bytes minus estimated text/font contribution

### Heuristic savings rules

| Technique | Estimate |
|---|---|
| Downsample images (300→150 DPI) | 75% of image bytes |
| JPEG re-encode (quality 80→60) | 30% of image bytes |
| Grayscale conversion | 60% of image bytes |
| Font subsetting | 40% of unsubsetted font bytes |
| Strip metadata | ~50 KB flat |
| Strip annotations | ~50 KB flat |

### PdfAnalyzerPanel UI

- Card rendered alongside `CompressionPreview` inside the `previewPanel` slot
- **Synced to preview file switcher** — `selectedFileIndex` state lives in the `previewPanel` render function closure in `compress-pdf.ts`, passed as a prop to both `CompressionPreview` and `PdfAnalyzerPanel` so they always stay in sync
- Displays: image count, total image bytes, avg DPI, font count, metadata/annotation/JS presence
- "Biggest opportunities" ranked list (sorted by `estimatedBytes` desc)
- List updates live as advanced settings change — re-runs savings estimator only (no re-parse)

---

## Feature 3: Advanced Settings Panel

### New type in `/lib/types.ts`

```ts
interface CompressionSettings {
  images: {
    dpiMode: 'auto' | 'custom'
    targetDpi: number          // 72 | 96 | 150 | 200 | 300
    jpegQuality: number        // 0–100
    grayscale: boolean
  }
  fonts: {
    subset: boolean
    removeUnused: boolean
  }
  strip: {
    metadata: boolean
    annotations: boolean
    bookmarks: boolean
    embeddedFiles: boolean
    javascript: boolean
  }
  structure: {
    linearize: boolean
    deduplicateResources: boolean
  }
}
```

### New ToolOption type: `section-header`

Added to the `ToolOption` union in `/lib/types.ts`:
```ts
{ type: 'section-header'; label: string }
```
Rendered in `OptionsPanel` as a `<h4>` with a subtle top border/separator. No value, no state.

### advancedOptions schema (in `/content/tools/compress-pdf.ts`)

```
[section-header] Images
  toggle:  DPI mode                    name: dpiMode,    default: 'auto'
  slider:  Target DPI (72–300)         name: targetDpi,  default: 150,  dependsOn: { dpiMode: 'custom' }
  slider:  JPEG quality (0–100)        name: jpegQuality, default: 70
  toggle:  Convert to grayscale        name: grayscale,  default: false

[section-header] Fonts
  toggle:  Subset fonts                name: subsetFonts,    default: true
  toggle:  Remove unused fonts         name: removeUnusedFonts, default: false

[section-header] Strip
  toggle:  Metadata                    name: stripMetadata,     default: true
  toggle:  Annotations                 name: stripAnnotations,  default: false
  toggle:  Bookmarks                   name: stripBookmarks,    default: false
  toggle:  Embedded files              name: stripEmbedded,     default: false
  toggle:  JavaScript                  name: stripJS,           default: false

[section-header] Structure
  toggle:  Linearize (fast web view)   name: linearize,         default: false
  toggle:  Deduplicate resources       name: deduplicate,       default: false
```

### convertFn changes in `/lib/converters/pdf.ts`

The existing 7-pass algorithm has hardcoded DPI/quality values per pass. These become parameterized — read from `options` when provided, with existing hardcoded values as fallback defaults. The `compressLevel` radio still controls the quick-mode pass selection order; advanced settings override per-pass DPI/quality parameters.

---

## Feature 4: Preset Profiles

### New file: `/components/pdf/PresetBar.tsx`

5 buttons rendered above the `advancedOptions` collapsible. Clicking a preset:
1. Writes all advanced option values at once via `setOptions`
2. Opens the Advanced collapsible so the user sees the applied values

ToolShell manages an `advancedOpen` boolean state. It passes an `onPresetApply` callback to `PresetBar` that calls `setOptions(presetValues)` and sets `advancedOpen = true`. The `<details>` element for `advancedOptions` is controlled by this state.

### Preset values

| Preset | DPI | Quality | Grayscale | Strip metadata | Subset fonts |
|---|---|---|---|---|---|
| Email | 96 | 55 | false | true | true |
| Web | 120 | 65 | false | true | true |
| Print | 200 | 80 | false | false | true |
| Archive | 150 | 70 | false | false | false |
| Maximum | 72 | 40 | true | true | true |

---

## Feature 5: Comparison Table + FAQ Additions

### New file: `/components/pdf/CompressorComparisonTable.tsx`

Static React component, hardcoded data. The comparison table sits outside the ToolShell flow (it's not part of the conversion UI), so it is rendered directly in `/app/(tools)/compress-pdf/page.tsx` below `<ToolShell config={config} />`.

**Columns:** ConvertYard | Adobe Acrobat Free | Adobe Acrobat Pro | iLovePDF | Smallpdf

**Rows:**
- Target file size (KB-level control)
- Visual before/after preview
- File analyzer with savings estimates
- Advanced DPI control
- Font subsetting
- Content stripping (metadata, JS, forms)
- Batch (1000+ files)
- Files stay in browser (no upload)
- Free, no account required

ConvertYard column gets a subtle background highlight tint. Cell values: ✓ / ✗ / "Pro only" / "Limited".

### FAQ additions (6 new entries in compress-pdf.ts)

1. What does DPI mean for PDFs and when should I change it?
2. Will converting to grayscale affect text readability?
3. What is font subsetting and is it safe?
4. What does "linearize" do?
5. Can I strip embedded files without affecting the PDF content?
6. How does the visual preview work if files never leave my browser?

---

## Full file change list

| File | Change |
|---|---|
| `/lib/types.ts` | Add `CompressionSettings`, `previewPanel` + `advancedOptions` to `ToolConfig`, `section-header` ToolOption type |
| `/lib/converters/pdf.ts` | Parameterize DPI/quality across all 7 compression passes |
| `/lib/pdf/analyzer.ts` | New — PDF structure parser returning `PdfAnalysis` |
| `/lib/pdf/savings-estimator.ts` | New — heuristic savings calculator returning `SavingsEstimate[]` |
| `/components/tool-shell/tool-shell.tsx` | Render `previewPanel` slot + `advancedOptions` collapsible |
| `/components/tool-shell/options-panel.tsx` | Handle `section-header` option type |
| `/components/ui/ComparisonSlider.tsx` | New — generic CSS clip-path draggable divider |
| `/components/pdf/CompressionPreview.tsx` | New — before/after preview with file switcher + state machine |
| `/components/pdf/PdfAnalyzerPanel.tsx` | New — analyzer card, synced to file switcher index |
| `/components/pdf/PresetBar.tsx` | New — 5 preset buttons with applyPreset logic |
| `/components/pdf/CompressorComparisonTable.tsx` | New — static feature grid |
| `/content/tools/compress-pdf.ts` | Add `advancedOptions`, `previewPanel`, `PresetBar`, comparison table ref, 6 new FAQs |

---

## Verification

1. Drop a single PDF → left canvas renders, analyzer card shows image/font stats
2. Drop 3 PDFs → file switcher appears "1 of 3", cycling updates both preview and analyzer
3. Compress → right canvas fills with compressed page 1, savings estimates update to reflect "enabled" status
4. Click "Maximum" preset → Advanced collapsible opens, sliders reflect Maximum values
5. Adjust JPEG quality slider → savings estimate for quality reduction updates live without re-parsing
6. Batch: 10 PDFs all compress successfully with advanced settings applied uniformly
7. Comparison table renders below FAQ with ConvertYard column highlighted
8. Mobile (< md): preview stacks vertically with no slider handle, analyzer card below
