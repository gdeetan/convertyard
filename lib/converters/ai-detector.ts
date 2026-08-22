import type { AiDetectionResult } from './ai-detector.types'
import { verdictFromProbability } from './ai-detector.types'
import { detectAiSignatures } from './exif-viewer-ai'
import { buildThumbnailDataUrl } from './ai-detector-thumbnail'

const MODEL_ID = 'Organika/sdxl-detector'
const HEIC_MIME = /image\/hei[cf]/i

let pipelinePromise: Promise<unknown> | null = null

async function getClassifier() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      return pipeline('image-classification', MODEL_ID, { dtype: 'q8' })
    })()
  }
  return pipelinePromise as Promise<
    (input: string, opts?: { top_k?: number }) => Promise<Array<{ label: string; score: number }>>
  >
}

export async function analyzeForAi(
  files: File[],
  onProgress?: (i: number, pct: number) => void,
  onResult?: (i: number, r: AiDetectionResult) => void,
): Promise<AiDetectionResult[]> {
  const { parse } = await import('exifr')
  const classifier = await getClassifier()
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
    let inputSrc: string | undefined
    let width: number | undefined
    let height: number | undefined
    try {
      const built = await buildThumbnailDataUrl(f, HEIC_MIME.test(f.type) || /\.hei[cf]$/i.test(f.name))
      thumbnailDataUrl = built.dataUrl
      inputSrc = built.dataUrl
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
      const preds = await classifier(inputSrc!, { top_k: 5 })
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
