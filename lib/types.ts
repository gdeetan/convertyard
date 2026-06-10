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

export type ToolOption =
  | SliderOption
  | ToggleOption
  | DropdownOption
  | RadioOption
  | NumberOption
  | ColorPickerOption
  | ImageUploadOption
  | NumberWithChipsOption

export type ToolOptions = Record<string, unknown>

export interface CompressionMeta {
  originalBytes: number
  targetBytes: number
  achievedBytes: number
  reachedTarget: boolean
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
  warningFn?: (files: File[]) => string | null
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
