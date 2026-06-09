/// <reference lib="webworker" />

// Runs entirely in a Web Worker — never imported server-side.
// Models are cached in browser IndexedDB/Cache Storage by transformers.js after first download.
//
// Background removal uses Xenova/modnet (MIT license, ~14 MB quantized).
// Upgrade path: ZhengPeng7/BiRefNet (MIT) once ONNX weights are on HuggingFace,
// or license briaai/RMBG-1.4 commercially if hair/fur edge quality becomes a complaint.

export type ModelType = 'bg-removal' | 'alt-text'

interface LoadMsg { type: 'load'; modelType: ModelType }
interface InferMsg {
  type: 'infer'
  id: string
  modelType: ModelType
  buffer: ArrayBuffer
  mimeType: string
  opts: { maxTokens?: number; outputFormat?: string }
}
type IncomingMsg = LoadMsg | InferMsg

// ── State ─────────────────────────────────────────────────────────────────────

let bgModel: unknown = null
let bgProcessor: unknown = null
let altPipeline: unknown = null

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

// ── Model loaders ─────────────────────────────────────────────────────────────

async function loadBgModel() {
  if (bgModel && bgProcessor) return

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
  if (altPipeline) return

  const { pipeline } = await import('@huggingface/transformers')

  const cb = makeProgressCallback('alt-text')

  // Florence-2-base: compact VLM with strong captioning, Apache 2.0
  altPipeline = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
    dtype: 'q8',
    progress_callback: cb,
  })
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
  const maskTensor = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput

  // Build mask (single-channel, 0–255)
  const tensor = (maskTensor as { mul: (n: number) => { to: (t: string) => unknown } })
    .mul(255)
    .to('uint8')
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

// ── Inference: alt text ───────────────────────────────────────────────────────

async function runAltText(id: string, buffer: ArrayBuffer, mimeType: string, maxTokens: number) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  const image = await RawImage.fromBlob(blob)

  self.postMessage({ type: 'infer-progress', id, progress: 20 })

  const pipe = altPipeline as (
    img: unknown,
    opts: { max_new_tokens: number }
  ) => Promise<Array<{ generated_text: string }>>

  const result = await pipe(image, { max_new_tokens: maxTokens })
  const text = result[0]?.generated_text?.trim() ?? ''

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
        await runAltText(id, buffer, mimeType, opts.maxTokens ?? 50)
      }
    } catch (err) {
      self.postMessage({ type: 'error', id, message: (err as Error).message })
    }
  }
})
