# SmolVLM-500M WASM Fallback — Image to Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SmolVLM-500M-Instruct as the WASM fallback for image-to-excel. Qwen2.5-VL-3B (WebGPU) stays unchanged. WASM users get SmolVLM + an amber caveat banner + `(verify output)` filename suffix.

**Architecture:** Device detection already runs in `loadTableVlmModel()`. We branch at load time: WASM loads `HuggingFaceTB/SmolVLM-500M-Instruct` into the same `vlmModel`/`vlmProcessor` singletons; WebGPU loads Qwen2.5-VL-3B as before. The inference path (`runTableVlm`) branches only for image sizing. After `model-ready`, the worker emits `model-device` so the client can surface a banner and the converter can tag filenames.

**Tech Stack:** transformers.js 4.2.0, Next.js App Router (client component), TypeScript, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `lib/converters/transformers-worker.ts` | Branch `loadTableVlmModel()` on device; emit `model-device` after ready; fix WASM image sizing for SmolVLM |
| `lib/converters/transformers-client.ts` | Handle `model-device` msg; export `getVlmDevice()` |
| `lib/converters/image-to-excel-vlm.ts` | Append `(verify output)` to WASM result filenames |
| `components/tool-shell/tool-shell.tsx` | Add optional `notice?: React.ReactNode` prop, render above tool card |
| `app/(tools)/image-to-excel/page.tsx` | Client component; GPU detection; amber banner notice |
| `content/tools/image-to-excel.ts` | Update `limitationNote` to describe two-tier system |

---

### Task 1: Worker — branch loader + emit model-device + fix WASM image sizing

**Files:**
- Modify: `lib/converters/transformers-worker.ts`

- [ ] **Step 1: Add model ID constants**

In `transformers-worker.ts`, immediately after line 40 (`let vlmDevice: 'webgpu' | 'wasm' = 'wasm'`), insert:

```typescript
const QWEN_MODEL_ID = 'onnx-community/Qwen2.5-VL-3B-Instruct-ONNX'
const SMOLVLM_MODEL_ID = 'HuggingFaceTB/SmolVLM-500M-Instruct'
```

- [ ] **Step 2: Replace `loadTableVlmModel()` with branched implementation**

Replace the entire current `loadTableVlmModel` function (lines 129–157) with:

```typescript
async function loadTableVlmModel() {
  if (vlmModel && vlmProcessor) return
  await ensureHfAuth()

  const cb = makeProgressCallback('table-vlm')

  let device: 'webgpu' | 'wasm'
  try {
    const adapter = await (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu?.requestAdapter()
    device = adapter ? 'webgpu' : 'wasm'
  } catch {
    device = 'wasm'
  }
  vlmDevice = device

  if (device === 'webgpu') {
    const { Qwen2_5_VLForConditionalGeneration: Qwen2_5_VL, AutoProcessor } = await import('@huggingface/transformers')
    const dtype = {
      embed_tokens: 'fp16' as const,
      vision_encoder: 'fp16' as const,
      decoder_model_merged: 'q4' as const,
    }
    vlmProcessor = await AutoProcessor.from_pretrained(QWEN_MODEL_ID, { progress_callback: cb })
    vlmModel = await Qwen2_5_VL.from_pretrained(QWEN_MODEL_ID, { dtype, device, progress_callback: cb })
  } else {
    const { AutoModelForImageTextToText, AutoProcessor } = await import('@huggingface/transformers')
    vlmProcessor = await AutoProcessor.from_pretrained(SMOLVLM_MODEL_ID, { progress_callback: cb })
    vlmModel = await AutoModelForImageTextToText.from_pretrained(SMOLVLM_MODEL_ID, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: cb,
    })
  }
}
```

- [ ] **Step 3: Emit `model-device` after `model-ready` in the message router**

In the message router (around line 469), find:

```typescript
self.postMessage({ type: 'model-ready', modelType: msg.modelType })
```

Replace with:

```typescript
self.postMessage({ type: 'model-ready', modelType: msg.modelType })
if (msg.modelType === 'table-vlm') {
  self.postMessage({ type: 'model-device', modelType: 'table-vlm', device: vlmDevice })
}
```

- [ ] **Step 4: Update `runTableVlm()` image sizing — no 56px alignment for WASM**

In `runTableVlm()`, replace the entire image resize block (lines 404–414, the `PATCH`/`MAX_PX` block) with:

```typescript
const MAX_PX = vlmDevice === 'wasm' ? 512 : 1344

if (vlmDevice === 'webgpu') {
  // Qwen2.5-VL: spatial_merge_size=2 * patch_size=28 = 56px stride.
  // Both dims must be multiples of 56 or the ONNX tensor allocation mismatches.
  const PATCH = 56
  const scale = Math.min(1, MAX_PX / Math.max(image.width, image.height))
  const alignedW = Math.max(PATCH, Math.round((image.width * scale) / PATCH) * PATCH)
  const alignedH = Math.max(PATCH, Math.round((image.height * scale) / PATCH) * PATCH)
  if (alignedW !== image.width || alignedH !== image.height) {
    image = await image.resize(alignedW, alignedH)
  }
} else {
  // SmolVLM: no patch alignment required — cap to 512px
  const scale = Math.min(1, MAX_PX / Math.max(image.width, image.height))
  if (scale < 1) {
    image = await image.resize(Math.round(image.width * scale), Math.round(image.height * scale))
  }
}
```

Also update `max_new_tokens` in the `model.generate(...)` call:

```typescript
max_new_tokens: vlmDevice === 'wasm' ? 512 : 2048,
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/converters/transformers-worker.ts
git commit -m "feat: SmolVLM-500M WASM fallback in table-vlm loader; emit model-device"
```

---

### Task 2: Client — handle model-device, export getVlmDevice

**Files:**
- Modify: `lib/converters/transformers-client.ts`

- [ ] **Step 1: Add module-level device tracker and export**

After `let workerInstance: Worker | null = null` (line 3), add:

```typescript
let lastVlmDevice: 'webgpu' | 'wasm' = 'wasm'

export function getVlmDevice(): 'webgpu' | 'wasm' {
  return lastVlmDevice
}
```

- [ ] **Step 2: Capture `model-device` in the load handler**

Inside `loadTransformersModel()`, find the handler's `else if (d.type === 'model-ready' ...` branch and add a new case after it:

```typescript
} else if (d.type === 'model-device' && d.modelType === modelType) {
  lastVlmDevice = d.device as 'webgpu' | 'wasm'
}
```

The complete handler block becomes:

```typescript
const handler = (e: MessageEvent) => {
  const d = e.data
  if (d.type === 'model-progress' && d.modelType === modelType) {
    onProgress(d.progress as number)
  } else if (d.type === 'model-ready' && d.modelType === modelType) {
    worker.removeEventListener('message', handler)
    modelReady[modelType] = true
    delete loadingPromise[modelType]
    onProgress(100)
    resolve()
  } else if (d.type === 'model-device' && d.modelType === modelType) {
    lastVlmDevice = d.device as 'webgpu' | 'wasm'
  } else if (d.type === 'error' && !d.id) {
    worker.removeEventListener('message', handler)
    delete loadingPromise[modelType]
    reject(new Error(d.message as string))
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/transformers-client.ts
git commit -m "feat: track vlm device in client, export getVlmDevice()"
```

---

### Task 3: image-to-excel-vlm.ts — verify output filename suffix

**Files:**
- Modify: `lib/converters/image-to-excel-vlm.ts`

- [ ] **Step 1: Add getVlmDevice to the import**

Find the existing import line:

```typescript
import { loadTransformersModel, extractTableWithVlm } from '@/lib/converters/transformers-client'
```

Replace with:

```typescript
import { loadTransformersModel, extractTableWithVlm, getVlmDevice } from '@/lib/converters/transformers-client'
```

- [ ] **Step 2: Use device-aware output filename**

In `imageToExcelVlm()`, find:

```typescript
const baseName = file.name.replace(/\.[^.]+$/, '')
```

Replace with:

```typescript
const baseName = file.name.replace(/\.[^.]+$/, '')
const outputName = getVlmDevice() === 'wasm' ? `${baseName} (verify output)` : baseName
```

Then change the two references from `baseName` to `outputName` in the file/sheet name:

```typescript
const xlsxBytes = toXlsx(rows, outputName)
results.push(
  new File(
    [xlsxBytes as unknown as Uint8Array<ArrayBuffer>],
    `${outputName}.xlsx`,
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  )
)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/image-to-excel-vlm.ts
git commit -m "feat: append '(verify output)' suffix to WASM-converted filenames"
```

---

### Task 4: ToolShell — add optional notice prop

**Files:**
- Modify: `components/tool-shell/tool-shell.tsx`

- [ ] **Step 1: Add `notice` to ToolShellProps**

Find the `ToolShellProps` interface (around line 38):

```typescript
interface ToolShellProps {
  config: ToolConfig
  embedded?: boolean
  onResults?: (results: File[]) => void
  initialOptions?: ToolOptions
}
```

Add the notice prop:

```typescript
interface ToolShellProps {
  config: ToolConfig
  embedded?: boolean
  onResults?: (results: File[]) => void
  initialOptions?: ToolOptions
  notice?: React.ReactNode
}
```

- [ ] **Step 2: Destructure notice in the component signature**

Find:

```typescript
export function ToolShell({ config, embedded = false, onResults, initialOptions }: ToolShellProps) {
```

Replace with:

```typescript
export function ToolShell({ config, embedded = false, onResults, initialOptions, notice }: ToolShellProps) {
```

- [ ] **Step 3: Render notice between the header and the main tool card**

Find the comment line (around line 283):

```tsx
      {/* ── Main tool card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
```

Insert the notice block immediately before it:

```tsx
      {/* ── Optional notice banner ──────────────────────────────────────── */}
      {notice && <div className="mb-4">{notice}</div>}

      {/* ── Main tool card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. `React.ReactNode` is already available — the file already imports from react at the top.

- [ ] **Step 5: Commit**

```bash
git add components/tool-shell/tool-shell.tsx
git commit -m "feat: add optional notice prop to ToolShell"
```

---

### Task 5: page.tsx — GPU detection + amber banner

**Files:**
- Modify: `app/(tools)/image-to-excel/page.tsx`

The current file is:
```tsx
'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/image-to-excel'

export default function Page() {
  return <ToolShell config={config} />
}
```

- [ ] **Step 1: Rewrite page.tsx with GPU detection**

Replace the entire file with:

```tsx
'use client'
import { useState, useEffect } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/image-to-excel'

export default function Page() {
  const [wasmOnly, setWasmOnly] = useState(false)

  useEffect(() => {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
    if (!gpu) {
      setWasmOnly(true)
      return
    }
    gpu.requestAdapter()
      .then(adapter => { if (!adapter) setWasmOnly(true) })
      .catch(() => setWasmOnly(true))
  }, [])

  const notice = wasmOnly ? (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <strong>GPU acceleration not detected</strong> — a lightweight fallback model (~200 MB) will be used instead of the full model (~1.8 GB). Results may be less accurate. Verify output before use.
    </div>
  ) : null

  return <ToolShell config={config} notice={notice} />
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/(tools)/image-to-excel/page.tsx'
git commit -m "feat: show amber caveat banner when WebGPU unavailable (WASM fallback)"
```

---

### Task 6: Update limitationNote in tool config

**Files:**
- Modify: `content/tools/image-to-excel.ts`

- [ ] **Step 1: Replace limitationNote**

Find:

```typescript
  limitationNote: {
    summary: 'Uses a local AI model (~1.8 GB download on first use)',
    body: 'Qwen2.5-VL-3B runs entirely in your browser via WebGPU. First use downloads ~1.8 GB which is then cached — subsequent conversions start immediately. Handles complex multi-column tables, merged headers, and N/A values accurately. Extremely dense nested tables may still need minor cleanup.',
  },
```

Replace with:

```typescript
  limitationNote: {
    summary: 'Model size depends on your browser',
    body: 'Chrome/Edge with GPU: uses Qwen2.5-VL-3B-Instruct (~1.8 GB, one-time download, then cached) — accurate on complex tables. Safari/Firefox or no GPU: uses SmolVLM-500M (~200 MB) — results may need verification. All processing runs locally; files never leave your device.',
  },
```

- [ ] **Step 2: Commit**

```bash
git add content/tools/image-to-excel.ts
git commit -m "docs: update limitationNote to describe two-tier WebGPU/WASM model selection"
```

---

### Task 7: Build verification + deploy

- [ ] **Step 1: Run full build**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm run build 2>&1 | tail -30
```

Expected: exits 0, static export written to `/out`.

- [ ] **Step 2: Fix any build errors**

If the build fails, common causes:
- Import path typo: `@/lib/converters/transformers-client` (verify exact path)
- `React.ReactNode` not imported in tool-shell.tsx — if TS errors, add `import type { ReactNode } from 'react'` and use `ReactNode` instead of `React.ReactNode`
- `'use client'` already present on page.tsx — that's correct, leave it

- [ ] **Step 3: Push to deploy**

```bash
git push origin main
```

Cloudflare Pages auto-deploys from `main`. Build takes ~2 minutes.

- [ ] **Step 4: Smoke-test on production**

Open `https://convertyard.com/image-to-excel/` in two browsers:

**Chrome (WebGPU expected):**
- Amber banner should NOT appear
- After conversion, output filename should NOT have `(verify output)` suffix

**Safari or Firefox (WASM expected):**
- Amber banner SHOULD appear immediately on page load
- After conversion, output filename SHOULD end in `(verify output).xlsx`

Or run the Playwright script:

```bash
cd /Users/garrickdeetan/Documents/Covertyard && node scripts/test-image-to-excel.mjs
```

Check console for `[model-device]` message (add logging to the script's Worker intercept if needed) and `[vlm-output]` confirming the model generated output.
