import type { PdfAnalysis } from './analyzer'
import type { ToolOptions } from '@/lib/types'

export interface SavingsEstimate {
  technique: string
  estimatedBytes: number
  enabled: boolean
}

export function estimateSavings(
  analysis: PdfAnalysis,
  options: ToolOptions
): SavingsEstimate[] {
  const estimates: SavingsEstimate[] = []
  const { images, fonts } = analysis

  const jpegQuality = typeof options.jpegQuality === 'number' ? options.jpegQuality : 70
  const grayscale = options.grayscale === true
  const dpiMode = options.dpiMode ?? 'auto'
  const targetDpi = typeof options.targetDpi === 'number' ? options.targetDpi : 150
  const subsetFonts = options.subsetFonts !== false
  const stripMetadata = options.stripMetadata !== false
  const stripAnnotations = options.stripAnnotations === true
  const stripBookmarks = options.stripBookmarks === true
  const stripEmbedded = options.stripEmbedded === true

  if (images.count > 0 && images.avgDpi > 150) {
    const savingsRatio =
      dpiMode === 'custom' && targetDpi < images.avgDpi
        ? 1 - Math.pow(targetDpi / images.avgDpi, 2)
        : 0.75
    estimates.push({
      technique:
        dpiMode === 'custom'
          ? `Downsample images to ${targetDpi} DPI`
          : 'Downsample images to 150 DPI',
      estimatedBytes: Math.round(images.totalEstimatedBytes * savingsRatio),
      enabled: images.highDpiCount > 0,
    })
  }

  if (images.count > 0 && jpegQuality < 80) {
    estimates.push({
      technique: `Re-encode images at quality ${jpegQuality}`,
      estimatedBytes: Math.round(images.totalEstimatedBytes * ((80 - jpegQuality) / 80) * 0.3),
      enabled: true,
    })
  }

  if (grayscale && images.count > 0) {
    estimates.push({
      technique: 'Convert to grayscale',
      estimatedBytes: Math.round(images.totalEstimatedBytes * 0.6),
      enabled: true,
    })
  }

  if (fonts.unsubsettedCount > 0) {
    estimates.push({
      technique: `Subset ${fonts.unsubsettedCount} font${fonts.unsubsettedCount > 1 ? 's' : ''}`,
      estimatedBytes: Math.round(fonts.estimatedBytes * 0.4),
      enabled: subsetFonts,
    })
  }

  if (analysis.hasMetadata) {
    estimates.push({
      technique: 'Strip document metadata',
      estimatedBytes: 50 * 1024,
      enabled: stripMetadata,
    })
  }

  if (analysis.hasAnnotations) {
    estimates.push({
      technique: 'Remove annotations',
      estimatedBytes: 50 * 1024,
      enabled: stripAnnotations,
    })
  }

  if (analysis.hasBookmarks) {
    estimates.push({
      technique: 'Remove bookmarks',
      estimatedBytes: 20 * 1024,
      enabled: stripBookmarks,
    })
  }

  if (analysis.hasEmbeddedFiles) {
    estimates.push({
      technique: 'Remove embedded files',
      estimatedBytes: 100 * 1024,
      enabled: stripEmbedded,
    })
  }

  return estimates.sort((a, b) => b.estimatedBytes - a.estimatedBytes)
}
