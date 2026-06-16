import { extractStructuredText, getPageSizes } from '@/lib/converters/mupdf-client'

export interface PdfAnalysis {
  pageCount: number
  images: {
    count: number
    totalEstimatedBytes: number
    avgDpi: number
    highDpiCount: number
  }
  fonts: {
    count: number
    unsubsettedCount: number
    estimatedBytes: number
  }
  hasMetadata: boolean
  hasAnnotations: boolean
  hasBookmarks: boolean
  hasJS: boolean
  hasEmbeddedFiles: boolean
}

// Subsetted fonts in PDFs have a 6-char uppercase prefix + "+" e.g. "ABCDEF+Arial"
export function isSubsettedFont(name: string): boolean {
  return /^[A-Z]{6}\+/.test(name)
}

// Estimates avg DPI from image byte count vs page size.
// Uses JPEG rule of thumb: ~3 bytes/pixel
export function estimateAvgDpi(
  imageCount: number,
  totalImageBytes: number,
  avgPageWidthPt: number
): number {
  if (imageCount === 0) return 0
  const avgPageWidthIn = avgPageWidthPt / 72
  const bytesPerImage = totalImageBytes / imageCount
  const estimatedPixels = bytesPerImage / 3
  const estimatedDpi = Math.sqrt(estimatedPixels) / avgPageWidthIn
  return Math.min(600, Math.max(72, Math.round(estimatedDpi)))
}

export async function analyzePdf(file: File): Promise<PdfAnalysis> {
  const buffer = await file.arrayBuffer()
  // latin1 maps byte values 1:1 — safe for scanning ASCII PDF structure keywords
  const text = new TextDecoder('latin1').decode(buffer)

  const imageCount = (text.match(/\/Subtype\s*\/Image/g) ?? []).length
  const hasMetadata =
    /\/Title\s*\(/.test(text) ||
    /\/Author\s*\(/.test(text) ||
    /\/Subject\s*\(/.test(text)
  const hasAnnotations =
    /\/Annots\s*\[/.test(text) || /\/Annots\s+\d/.test(text)
  const hasBookmarks = /\/Outlines\b/.test(text)
  const hasJS = /\/JS\b/.test(text) || /\/JavaScript\b/.test(text)
  const hasEmbeddedFiles = /\/EmbeddedFile\b/.test(text)

  const fontNames = new Set<string>()
  let pageSizes: { width: number; height: number }[] = []

  try {
    const [structuredPages, sizes] = await Promise.all([
      extractStructuredText(buffer),
      getPageSizes(buffer),
    ])
    pageSizes = sizes

    for (const pageJson of structuredPages) {
      try {
        const page = JSON.parse(pageJson)
        for (const block of page?.blocks ?? []) {
          for (const line of block?.lines ?? []) {
            for (const span of line?.spans ?? []) {
              const name: string = span?.font?.name ?? ''
              if (name) fontNames.add(name)
            }
          }
        }
      } catch { /* skip malformed page */ }
    }
  } catch { /* mupdf may fail on encrypted/corrupt PDFs */ }

  const unsubsettedCount = [...fontNames].filter(n => !isSubsettedFont(n)).length
  const estimatedImageBytes = Math.max(0, file.size - 50 * 1024)
  const avgPageWidthPt =
    pageSizes.length
      ? pageSizes.reduce((s, p) => s + p.width, 0) / pageSizes.length
      : 595
  const avgDpi = estimateAvgDpi(imageCount, estimatedImageBytes, avgPageWidthPt)

  return {
    pageCount: pageSizes.length,
    images: {
      count: imageCount,
      totalEstimatedBytes: estimatedImageBytes,
      avgDpi,
      highDpiCount: avgDpi > 150 ? imageCount : 0,
    },
    fonts: {
      count: fontNames.size,
      unsubsettedCount,
      estimatedBytes: unsubsettedCount * 60 * 1024,
    },
    hasMetadata,
    hasAnnotations,
    hasBookmarks,
    hasJS,
    hasEmbeddedFiles,
  }
}
