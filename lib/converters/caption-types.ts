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
  { id: 'mrbeast',  label: 'One Word', description: 'One bold word at a time, centered, high contrast', wordByWord: true  },
  { id: 'tiktok',   label: 'Outline',  description: 'Bold all-caps, heavy outline, word by word',       wordByWord: true  },
  { id: 'netflix',  label: 'Bar',      description: 'White text on a dark bar, full sentences',         wordByWord: false },
  { id: 'classic',  label: 'Classic',  description: 'White text, black shadow, bottom of the frame',    wordByWord: false },
  { id: 'karaoke',  label: 'Follow',   description: 'Full line shown, spoken word changes color',       wordByWord: false },
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
  maxCharsPerLine: number
}

/** Position, case, and outline that match each style's preview and copy. */
export const STYLE_PRESETS: Record<
  CaptionStyleId,
  Pick<CaptionOptions, 'position' | 'uppercase' | 'outlineWidth'>
> = {
  mrbeast: { position: 'center', uppercase: false, outlineWidth: 4 },
  tiktok:  { position: 'center', uppercase: true,  outlineWidth: 6 },
  netflix: { position: 'bottom', uppercase: false, outlineWidth: 0 },
  classic: { position: 'bottom', uppercase: false, outlineWidth: 2 },
  karaoke: { position: 'bottom', uppercase: false, outlineWidth: 2 },
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
  ...STYLE_PRESETS.mrbeast,
  maxCharsPerLine: 42,
}
