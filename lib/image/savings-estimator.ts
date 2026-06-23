import type { ImageAnalysis } from './analyzer'
import type { ToolOptions } from '@/lib/types'

export interface TechniqueSaving {
  label: string
  bytes: number
  note?: string
}

export interface SavingsEstimate {
  total: { bytes: number; pct: number }
  perTechnique: TechniqueSaving[]
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function estimateImageSavings(
  analysis: ImageAnalysis,
  settings: ToolOptions,
): SavingsEstimate {
  const techniques: TechniqueSaving[] = []
  const fileSize = analysis.fileSizeBytes

  // --- Strip EXIF (exact bytes) ---
  if (settings.stripMetadata !== false && analysis.exifBytes > 0) {
    let label = `Strip metadata: ${formatBytes(analysis.exifBytes)}`
    if (analysis.hasGpsData) label += ' (includes GPS location)'
    techniques.push({ label, bytes: analysis.exifBytes })
  }

  // --- Strip ICC profile (exact bytes) ---
  if (settings.convertToSrgb !== false && analysis.iccProfileBytes > 0) {
    techniques.push({
      label: `Convert to sRGB: removes ${formatBytes(analysis.iccProfileBytes)} ICC profile`,
      bytes: analysis.iccProfileBytes,
    })
  }

  // --- Resize to max dimension ---
  const maxDim = typeof settings.maxDimension === 'number' ? settings.maxDimension : 0
  if (maxDim > 0 && (analysis.width > 0 || analysis.height > 0)) {
    const longestEdge = Math.max(analysis.width, analysis.height)
    if (longestEdge > maxDim) {
      const ratio = maxDim / longestEdge
      // Savings scale with ratio² (area reduction), then file roughly follows area
      const areaSavingsFraction = 1 - ratio * ratio
      const estimatedSavingsBytes = Math.round(fileSize * areaSavingsFraction * 0.85)
      techniques.push({
        label: `Resize to ${maxDim}px`,
        bytes: estimatedSavingsBytes,
        note: `~${Math.round(areaSavingsFraction * 100)}% area reduction`,
      })
    }
  }

  // --- Quality reduction (JPEG/WebP) ---
  const quality = typeof settings.quality === 'number' ? settings.quality : 80
  const existingQ = analysis.estimatedExistingQuality
  const isLossy = analysis.format === 'jpeg' || analysis.format === 'webp' || analysis.format === 'avif'

  if (isLossy && existingQ !== null && quality < existingQ) {
    const drop = existingQ - quality
    // ~3% savings per quality point drop (rough heuristic on image data portion)
    const imageDataBytes = fileSize - analysis.exifBytes - analysis.iccProfileBytes
    const estimatedSavingsBytes = Math.round(imageDataBytes * (drop / 100) * 0.3)
    if (estimatedSavingsBytes > 1024) {
      techniques.push({
        label: `Quality ${existingQ} → ${quality}`,
        bytes: estimatedSavingsBytes,
        note: `estimated from JPEG quantization tables`,
      })
    }
  }

  // --- Format conversion suggestion (label-only, no bytes applied) ---
  if (analysis.format === 'jpeg') {
    techniques.push({
      label: '💡 Converting to WebP could save ~30% more',
      bytes: 0,
      note: 'use "JPG to WebP" tool for format conversion',
    })
  }

  // --- Palette reduction (PNG with low color count) ---
  if (
    analysis.format === 'png' &&
    analysis.uniqueColorEstimate !== null &&
    analysis.uniqueColorEstimate <= 256 &&
    settings.paletteReduction !== true // not already enabled
  ) {
    const imageDataBytes = fileSize - analysis.iccProfileBytes
    const estimatedSavingsBytes = Math.round(imageDataBytes * 0.65)
    techniques.push({
      label: `Palette reduction (${analysis.uniqueColorEstimate} unique colors detected)`,
      bytes: estimatedSavingsBytes,
      note: 'enable in Advanced settings',
    })
  }

  // Total = sum of real savings (exclude 0-byte suggestions)
  const totalBytes = techniques.reduce((sum, t) => sum + t.bytes, 0)
  const cappedBytes = Math.min(totalBytes, fileSize)
  const pct = fileSize > 0 ? Math.round((cappedBytes / fileSize) * 100) : 0

  return {
    total: { bytes: cappedBytes, pct },
    perTechnique: techniques,
  }
}
