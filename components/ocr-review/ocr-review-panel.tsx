'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { buildEditableOcrText } from '@/lib/ocr/review-text'
import { cn } from '@/lib/utils/cn'
import type { ConversionResult, OcrResultMeta } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOcrMeta(result: ConversionResult): OcrResultMeta | null {
  if (result instanceof File || result instanceof Error) return null
  if ('ocrMeta' in result) return result.ocrMeta
  return null
}

function getResultFile(result: ConversionResult): File | null {
  if (result instanceof File) return result
  if (result instanceof Error) return null
  return result.file
}

function flaggedCount(meta: OcrResultMeta): number {
  return meta.words.filter(w =>
    (w.confidence !== -1 && w.confidence < 60) || w.corrected !== undefined
  ).length
}

function tokenizeLine(line: string): string[] {
  return line.split(/(\s+)/)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FileThumbnail({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return src
    ? <img src={src} alt="" className="h-10 w-10 rounded object-cover shrink-0" aria-hidden="true" />
    : <div className="h-10 w-10 rounded bg-bg-muted shrink-0" aria-hidden="true" />
}

function SourceImage({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return src
    ? <img
        src={src}
        alt="Source document"
        className="max-w-full rounded border border-border"
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      />
    : <div className="h-48 w-full rounded bg-bg-muted animate-pulse" />
}

// ── Correction popover ────────────────────────────────────────────────────────

interface PopoverProps {
  rawText: string
  correctedText: string
  anchorRect: DOMRect
  onRevert: () => void
  onClose: () => void
}

function CorrectionPopover({ rawText, correctedText, anchorRect, onRevert, onClose }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label="Auto-correction details"
      className={cn(
        'fixed z-50 rounded-lg border border-border bg-bg-elevated shadow-lg p-3',
        'min-w-[180px] text-sm'
      )}
      style={{
        top: anchorRect.bottom + window.scrollY + 6,
        left: Math.max(8, Math.min(anchorRect.left + window.scrollX - 40, window.innerWidth - 220)),
      }}
    >
      <div className="text-fg-muted text-xs mb-2 font-medium">Auto-corrected</div>
      <div className="flex items-center gap-2 mb-3">
        <span className="line-through text-fg-muted">{rawText}</span>
        <span className="text-fg-subtle">→</span>
        <span className="text-fg font-medium">{correctedText}</span>
      </div>
      <button
        type="button"
        onClick={onRevert}
        className="w-full rounded-md bg-bg-muted hover:bg-bg-hover px-2 py-1.5 text-xs font-medium text-fg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Revert to original
      </button>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface OcrReviewPanelProps {
  files: File[]
  results: ConversionResult[]
  onResultEdit: (index: number, newFile: File) => void
}

export function OcrReviewPanel({ files, results, onResultEdit }: OcrReviewPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  // Per-file overrides: wordIndex → reverted (corrected removed)
  const [reverts, setReverts] = useState<Map<string, Set<number>>>(new Map())
  const [applied, setApplied] = useState<Set<number>>(new Set())
  const [popover, setPopover] = useState<{
    fileIndex: number
    wordIndex: number
    anchorRect: DOMRect
  } | null>(null)
  const editRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)

  const hasAnyOcr = results.some(r => getOcrMeta(r) !== null)
  if (!hasAnyOcr) return null

  const activeMeta = getOcrMeta(results[activeIndex])
  const activeFile = files[activeIndex]
  const activeResultFile = getResultFile(results[activeIndex])
  const fileKey = `${activeIndex}`
  const revertedSet = reverts.get(fileKey) ?? new Set<number>()

  const getEffectiveWords = useCallback((fileIndex: number) => {
    const meta = getOcrMeta(results[fileIndex])
    if (!meta) return []
    const rSet = reverts.get(`${fileIndex}`) ?? new Set<number>()
    return meta.words.map((w, wi) =>
      rSet.has(wi) ? { ...w, corrected: undefined } : w
    )
  }, [results, reverts])

  const handleRevert = useCallback((wordIndex: number) => {
    setReverts(prev => {
      const next = new Map(prev)
      const s = new Set(next.get(fileKey) ?? [])
      s.add(wordIndex)
      next.set(fileKey, s)
      return next
    })
    setPopover(null)
  }, [fileKey])

  const handleApply = useCallback(async () => {
    if (!activeResultFile) return
    const words = getEffectiveWords(activeIndex)
    // Read edited text from the contentEditable div if user typed in it;
    // fall back to reconstructing from word metadata
    const editedText = editRef.current?.innerText?.trim()
      ?? words.map(w => w.corrected ?? w.text).join(' ')

    const newFile = new File([editedText], activeResultFile.name, { type: activeResultFile.type })
    onResultEdit(activeIndex, newFile)
    setApplied(prev => new Set(prev).add(activeIndex))
    if (liveRef.current) liveRef.current.textContent = 'Changes applied.'
    setTimeout(() => { if (liveRef.current) liveRef.current.textContent = '' }, 3000)
  }, [activeResultFile, getEffectiveWords, activeIndex, onResultEdit])

  const handleWordClick = useCallback((wordIndex: number, el: HTMLElement) => {
    setPopover({
      fileIndex: activeIndex,
      wordIndex,
      anchorRect: el.getBoundingClientRect(),
    })
  }, [activeIndex])

  if (!activeMeta || !activeFile) return null

  const effectiveWords = getEffectiveWords(activeIndex)
  const isApplied = applied.has(activeIndex)
  const renderedLines = activeMeta.lines.length > 0 ? activeMeta.lines : [buildEditableOcrText(activeMeta)]

  return (
    <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-fg">Review extracted text</span>
        <span className="text-xs text-fg-muted">Edit before downloading</span>
      </div>

      {/* File strip — batch only */}
      {files.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto p-3 border-b border-border"
          role="tablist"
          aria-label="Files"
        >
          {files.map((f, i) => {
            const meta = getOcrMeta(results[i])
            const count = meta ? flaggedCount(meta) : 0
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'flex items-center gap-2 min-w-0 rounded-lg border px-2 py-1.5 text-left text-xs shrink-0 transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  i === activeIndex
                    ? 'border-primary/50 bg-primary/5 text-fg'
                    : 'border-border bg-bg hover:border-border-strong text-fg-muted'
                )}
              >
                <FileThumbnail file={f} />
                <span className="max-w-[80px] truncate">{f.name}</span>
                {count > 0 && (
                  <span className="ml-auto rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5 text-[10px] font-medium shrink-0">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-col md:flex-row md:divide-x md:divide-border">
        {/* Source image */}
        <div className="overflow-auto p-4 md:w-1/2 md:max-h-[500px]">
          <SourceImage file={activeFile} />
        </div>

        {/* Text side */}
        <div className="flex flex-col p-4 md:w-1/2 gap-3">
          {/* Legend */}
          <p className="text-xs text-fg-muted flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-6 border-b-2 border-amber-400 border-dashed" />
              Low confidence
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-6 border-b-2 border-blue-400 border-dotted" />
              Auto-corrected (tap to revert)
            </span>
          </p>

          {/* Editable region */}
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            className={cn(
              'min-h-[160px] rounded-lg border border-border bg-bg p-3 text-sm text-fg leading-relaxed',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
              'overflow-y-auto max-h-[360px]',
            )}
            aria-label="Extracted text — editable"
            aria-multiline="true"
          >
            {(() => {
              let wordIndex = 0
              return renderedLines.map((line, lineIndex) => (
                <div key={lineIndex}>
                  {tokenizeLine(line).map((token, tokenIndex) => {
                    if (!token || /^\s+$/.test(token)) {
                      return <span key={`ws-${lineIndex}-${tokenIndex}`}>{token}</span>
                    }

                    const word = effectiveWords[wordIndex]
                    const display = word?.corrected ?? word?.text ?? token
                    const isFlagged = !!word && word.confidence !== -1 && word.confidence < 60 && !word.corrected
                    const isCorrected = !!word && word.corrected !== undefined
                    const currentWordIndex = wordIndex
                    wordIndex++

                    if (!word || (!isFlagged && !isCorrected)) {
                      return <span key={`word-${lineIndex}-${tokenIndex}`}>{display}</span>
                    }

                    return (
                      <AnnotatedWord
                        key={`word-${lineIndex}-${tokenIndex}`}
                        word={word}
                        wordIndex={currentWordIndex}
                        isFlagged={isFlagged}
                        isCorrected={isCorrected}
                        onPopoverOpen={handleWordClick}
                      />
                    )
                  })}
                </div>
              ))
            })()}
          </div>

          {/* aria-live for screen readers */}
          <div ref={liveRef} aria-live="polite" className="sr-only" />

          <button
            type="button"
            onClick={handleApply}
            className={cn(
              'self-end rounded-lg px-4 py-2 text-sm font-semibold transition-colors min-h-[44px]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              isApplied
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-primary text-primary-fg hover:bg-primary-hover'
            )}
          >
            {isApplied ? 'Changes applied ✓' : 'Apply changes'}
          </button>
        </div>
      </div>

      {/* Correction popover */}
      {popover && (() => {
        const w = getEffectiveWords(popover.fileIndex)[popover.wordIndex]
        if (!w?.corrected) return null
        return (
          <CorrectionPopover
            rawText={w.text}
            correctedText={w.corrected}
            anchorRect={popover.anchorRect}
            onRevert={() => handleRevert(popover.wordIndex)}
            onClose={() => setPopover(null)}
          />
        )
      })()}
    </div>
  )
}

// ── Annotated word span (extracted to avoid hook rules issues) ────────────────

function AnnotatedWord({
  word,
  wordIndex,
  isFlagged,
  isCorrected,
  onPopoverOpen,
}: {
  word: { text: string; corrected?: string; confidence: number }
  wordIndex: number
  isFlagged: boolean
  isCorrected: boolean
  onPopoverOpen: (wordIndex: number, el: HTMLElement) => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const display = word.corrected ?? word.text

  return (
    <span
      ref={ref}
      className={cn(
        isFlagged && 'underline decoration-amber-400 decoration-wavy underline-offset-2',
        isCorrected && 'underline decoration-blue-400 decoration-dotted underline-offset-2 cursor-pointer'
      )}
      onClick={isCorrected ? () => { if (ref.current) onPopoverOpen(wordIndex, ref.current) } : undefined}
      onKeyDown={isCorrected ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (ref.current) onPopoverOpen(wordIndex, ref.current)
        }
      } : undefined}
      role={isCorrected ? 'button' : undefined}
      tabIndex={isCorrected ? 0 : undefined}
      aria-label={isCorrected
        ? `Auto-corrected: "${word.text}" changed to "${word.corrected}". Press Enter to see options.`
        : undefined}
    >
      {display}{' '}
    </span>
  )
}
