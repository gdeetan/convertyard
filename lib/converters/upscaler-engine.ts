// All imports are dynamic — this module is imported from tool configs that Next.js
// analyzes at build time. Static TF.js/UpscalerJS imports would fail SSR.

export type UpscaleScale = '2x' | '3x' | '4x' | '8x'

// ── TF.js init ────────────────────────────────────────────────────────────────

let _tfReady = false

async function initTf() {
  if (_tfReady) return
  _tfReady = true
  await import('@tensorflow/tfjs-backend-webgl')
  const tf = await import('@tensorflow/tfjs-core')
  // Prefer WebGL (GPU); silently fall back to CPU if WebGL unavailable
  const ok = await tf.setBackend('webgl').catch(() => false)
  if (!ok) await tf.setBackend('cpu')
  await tf.ready()
}

// ── Model import map (static strings — required for webpack bundle analysis) ──

async function importModel(scale: UpscaleScale) {
  switch (scale) {
    case '2x': return (await import('@upscalerjs/esrgan-slim/2x')).default
    case '3x': return (await import('@upscalerjs/esrgan-slim/3x')).default
    case '4x': return (await import('@upscalerjs/esrgan-slim/4x')).default
    case '8x': return (await import('@upscalerjs/esrgan-slim/8x')).default
  }
}

// ── Singleton Upscaler instances per scale ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instances: Partial<Record<UpscaleScale, any>> = {}
const readyMap: Partial<Record<UpscaleScale, boolean>> = {}
const loadingMap: Partial<Record<UpscaleScale, Promise<void>>> = {}

export function loadUpscalerModel(
  scale: UpscaleScale,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (readyMap[scale]) return Promise.resolve()
  if (loadingMap[scale]) return loadingMap[scale]!

  const p = (async () => {
    await initTf()
    const Upscaler = (await import('upscaler')).default
    const model = await importModel(scale)
    instances[scale] = new Upscaler({ model })
    onProgress?.(50)
    // Warmup: loads weights and pre-compiles WebGL shaders
    await instances[scale].warmup([{ patchSize: 64, padding: 2 }])
    readyMap[scale] = true
    delete loadingMap[scale]
    onProgress?.(100)
  })()

  loadingMap[scale] = p
  return p
}

// ── Image upscaling ───────────────────────────────────────────────────────────

const SAFE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function upscaleImageFile(
  file: File,
  scale: UpscaleScale,
  outputFormat: string | null,
  onProgress?: (pct: number) => void
): Promise<File> {
  const tf = await import('@tensorflow/tfjs-core')
  const upscaler = instances[scale]
  if (!upscaler) throw new Error(`Upscaler for ${scale} not loaded — call loadUpscalerModel first`)

  const rawMime = outputFormat ?? file.type
  const outMime = SAFE_MIMES.has(rawMime) ? rawMime : 'image/png'
  const outExt = outMime.split('/')[1]!
  const baseName = file.name.replace(/\.[^.]+$/, '')

  // Load image element from file blob
  const url = URL.createObjectURL(file)
  const img = await loadImg(url)
  URL.revokeObjectURL(url)

  onProgress?.(10)

  // GPU upscaling — TF.js WebGL operations are async (non-blocking)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tensor: any = await upscaler.upscale(img, {
    output: 'tensor',
    patchSize: 64,
    padding: 2,
    progress: (pct: number) => {
      // UpscalerJS progress is 0–1
      onProgress?.(10 + Math.round(pct * 75))
    },
  })

  onProgress?.(85)

  // Render tensor → canvas → Blob → File
  const canvas = document.createElement('canvas')
  canvas.width = tensor.shape[1]
  canvas.height = tensor.shape[0]
  await tf.browser.toPixels(tensor, canvas)
  tensor.dispose()

  onProgress?.(95)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob failed'))),
      outMime,
      0.92
    )
  })

  onProgress?.(100)

  return new File([blob], `${baseName}-${scale}.${outExt}`, { type: outMime })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}
