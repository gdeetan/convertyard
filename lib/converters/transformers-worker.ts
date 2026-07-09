/// <reference lib="webworker" />

// Runs entirely in a Web Worker — never imported server-side.
// Models are cached in browser IndexedDB/Cache Storage by transformers.js after first download.
//
// Background removal uses Xenova/modnet (MIT license, ~14 MB quantized).
// Alt text uses onnx-community/Florence-2-base-ft (~262 MB q8), self-hosted on
// Cloudflare R2 (pub-4e06a0715aae49b1975bbe46902137a3.r2.dev) to avoid HuggingFace
// auth/availability dependency. Florence-2 understands diverse product imagery and
// uses task tokens (<CAPTION>, <DETAILED_CAPTION>, <MORE_DETAILED_CAPTION>).
//
// HuggingFace now requires auth even for public Xenova models.
// HF_TOKEN is injected at build time by webpack DefinePlugin from the Cloudflare Pages
// environment variable. The token is read-only and only grants access to public models.

// Injected at build time — empty string when env var is not set
declare const __HF_TOKEN__: string

export type ModelType = 'bg-removal' | 'alt-text' | 'ocr' | 'table-vlm'

interface LoadMsg { type: 'load'; modelType: ModelType }
interface InferMsg {
  type: 'infer'
  id: string
  modelType: ModelType
  buffer: ArrayBuffer
  mimeType: string
  opts: { maxTokens?: number; outputFormat?: string; contextHint?: string; filename?: string; prompt?: string }
}
type IncomingMsg = LoadMsg | InferMsg

// ── State ─────────────────────────────────────────────────────────────────────

let bgModel: unknown = null
let bgProcessor: unknown = null
let altModel: unknown = null
let altProcessor: unknown = null
let vlmModel: unknown = null
let vlmProcessor: unknown = null
let vlmDevice: 'webgpu' | 'wasm' = 'wasm'
const QWEN_MODEL_ID = 'onnx-community/Qwen2.5-VL-3B-Instruct-ONNX'
const SMOLVLM_MODEL_ID = 'HuggingFaceTB/SmolVLM-500M-Instruct'
// ── Aggregated download progress tracker ──────────────────────────────────────

function makeProgressCallback(modelType: ModelType) {
  const downloaded: Record<string, number> = {}
  const totals: Record<string, number> = {}

  return (info: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (info.status === 'progress' && info.file && info.loaded != null && info.total != null) {
      downloaded[info.file] = info.loaded
      totals[info.file] = info.total
      const totalDown = Object.values(downloaded).reduce((a, b) => a + b, 0)
      const totalExpected = Object.values(totals).reduce((a, b) => a + b, 0)
      const pct = totalExpected > 0 ? Math.round((totalDown / totalExpected) * 100) : 0
      self.postMessage({ type: 'model-progress', modelType, progress: pct })
    }
  }
}

// ── HuggingFace auth ──────────────────────────────────────────────────────────

let _authReady = false

async function ensureHfAuth() {
  if (_authReady) return
  _authReady = true
  if (!__HF_TOKEN__) return
  const { env } = await import('@huggingface/transformers')
  const _fetch = env.fetch
  env.fetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const u = url instanceof Request ? url.url : url instanceof URL ? url.href : String(url)
    if (u.includes('huggingface.co') || u.includes('hf.co')) {
      const headers = new Headers((init?.headers ?? {}) as HeadersInit)
      headers.set('Authorization', `Bearer ${__HF_TOKEN__}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return _fetch(u as any, { ...init, headers })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return _fetch(url as any, init)
  }
}

// ── Model loaders ─────────────────────────────────────────────────────────────

async function loadBgModel() {
  if (bgModel && bgProcessor) return
  await ensureHfAuth()

  const { AutoModelForImageSegmentation, AutoImageProcessor } =
    await import('@huggingface/transformers')

  const cb = makeProgressCallback('bg-removal')

  bgProcessor = await AutoImageProcessor.from_pretrained('Xenova/modnet', {
    progress_callback: cb,
  })
  bgModel = await AutoModelForImageSegmentation.from_pretrained('Xenova/modnet', {
    dtype: 'q8',
    progress_callback: cb,
  })
}

async function loadAltModel(progressType: ModelType = 'alt-text') {
  if (altModel && altProcessor) return
  await ensureHfAuth()

  const { AutoModelForImageTextToText, AutoProcessor, env } = await import('@huggingface/transformers')
  const cb = makeProgressCallback(progressType)
  const MODEL_ID = 'onnx-community/Florence-2-base-ft'
  const R2_HOST = 'https://pub-4e06a0715aae49b1975bbe46902137a3.r2.dev/'

  async function tryLoad(useR2: boolean) {
    const prev = env.remoteHost
    if (useR2) env.remoteHost = R2_HOST
    try {
      altProcessor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback: cb })
      altModel = await AutoModelForImageTextToText.from_pretrained(MODEL_ID, { dtype: 'q8', progress_callback: cb })
    } finally {
      env.remoteHost = prev
    }
  }

  try {
    await tryLoad(true)   // R2 first (faster, no auth needed)
  } catch {
    await tryLoad(false)  // HF Hub fallback (uses __HF_TOKEN__)
  }
}

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

// ── Inference: background removal ─────────────────────────────────────────────

async function runBgRemoval(
  id: string,
  buffer: ArrayBuffer,
  mimeType: string,
  outputFormat: string
) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  const image = await RawImage.fromBlob(blob)

  self.postMessage({ type: 'infer-progress', id, progress: 10 })

  // Preprocess
  const processor = bgProcessor as {
    (img: unknown): Promise<{ pixel_values: unknown }>
  }
  const model = bgModel as {
    (inputs: Record<string, unknown>): Promise<Record<string, unknown>>
  }

  const { pixel_values } = await processor(image)
  self.postMessage({ type: 'infer-progress', id, progress: 30 })

  // MODNet's ONNX input is named 'input', not 'pixel_values'
  const modelOutputs = await model({ input: pixel_values })
  self.postMessage({ type: 'infer-progress', id, progress: 70 })

  // Handle both array outputs (RMBG-style) and direct tensor outputs (MODNet-style)
  const rawOutput = modelOutputs.output
  type MaskTensor = { mul: (n: number) => MaskTensor; to: (t: string) => MaskTensor; squeeze: (d: number) => MaskTensor; dims: number[] }
  const maskRaw = (Array.isArray(rawOutput) ? rawOutput[0] : rawOutput) as MaskTensor

  // If 4D [1, 1, H, W] squeeze batch dim to 3D [1, H, W] — RawImage.fromTensor requires 3D
  const maskTensor = maskRaw.dims.length === 4 ? maskRaw.squeeze(0) : maskRaw

  // Build mask (single-channel, 0–255)
  const tensor = maskTensor.mul(255).to('uint8')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mask = await RawImage.fromTensor(tensor as any)
  const resizedMask = await mask.resize(image.width, image.height)

  self.postMessage({ type: 'infer-progress', id, progress: 85 })

  // Composite: original image + mask as alpha
  const rgbaImage = image.rgba()
  const canvas = new OffscreenCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')!

  const imgData = new ImageData(
    new Uint8ClampedArray(rgbaImage.data.buffer as ArrayBuffer),
    image.width,
    image.height
  )
  ctx.putImageData(imgData, 0, 0)

  const composited = ctx.getImageData(0, 0, image.width, image.height)
  for (let i = 0; i < resizedMask.data.length; i++) {
    composited.data[4 * i + 3] = resizedMask.data[i]
  }
  ctx.putImageData(composited, 0, 0)

  const outMime = outputFormat === 'webp' ? 'image/webp' : 'image/png'
  const resultBlob = await canvas.convertToBlob({ type: outMime })
  const resultBuffer = await resultBlob.arrayBuffer()

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result: resultBuffer, outputMime: outMime }, [
    resultBuffer,
  ])
}

// ── Filename parser ───────────────────────────────────────────────────────────

// Returns a natural-language phrase from a filename for use as a Florence-2 context hint,
// or empty string if the filename is generic (IMG_20240101, DSC_0001, etc.)
function parseFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '')
  const words = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

  // Skip generic camera/device filenames
  if (/^(img|dsc|dcim|photo|image|screenshot|picture|clip|video|mov|file|document|scan|copy)\b/.test(words) && /\d{4,}/.test(words)) return ''
  if (/^\d+$/.test(words.replace(/\s/g, ''))) return ''
  if (words.length < 4) return ''

  // Smart casing: product codes with digits go uppercase (v15 → V15),
  // small connector words stay lowercase, everything else gets title-cased
  const SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with'])
  const titled = words.split(' ').map((w, i) => {
    if (i > 0 && SMALL.has(w)) return w
    if (/\d/.test(w)) return w.toUpperCase()
    return w.charAt(0).toUpperCase() + w.slice(1)
  }).join(' ')

  return `a photo of the ${titled}`
}

// ── Inference: alt text ───────────────────────────────────────────────────────

async function runAltText(
  id: string, buffer: ArrayBuffer, mimeType: string,
  maxTokens: number, contextHint?: string, filename?: string
) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  const image = await RawImage.fromBlob(blob)

  self.postMessage({ type: 'infer-progress', id, progress: 20 })

  // Map length preset to Florence-2 task tokens
  const taskToken = maxTokens <= 25 ? '<CAPTION>'
    : maxTokens <= 50 ? '<DETAILED_CAPTION>'
    : '<MORE_DETAILED_CAPTION>'

  // Compute hint for post-processing use (prepend/fallback after generation).
  // Florence-2 task tokens must be bare — never append text to the task prompt.
  const filenameHint = filename ? parseFilename(filename) : ''
  const hint = contextHint?.trim() || filenameHint
  const taskPrompt = taskToken

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processor = altProcessor as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = altModel as any

  // Florence-2: processor encodes image + task prompt → model.generate → processor decodes
  const inputs = await processor(image, taskPrompt)

  self.postMessage({ type: 'infer-progress', id, progress: 50 })

  const generatedIds = await model.generate({
    ...inputs,
    max_new_tokens: maxTokens,
  })

  // skip_special_tokens: false preserves task tokens so post_process_generation can strip them.
  const decoded: string[] = processor.batch_decode(generatedIds, { skip_special_tokens: false })
  const raw = decoded[0] ?? ''

  // Layer 1: Florence-2's canonical task token stripper.
  let text = ''
  try {
    const parsed = processor.post_process_generation(raw, taskToken, [image.height, image.width])
    if (typeof parsed === 'object' && parsed !== null && taskToken in parsed) {
      text = String(parsed[taskToken as keyof typeof parsed]).trim()
    }
  } catch {
    // post_process_generation unavailable; fall through to regex
  }

  // Layer 2: regex fallback for when ppg returns empty or throws.
  if (!text) {
    const taskTokenBare = taskToken.replace(/^<|>$/g, '')
    const gtIdx = raw.indexOf('>')
    const slice = gtIdx >= 0 ? raw.slice(gtIdx + 1) : raw
    text = slice
      .replace(/<[^>]*>/g, '')
      .replaceAll(taskTokenBare, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Apply context hint: prepend if not already referenced, or use as fallback if AI returned nothing.
  const hintSubject = hint.replace(/^a photo of the /i, '').toLowerCase()
  if (hint && text && !text.toLowerCase().includes(hintSubject)) {
    text = `${hint} — ${text}`
  }
  if (!text && hint) {
    text = hint
  }

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result: text })
}

// ── Inference: handwriting OCR (Florence-2 <OCR_WITH_REGION>) ────────────────
//
// Uses the same Florence-2 model as alt-text but with the OCR task token.
// Returns JSON: { quad_boxes: number[][], labels: string[] }
// The caller sorts regions by Y coordinate to reconstruct reading order.

async function runOcr(id: string, buffer: ArrayBuffer, mimeType: string) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  const image = await RawImage.fromBlob(blob)

  self.postMessage({ type: 'infer-progress', id, progress: 20 })

  const taskToken = '<OCR_WITH_REGION>'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processor = altProcessor as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = altModel as any

  const inputs = await processor(image, taskToken)
  self.postMessage({ type: 'infer-progress', id, progress: 50 })

  const generatedIds = await model.generate({ ...inputs, max_new_tokens: 1024 })
  const decoded: string[] = processor.batch_decode(generatedIds, { skip_special_tokens: false })
  const raw = decoded[0] ?? ''

  self.postMessage({ type: 'infer-progress', id, progress: 80 })

  let result = ''
  try {
    const parsed = processor.post_process_generation(raw, taskToken, [image.height, image.width])
    const regions = parsed?.[taskToken]
    if (regions && Array.isArray(regions.labels) && regions.labels.length > 0) {
      result = JSON.stringify({ quad_boxes: regions.quad_boxes ?? [], labels: regions.labels })
    }
  } catch {
    // post_process_generation failed — try plain <OCR> as fallback
  }

  // Fallback: if OCR_WITH_REGION produced nothing, try plain OCR
  if (!result) {
    try {
      const ocrToken = '<OCR>'
      const inputs2 = await processor(image, ocrToken)
      const ids2 = await model.generate({ ...inputs2, max_new_tokens: 512 })
      const dec2: string[] = processor.batch_decode(ids2, { skip_special_tokens: false })
      const parsed2 = processor.post_process_generation(dec2[0] ?? '', ocrToken, [image.height, image.width])
      const ocrText = String(parsed2?.[ocrToken] ?? '').trim()
      if (ocrText) result = JSON.stringify({ quad_boxes: [], labels: [ocrText] })
    } catch {
      // both failed — return empty
    }
  }

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result })
}

// ── Inference: table extraction (Qwen2.5-VL-3B on WebGPU, SmolVLM-500M on WASM) ──

async function runTableVlm(id: string, buffer: ArrayBuffer, mimeType: string, prompt: string) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  let image = await RawImage.fromBlob(blob)

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

  self.postMessage({ type: 'infer-progress', id, progress: 15 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processor = vlmProcessor as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = vlmModel as any

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'image' },
        { type: 'text', text: prompt },
      ],
    },
  ]

  const text = processor.apply_chat_template(messages, {
    tokenize: false,
    add_generation_prompt: true,
  })

  const inputs = await processor(text, [image], { padding: true })
  self.postMessage({ type: 'infer-progress', id, progress: 40 })

  const outputs = await model.generate({
    ...inputs,
    max_new_tokens: vlmDevice === 'wasm' ? 512 : 2048,
    repetition_penalty: 1.3,
  })

  self.postMessage({ type: 'infer-progress', id, progress: 85 })

  // transformers.js 4.x: slice(null, [N, null]) = all batches, seq_dim N to end (new tokens only)
  const newTokens = outputs.slice(null, [inputs.input_ids.dims[1], null])
  const decoded: string[] = processor.batch_decode(newTokens, { skip_special_tokens: true })
  const result = (decoded[0] ?? '').trim()

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result })
}

// ── Message router ────────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      if (msg.modelType === 'bg-removal') await loadBgModel()
      else if (msg.modelType === 'alt-text') await loadAltModel('alt-text')
      else if (msg.modelType === 'ocr') await loadAltModel('ocr')  // same Florence-2 model
      else if (msg.modelType === 'table-vlm') await loadTableVlmModel()
      self.postMessage({ type: 'model-ready', modelType: msg.modelType })
      if (msg.modelType === 'table-vlm') {
        self.postMessage({ type: 'model-device', modelType: 'table-vlm', device: vlmDevice })
      }
    } catch (err) {
      self.postMessage({ type: 'error', message: (err as Error).message })
    }
    return
  }

  if (msg.type === 'infer') {
    const { id, modelType, buffer, mimeType, opts } = msg
    try {
      if (modelType === 'bg-removal') {
        await runBgRemoval(id, buffer, mimeType, opts.outputFormat ?? 'png')
      } else if (modelType === 'alt-text') {
        await runAltText(id, buffer, mimeType, opts.maxTokens ?? 50, opts.contextHint, opts.filename)
      } else if (modelType === 'ocr') {
        await runOcr(id, buffer, mimeType)
      } else if (modelType === 'table-vlm') {
        const prompt = opts.prompt ?? 'Extract the table as CSV. First row: headers. No explanation, no markdown fences.'
        await runTableVlm(id, buffer, mimeType, prompt)
      }
    } catch (err) {
      self.postMessage({ type: 'error', id, message: (err as Error).message })
    }
  }
})
