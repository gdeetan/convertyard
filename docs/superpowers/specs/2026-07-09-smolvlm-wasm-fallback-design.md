# SmolVLM-500M WASM Fallback for Image-to-Excel

**Date:** 2026-07-09  
**Status:** Approved  
**Scope:** `lib/converters/transformers-worker.ts`, `lib/converters/transformers-client.ts`, `lib/converters/image-to-excel-vlm.ts`, `app/(tools)/image-to-excel/page.tsx`

---

## Problem

The current image-to-excel tool uses a single model path: Qwen2.5-VL-3B-Instruct (ONNX) via transformers.js. On browsers with WebGPU this works reliably, but on WASM-only browsers (Safari, Firefox, most mobile) the 3B model at q8 precision frequently hits WASM memory limits (`std::bad_alloc`, ERROR_CODE 6) for images with many table rows.

We need a lighter model for WASM that fits within WASM constraints while still providing useful (if lower-accuracy) output.

---

## Design

### Two-tier model routing

| Device | Model | Precision | Max image | Max tokens |
|--------|-------|-----------|-----------|------------|
| WebGPU | `Hugging-Face-no-rob/Qwen2.5-VL-3B-Instruct-ONNX` | q4f16 | 1344px | 2048 |
| WASM | `HuggingFaceTB/SmolVLM-500M-Instruct` | q8 | 512px | 512 |

Device detection uses `navigator.gpu?.requestAdapter()` — if it resolves to a non-null adapter, use WebGPU; otherwise fall back to WASM.

---

## Components

### `transformers-worker.ts`

`loadTableVlmModel()` already detects `device` and sets `vlmDevice`. Extend to branch model load:

- **WebGPU path** — unchanged: `Qwen2_5_VLForConditionalGeneration.from_pretrained(QWEN_MODEL_ID, { dtype: 'q4f16', device: 'webgpu' })`
- **WASM path** — new: `AutoModelForImageTextToText.from_pretrained(SMOLVLM_MODEL_ID, { dtype: 'q8', device: 'wasm' })`

After `model-ready` fires, emit a `model-device` message: `{ type: 'model-device', modelType: 'table-vlm', device: vlmDevice }`. This lets the client inform the UI without coupling the worker to UI logic.

`runTableVlm()` branches on `vlmDevice`:

- **WebGPU** — existing Qwen path: cap 1344px, align to 56px multiples, use `Qwen2_5_VLProcessor`, `max_new_tokens: 2048`
- **WASM** — new SmolVLM path: cap 512px (no patch alignment needed), use `AutoProcessor`, `max_new_tokens: 512`

Both paths share the same `TABLE_EXTRACTION_PROMPT` and the same `[vlm-output]` result message shape. No changes to the IPC protocol.

### `transformers-client.ts`

Add `getVlmDevice()` export that returns the last `model-device` value received from the worker. The `extractTableWithVlm()` handler already forwards `infer-result` — no change to that path. Add a handler in the `loadTransformersModel()` message listener that saves `model-device` into a module-level variable.

### `image-to-excel-vlm.ts`

After a successful conversion, if `getVlmDevice() === 'wasm'`, append ` (verify output)` to the output filename before the `.xlsx` extension. Example: `my-table (verify output).xlsx`.

This is a passive signal — no modal, no blocking — that tells the user the lightweight model was used.

### `app/(tools)/image-to-excel/page.tsx`

On component mount, run GPU detection:

```ts
useEffect(() => {
  navigator.gpu?.requestAdapter().then(adapter => {
    if (!adapter) setWasmOnly(true)
  }).catch(() => setWasmOnly(true))
}, [])
```

When `wasmOnly` is true, render an amber banner above the dropzone:

> ⚠️ GPU acceleration not detected — a lightweight fallback model will be used. Results may be less accurate. Verify output before use.

Banner disappears once the model signals WebGPU (i.e., `model-device` arrives with `device: 'webgpu'`). This handles the case where GPU detection incorrectly returns null at mount time.

---

## Data flow

```
page.tsx          transformers-client.ts     transformers-worker.ts
  |                        |                          |
  |-- mount GPU check -->  |                          |
  |<-- wasmOnly flag ----  |                          |
  |                        |-- load('table-vlm') --> |
  |                        |<-- model-device -------- |
  |<-- setWasmOnly(false) -|  (if webgpu)             |
  |                        |                          |
  |-- drop file ---------->|                          |
  |                        |-- infer(table-vlm) ---> |
  |                        |<-- infer-result -------- |
  |<-- ConversionResult -- |  (CSV string)            |
```

---

## Error handling

- If SmolVLM fails to load (network error, ONNX error), the worker emits `type: 'error'` — same as current behavior. The tool page shows the standard error state.
- If SmolVLM inference times out or produces empty CSV, `image-to-excel-vlm.ts` throws `'No table data found in image'` — same as current behavior.
- No silent fallbacks within the WASM path — fail loudly so the user sees the error rather than a corrupt spreadsheet.

---

## Accuracy expectations

SmolVLM-500M on WASM is significantly less capable than Qwen2.5-VL-3B on WebGPU. Expected accuracy:

- Simple 3–4 column tables with clear headers: reasonable
- Dense tables (10+ columns, many rows): likely to miss rows or merge columns
- Tables with merged cells or complex formatting: unreliable

The `(verify output)` filename suffix and the amber UI banner communicate this limitation to the user without blocking the conversion.

---

## Out of scope

- Improving SmolVLM accuracy (prompt tuning, post-processing) — separate sprint
- Showing per-file model badges in the result list
- Auto-retry with a different model if the first fails
