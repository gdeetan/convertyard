// lib/converters/exif-viewer.types.ts

/** Grouped tag sections shown in the single-file view (matches spec §4.1). */
export type TagGroupKey =
  | 'camera'
  | 'exposure'
  | 'gps'
  | 'dateTime'
  | 'software'
  | 'aiProvenance'
  | 'iptc'
  | 'color'
  | 'raw'

export interface TagRow {
  label: string
  value: string
  /** Raw JSON-serialisable value, kept for export. */
  raw: unknown
}

export interface TagGroup {
  key: TagGroupKey
  title: string
  rows: TagRow[]
}

export type PrivacySeverity = 'high' | 'medium' | 'info'
export type PrivacyFixGroup = 'gps' | 'personal' | 'device' | 'path' | 'thumbnail' | 'aiProvenance' | 'editHistory'

export interface PrivacyFlag {
  severity: PrivacySeverity
  tag: string
  message: string
  fixGroup: PrivacyFixGroup
}

export type AiGenerator =
  | 'stable-diffusion'
  | 'comfyui'
  | 'midjourney'
  | 'dalle'
  | 'firefly'
  | 'imagen'
  | 'ideogram'
  | 'leonardo'
  | 'runway'
  | 'c2pa-only'

export interface AiSignature {
  generator: AiGenerator
  detail?: string
}

export interface GpsFix {
  lat: number
  lon: number
  altitude?: number
  direction?: number
  timestampIso?: string
}

export interface AnalyzeSuccess {
  ok: true
  fileName: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  thumbnailDataUrl?: string
  groups: TagGroup[]
  gps?: GpsFix
  privacyFlags: PrivacyFlag[]
  aiSignatures: AiSignature[]
  raw: Record<string, unknown>
}

export interface AnalyzeFailure {
  ok: false
  fileName: string
  fileSize: number
  mimeType: string
  reason: 'unsupported-format' | 'parse-error' | 'no-metadata'
  message: string
}

export type AnalyzeResult = AnalyzeSuccess | AnalyzeFailure
