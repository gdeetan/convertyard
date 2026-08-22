import type { AiSignature } from './exif-viewer.types'

export type Verdict = 'likely-ai' | 'likely-human' | 'inconclusive' | 'error'

export interface AiDetectionResult {
  ok: boolean
  fileName: string
  fileSize: number
  mimeType: string
  /** 0..1 — model's estimated probability the image is AI-generated. */
  aiProbability?: number
  /** Same, for the "human/real" class (usually 1 - aiProbability). */
  humanProbability?: number
  verdict: Verdict
  /** Named generator hints from EXIF/XMP/PNG-chunk metadata. */
  metadataSignatures: AiSignature[]
  /** True until the pixel classifier returns. Metadata may already be present. */
  classifierPending?: boolean
  /** Data URL for the thumbnail rendered in the verdict card. */
  thumbnailDataUrl?: string
  width?: number
  height?: number
  /** Populated when verdict === 'error'. */
  errorMessage?: string
}

/** Calibrated for the re-fit ViT-S head (offset +1.67 → 0.65 operating point). */
export function verdictFromProbability(p: number): Verdict {
  if (p >= 0.65) return 'likely-ai'
  if (p <= 0.35) return 'likely-human'
  return 'inconclusive'
}
