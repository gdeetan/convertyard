# Merge PDF Excellence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add page-level control to the Merge PDF tool — expandable per-file thumbnail grids with exclude/reorder per page, free in-browser.

**Architecture:** Replace the `files: File[]` state model with `PdfFileEntry[]` that tracks page count, thumbnail blob URLs, and a `pageOrder` array (excluded pages absent). The converter gains a `MergeSource` interface so callers can pass arbitrary page indices. The tool config replaces the live `convertFn` with an unreachable stub.

**Tech Stack:** pdf-lib (`copyPages`), mupdf-wasm (`getPageCount`, `renderPagePng` at 72 DPI), HTML5 drag API, React `useRef` + `useState`, Tailwind CSS

---

### Task 1: Update `mergePDFs` in `lib/converters/pdf.ts`

**Files:**
- Modify: `lib/converters/pdf.ts:10-35`

- [ ] **Step 1: Add `MergeSource` interface before the function**

Open `lib/converters/pdf.ts`. Insert directly above `export async function mergePDFs`:

```typescript
export interface MergeSource {
  file: File
  pageIndices: number[]  // 0-based, in the order to include them
}
```

- [ ] **Step 2: Update function signature and body**

Replace the entire `mergePDFs` function (lines 10–35):

```typescript
export async function mergePDFs(
  sources: MergeSource[],
  _options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const activeSources = sources.filter(s => s.pageIndices.length > 0)
  if (activeSources.length === 0) return []

  const merged = await PDFDocument.create()

  for (let i = 0; i < activeSources.length; i++) {
    onProgress?.(0, Math.round((i / activeSources.length) * 80))
    const buffer = await activeSources[i].file.arrayBuffer()
    const srcDoc = await PDFDocument.load(buffer)
    const copied = await merged.copyPages(srcDoc, activeSources[i].pageIndices)
    for (const page of copied) merged.addPage(page)
  }

  onProgress?.(0, 90)
  const bytes = await merged.save({ useObjectStreams: true })
  onProgress?.(0, 100)

  const baseName = activeSources[0].file.name.replace(/\.[^.]+$/, '')
  const outName = activeSources.length === 1
    ? activeSources[0].file.name
    : `${baseName}-merged.pdf`
  return [new File([new Uint8Array(bytes)], outName, { type: 'application/pdf' })]
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm run build 2>&1 | tail -20
```

Expected: build succeeds (TypeScript errors would show here).

- [ ] **Step 4: Commit**

```bash
git add lib/converters/pdf.ts
git commit -m "feat: add MergeSource interface to mergePDFs — page-level merge support"
```

---

### Task 2: Update `content/tools/merge-pdf.ts`

**Files:**
- Modify: `content/tools/merge-pdf.ts`

- [ ] **Step 1: Replace `convertFn` and update FAQ**

Rewrite the entire file:

```typescript
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'merge-pdf',
  title: 'Merge PDF',
  subtitle: 'Combine multiple PDFs into one file. Built for batches.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  // This tool uses a custom page.tsx — convertFn is never called through ToolShell.
  convertFn: () => Promise.resolve([]),

  faq: [
    {
      q: 'What order will the pages appear in the merged PDF?',
      a: 'Pages appear in the order you arrange your files using the drag handles. Within each file, you can expand the page grid and drag individual pages to reorder them. The final output reflects both file order and any per-file page reordering you apply.',
    },
    {
      q: 'Can I merge only specific pages from each file?',
      a: 'Yes. Expand any file in the list by clicking the chevron next to its name. You\'ll see a thumbnail grid of all its pages. Click ✕ on any page to exclude it from the merge — the thumbnail dims to show it\'s excluded. Click the + on a dimmed page to re-include it.',
    },
    {
      q: 'Can I reorder pages from different files?',
      a: 'You can reorder pages within each file using the thumbnail grid. To interleave pages from different sources, reorder the files first using the file-level drag handles, then use the per-file page controls to set the page order within each file.',
    },
    {
      q: 'Does merging reduce the quality of my PDFs?',
      a: 'No. Merging copies the original page content from each PDF without re-compressing or re-rendering anything. Text, images, and vector graphics are preserved exactly as they were in the source files.',
    },
    {
      q: 'Is there a limit on how many PDFs I can merge or how large they can be?',
      a: 'There is no hard limit built into the tool. Practical limits depend on your device memory — most modern computers handle 50+ PDFs or several hundred megabytes without issue. Very large files (500MB+) may be slow or run out of browser memory on older devices.',
    },
    {
      q: 'Does merging increase the final file size?',
      a: 'The merged file is roughly the sum of your input file sizes, sometimes a little smaller because duplicate data (like embedded fonts shared across documents) is deduplicated during the merge. You will not get significant compression just from merging — use Compress PDF after if you need a smaller file.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. The entire merge happens in your browser using WebAssembly. Your PDFs never leave your device — no upload, no account, no server involved.',
    },
    {
      q: 'Can I merge password-protected PDFs?',
      a: 'Password-protected PDFs that require a password to open are not supported — the tool will return an error for those files. PDFs with print or copy restrictions (but no open password) typically merge without issues.',
    },
  ],

  relatedTools: ['compress-pdf', 'pdf-to-jpg'],
  relatedArticles: ['merge-pdf-without-uploading'],

  meta: {
    title: 'Merge PDF — ConvertYard',
    description:
      'Merge multiple PDF files into one in your browser. Drag to reorder pages before combining. No uploads, no account — runs entirely locally.',
  },
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add content/tools/merge-pdf.ts
git commit -m "feat: stub convertFn, update FAQ for page-level merge control"
```

---

### Task 3: Rewrite `app/(tools)/merge-pdf/page.tsx`

**Files:**
- Modify: `app/(tools)/merge-pdf/page.tsx`

This is the main task — full replacement of the page with `PdfFileEntry` state, thumbnail loading, expandable page grids, per-page exclude/reorder, updated footer and merge button.

- [ ] **Step 1: Write the new page.tsx**

Replace the entire file with:

```typescript
'use client'

import { useState, useCallback, useRef } from 'react'
import {
  GripVertical, X, Plus, Lock, Upload, RefreshCcw, Download,
  CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { mergePDFs, MergeSource } from '@/lib/converters/pdf'
import { getPageCount, renderPagePng } from '@/lib/converters/mupdf-client'
import { config } from '@/content/tools/merge-pdf'

interface PdfFileEntry {
  file: File
  pageCount: number | null
  thumbnails: (string | null)[]
  pageOrder: number[]
  expanded: boolean
}

type Phase = 'idle' | 'merging' | 'done' | 'error'

export default function MergePdfPage() {
  const [entries, setEntries] = useState<PdfFileEntry[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ file: File; pageCount: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // File-level drag
  const dragFileIndex = useRef<number | null>(null)
  // Page-level drag
  const dragPageRef = useRef<{ fileIdx: number; fromPageOrderIdx: number } | null>(null)
  // Cancelled file tracking for in-progress thumbnail renders
  const cancelledFiles = useRef<Set<File>>(new Set())

  const handleAdd = useCallback(async (added: File[]) => {
    for (const file of added) {
      // Create initial entry with unknown page count
      const entry: PdfFileEntry = {
        file,
        pageCount: null,
        thumbnails: [],
        pageOrder: [],
        expanded: false,
      }
      setEntries(prev => [...prev, entry])

      // Load page count + render thumbnails in background
      try {
        const buffer = await file.arrayBuffer()
        const n = await getPageCount(buffer)

        if (cancelledFiles.current.has(file)) return

        setEntries(prev => prev.map(e =>
          e.file === file
            ? { ...e, pageCount: n, thumbnails: new Array(n).fill(null), pageOrder: Array.from({ length: n }, (_, i) => i) }
            : e
        ))

        // Render thumbnails sequentially
        for (let p = 0; p < n; p++) {
          if (cancelledFiles.current.has(file)) return
          try {
            const buf = file.arrayBuffer ? await file.arrayBuffer() : buffer
            const png = await renderPagePng(buf, p, 72)
            if (cancelledFiles.current.has(file)) return
            const url = URL.createObjectURL(new Blob([png], { type: 'image/png' }))
            setEntries(prev => prev.map(e => {
              if (e.file !== file) return e
              const next = [...e.thumbnails]
              next[p] = url
              return { ...e, thumbnails: next }
            }))
          } catch {
            // Leave thumbnail as null (grey skeleton)
          }
        }
      } catch {
        // Leave pageCount as null — file row still appears
      }
    }
  }, [])

  const handleRemove = (idx: number) => {
    setEntries(prev => {
      const entry = prev[idx]
      // Mark as cancelled so background render stops
      cancelledFiles.current.add(entry.file)
      // Revoke all completed blob URLs
      for (const url of entry.thumbnails) {
        if (url) URL.revokeObjectURL(url)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleReset = () => {
    setEntries(prev => {
      for (const entry of prev) {
        cancelledFiles.current.add(entry.file)
        for (const url of entry.thumbnails) {
          if (url) URL.revokeObjectURL(url)
        }
      }
      return []
    })
    cancelledFiles.current = new Set()
    setPhase('idle')
    setProgress(0)
    setResult(null)
    setErrorMsg('')
  }

  const toggleExpand = (idx: number) => {
    setEntries(prev => prev.map((e, i) =>
      i === idx ? { ...e, expanded: !e.expanded } : e
    ))
  }

  const excludePage = (fileIdx: number, pageOrderIdx: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== fileIdx) return e
      const next = [...e.pageOrder]
      next.splice(pageOrderIdx, 1)
      return { ...e, pageOrder: next }
    }))
  }

  const includePage = (fileIdx: number, pageIndex: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== fileIdx) return e
      return { ...e, pageOrder: [...e.pageOrder, pageIndex] }
    }))
  }

  // File-level drag
  const onFileDragStart = (idx: number) => { dragFileIndex.current = idx }
  const onFileDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const from = dragFileIndex.current
    if (from === null || from === idx) return
    setEntries(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(idx, 0, moved)
      dragFileIndex.current = idx
      return next
    })
  }
  const onFileDragEnd = () => { dragFileIndex.current = null }

  // Page-level drag (within a file's pageOrder)
  const onPageDragStart = (fileIdx: number, fromPageOrderIdx: number) => {
    dragPageRef.current = { fileIdx, fromPageOrderIdx }
  }
  const onPageDragOver = (e: React.DragEvent, fileIdx: number, toPageOrderIdx: number) => {
    e.preventDefault()
    const drag = dragPageRef.current
    if (!drag || drag.fileIdx !== fileIdx || drag.fromPageOrderIdx === toPageOrderIdx) return
    setEntries(prev => prev.map((entry, i) => {
      if (i !== fileIdx) return entry
      const next = [...entry.pageOrder]
      const [moved] = next.splice(drag.fromPageOrderIdx, 1)
      next.splice(toPageOrderIdx, 0, moved)
      dragPageRef.current = { fileIdx, fromPageOrderIdx: toPageOrderIdx }
      return { ...entry, pageOrder: next }
    }))
  }
  const onPageDragEnd = () => { dragPageRef.current = null }

  const handleMerge = async () => {
    const totalIncluded = entries.reduce((s, e) => s + e.pageOrder.length, 0)
    if (totalIncluded === 0) return
    setPhase('merging')
    setProgress(0)
    try {
      const sources: MergeSource[] = entries.map(e => ({
        file: e.file,
        pageIndices: e.pageOrder,
      }))
      const results = await mergePDFs(sources, {}, (_, pct) => setProgress(pct))
      const merged = results[0]
      if (merged instanceof Error) throw merged
      if (!(merged instanceof File)) throw new Error('Merge failed')
      setResult({ file: merged, pageCount: totalIncluded })
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Merge failed')
      setPhase('error')
    }
  }

  const totalPages = entries.reduce((s, e) => s + (e.pageCount ?? 0), 0)
  const includedPages = entries.reduce((s, e) => s + e.pageOrder.length, 0)
  const totalBytes = entries.reduce((s, e) => s + e.file.size, 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/pdf' },
          { label: config.title },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {config.title}
        </h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Files never leave your browser. No uploads. No accounts.
        </div>
      </div>

      {/* Tool card */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">

        {/* Idle: no files */}
        {phase === 'idle' && entries.length === 0 && (
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={handleAdd}
          />
        )}

        {/* Idle: files queued */}
        {phase === 'idle' && entries.length > 0 && (
          <div className="space-y-4">
            {/* File list */}
            <ul className="space-y-1.5" aria-label="Files to merge">
              {entries.map((entry, fileIdx) => (
                <li key={`${entry.file.name}-${fileIdx}`}>
                  {/* File row */}
                  <div
                    draggable
                    onDragStart={() => onFileDragStart(fileIdx)}
                    onDragOver={(e) => onFileDragOver(e, fileIdx)}
                    onDragEnd={onFileDragEnd}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5',
                      'cursor-grab active:cursor-grabbing select-none',
                      'hover:border-primary/40 transition-colors',
                      entry.expanded && 'rounded-b-none border-b-0'
                    )}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{entry.file.name}</span>
                    {/* Page count badge */}
                    <span className="shrink-0 text-xs text-fg-subtle">
                      {entry.pageCount === null ? '…' : `${entry.pageCount} page${entry.pageCount === 1 ? '' : 's'}`}
                    </span>
                    <span className="shrink-0 text-xs text-fg-subtle">{formatBytes(entry.file.size)}</span>
                    {/* Expand chevron */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(fileIdx)}
                      aria-label={entry.expanded ? 'Collapse pages' : 'Expand pages'}
                      className={cn(
                        'shrink-0 rounded p-0.5 text-fg-subtle transition-all',
                        'hover:text-fg hover:bg-bg-muted',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                      )}
                    >
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', entry.expanded && 'rotate-180')} />
                    </button>
                    {/* Remove file */}
                    <button
                      type="button"
                      onClick={() => handleRemove(fileIdx)}
                      aria-label={`Remove ${entry.file.name}`}
                      className={cn(
                        'shrink-0 rounded p-0.5 text-fg-subtle transition-colors',
                        'hover:text-error hover:bg-bg-muted',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expanded page grid */}
                  {entry.expanded && (
                    <div className="rounded-b-lg border border-t-0 border-border bg-bg-muted p-3">
                      {entry.pageCount === null ? (
                        <p className="text-xs text-fg-subtle py-2 text-center">Loading pages…</p>
                      ) : entry.pageCount === 0 ? (
                        <p className="text-xs text-fg-subtle py-2 text-center">No pages in this file.</p>
                      ) : (
                        <>
                          {/* Included pages */}
                          {entry.pageOrder.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              {entry.pageOrder.map((pageIndex, orderIdx) => (
                                <div
                                  key={`${fileIdx}-${pageIndex}-included`}
                                  draggable
                                  onDragStart={() => onPageDragStart(fileIdx, orderIdx)}
                                  onDragOver={(e) => onPageDragOver(e, fileIdx, orderIdx)}
                                  onDragEnd={onPageDragEnd}
                                  className="relative cursor-grab active:cursor-grabbing"
                                >
                                  <div className="relative overflow-hidden rounded border border-border bg-bg aspect-[3/4]">
                                    {entry.thumbnails[pageIndex] ? (
                                      <img
                                        src={entry.thumbnails[pageIndex]!}
                                        alt={`Page ${pageIndex + 1}`}
                                        className="h-full w-full object-contain"
                                        draggable={false}
                                      />
                                    ) : (
                                      <div className="h-full w-full animate-pulse bg-bg-muted" />
                                    )}
                                  </div>
                                  <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[10px] leading-4 text-white">
                                    {pageIndex + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => excludePage(fileIdx, orderIdx)}
                                    aria-label={`Exclude page ${pageIndex + 1}`}
                                    className={cn(
                                      'absolute top-1 right-1 rounded-full bg-black/60 p-0.5',
                                      'text-white hover:bg-error transition-colors'
                                    )}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Excluded pages */}
                          {(() => {
                            const excluded = Array.from({ length: entry.pageCount }, (_, i) => i)
                              .filter(i => !entry.pageOrder.includes(i))
                            if (excluded.length === 0) return null
                            return (
                              <>
                                <p className="text-[10px] text-fg-subtle mb-1.5">Excluded</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {excluded.map(pageIndex => (
                                    <div key={`${fileIdx}-${pageIndex}-excluded`} className="relative">
                                      <div className="relative overflow-hidden rounded border border-border bg-bg aspect-[3/4] opacity-30">
                                        {entry.thumbnails[pageIndex] ? (
                                          <img
                                            src={entry.thumbnails[pageIndex]!}
                                            alt={`Page ${pageIndex + 1} (excluded)`}
                                            className="h-full w-full object-contain"
                                            draggable={false}
                                          />
                                        ) : (
                                          <div className="h-full w-full bg-bg-muted" />
                                        )}
                                      </div>
                                      <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[10px] leading-4 text-white">
                                        {pageIndex + 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => includePage(fileIdx, pageIndex)}
                                        aria-label={`Re-include page ${pageIndex + 1}`}
                                        className={cn(
                                          'absolute top-1 right-1 rounded-full bg-black/60 p-0.5',
                                          'text-white hover:bg-green-500 transition-colors'
                                        )}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Add more */}
            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              compact
              fileCount={entries.length}
              totalBytes={totalBytes}
            />

            {/* Footer bar */}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className={cn(
                    'text-sm text-fg-muted hover:text-fg transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
                  )}
                >
                  Clear all
                </button>
                <span className="text-xs text-fg-subtle">
                  {entries.length} file{entries.length === 1 ? '' : 's'} · {includedPages} of {totalPages} page{totalPages === 1 ? '' : 's'} selected
                </span>
              </div>
              <button
                type="button"
                onClick={handleMerge}
                disabled={includedPages === 0}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Merge {includedPages} page{includedPages === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        )}

        {/* Merging */}
        {phase === 'merging' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">Merging {includedPages} pages…</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-fg-subtle">{progress}%</p>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && result && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-bg px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{result.file.name}</p>
                <p className="text-xs text-fg-subtle">
                  {result.pageCount} page{result.pageCount === 1 ? '' : 's'} · {formatBytes(result.file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadFile(result.file)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                )}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </button>
            </div>
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  'flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
                )}
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Merge more files
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-error/40 bg-bg px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-fg">Merge failed</p>
                <p className="mt-0.5 text-xs text-fg-muted">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                'flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
              )}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <section className="mt-12" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">
          How it works
        </h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
          {[
            { n: '1', label: 'Drop your PDFs', desc: 'Drag and drop or click to browse. Add as many PDFs as you need.' },
            { n: '2', label: 'Set the order', desc: 'Drag files to set their order. Expand any file to reorder or exclude individual pages.' },
            { n: '3', label: 'Click Merge', desc: 'All merging happens in your browser via WebAssembly — no server, no upload.' },
            { n: '4', label: 'Download', desc: 'Your merged PDF downloads as a single file immediately.' },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{step.label}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      {config.faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={config.faq} />
        </section>
      )}

      {/* Related tools */}
      {config.relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={config.relatedTools} />
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm run build 2>&1 | tail -30
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual smoke test**

Start dev server:
```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm run dev
```

Open `http://localhost:3000/merge-pdf` and verify:
- Drop a multi-page PDF → page count badge appears (then updates from `…`)
- Chevron expands the file row to reveal thumbnail grid
- Thumbnails render progressively (grey skeleton → image)
- Click ✕ on a page → it moves to the Excluded section, dimmed, with `+`
- Click `+` on an excluded page → it reappears in the included grid
- Footer shows `X files · Y of Z pages selected` and updates on exclude/include
- Merge button shows `Merge Y pages`
- Merge with exclusions → output has correct page count in done state
- Done state shows `N pages · X MB`
- Drag a page thumbnail → `pageOrder` reorders (watch merge output order)
- Remove a file while thumbnails still rendering → no console errors, thumbnail rendering stops

- [ ] **Step 4: Commit**

```bash
git add app/\(tools\)/merge-pdf/page.tsx
git commit -m "feat: Merge PDF excellence — expandable page grids, per-page exclude/reorder, progressive thumbnails"
```

---

## Deployment

After all tasks pass:

```bash
git push origin main
```

Cloudflare Pages auto-deploys from `main`. The live site updates within ~2 minutes.

---

## Spec Reference

Full design spec: `docs/superpowers/specs/2026-06-26-merge-pdf-excellence-design.md`
