# PDF to JPG Excellence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic ToolShell PDF to JPG page with a custom page featuring page-selection thumbnails, click-to-preview at full DPI/quality, and ZIP download of only the selected pages.

**Architecture:** Custom `page.tsx` (exits ToolShell) with `PdfFileEntry[]` state — same thumbnail loading pattern as Merge PDF (72 DPI progressive, `cancelledFiles` ref). DPI is three preset buttons (72/150/300). Preview panel renders via `renderPage(buffer, pageIndex, dpi, quality)` on click, debounced re-render on slider change. Output collected as `File[]` and packaged via `downloadAsZip`.

**Tech Stack:** mupdf-client (`renderPagePng` for thumbnails, `renderPage` for preview/export), fflate via `lib/utils/zip.ts` (`downloadAsZip`), React `useRef` + `useState`, Tailwind CSS

---

### Task 1: Update `content/tools/pdf-to-jpg.ts`

**Files:**
- Modify: `content/tools/pdf-to-jpg.ts`

- [ ] **Step 1: Rewrite the file**

Replace the entire file with:

```typescript
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-jpg',
  title: 'PDF to JPG Converter',
  subtitle: 'Export PDF pages as JPG images. Pick pages, preview quality.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.jpg',
  // This tool uses a custom page.tsx — convertFn is never called through ToolShell.
  convertFn: () => Promise.resolve([]),

  faq: [
    {
      q: 'Can I export only specific pages?',
      a: 'Yes. Expand any file to see its page thumbnails, then uncheck the pages you want to skip. Only checked pages are included in the download.',
    },
    {
      q: 'Can I preview what the output will look like before downloading?',
      a: 'Yes. Click any page thumbnail to open a full-resolution preview at your chosen DPI and quality settings. Change the DPI or quality controls to see the effect in real time.',
    },
    {
      q: 'What DPI should I choose?',
      a: '72 DPI is fine for web thumbnails or quick previews. 150 DPI is a good default for email attachments, presentations, and most online uses — clear and readable without large file sizes. 300 DPI produces print-quality images suitable for physical printing or professional workflows. Higher DPI means larger files and slower processing.',
    },
    {
      q: 'How does a multi-page PDF export?',
      a: 'Each selected page becomes a separate JPG file named with your original PDF name and the original page number — for example, page 3 of "report.pdf" exports as "report-page-3.jpg". All files download together in a single ZIP.',
    },
    {
      q: 'Will text in the PDF be readable in the exported JPGs?',
      a: 'Yes, as long as you use a sufficient DPI. At 150 DPI, standard body text is clearly legible. Small text (footnotes, captions) may need 200–300 DPI to remain sharp. JPEG compression can also soften fine text — use quality 85 or higher to preserve readability.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Rendering happens entirely in your browser using WebAssembly. Your PDFs never leave your device — no upload, no account.',
    },
    {
      q: 'What is the difference between PDF to JPG and PDF to PNG?',
      a: 'JPG uses lossy compression — smaller files, perfect for photos and scanned documents. PNG uses lossless compression — larger files, but every pixel is preserved exactly. For most PDFs containing text or mixed content, JPG at quality 85+ looks identical to PNG but at a fraction of the size.',
    },
  ],

  relatedTools: ['compress-pdf', 'merge-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to JPG Converter — ConvertYard',
    description:
      'Convert PDF pages to JPG images in your browser. Pick pages, preview quality before downloading. Batch convert — no uploads, no account, entirely local.',
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
git add content/tools/pdf-to-jpg.ts
git commit -m "feat: stub convertFn, update FAQ for page selection and preview"
```

---

### Task 2: Rewrite `app/(tools)/pdf-to-jpg/page.tsx`

**Files:**
- Modify: `app/(tools)/pdf-to-jpg/page.tsx`

This is the main task — full replacement with `PdfFileEntry` state, checkbox-based page selection, click-to-preview panel, DPI presets, quality slider, and ZIP download.

- [ ] **Step 1: Write the new page.tsx**

Replace the entire file with:

```typescript
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  GripVertical, X, Lock, RefreshCcw, Download,
  CheckCircle2, AlertCircle, ChevronDown, ImageIcon,
} from 'lucide-react'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import { downloadAsZip } from '@/lib/utils/zip'
import { getPageCount, renderPagePng, renderPage } from '@/lib/converters/mupdf-client'
import { config } from '@/content/tools/pdf-to-jpg'

interface PdfFileEntry {
  id: string
  file: File
  pageCount: number | null
  thumbnails: (string | null)[]
  selectedPages: Set<number>
  expanded: boolean
}

interface PreviewState {
  fileIdx: number
  pageIndex: number
  blobUrl: string | null
}

type Phase = 'idle' | 'converting' | 'done' | 'error'

const DPI_OPTIONS = [72, 150, 300] as const
type DpiOption = typeof DPI_OPTIONS[number]

export default function PdfToJpgPage() {
  const [entries, setEntries] = useState<PdfFileEntry[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [doneSize, setDoneSize] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [dpi, setDpi] = useState<DpiOption>(150)
  const [quality, setQuality] = useState(85)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const cancelledFiles = useRef<Set<File>>(new Set())
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewBlobUrl = useRef<string | null>(null)

  // Debounced preview re-render when dpi/quality change
  useEffect(() => {
    if (!preview) return
    if (previewDebounce.current) clearTimeout(previewDebounce.current)
    previewDebounce.current = setTimeout(() => {
      renderPreview(preview.fileIdx, preview.pageIndex)
    }, 300)
    return () => {
      if (previewDebounce.current) clearTimeout(previewDebounce.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpi, quality])

  const renderPreview = async (fileIdx: number, pageIndex: number) => {
    const entry = entries[fileIdx]
    if (!entry) return
    setPreview(prev => prev ? { ...prev, blobUrl: null } : null)
    try {
      const buffer = await entry.file.arrayBuffer()
      const jpegBuffer = await renderPage(buffer, pageIndex, dpi, quality)
      const blob = new Blob([jpegBuffer], { type: 'image/jpeg' })
      // Revoke previous
      if (previewBlobUrl.current) URL.revokeObjectURL(previewBlobUrl.current)
      const url = URL.createObjectURL(blob)
      previewBlobUrl.current = url
      setPreview({ fileIdx, pageIndex, blobUrl: url })
    } catch {
      setPreview(prev => prev ? { ...prev, blobUrl: null } : null)
    }
  }

  const openPreview = (fileIdx: number, pageIndex: number) => {
    setPreview({ fileIdx, pageIndex, blobUrl: null })
    renderPreview(fileIdx, pageIndex)
  }

  const closePreview = () => {
    if (previewBlobUrl.current) {
      URL.revokeObjectURL(previewBlobUrl.current)
      previewBlobUrl.current = null
    }
    setPreview(null)
  }

  const handleAdd = useCallback(async (added: File[]) => {
    for (const file of added) {
      const entry: PdfFileEntry = {
        id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`,
        file,
        pageCount: null,
        thumbnails: [],
        selectedPages: new Set(),
        expanded: false,
      }
      setEntries(prev => [...prev, entry])

      try {
        const buffer = await file.arrayBuffer()
        const n = await getPageCount(buffer)
        if (cancelledFiles.current.has(file)) return

        setEntries(prev => prev.map(e =>
          e.file === file
            ? {
                ...e,
                pageCount: n,
                thumbnails: new Array(n).fill(null),
                selectedPages: new Set(Array.from({ length: n }, (_, i) => i)),
              }
            : e
        ))

        for (let p = 0; p < n; p++) {
          if (cancelledFiles.current.has(file)) return
          try {
            const buf = await file.arrayBuffer()
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
            // Leave thumbnail as null skeleton
          }
        }
      } catch {
        // Leave pageCount as null — row still appears
      }
    }
  }, [])

  const handleRemove = (idx: number) => {
    setEntries(prev => {
      const entry = prev[idx]
      cancelledFiles.current.add(entry.file)
      for (const url of entry.thumbnails) {
        if (url) URL.revokeObjectURL(url)
      }
      if (preview?.fileIdx === idx) closePreview()
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
    closePreview()
    queueMicrotask(() => { cancelledFiles.current = new Set() })
    setPhase('idle')
    setProgress(0)
    setDoneCount(0)
    setDoneSize(0)
    setErrorMsg('')
  }

  const toggleExpand = (idx: number) => {
    setEntries(prev => prev.map((e, i) =>
      i === idx ? { ...e, expanded: !e.expanded } : e
    ))
  }

  const togglePage = (fileIdx: number, pageIndex: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== fileIdx) return e
      const next = new Set(e.selectedPages)
      if (next.has(pageIndex)) next.delete(pageIndex)
      else next.add(pageIndex)
      return { ...e, selectedPages: next }
    }))
  }

  const handleConvert = async () => {
    const totalSelected = entries.reduce((s, e) => s + e.selectedPages.size, 0)
    if (totalSelected === 0) return
    setPhase('converting')
    setProgress(0)

    try {
      const outputFiles: File[] = []
      let processed = 0

      for (const entry of entries) {
        if (entry.selectedPages.size === 0) continue
        const buffer = await entry.file.arrayBuffer()
        const baseName = entry.file.name.replace(/\.[^.]+$/, '')
        const sorted = Array.from(entry.selectedPages).sort((a, b) => a - b)

        for (const pageIndex of sorted) {
          const jpegBuffer = await renderPage(buffer, pageIndex, dpi, quality)
          const fileName = entry.pageCount === 1 && entry.selectedPages.size === 1
            ? `${baseName}.jpg`
            : `${baseName}-page-${pageIndex + 1}.jpg`
          outputFiles.push(new File([jpegBuffer], fileName, { type: 'image/jpeg' }))
          processed++
          setProgress(Math.round((processed / totalSelected) * 100))
        }
      }

      const totalBytes = outputFiles.reduce((s, f) => s + f.size, 0)
      setDoneCount(outputFiles.length)
      setDoneSize(totalBytes)
      setPhase('done')
      await downloadAsZip(outputFiles, 'convertyard-jpg.zip')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Conversion failed')
      setPhase('error')
    }
  }

  const totalPages = entries.reduce((s, e) => s + (e.pageCount ?? 0), 0)
  const selectedPages = entries.reduce((s, e) => s + e.selectedPages.size, 0)
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
            <ul className="space-y-1.5" aria-label="PDF files">
              {entries.map((entry, fileIdx) => (
                <li key={entry.id}>
                  {/* File row */}
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5',
                      'select-none hover:border-primary/40 transition-colors',
                      entry.expanded && 'rounded-b-none border-b-0'
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{entry.file.name}</span>
                    <span className="shrink-0 text-xs text-fg-subtle">
                      {entry.pageCount === null
                        ? '…'
                        : `${entry.selectedPages.size} / ${entry.pageCount} page${entry.pageCount === 1 ? '' : 's'}`}
                    </span>
                    <span className="shrink-0 text-xs text-fg-subtle">{formatBytes(entry.file.size)}</span>
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
                    <div className="rounded-b-lg border border-t-0 border-border bg-bg-muted p-3 space-y-3">
                      {entry.pageCount === null ? (
                        <p className="text-xs text-fg-subtle py-2 text-center">Loading pages…</p>
                      ) : entry.pageCount === 0 ? (
                        <p className="text-xs text-fg-subtle py-2 text-center">No pages in this file.</p>
                      ) : (
                        <>
                          {/* Select all / deselect all */}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setEntries(prev => prev.map((e, i) =>
                                i === fileIdx
                                  ? { ...e, selectedPages: new Set(Array.from({ length: e.pageCount! }, (_, j) => j)) }
                                  : e
                              ))}
                              className="text-[11px] text-primary hover:underline"
                            >
                              Select all
                            </button>
                            <span className="text-[11px] text-fg-subtle">·</span>
                            <button
                              type="button"
                              onClick={() => setEntries(prev => prev.map((e, i) =>
                                i === fileIdx ? { ...e, selectedPages: new Set() } : e
                              ))}
                              className="text-[11px] text-primary hover:underline"
                            >
                              Deselect all
                            </button>
                          </div>

                          {/* Thumbnail grid */}
                          <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: entry.pageCount }, (_, pageIndex) => {
                              const selected = entry.selectedPages.has(pageIndex)
                              const isPreview = preview?.fileIdx === fileIdx && preview.pageIndex === pageIndex
                              return (
                                <div key={`${entry.id}-${pageIndex}`} className="relative">
                                  <button
                                    type="button"
                                    onClick={() => openPreview(fileIdx, pageIndex)}
                                    aria-label={`Preview page ${pageIndex + 1}`}
                                    className={cn(
                                      'relative w-full overflow-hidden rounded border bg-bg aspect-[3/4] block',
                                      isPreview ? 'border-primary' : 'border-border',
                                      !selected && 'opacity-30',
                                      'hover:border-primary/60 transition-colors'
                                    )}
                                  >
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
                                  </button>
                                  {/* Page number */}
                                  <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[10px] leading-4 text-white pointer-events-none">
                                    {pageIndex + 1}
                                  </span>
                                  {/* Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => togglePage(fileIdx, pageIndex)}
                                    aria-label={selected ? `Deselect page ${pageIndex + 1}` : `Select page ${pageIndex + 1}`}
                                    className={cn(
                                      'absolute top-1 left-1 rounded w-4 h-4 border flex items-center justify-center',
                                      selected
                                        ? 'bg-primary border-primary text-primary-fg'
                                        : 'bg-bg border-border',
                                      'hover:border-primary transition-colors'
                                    )}
                                  >
                                    {selected && (
                                      <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )
                            })}
                          </div>

                          {/* Preview panel */}
                          {preview?.fileIdx === fileIdx && (
                            <div className="rounded-lg border border-border bg-bg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-fg">
                                  Page {preview.pageIndex + 1} preview
                                </span>
                                <button
                                  type="button"
                                  onClick={closePreview}
                                  aria-label="Close preview"
                                  className="rounded p-0.5 text-fg-subtle hover:text-fg hover:bg-bg-muted"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-center min-h-[200px] bg-bg-muted rounded">
                                {preview.blobUrl ? (
                                  <img
                                    src={preview.blobUrl}
                                    alt={`Page ${preview.pageIndex + 1} at ${dpi} DPI`}
                                    className="max-w-full max-h-96 object-contain rounded"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-fg-subtle">
                                    <ImageIcon className="h-8 w-8 animate-pulse" />
                                    <span className="text-xs">Rendering at {dpi} DPI…</span>
                                  </div>
                                )}
                              </div>
                              {preview.blobUrl && (
                                <p className="mt-1.5 text-[11px] text-fg-subtle text-center">
                                  {dpi} DPI · {quality}% quality
                                </p>
                              )}
                            </div>
                          )}
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

            {/* DPI + Quality controls */}
            <div className="space-y-3 border-t border-border pt-3">
              {/* DPI presets */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-fg-subtle w-14 shrink-0">DPI</span>
                <div className="flex gap-1.5">
                  {DPI_OPTIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDpi(d)}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        dpi === d
                          ? 'bg-primary text-primary-fg'
                          : 'bg-bg-muted text-fg-muted hover:bg-bg-elevated hover:text-fg border border-border'
                      )}
                    >
                      {d}
                      {d === 72 && <span className="ml-1 text-[10px] opacity-70">screen</span>}
                      {d === 150 && <span className="ml-1 text-[10px] opacity-70">web</span>}
                      {d === 300 && <span className="ml-1 text-[10px] opacity-70">print</span>}
                    </button>
                  ))}
                </div>
              </div>
              {/* Quality slider */}
              <div className="flex items-center gap-3">
                <label htmlFor="quality-slider" className="text-xs text-fg-subtle w-14 shrink-0">
                  Quality
                </label>
                <input
                  id="quality-slider"
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-right text-xs text-fg-subtle">{quality}</span>
              </div>
            </div>

            {/* Footer */}
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
                  {entries.length} file{entries.length === 1 ? '' : 's'} · {selectedPages} of {totalPages} page{totalPages === 1 ? '' : 's'} selected
                </span>
              </div>
              <button
                type="button"
                onClick={handleConvert}
                disabled={selectedPages === 0}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                Convert {selectedPages} page{selectedPages === 1 ? '' : 's'} → JPG
              </button>
            </div>
          </div>
        )}

        {/* Converting */}
        {phase === 'converting' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">Converting pages to JPG…</p>
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
        {phase === 'done' && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-bg px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{doneCount} JPG{doneCount === 1 ? '' : 's'} ready</p>
                <p className="text-xs text-fg-subtle">{formatBytes(doneSize)} total</p>
              </div>
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
                Convert more files
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
                <p className="text-sm font-medium text-fg">Conversion failed</p>
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
            { n: '2', label: 'Pick pages', desc: 'Expand any file to see its pages. Uncheck pages you want to skip.' },
            { n: '3', label: 'Preview quality', desc: 'Click any page thumbnail to preview it at your chosen DPI and quality.' },
            { n: '4', label: 'Convert and download', desc: 'Click Convert — all selected pages export as JPGs in a single ZIP.' },
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

- [ ] **Step 3: Run tests**

```bash
cd /Users/garrickdeetan/Documents/Covertyard && npm test 2>&1 | tail -10
```

Expected: all tests pass (109+).

- [ ] **Step 4: Self-review checklist**

Before committing, verify:
- `PdfFileEntry` has `id`, `file`, `pageCount`, `thumbnails`, `selectedPages: Set<number>`, `expanded`
- `handleAdd` sets `selectedPages: new Set([0..N-1])` (all selected by default)
- `cancelledFiles` ref stops rendering after `handleRemove`
- `handleRemove` revokes all thumbnail blob URLs
- `handleReset` uses `queueMicrotask` to clear `cancelledFiles` (not synchronous)
- Preview re-renders on DPI/quality change via `useEffect` with 300ms debounce
- `closePreview` revokes the preview blob URL before clearing state
- `renderPreview` uses `renderPage` (JPEG), not `renderPagePng` (PNG)
- Thumbnails use `renderPagePng` at 72 DPI
- File row shows `X / Y pages` (selected / total)
- Footer shows `X of Y pages selected`
- Convert button says `Convert X pages → JPG`
- Done state shows count + total size
- No import of `PDFDocument` from pdf-lib
- `downloadAsZip` called with output files and `'convertyard-jpg.zip'`

- [ ] **Step 5: Commit**

```bash
git add "app/(tools)/pdf-to-jpg/page.tsx"
git commit -m "feat: PDF to JPG excellence — page selection, click-to-preview, DPI presets"
```

---

## Deployment

After both tasks pass:

```bash
git push origin main
```

Cloudflare Pages auto-deploys from `main`. Live site updates within ~2 minutes.

---

## Spec Reference

`docs/superpowers/specs/2026-06-26-pdf-to-jpg-excellence-design.md`
