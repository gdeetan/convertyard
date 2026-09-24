'use client'
import { useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config as baseConfig } from '@/content/tools/compress-pdf'
import { CompressPdfPreviewPanel } from '@/components/pdf/CompressPdfPreviewPanel'
import { PresetBar } from '@/components/pdf/PresetBar'
import { compressPdfKeepText, rasterizeToTargetSize, compressPDF } from '@/lib/converters/pdf'
import { preloadPdfWasm } from '@/lib/pdf/wasm-preload'
import type { CompressionMeta, ConversionResult, ToolOptions } from '@/lib/types'

// Ratio above which the keep-text ladder almost never hits the target
// (target < ~40% of input). We skip straight to rasterize in that case
// instead of running a doomed keep-text pass first.
const UNACHIEVABLE_RATIO = 2.5

export default function Page() {
  useEffect(() => {
    const trigger = () => { void preloadPdfWasm() }
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback
    const idleId = ric ? ric(trigger) : window.setTimeout(trigger, 1500)
    const onDragEnter = () => { void preloadPdfWasm() }
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null
      if (t && t.tagName === 'INPUT' && (t as HTMLInputElement).type === 'file') {
        void preloadPdfWasm()
      }
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('focusin', onFocusIn)
    return () => {
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback
      if (ric && cic) cic(idleId as number)
      else window.clearTimeout(idleId as number)
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('focusin', onFocusIn)
    }
  }, [])

  const convertFn = useCallback(
    async (
      files: File[],
      options: ToolOptions,
      onProgress?: (fileIndex: number, pct: number) => void,
      onResult?: (fileIndex: number, r: ConversionResult) => void
    ): Promise<ConversionResult[]> => {
      const targetSizeMode = options.targetSizeMode === true
      // Non target-size path: unchanged — delegate to the original converter.
      if (!targetSizeMode) {
        return compressPDF(files, options, onProgress)
      }

      const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 500
      const targetBytes = targetKB * 1024
      const results: ConversionResult[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          // Fast-path: input already within target — return unchanged.
          if (file.size <= targetBytes) {
            const meta: CompressionMeta = {
              originalBytes: file.size,
              targetBytes,
              achievedBytes: file.size,
              reachedTarget: true,
              isUnchanged: true,
              iterationsUsed: 0,
              appliedSettings: 'none — file already within target',
            }
            const r: ConversionResult = { file, meta }
            onProgress?.(i, 100)
            onResult?.(i, r)
            results.push(r)
            continue
          }

          // Aggressive target — skip the keep-text ladder entirely and
          // rasterize directly. Saves waiting on a pass we already know
          // won't hit the target.
          if (file.size > targetBytes * UNACHIEVABLE_RATIO) {
            const { file: rasterized, meta } = await rasterizeToTargetSize(
              file,
              targetBytes,
              (pct) => onProgress?.(i, pct)
            )
            const r: ConversionResult = { file: rasterized, meta }
            onResult?.(i, r)
            results.push(r)
            continue
          }

          // Split the outer progress bar between phases we might run:
          // keep-text 0–35% (short leap to 100% if it hits target),
          // auto-rasterize fallback 35–100% (longer, more variable).
          // The 35% cap is chosen because keep-text is usually ~2–4×
          // faster than rasterize, so this reflects real wall-time share.
          const keepText = await compressPdfKeepText(file, targetBytes, (pct) =>
            onProgress?.(i, Math.round(pct * 0.35))
          )

          if (keepText.ok) {
            const outFile = new File([keepText.blob], file.name, { type: 'application/pdf' })
            const meta: CompressionMeta = {
              originalBytes: file.size,
              targetBytes,
              achievedBytes: keepText.bytes,
              reachedTarget: true,
              isUnchanged: false,
              iterationsUsed: keepText.passesRun.length,
              appliedSettings: keepText.passesRun.join(' + '),
            }
            onProgress?.(i, 100)
            const r: ConversionResult = { file: outFile, meta }
            onResult?.(i, r)
            results.push(r)
          } else {
            // Keep-text failed to reach target. Fall through automatically
            // to rasterize — no user prompt. If rasterize returns something
            // larger than keep-text's best, we hand back the keep-text
            // result instead (rare — happens on vector-heavy inputs).
            const { file: rasterizedFile, meta: rasterMeta } = await rasterizeToTargetSize(
              file,
              targetBytes,
              (pct) => onProgress?.(i, 35 + Math.round(pct * 0.65))
            )
            const rasterized = rasterizedFile
            const keptBestFile = new File([keepText.bestBlob], file.name, { type: 'application/pdf' })
            const winner = rasterized.size <= keptBestFile.size ? rasterized : keptBestFile
            const meta: CompressionMeta =
              winner === rasterized
                ? rasterMeta
                : {
                    originalBytes: file.size,
                    targetBytes,
                    achievedBytes: keptBestFile.size,
                    reachedTarget: keptBestFile.size <= targetBytes,
                    isUnchanged: false,
                    iterationsUsed: keepText.passesRun.length,
                    appliedSettings: keepText.passesRun.join(' + '),
                    message:
                      keptBestFile.size <= targetBytes
                        ? undefined
                        : `Couldn't reach ${Math.round(targetBytes / 1024)} KB — smallest possible is ${Math.round(keptBestFile.size / 1024)} KB`,
                  }
            const r: ConversionResult = { file: winner, meta }
            onProgress?.(i, 100)
            onResult?.(i, r)
            results.push(r)
          }
        } catch (err) {
          const e = err instanceof Error ? err : new Error('Compression failed')
          onResult?.(i, e)
          results.push(e)
        }
      }

      return results
    },
    []
  )

  const config = {
    ...baseConfig,
    previewPanel: CompressPdfPreviewPanel,
    presetBar: PresetBar,
    convertFn,
  }

  return <ToolShell config={config} />
}
