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
  /** Data URL for the thumbnail rendered in the verdict card. */
  thumbnailDataUrl?: string
  width?: number
  height?: number
  /** Populated when verdict === 'error'. */
  errorMessage?: string
}

export function verdictFromProbability(p: number): Verdict {
  if (p >= 0.75) return 'likely-ai'
  if (p <= 0.25) return 'likely-human'
  return 'inconclusive'
}
