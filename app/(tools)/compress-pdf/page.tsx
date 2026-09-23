'use client'
import { useCallback, useRef, useState } from 'react'
import { ToolShell, type ToolShellApi } from '@/components/tool-shell/tool-shell'
import { config as baseConfig } from '@/content/tools/compress-pdf'
import { CompressPdfPreviewPanel } from '@/components/pdf/CompressPdfPreviewPanel'
import { PresetBar } from '@/components/pdf/PresetBar'
import { UnachievableTargetCard } from '@/components/pdf/UnachievableTargetCard'
import { RasterizeAheadCard } from '@/components/pdf/RasterizeAheadCard'
import { compressPdfKeepText, rasterizeToTargetSize, compressPDF } from '@/lib/converters/pdf'
import type { CompressionMeta, ConversionResult, ToolOptions } from '@/lib/types'

// Ratio above which the keep-text ladder almost never hits the target
// (target < ~40% of input). Kept in sync with the same threshold used
// during convertFn (line ~54) — moving both would break the pre-convert
// rasterize prompt without ever running the doomed keep-text pass.
const UNACHIEVABLE_RATIO = 2.5

function isUnachievableForFiles(files: File[], options: ToolOptions): boolean {
  if (options.targetSizeMode !== true) return false
  const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 500
  const targetBytes = targetKB * 1024
  return files.some((f) => f.size > targetBytes * UNACHIEVABLE_RATIO)
}

interface PendingEntry {
  input: File
  bestBytes: number
  targetBytes: number
}

export default function Page() {
  const apiRef = useRef<ToolShellApi | null>(null)
  const [pending, setPending] = useState<Record<number, PendingEntry>>({})
  const [rasterizing, setRasterizing] = useState<Record<number, { progress: number }>>({})
  const [rasterizeErrors, setRasterizeErrors] = useState<Record<number, string>>({})

  const handleReady = useCallback((api: ToolShellApi) => {
    apiRef.current = api
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

      // Fresh run — clear any card state from a previous convert.
      setPending({})
      setRasterizing({})
      setRasterizeErrors({})

      const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 500
      const targetBytes = targetKB * 1024
      const nextPending: Record<number, PendingEntry> = {}
      const results: ConversionResult[] = []

      // UNACHIEVABLE_RATIO defined at module scope so the pre-convert
      // RasterizeAheadCard predicate uses the same threshold.

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

          // Upfront skip: if the ratio predicts keep-text can't hit target,
          // rasterize directly. Feeds progress through the shell's normal
          // per-file bar so the user sees continuous feedback.
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

          const keepText = await compressPdfKeepText(file, targetBytes, (pct) =>
            onProgress?.(i, pct)
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
            const r: ConversionResult = { file: outFile, meta }
            onResult?.(i, r)
            results.push(r)
          } else {
            // Unachievable via keep-text. Surface the best-possible file so the
            // shell has something to render, and record a pending entry so the
            // UnachievableTargetCard shows below the results.
            const bestFile = new File([keepText.bestBlob], file.name, { type: 'application/pdf' })
            const meta: CompressionMeta = {
              originalBytes: file.size,
              targetBytes,
              achievedBytes: keepText.bestBytes,
              reachedTarget: false,
              isUnchanged: false,
              iterationsUsed: keepText.passesRun.length,
              appliedSettings: keepText.passesRun.join(' + '),
              message: `Best possible without rasterizing: ${Math.round(keepText.bestBytes / 1024)} KB`,
            }
            const r: ConversionResult = { file: bestFile, meta }
            const entry: PendingEntry = {
              input: file,
              bestBytes: keepText.bestBytes,
              targetBytes,
            }
            nextPending[i] = entry
            // Publish the card the moment keep-text fails for this file
            // instead of waiting for the whole batch to finish — otherwise
            // the yellow "Rasterize" prompt appears well after the result
            // is already visible.
            setPending((prev) => ({ ...prev, [i]: entry }))
            onResult?.(i, r)
            results.push(r)
          }
        } catch (err) {
          const e = err instanceof Error ? err : new Error('Compression failed')
          onResult?.(i, e)
          results.push(e)
        }
      }

      // pending state was updated incrementally inside the loop; nothing to
      // publish here. `nextPending` is retained only for legibility.
      void nextPending
      return results
    },
    []
  )

  const handleKeep = useCallback((fileIndex: number) => {
    setPending((prev) => {
      if (!(fileIndex in prev)) return prev
      const next = { ...prev }
      delete next[fileIndex]
      return next
    })
  }, [])

  const handleRasterize = useCallback(async (fileIndex: number) => {
    const entry = pending[fileIndex]
    if (!entry) return
    // Immediate visual ack: disable buttons + show spinner. Prior to this
    // the click gave zero feedback and looked broken on large files where
    // rasterization takes 30s+.
    setRasterizing((prev) => ({ ...prev, [fileIndex]: { progress: 0 } }))
    setRasterizeErrors((prev) => {
      if (!(fileIndex in prev)) return prev
      const next = { ...prev }
      delete next[fileIndex]
      return next
    })
    try {
      const { file } = await rasterizeToTargetSize(entry.input, entry.targetBytes, (pct) => {
        setRasterizing((prev) =>
          prev[fileIndex] ? { ...prev, [fileIndex]: { progress: pct } } : prev
        )
      })
      apiRef.current?.replaceResult(fileIndex, file)
      // Success: clear the card.
      setPending((prev) => {
        if (!(fileIndex in prev)) return prev
        const next = { ...prev }
        delete next[fileIndex]
        return next
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Rasterization failed'
      setRasterizeErrors((prev) => ({ ...prev, [fileIndex]: msg }))
    } finally {
      setRasterizing((prev) => {
        if (!(fileIndex in prev)) return prev
        const next = { ...prev }
        delete next[fileIndex]
        return next
      })
    }
  }, [pending])

  const config = {
    ...baseConfig,
    previewPanel: CompressPdfPreviewPanel,
    presetBar: PresetBar,
    convertFn,
    // Hide the primary Convert button when the pre-convert rasterize prompt
    // is showing — the card owns the action from that point on.
    hideConvertWhen: isUnachievableForFiles,
  }

  const pendingEntries = Object.entries(pending)

  // Post-convert card (unchanged): appears when keep-text finishes but
  // couldn't reach the target. Static ReactNode passed straight through.
  const postConvertNotice = pendingEntries.length > 0 ? (
    <div>
      {pendingEntries.map(([idxStr, entry]) => {
        const idx = Number(idxStr)
        return (
          <UnachievableTargetCard
            key={idx}
            bestBytes={entry.bestBytes}
            targetBytes={entry.targetBytes}
            onKeep={() => handleKeep(idx)}
            onRasterize={() => handleRasterize(idx)}
            busy={idx in rasterizing}
            progress={rasterizing[idx]?.progress ?? null}
            error={rasterizeErrors[idx] ?? null}
          />
        )
      })}
    </div>
  ) : null

  // Combined notice slot: post-convert card takes precedence if present;
  // otherwise render the pre-convert card via a function so the shell
  // supplies current files/options/api.
  const notice = postConvertNotice
    ? postConvertNotice
    : (({ files, options, api }: { files: File[]; options: ToolOptions; api: ToolShellApi }) => {
        if (!isUnachievableForFiles(files, options)) return null
        const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 500
        const targetBytes = targetKB * 1024
        const largestBytes = files.reduce((m, f) => Math.max(m, f.size), 0)
        // Pick a target that clears the 2.5× threshold with a small buffer
        // (2× ratio) so the card doesn't immediately re-appear after clicking
        // "Raise target". Round up to the next 10 KB for a clean value.
        const suggestedTargetKB = Math.max(
          targetKB + 1,
          Math.ceil(largestBytes / 2 / 1024 / 10) * 10
        )
        return (
          <RasterizeAheadCard
            fileCount={files.length}
            targetBytes={targetBytes}
            largestInputBytes={largestBytes}
            suggestedTargetKB={suggestedTargetKB}
            onRasterize={() => api.startConversion()}
            onRaiseTarget={() => api.setOption('targetKB', suggestedTargetKB)}
          />
        )
      })

  return <ToolShell config={config} onReady={handleReady} notice={notice} />
}
