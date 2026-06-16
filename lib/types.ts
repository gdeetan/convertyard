import type React from 'react'

export type ToolCategory = 'images' | 'pdf' | 'video-audio' | 'dev' | 'web' | 'ai' | 'image-editing'

export interface FAQItem {
  q: string
  a: string
}

// ── Option types ────────────────────────────────────────────────────────────

interface BaseOption {
  name: string
  label: string
  hint?: string
  dependsOn?: { name: string; value: string }
}

export interface SliderOption extends BaseOption {
  type: 'slider'
  min: number
  max: number
  step?: number
  default: number
}

export interface ToggleOption extends BaseOption {
  type: 'toggle'
  default: boolean
}

export interface DropdownOption extends BaseOption {
  type: 'dropdown'
  choices: Array<{ value: string; label: string }>
  default: string
}

export interface RadioOption extends BaseOption {
  type: 'radio'
  choices: Array<{ value: string; label: string }>
  default: string
  conditionalHints?: Record<string, string>
}

export interface NumberOption extends BaseOption {
  type: 'number'
  min?: number
  max?: number
  step?: number
  default: number
}

export interface ColorPickerOption extends BaseOption {
  type: 'color-picker'
  default: string
}

export interface ImageUploadOption extends BaseOption {
  type: 'image-upload'
  default: null
}

export interface NumberWithChipsOption extends BaseOption {
  type: 'number-with-chips'
  unitChoices?: string[]   // e.g. ['KB', 'MB'] — shows a unit selector
  chips?: Array<{ label: string; valueKB: number }>  // valueKB always in KB; UI converts to display unit
  min?: number
  max?: number
  step?: number
  default: number
  defaultUnit?: string
}

export interface SectionHeaderOption {
  type: 'section-header'
  label: string
}

export type ToolOption =
  | SliderOption
  | ToggleOption
  | DropdownOption
  | RadioOption
  | NumberOption
  | ColorPickerOption
  | ImageUploadOption
  | NumberWithChipsOption
  | SectionHeaderOption

export type ToolOptions = Record<string, unknown>

export interface CompressionMeta {
  originalBytes: number
  targetBytes: number
  achievedBytes: number
  reachedTarget: boolean
  isUnchanged: boolean      // input.size <= targetBytes; returned as-is
  iterationsUsed: number    // 0–6
  appliedSettings: string   // human description for UI
  message?: string
}

// ── Conversion result ────────────────────────────────────────────────────────

// Each index in the result array corresponds to the same index in the input
// files array. An Error value means that file failed; File means success.
// { file, meta } variant carries compression metadata for target-size mode.
export type ConversionResult = File | Error | { file: File; meta: CompressionMeta }

// ── Tool config ──────────────────────────────────────────────────────────────

export interface ToolConfig {
  slug: string
  title: string
  subtitle: string
  category: ToolCategory
  accepts: string[]       // MIME types, e.g. ['image/jpeg']
  acceptsExt: string[]    // display extensions, e.g. ['.jpg', '.jpeg']
  outputExt: string       // e.g. '.webp'
  convertFn: (
    files: File[],
    options: ToolOptions,
    onProgress?: (fileIndex: number, pct: number) => void
  ) => Promise<ConversionResult[]>
  options?: ToolOption[]
  limitationNote?: {
    summary: string
    body: string
  }
  warningFn?: (files: File[]) => string | null
  previewPanel?: React.ComponentType<{
    files: File[]
    results: (File | null)[]
    options: ToolOptions
  }>
  advancedOptions?: ToolOption[]
  presetBar?: React.ComponentType<{ onApply: (values: ToolOptions) => void }>
  faq: FAQItem[]
  relatedTools: string[]    // tool slugs, 3-5
  relatedArticles: string[] // article slugs, 2-3
  meta: {
    title: string
    description: string   // 140-155 chars
    ogImage?: string
  }
}

// ── Internal tool-shell state ─────────────────────────────────────────────────

export type FileStatus = 'pending' | 'processing' | 'done' | 'error'

export interface FileEntry {
  id: string
  file: File
  status: FileStatus
  progress: number  // 0-100
  result?: File
  resultMeta?: CompressionMeta
  error?: string
}

export type ToolPhase = 'idle' | 'converting' | 'done'

// ── Size-target landing page config ──────────────────────────────────────────

export interface SizeTargetConfig {
  parentTool: 'compress-pdf' | 'compress-image'
  targetBytes: number
  targetLabel: string
  slug: string
  h1: string
  subhead: string
  intro: string
  useCases: { label: string; description: string }[]
  specificFaq: FAQItem[]
  relatedSizes: string[]
  relatedVerticals: string[]
}

// ── Vertical hub page config ──────────────────────────────────────────────────

export interface VerticalHubConfig {
  slug: string
  name: string
  fullName: string
  country: string
  category: 'exam' | 'visa' | 'court' | 'job' | 'platform'
  h1: string
  subhead: string
  intro: string
  toolPresets: {
    toolSlug: string
    label: string
    targetBytes?: number
    targetDimensions?: { width: number; height: number }
    outputFormat?: string
    notes?: string
  }[]
  officialSpecs: {
    documentType: string
    size: string
    dimensions: string
    format: string
    notes?: string
  }[]
  commonMistakes: string[]
  specificFaq: FAQItem[]
  relatedVerticals: string[]
  lastUpdated: string
}
