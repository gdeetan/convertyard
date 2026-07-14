# PROMPT-33 Findings: Mobile OCR AI Mode Investigation

**Date:** 2026-07-14  
**Branch:** `debug/mobile-ocr-ai-investigation`  
**Investigator:** Claude Code via static analysis + Explore agents

---

## Pipeline Map

### Registered tools (13 total)

All delegate to `imageOcrConvert()` in `lib/converters/image-ocr.ts`.

| Tool slug | Entry file |
|---|---|
| screenshot-to-text | content/tools/screenshot-to-text.ts |
| jpg-to-text | content/tools/jpg-to-text.ts |
| png-to-text | content/tools/png-to-text.ts |
| jpeg-to-text | content/tools/jpeg-to-text.ts |
| heic-to-text | content/tools/heic-to-text.ts |
| photo-to-text | content/tools/photo-to-text.ts |
| scan-to-text | content/tools/scan-to-text.ts |
| handwriting-to-text | content/tools/handwriting-to-text.ts |
| business-card-to-text | content/tools/business-card-to-text.ts |
| receipt-to-text | content/tools/receipt-to-text.ts |
| table-image-to-text | content/tools/table-image-to-text.ts |
| image-to-excel | content/tools/image-to-excel.ts |
| ocr-pdf | content/tools/ocr-pdf.ts |

### Mode selection (`image-ocr.ts:427`)

```
useAi = engine === 'ai-enhanced' && lang === 'eng'
```

AI mode only triggers when the user selects the AI engine AND language is English.

---

### AI-mode cascade (`image-ocr.ts:456–590`)

```
1. Florence-2 (Dedicated Web Worker, ~262 MB q8)
   ├── Success → use Florence text
   └── Empty/fail → cascade to TrOCR

2. TrOCR (MAIN THREAD, fp32, ~800 MB base / ~400 MB small)
   ├── Success → use TrOCR text
   └── Empty/fail → cascade to Tesseract

3. Tesseract (Main thread WASM, ~10-15 MB/lang)
   └── Always produces output (fallback of last resort)
```

### Worker topology

| Component | Thread | File | Singleton |
|---|---|---|---|
| **Florence-2** | Dedicated Web Worker | `lib/converters/transformers-worker.ts` | Yes — module-level `altModel`/`altProcessor` |
| **TrOCR** | **Main thread** | `lib/ocr/trocr-client.ts` | Yes — `pipelinePromise` cached |
| **Tesseract** | Main thread WASM | `lib/ocr/tesseract-client.ts` | Yes — `workerInstance` |
| **Dict correction** | Dedicated Web Worker | `lib/ocr/correction.worker.ts` | Yes |

### Model footprint worst-case (AI mode, full cascade)

| Component | In-memory footprint | Source |
|---|---|---|
| Florence-2 weights (q8) | ~262 MB | `transformers-worker.ts:113` dtype='q8' |
| TrOCR-base weights (fp32) | ~800 MB | `trocr-client.ts:37` dtype='fp32' |
| Decoded 12 MP bitmap | ~48 MB | 12 MP × 4 bytes/px |
| Preprocessing OffscreenCanvas(es) | ~10–30 MB | `preprocessing.ts:66–68` |
| Tesseract WASM + lang data | ~50 MB | cached after first load |
| **Total (cascade)** | **~1.17–1.19 GB** | |

iOS Safari's per-tab budget is approximately 1–1.5 GB in WKWebView.

---

## Findings

### F1 — Memory budget at or above iOS limit

**Severity:** Critical  
**Platform:** iOS (primary), Android (secondary)  
**Confidence:** High — numbers derived from model files, not estimated  
**Symptom:** iOS silent tab reload

The worst-case simultaneous allocation in AI mode with the full cascade (Florence → TrOCR → Tesseract all loaded) totals approximately 1.17–1.19 GB. iOS Safari kills the tab when JsHeap + renderer memory exceeds ~1–1.5 GB. A 12 MP iPhone photo at full resolution produces a 48 MB decoded bitmap, and both model weights remain resident after loading (no disposal API).

**File:line evidence:**
- `lib/ocr/trocr-client.ts:37–46` — TrOCR loaded with `dtype: 'fp32'`, no quantization, ~800 MB
- `lib/converters/transformers-worker.ts:113` — Florence loaded with `dtype: 'q8'`, ~262 MB
- Neither model has a `dispose()` call anywhere in the codebase

**Fix direction:** Quantize TrOCR to q8 (requires a different model repo than Xenova once updated fp32 files arrive); or gate TrOCR-base behind explicit "high quality" toggle, defaulting to TrOCR-small on mobile. Downscale images to ≤1024 px longest edge before inference.

---

### F2 — TrOCR runs on main thread

**Severity:** Critical  
**Platform:** iOS (secondary kill vector), Android (jank + failure)  
**Confidence:** High — confirmed from source  
**Symptom:** iOS tab reload (unresponsive page kill), Android UI freeze

Florence-2 correctly runs in a dedicated Web Worker (`lib/converters/transformers-worker.ts`). TrOCR does not — it loads and infers directly on the main thread via `lib/ocr/trocr-client.ts`. The pipeline call at line 37 blocks the main thread for the entire model load (~800 MB download + ONNX init). iOS can kill a tab for being unresponsive in addition to OOM.

**File:line evidence:**
- `lib/ocr/trocr-client.ts:37` — `pipeline('image-to-text', model, { dtype: 'fp32' })` on main thread
- `lib/ocr/trocr-client.ts:88` — per-line inference loop also on main thread
- Compare: `lib/converters/transformers-worker.ts` (Florence) runs behind `new Worker(...)` from `lib/converters/transformers-client.ts:9`

**Fix direction:** Move TrOCR to the existing `transformers-worker.ts` using the same message-passing pattern already used for Florence-2 and `alt-text`.

---

### F3 — "cannot process image" string does not exist in the codebase

**Severity:** Medium (investigation gap)  
**Platform:** Android  
**Confidence:** High — exhaustive grep confirms absence  
**Symptom:** Android user sees "cannot process image" error message

Searched with: `grep -rn "cannot process image" --include="*.ts" --include="*.tsx" --include="*.js" -i`  
Result: zero matches.

The string does not originate from ConvertYard code. Candidate sources:
1. **Android WebView internal error** — `CanvasRenderingContext2D.drawImage()` on a failed `createImageBitmap()` decode throws "The source image could not be decoded" or similar, which Android Chrome may render differently
2. **Third-party library** (`heic2any`, Tesseract.js, transformers.js) wrapping a lower-level error
3. **A swallowed error** — one of the 11 catch blocks that calls `console.warn` and re-throws or converts to a generic message (see F4)

The `?debug=1` panel instrumentation (F4 fix) will expose the real Android error message on next test run.

---

### F4 — No global error handlers; 11 catch blocks swallow root causes

**Severity:** High  
**Platform:** Both  
**Confidence:** High  
**Symptom:** Android "cannot process image" (or whatever the real message is) — obscures root cause

No `window.onerror` or `unhandledrejection` handler exists in the codebase. Eleven catch blocks in the OCR pipeline call `console.warn` and either fall back silently or re-throw as a generic `Error(String(err))`. Errors crossing worker boundaries (a failed `transferable`, a worker OOM) are silently dropped.

**File:line evidence:**
- `lib/converters/image-ocr.ts:481` — Florence catch → `console.warn`, swallows `florenceErr`
- `lib/converters/image-ocr.ts:542` — TrOCR catch → `console.warn`, swallows `trocErr`
- `lib/converters/image-ocr.ts:760` — outer catch → `new Error(String(err))` loses stack/type
- `lib/ocr/tesseract-client.ts:54–59` — getWorker catch re-throws after cleanup (OK)
- `lib/ocr/tesseract-client.ts:96–103` — recognize catch re-throws (OK)
- `lib/ocr/trocr-client.ts:49–51` — variant catch → `console.warn`, continues cascade
- `lib/ocr/column-detector.ts:185–187, 231–233` — column/row detection swallows canvas errors → null

**Fix direction:** The Phase 3 instrumentation added to this branch already addresses this by hooking `diagError` into every catch block and adding `window.onerror` + `unhandledrejection` handlers. No production code changes needed beyond the debug panel; the real fix is surfacing the original error in production error UI (future prompt).

---

### F5 — WebGPU backend used for Florence-2; unavailable on most Android Chrome

**Severity:** Medium  
**Platform:** Android  
**Confidence:** Hypothesis — requires device testing to confirm  
**Symptom:** Florence model fails to load → silent TrOCR cascade on Android

Florence-2 is loaded in `transformers-worker.ts` with `dtype: 'q8'`. The transformers.js library defaults to WebGPU when available, WASM otherwise. WebGPU is not available in Android Chrome for most users (requires Chrome 121+ and a compatible GPU driver; many Android devices serve a WebGL-only or WASM-only environment). If backend init fails inside the worker, the error is wrapped and posted back as `{ type: 'error', message: ... }`, which the client at `lib/converters/transformers-client.ts:43–48` rejects — surfacing potentially as the user-visible error.

**File:line evidence:**
- `lib/converters/transformers-worker.ts:113` — `dtype: 'q8'` with no explicit `device` override
- `lib/converters/transformers-client.ts:43–48` — worker error handler calls `reject(err)`
- `lib/ocr/florence-ocr-client.ts:121` — calls `loadTransformersModel` which calls `loadTransformersModel` → rejects if worker errors

**Fix direction:** Add explicit `device: 'wasm'` to Florence's pipeline call in `transformers-worker.ts` as a safe default, or add a `navigator.gpu` capability check before attempting WebGPU init in the worker.

---

### F6 — HEIC detection uses MIME type + extension only; camera photos may have wrong MIME

**Severity:** Low–Medium  
**Platform:** iOS  
**Confidence:** Hypothesis  
**Symptom:** iPhone camera photo misrouted to standard decode path → `createImageBitmap` fails on HEIC bytes

The `isHeic()` function at `lib/converters/image-ocr.ts:22–28` checks `file.type` and the `.heic`/`.heif` filename extension. iPhone photos shared from the Photos app or captured via the camera input element can arrive with `type: ''` (empty) or `type: 'application/octet-stream'` when the browser doesn't recognize the format. In that case `isHeic()` returns false, the HEIC binary is passed directly to `createImageBitmap()`, which fails. The failure is caught by the outer catch at line 760 and the original error is lost.

**File:line evidence:**
- `lib/converters/image-ocr.ts:22–28` — `isHeic()` implementation
- `lib/converters/image-ocr.ts:441–444` — HEIC decode conditional

**Fix direction:** Add magic-byte detection as a fallback: read the first 12 bytes of the file, check for `ftyp` at offset 4 (`0x66 0x74 0x79 0x70`), which is present in all HEIC/MP4/M4A containers including HEIC variants (`heic`, `mif1`, `msf1`).

---

### F7 — No image downscale before Florence inference

**Severity:** Medium  
**Platform:** Both  
**Confidence:** Medium — needs runtime trace to confirm exact dimensions passed  
**Symptom:** Contributing factor to F1 (memory) on high-res photos

The preprocessing pipeline in `lib/ocr/preprocessing.ts` upscales images to `MIN_WIDTH_PX = 1500` (line 5) for Tesseract accuracy. The `preprocessForOcrDual()` call at `image-ocr.ts:458` produces a grayscale blob at `max(1500, origW)` pixels wide. This grayscale blob is passed to Florence-2 at potentially 3000–6000 px wide for a 12 MP photo, creating a large decoded bitmap in the worker alongside the 262 MB model weights.

**File:line evidence:**
- `lib/ocr/preprocessing.ts:5` — `const MIN_WIDTH_PX = 1500`
- `lib/ocr/preprocessing.ts:127–129` — `scale = Math.max(1, minWidth / outW)` — upscales, never downscales
- `lib/converters/image-ocr.ts:458` — `grayBlob` passed to Florence without size capping

**Fix direction:** Cap the image passed to AI inference (Florence, TrOCR) at ≤1024 px on the longest edge before calling the model. A separate preprocessing path for AI inference (different from the Tesseract upscale path) is the cleanest solution.

---

### F8 — OffscreenCanvas fallbacks return null/empty silently

**Severity:** Low  
**Platform:** Older Safari/Android WebView  
**Confidence:** Low  
**Symptom:** Silent empty OCR output; not a crash

When `typeof OffscreenCanvas === 'undefined'`, preprocessing functions return `null` or the raw blob unchanged. The caller receives no error — it just gets empty or un-preprocessed input to OCR. This is unlikely to cause the observed crashes but could explain silent failures on older devices.

**File:line evidence:**
- `lib/converters/image-ocr.ts:33` — `if (typeof OffscreenCanvas === 'undefined') return blob`
- `lib/ocr/preprocessing.ts:62` — `if (typeof OffscreenCanvas === 'undefined') return null`

**Fix direction:** The Phase 3 diagLog('preprocess-canvas', ...) hook will confirm whether this path is taken on the test devices. If so, a fallback using a regular `<canvas>` element (which is available in all browsers) should be added.

---

## Root-cause Hypotheses

### (a) iOS Safari silent tab reload

Ranked by confidence:

1. **F1 + F2 (OOM, ~95% confidence):** The combined resident footprint of Florence-2 (262 MB) + TrOCR-base (800 MB fp32) + decoded image + preprocessing canvases reaches 1.1–1.2 GB, triggering WKWebView's tab kill. The kill is silent (no JS error) and the page reloads. TrOCR's main-thread blocking (F2) may additionally trigger iOS's "page unresponsive" watchdog independently of OOM.

2. **F7 (contributing factor, ~60% confidence):** Full-resolution image passed to models inflates peak allocation — in the same heap window as model loading, this pushes over the limit even when individual components are under threshold.

### (b) Android Chrome "cannot process image" error

Ranked by confidence:

1. **F5 (WebGPU init failure → swallowed error, ~70% confidence):** Florence-2 worker attempts WebGPU on a device/driver that doesn't support it. The backend init error propagates through `loadTransformersModel` reject handler. Since F4 means no global error handler and the catch blocks at `image-ocr.ts:481` only `console.warn`, the error may be presented via the tool shell's generic error path. The string "cannot process image" may come from a lower-level Android WebView error that appears in the dev tools console (not from ConvertYard code).

2. **F1 (Android OOM, ~50% confidence):** Android Chrome also has a memory budget (lower than desktop, typically 512 MB–1 GB on mid-range devices). Loading TrOCR-base fp32 at ~800 MB may OOM and throw a catchable JS error, which image-ocr.ts:542 catches and `console.warn`s before re-falling-back to Tesseract. If Tesseract also fails, the outer catch at line 760 returns a generic `Error(String(err))` which the tool shell renders as the error message.

3. **F6 (HEIC on wrong path, ~30% confidence):** If an Android user uploads a HEIC file with the wrong MIME type, `createImageBitmap()` fails with a browser-level error that may be described as "cannot process image" by the Chromium implementation.

---

## Proposed Fix Directions (No Code — Reference Only)

| Finding | Direction |
|---|---|
| F1 Memory | Switch TrOCR to q8 when a working quantized model is available; until then, cap to TrOCR-small only on mobile (use `navigator.deviceMemory < 4` as heuristic); add explicit dispose after model use |
| F2 Main thread | Move TrOCR to `transformers-worker.ts` using the same `{ type: 'infer', modelType: 'trocr' }` pattern as Florence/alt-text |
| F3 Unknown string | Run `?debug=1` on Android to get the real error — finding 3's fix direction depends on the real message |
| F4 Error swallowing | Wrap inner errors with original cause: `new Error('TrOCR failed: ' + trocErr.message, { cause: trocErr })` and propagate to tool shell; show real error in UI |
| F5 WebGPU | Add `device: 'wasm'` to Florence pipeline options in `transformers-worker.ts` as safe mobile default; or feature-detect `navigator.gpu` before attempting WebGPU |
| F6 HEIC detection | Add 12-byte magic-byte HEIC detection fallback after MIME+extension check |
| F7 No downscale | Add a `resizeForAiInference(blob, maxPx = 1024)` helper; call it before passing `grayBlob` to Florence and before cropping line blobs for TrOCR |
| F8 OffscreenCanvas fallback | When OffscreenCanvas unavailable, fall back to `document.createElement('canvas')` in preprocessing |

---

## Testing Instructions: `?debug=1`

### Setup

1. Deploy the branch to a Cloudflare Pages preview URL (or use `npm run dev` with `ngrok`/`cloudflared tunnel`)
2. On your test device, open: `https://<preview-url>/screenshot-to-text?debug=1`
3. You should see a dark panel at the bottom of the screen with the yellow `[CY Debug]` header

### iPhone (Safari)

**Test steps:**
1. Open `?debug=1` URL in Safari
2. Select AI mode (the toggle labeled "AI Enhanced" or similar)
3. Drop or select a photo from your camera roll (ideally a 12 MP photo, not a screenshot)
4. Watch the debug panel — it will log each pipeline stage as it runs
5. When the tab reloads (expected), immediately reopen the same `?debug=1` URL
6. The panel will show "── RESTORED FROM PREVIOUS SESSION ──" followed by all logged stages before the kill

**Report back:**
- What was the last logged stage before the reload? (e.g. `florence-stage-start`, `before-florence memory`, `trocr-stage-start`, `before-trocr memory`)
- What memory readings appeared? (look for `memory:before-florence used=XXMb` etc.)
- Did `memory API unavailable (Safari)` appear? (expected — confirms Safari)
- Did any `window.onerror` or `unhandledrejection` entries appear?

### Android Chrome

**Test steps:**
1. Open `?debug=1` URL in Chrome
2. Enable AI mode
3. Drop or select a photo
4. Watch for the error

**Report back:**
- What error message appears in the debug panel under `image-ocr-outer-catch` or `trocr-stage-fail` or `model-load-fail`?
- What are the `memory:before-florence` and `memory:before-trocr` readings? (Chrome exposes `performance.memory`)
- Did `model-load-fail` appear? If so, what is the error message?
- Did `trocr-pipeline-variant-fail` appear for both variants (base and small)?
- Screenshot the full debug panel log

---

*Instrumentation commit: `debug: add local-only mobile OCR diagnostics behind ?debug=1 flag`*  
*Do not merge to main. Branch: `debug/mobile-ocr-ai-investigation`*
