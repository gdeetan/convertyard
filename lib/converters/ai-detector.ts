import type { AiDetectionResult } from './ai-detector.types'
import { verdictFromProbability } from './ai-detector.types'
import { detectAiSignatures } from './exif-viewer-ai'
import { buildThumbnailDataUrl } from './ai-detector-thumbnail'

const HEIC_MIME = /image\/hei[cf]/i

// ── Worker singleton ─────────────────────────────────────────────────────────

let workerInstance: Worker | null = null
let readyPromise: Promise<void> | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('./ai-detector-worker.ts', import.meta.url),
      { type: 'module' },
    )
  }
  return workerInstance
}

function ensureReady(): Promise<void> {
  if (readyPromise) return readyPromise
  readyPromise = new Promise<void>((resolve, reject) => {
    const worker = getWorker()
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'ready') {
        worker.removeEventListener('message', handler)
        // Fire-and-forget warmup once model is ready.
        worker.postMessage({ type: 'warmup' })
        resolve()
      } else if (e.data?.type === 'error' && !('id' in e.data)) {
        worker.removeEventListener('message', handler)
        readyPromise = null
        reject(new Error(e.data.message ?? 'Model load failed'))
      }
    }
    worker.addEventListener('message', handler)
    worker.postMessage({ type: 'load' })
  })
  return readyPromise
}

/** Kick off worker spawn + model download while the visitor reads the page. */
export function preloadClassifier(): void {
  void ensureReady().catch(() => { /* silent — retried on real use */ })
}

// ── Per-file classify via worker ─────────────────────────────────────────────

async function classifyDataUrl(dataUrl: string): Promise<Array<{ label: string; score: number }>> {
  await ensureReady()
  const worker = getWorker()
  const id = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      if (e.data?.id !== id) return
      worker.removeEventListener('message', handler)
      if (e.data.type === 'result') resolve(e.data.preds)
      else reject(new Error(e.data.message ?? 'Classifier failed'))
    }
    worker.addEventListener('message', handler)
    worker.postMessage({ type: 'classify', id, dataUrl })
  })
}

// ── Public analyzer ──────────────────────────────────────────────────────────

export async function analyzeForAi(
  files: File[],
  onProgress?: (i: number, pct: number) => void,
  onResult?: (i: number, r: AiDetectionResult) => void,
): Promise<AiDetectionResult[]> {
  const { parse } = await import('exifr')
  const results: AiDetectionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    onProgress?.(i, 10)

    let metadataSignatures: AiDetectionResult['metadataSignatures'] = []
    try {
      const raw = (await parse(f, { xmp: true, tiff: true, icc: true, iptc: true, jfif: true, ihdr: true })) as
        | Record<string, unknown>
        | undefined
      if (raw) {
        const hasC2pa = 'jumbf' in raw || 'C2PA' in raw
        metadataSignatures = detectAiSignatures(raw, { hasC2pa })
      }
    } catch { /* metadata pass is optional */ }

    onProgress?.(i, 30)

    let thumbnailDataUrl: string | undefined
    let width: number | undefined
    let height: number | undefined
    try {
      const built = await buildThumbnailDataUrl(f, HEIC_MIME.test(f.type) || /\.hei[cf]$/i.test(f.name))
      thumbnailDataUrl = built.dataUrl
      width = built.width
      height = built.height
    } catch (err) {
      const r: AiDetectionResult = {
        ok: false,
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type,
        verdict: 'error',
        metadataSignatures,
        errorMessage: err instanceof Error ? err.message : 'Could not decode image',
      }
      results.push(r); onResult?.(i, r); onProgress?.(i, 100); continue
    }

    onProgress?.(i, 60)

    try {
      const preds = await classifyDataUrl(thumbnailDataUrl!)
      const aiScore = pickAiScore(preds)
      const verdict = verdictFromProbability(aiScore)
      const r: AiDetectionResult = {
        ok: true,
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type,
        aiProbability: aiScore,
        humanProbability: 1 - aiScore,
        verdict,
        metadataSignatures,
        thumbnailDataUrl,
        width,
        height,
      }
      results.push(r); onResult?.(i, r); onProgress?.(i, 100)
    } catch (err) {
      const r: AiDetectionResult = {
        ok: false,
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type,
        verdict: 'error',
        metadataSignatures,
        thumbnailDataUrl,
        width,
        height,
        errorMessage: err instanceof Error ? err.message : 'Classifier failed',
      }
      results.push(r); onResult?.(i, r); onProgress?.(i, 100)
    }
  }

  return results
}

// Model labels vary by checkpoint. Match common AI-class labels; fall back to
// treating the top prediction as the AI class if the label looks generated.
const AI_LABELS = new Set(['artificial', 'ai', 'ai-generated', 'fake', 'sd', 'sdxl', 'generated', 'lab_1'])

function pickAiScore(preds: Array<{ label: string; score: number }>): number {
  for (const p of preds) {
    if (AI_LABELS.has(p.label.toLowerCase())) return p.score
  }
  const top = preds[0]
  if (top && /ai|artif|fake|generat|sd/i.test(top.label)) return top.score
  return 1 - (top?.score ?? 0.5)
}
