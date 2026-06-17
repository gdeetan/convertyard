import type { PdfAnalysis } from './analyzer'
import type { ToolOptions } from '@/lib/types'

export interface TechniqueSavings {
  savingsBytes: number
  explanation: string
}

export interface SavingsEstimate {
  estimatedFinalSize: number
  estimatedSavingsBytes: number
  estimatedSavingsPercent: number
  perTechnique: {
    imageDownsampling: TechniqueSavings
    imageQualityReduction: TechniqueSavings
    grayscaleConversion: TechniqueSavings
    fontSubsetting: TechniqueSavings
    stripMetadata: TechniqueSavings
    stripAnnotations: TechniqueSavings
    stripEmbeddedFiles: TechniqueSavings
    contentStreamOptimization: TechniqueSavings
  }
}

export function estimateSavings(analysis: PdfAnalysis, options: ToolOptions): SavingsEstimate {
  const { images, fonts, fileSize } = analysis
  const jpegQuality = typeof options.jpegQuality === 'number' ? options.jpegQuality : 70
  const grayscale = options.grayscale === true
  const dpiEnabled = options.dpiMode === true
  const targetDpi = typeof options.targetDpi === 'number' ? options.targetDpi : 150
  const subsetFonts = options.subsetFonts !== false
  const stripMetadataEnabled = options.stripMetadata !== false
  const stripAnnotationsEnabled = options.stripAnnotations === true
  const stripEmbeddedEnabled = options.stripEmbedded === true

  const imageDownsamplingBytes =
    images.count > 0 && images.avgDpi > 150
      ? Math.round(images.totalEstimatedBytes * (dpiEnabled && targetDpi < images.avgDpi ? 1 - Math.pow(targetDpi / images.avgDpi, 2) : 0.75))
      : 0

  const imageQualityBytes =
    images.count > 0 && jpegQuality < 80
      ? Math.round(images.totalEstimatedBytes * ((80 - jpegQuality) / 80) * 0.3)
      : 0

  const grayscaleBytes =
    grayscale && images.count > 0
      ? Math.round(images.totalEstimatedBytes * 0.6)
      : 0

  const fontSubsettingBytes =
    fonts.unsubsettedCount > 0 && subsetFonts
      ? Math.round(fonts.estimatedBytes * 0.4)
      : 0

  const stripMetadataBytes = analysis.hasMetadata && stripMetadataEnabled ? 50 * 1024 : 0
  const stripAnnotationsBytes = analysis.hasAnnotations && stripAnnotationsEnabled ? 50 * 1024 : 0
  const stripEmbeddedBytes = analysis.hasEmbeddedFiles && stripEmbeddedEnabled ? 100 * 1024 : 0
  const contentStreamBytes = Math.round(fileSize * 0.05)

  const totalSavings = Math.min(
    fileSize,
    imageDownsamplingBytes + imageQualityBytes + grayscaleBytes + fontSubsettingBytes +
    stripMetadataBytes + stripAnnotationsBytes + stripEmbeddedBytes + contentStreamBytes
  )

  return {
    estimatedFinalSize: Math.max(0, fileSize - totalSavings),
    estimatedSavingsBytes: totalSavings,
    estimatedSavingsPercent: fileSize > 0 ? Math.round((totalSavings / fileSize) * 100) : 0,
    perTechnique: {
      imageDownsampling: {
        savingsBytes: imageDownsamplingBytes,
        explanation: images.avgDpi > 150
          ? `Downsample ${images.count} image(s) from ~${images.avgDpi} DPI to ${dpiEnabled ? targetDpi : 150} DPI`
          : 'Images already at target DPI',
      },
      imageQualityReduction: {
        savingsBytes: imageQualityBytes,
        explanation: `Re-encode JPEG images at quality ${jpegQuality}`,
      },
      grayscaleConversion: {
        savingsBytes: grayscaleBytes,
        explanation: `Convert ${images.byColorSpace?.color ?? images.count} color images to grayscale (~60% reduction)`,
      },
      fontSubsetting: {
        savingsBytes: fontSubsettingBytes,
        explanation: fonts.unsubsettedCount > 0
          ? `Subset ${fonts.unsubsettedCount} embedded font(s) — remove unused glyphs`
          : 'All fonts already subsetted',
      },
      stripMetadata: {
        savingsBytes: stripMetadataBytes,
        explanation: 'Remove title, author, dates, producer fields',
      },
      stripAnnotations: {
        savingsBytes: stripAnnotationsBytes,
        explanation: `Remove ${analysis.annotationCount || 'all'} annotation(s)`,
      },
      stripEmbeddedFiles: {
        savingsBytes: stripEmbeddedBytes,
        explanation: 'Remove file attachments embedded in the PDF',
      },
      contentStreamOptimization: {
        savingsBytes: contentStreamBytes,
        explanation: 'Rewrite content streams using object compression (~5%)',
      },
    },
  }
}
