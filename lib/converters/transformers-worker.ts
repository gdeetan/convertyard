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

export type ModelType = 'bg-removal' | 'alt-text'

interface LoadMsg { type: 'load'; modelType: ModelType }
interface InferMsg {
  type: 'infer'
  id: string
  modelType: ModelType
  buffer: ArrayBuffer
  mimeType: string
  opts: { maxTokens?: number; outputFormat?: string; contextHint?: string; filename?: string }
}
type IncomingMsg = LoadMsg | InferMsg

// ── State ─────────────────────────────────────────────────────────────────────

let bgModel: unknown = null
let bgProcessor: unknown = null
let altModel: unknown = null
let altProcessor: unknown = null

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

async function loadAltModel() {
  if (altModel && altProcessor) return
  await ensureHfAuth()

  const { AutoModelForImageTextToText, AutoProcessor, env } = await import('@huggingface/transformers')
  const cb = makeProgressCallback('alt-text')

  // Florence-2 requires AutoModelForImageTextToText — the image-to-text pipeline
  // uses AutoModelForVision2Seq which doesn't include florence2 in its registry.
  // Model is self-hosted on Cloudflare R2; no HuggingFace auth required.
  const prevRemoteHost = env.remoteHost
  env.remoteHost = 'https://pub-4e06a0715aae49b1975bbe46902137a3.r2.dev/'
  try {
    altProcessor = await AutoProcessor.from_pretrained('onnx-community/Florence-2-base-ft', {
      progress_callback: cb,
    })
    altModel = await AutoModelForImageTextToText.from_pretrained('onnx-community/Florence-2-base-ft', {
      dtype: 'q8',
      progress_callback: cb,
    })
  } finally {
    env.remoteHost = prevRemoteHost
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

// Returns a human-readable description from a filename, or empty string if
// the filename is generic (camera roll patterns like IMG_20240101, DSC_0001, etc.)
function parseFilename(name: string): string {
  // Strip extension
  const base = name.replace(/\.[^.]+$/, '')
  // Replace separators with spaces
  const words = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  // Skip generic camera/device filenames — all digits, or known patterns
  if (/^(img|dsc|dcim|photo|image|screenshot|picture|clip|video|mov|file|document|scan|copy)\b/i.test(words) && /\d{4,}/.test(words)) return ''
  if (/^\d+$/.test(words.replace(/\s/g, ''))) return ''
  // Require at least 2 meaningful characters after cleanup
  if (words.length < 4) return ''
  return words.toLowerCase()
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

  // Build task prompt: manual hint > parsed filename > task token alone
  const filenameHint = filename ? parseFilename(filename) : ''
  const hint = contextHint?.trim() || filenameHint
  const taskPrompt = hint ? `${taskToken} ${hint}` : taskToken

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

  // batch_decode with skip_special_tokens:false keeps task tokens for post_process_generation
  const rawDecoded: string[] = processor.batch_decode(generatedIds, { skip_special_tokens: false })

  // post_process_generation strips task tokens and returns clean caption text
  const parsed = processor.post_process_generation(
    rawDecoded[0] ?? '',
    taskToken,
    [image.height, image.width],
  )
  const text = (parsed[taskToken] ?? rawDecoded[0] ?? '').trim()

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result: text })
}

// ── Message router ────────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      if (msg.modelType === 'bg-removal') await loadBgModel()
      else await loadAltModel()
      self.postMessage({ type: 'model-ready', modelType: msg.modelType })
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
      } else {
        await runAltText(id, buffer, mimeType, opts.maxTokens ?? 50, opts.contextHint, opts.filename)
      }
    } catch (err) {
      self.postMessage({ type: 'error', id, message: (err as Error).message })
    }
  }
})
