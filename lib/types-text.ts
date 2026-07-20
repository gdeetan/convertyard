// lib/types-text.ts
import type { FAQItem, ToolOption, ToolOptions, ToolCategory } from './types'

export interface TablePreview {
  headers: string[]
  rows: string[][]
}

export interface TextConvertResult {
  output: string
  outputMime: string
  outputFilename: string
  tablePreview?: TablePreview
  errorMessage?: string
  errorLine?: number
  errorCol?: number
}

export interface TextToolConfig {
  slug: string
  title: string
  subtitle: string
  bestFor?: string       // one sentence: when to reach for this tool
  category: ToolCategory
  inputLabel: string
  inputPlaceholder: string
  acceptsFile?: string[]
  acceptsFileExt?: string[]
  convertFn: (input: string, options: ToolOptions) => TextConvertResult
  fileToTextFn?: (file: File) => Promise<string>
  options?: ToolOption[]
  enableUrlHash?: boolean
  enableAutoDetect?: boolean
  outputLabel?: string
  faq: FAQItem[]
  relatedTools: string[]
  relatedArticles: string[]
  meta: {
    title: string
    description: string
    ogImage?: string
  }
}
