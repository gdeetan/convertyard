'use client'
import { useCallback, useRef, useState } from 'react'
import { ToolShell, type ToolShellApi } from '@/components/tool-shell/tool-shell'
import { config as baseConfig } from '@/content/tools/compress-pdf'
import { CompressPdfPreviewPanel } from '@/components/pdf/CompressPdfPreviewPanel'
import { PresetBar } from '@/components/pdf/PresetBar'
import { CompressorComparisonTable } from '@/components/pdf/CompressorComparisonTable'
import { UnachievableTargetCard } from '@/components/pdf/UnachievableTargetCard'
import { compressPdfKeepText, rasterizeToTargetSize, compressPDF } from '@/lib/converters/pdf'
import type { CompressionMeta, ConversionResult, ToolOptions } from '@/lib/types'

interface PendingEntry {
  input: File
  bestBytes: number
  targetBytes: number
}

export default function Page() {
  const apiRef = useRef<ToolShellApi | null>(null)
  const [pending, setPending] = useState<Record<number, PendingEntry>>({})

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

      const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 500
      const targetBytes = targetKB * 1024
      const nextPending: Record<number, PendingEntry> = {}
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
            nextPending[i] = {
              input: file,
              bestBytes: keepText.bestBytes,
              targetBytes,
            }
            onResult?.(i, r)
            results.push(r)
          }
        } catch (err) {
          const e = err instanceof Error ? err : new Error('Compression failed')
          onResult?.(i, e)
          results.push(e)
        }
      }

      if (Object.keys(nextPending).length > 0) setPending(nextPending)
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
    try {
      const { file } = await rasterizeToTargetSize(entry.input, entry.targetBytes)
      apiRef.current?.replaceResult(fileIndex, file)
    } finally {
      setPending((prev) => {
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
  }

  const pendingEntries = Object.entries(pending)

  return (
    <>
      <ToolShell config={config} onReady={handleReady} />
      {pendingEntries.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {pendingEntries.map(([idxStr, entry]) => {
            const idx = Number(idxStr)
            return (
              <UnachievableTargetCard
                key={idx}
                bestBytes={entry.bestBytes}
                targetBytes={entry.targetBytes}
                onKeep={() => handleKeep(idx)}
                onRasterize={() => handleRasterize(idx)}
              />
            )
          })}
        </div>
      )}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <CompressorComparisonTable />
      </div>
    </>
  )
}
