import type { OcrRoute } from './benchmark'

export function inferRouteFromLogs(messages: string[]): OcrRoute {
  const explicit = messages.find(msg => msg.includes('[AI Route] primary='))
  if (explicit?.includes('primary=trocr')) return 'trocr'
  if (explicit?.includes('primary=florence')) return 'florence'

  const sawFlorenceFallback = messages.some(msg =>
    msg.includes('[Florence-2] Empty OCR result') ||
    msg.includes('[Florence-2] OCR failed'),
  )
  const sawTesseractFallback = messages.some(msg =>
    msg.includes('[TrOCR] Model unavailable, falling back to Tesseract') ||
    msg.includes('[TrOCR] No text extracted from line crops'),
  )

  if (!sawFlorenceFallback) return 'florence'
  if (sawTesseractFallback) return 'tesseract'
  return 'trocr'
}
