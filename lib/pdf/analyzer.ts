import { extractStructuredText, getPageSizes } from '@/lib/converters/mupdf-client'

export interface PdfAnalysis {
  pageCount: number
  fileSize: number
  pdfVersion: string
  isLinearized: boolean
  images: {
    count: number
    totalEstimatedBytes: number
    avgDpi: number
    highDpiCount: number
    byColorSpace: {
      color: number
      grayscale: number
      monochrome: number
    }
  }
  fonts: {
    count: number
    unsubsettedCount: number
    estimatedBytes: number
    fontsList: { name: string; isSubset: boolean }[]
  }
  hasMetadata: boolean
  hasAnnotations: boolean
  annotationCount: number
  hasBookmarks: boolean
  hasJS: boolean
  hasEmbeddedFiles: boolean
  formFieldCount: number
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

// Extracts PDF version from the %PDF-X.Y header line
export function extractPdfVersion(text: string): string {
  const match = text.match(/^%PDF-(\d+\.\d+)/m)
  return match ? match[1] : ''
}

// Checks for /Linearized marker within the first 1024 chars (fast-web-view PDFs)
export function isPdfLinearized(text: string): boolean {
  return /\/Linearized\s+\d/.test(text.slice(0, 1024))
}

// For each image in the PDF, classify its color space
export function detectImageColorSpaces(text: string): {
  color: number
  grayscale: number
  monochrome: number
} {
  const result = { color: 0, grayscale: 0, monochrome: 0 }
  const imageRegex = /\/Subtype\s*\/Image/g
  let match: RegExpExecArray | null

  while ((match = imageRegex.exec(text)) !== null) {
    // Look ahead up to 512 chars but stop before the next /Subtype /Image
    const raw = text.slice(match.index + match[0].length, match.index + 512)
    const nextImg = raw.indexOf('/Subtype')
    const after = nextImg === -1 ? raw : raw.slice(0, nextImg)
    if (/\/BitsPerComponent\s+1\b/.test(after) || /\/ImageMask\s+true\b/.test(after)) {
      result.monochrome++
    } else if (/\/ColorSpace\s*\/DeviceGray\b/.test(after)) {
      result.grayscale++
    } else if (/\/ColorSpace\s*\/(DeviceRGB|DeviceCMYK|CalRGB|ICCBased)\b/.test(after)) {
      result.color++
    } else {
      result.color++
    }
  }

  return result
}

export async function analyzePdf(file: File): Promise<PdfAnalysis> {
  const buffer = await file.arrayBuffer()
  // latin1 maps byte values 1:1 — safe for scanning ASCII PDF structure keywords
  const text = new TextDecoder('latin1').decode(buffer)

  const imageCount = (text.match(/\/Subtype\s*\/Image/g) ?? []).length
  const hasMetadata =
    /\/Title\s*[\(<]/.test(text) ||
    /\/Author\s*[\(<]/.test(text) ||
    /\/Subject\s*[\(<]/.test(text) ||
    /\/Metadata\s+\d+\s+\d+\s+R/.test(text)
  const hasAnnotations =
    /\/Annots\s*\[/.test(text) || /\/Annots\s+\d+\s+\d+\s+R/.test(text)
  const hasBookmarks = /\/Outlines\b/.test(text)
  const hasJS = /\/JS\b/.test(text) || /\/JavaScript\b/.test(text)
  const hasEmbeddedFiles = /\/EmbeddedFile\b/.test(text)
  const annotationCount = (text.match(/\/Type\s*\/Annot\b/g) ?? []).length
  const formFieldCount = (text.match(/\/Subtype\s*\/Widget\b/g) ?? []).length

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
    fileSize: file.size,
    pdfVersion: extractPdfVersion(text),
    isLinearized: isPdfLinearized(text),
    images: {
      count: imageCount,
      totalEstimatedBytes: estimatedImageBytes,
      avgDpi,
      highDpiCount: avgDpi > 150 ? imageCount : 0,
      byColorSpace: detectImageColorSpaces(text),
    },
    fonts: {
      count: fontNames.size,
      unsubsettedCount,
      estimatedBytes: unsubsettedCount * 60 * 1024,
      fontsList: [...fontNames].map(name => ({ name, isSubset: isSubsettedFont(name) })),
    },
    hasMetadata,
    hasAnnotations,
    annotationCount,
    hasBookmarks,
    hasJS,
    hasEmbeddedFiles,
    formFieldCount,
  }
}
