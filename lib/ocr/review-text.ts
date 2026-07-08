import type { OcrResultMeta } from '@/lib/types'

export function buildEditableOcrText(meta: OcrResultMeta): string {
  const lineText = meta.lines.join('\n').trim()
  if (lineText) return lineText

  return meta.words
    .map(w => w.corrected ?? w.text)
    .join(' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
