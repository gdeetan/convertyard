export interface WordChunk {
  text: string
  start: number  // seconds
  end: number    // seconds
}

export type CaptionStyleId = 'mrbeast' | 'tiktok' | 'netflix' | 'classic' | 'karaoke'

export interface CaptionStyleMeta {
  id: CaptionStyleId
  label: string
  description: string
  wordByWord: boolean
}

export const CAPTION_STYLES: CaptionStyleMeta[] = [
  { id: 'mrbeast',  label: 'Mr. Beast',   description: 'One bold word at a time, centered, high contrast',    wordByWord: true  },
  { id: 'tiktok',   label: 'TikTok',      description: 'Bold all-caps, heavy outline, word by word',          wordByWord: true  },
  { id: 'netflix',  label: 'Netflix',     description: 'White text on dark pill background, full sentences',  wordByWord: false },
  { id: 'classic',  label: 'Classic SRT', description: 'White text, black shadow, bottom of screen',          wordByWord: false },
  { id: 'karaoke',  label: 'Karaoke',     description: 'Full line shown, active word highlights as spoken',   wordByWord: false },
]

export type FontSource = 'builtin' | 'upload' | 'system'

export interface CaptionOptions {
  styleId: CaptionStyleId
  fontSource: FontSource
  builtinFont: string
  uploadedFont: File | null
  systemFontFamily: string
  systemFontBlob: Blob | null
  fontSize: number
  primaryColor: string
  highlightColor: string
  outlineColor: string
  outlineWidth: number
  position: 'top' | 'center' | 'bottom'
  uppercase: boolean
}

export const DEFAULT_CAPTION_OPTIONS: CaptionOptions = {
  styleId: 'mrbeast',
  fontSource: 'builtin',
  builtinFont: 'Komika Axis',
  uploadedFont: null,
  systemFontFamily: '',
  systemFontBlob: null,
  fontSize: 80,
  primaryColor: '#FFFFFF',
  highlightColor: '#FFFF00',
  outlineColor: '#000000',
  outlineWidth: 4,
  position: 'bottom',
  uppercase: false,
}
