'use client'
import { useState, useCallback } from 'react'
import { Lock } from 'lucide-react'
import { zipSync, strToU8 } from 'fflate'
import { pdfToCsv, type CsvPageResult } from '@/lib/converters/pdf'
import { getPageCount } from '@/lib/converters/mupdf-client'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { config } from '@/content/tools/pdf-to-csv'

type Phase = 'idle' | 'loading' | 'preview' | 'extracting'

export default function PdfToCsvPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [pageFrom, setPageFrom] = useState(1)
  const [pageTo, setPageTo] = useState(1)
  const [results, setResults] = useState<CsvPageResult[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setPhase('loading')
    setError(null)
    setResults([])
    try {
      const buffer = await f.arrayBuffer()
      const count = await getPageCount(buffer.slice(0))
      setPageCount(count)
      setPageFrom(1)
      setPageTo(count)
      setPhase('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
      setPhase('idle')
    }
  }, [])

  const handleExtract = useCallback(async () => {
    if (!file) return
    setPhase('extracting')
    setError(null)
    try {
      const from = Math.max(1, Math.min(pageCount, pageFrom))
      const to = Math.max(from, Math.min(pageCount, pageTo))
      const csvResults = await pdfToCsv(file, from, to)
      setResults(csvResults)
      setActiveTab(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setPhase('preview')
    }
  }, [file, pageFrom, pageTo, pageCount])

  const handleDownload = useCallback(() => {
    if (!file || results.length === 0) return
    const baseName = file.name.replace(/\.[^.]+$/, '')
    if (results.length === 1) {
      const blob = new Blob([results[0].csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}-page-${results[0].page}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const entries: Record<string, Uint8Array> = {}
      for (const r of results) {
        entries[`${baseName}-page-${r.page}.csv`] = strToU8(r.csv)
      }
      const zipped = zipSync(entries)
      const isFullDoc = pageFrom === 1 && pageTo === pageCount
      const suffix = isFullDoc ? 'all-pages' : `pages-${pageFrom}-${pageTo}`
      const blob = new Blob([zipped], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}-${suffix}.zip`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [file, results, pageFrom, pageTo, pageCount])

  const isExtracting = phase === 'extracting'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/pdf' },
          { label: config.title },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.title}</h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Files never leave your browser. No uploads. No accounts.
        </div>
      </div>

      {/* Drop zone */}
      {phase === 'loading' && (
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm mb-6">
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-fg-muted">Reading PDF…</p>
          </div>
        </div>
      )}
      {phase === 'idle' && (
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm mb-6">
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={(files) => { if (files[0]) loadFile(files[0]) }}
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Range selector + extract */}
      {(phase === 'preview' || phase === 'extracting') && (
        <>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From page</label>
              <input
                type="number" min={1} max={pageCount} value={pageFrom}
                onChange={(e) => setPageFrom(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                className="w-20 border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To page</label>
              <input
                type="number" min={1} max={pageCount} value={pageTo}
                onChange={(e) => setPageTo(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || pageCount)))}
                className="w-20 border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <span className="text-sm text-gray-400">of {pageCount} page{pageCount !== 1 ? 's' : ''}</span>
            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 text-sm font-medium"
            >
              {isExtracting ? 'Extracting…' : 'Extract'}
            </button>
            <button
              onClick={() => { setPhase('idle'); setFile(null); setResults([]) }}
              className="text-sm text-gray-500 hover:underline"
            >
              Load different file
            </button>
          </div>

          {/* Preview */}
          {results.length > 0 && (
            <>
              <div className="flex gap-1 overflow-x-auto pb-0">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`px-3 py-1.5 text-xs rounded-t-lg border-t border-l border-r whitespace-nowrap transition-colors ${
                      i === activeTab
                        ? 'bg-white border-gray-300 font-medium text-gray-900'
                        : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Page {r.page}
                    {r.rows.length > 0 ? ` · ${r.rows.length} rows` : ' · empty'}
                  </button>
                ))}
              </div>

              <div className="border border-gray-300 rounded-b-lg rounded-tr-lg overflow-auto max-h-96 mb-4">
                {results[activeTab]?.rows.length === 0
                  ? (
                    <p className="p-4 text-sm text-gray-400 italic">
                      No extractable text on page {results[activeTab]?.page}. This page may be a scanned image.
                    </p>
                  )
                  : (
                    <table className="text-xs w-full border-collapse">
                      <tbody>
                        {results[activeTab].rows.slice(0, 50).map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-2 py-1 border-r border-b border-gray-100 max-w-xs truncate" title={cell}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {results[activeTab].rows.length > 50 && (
                          <tr>
                            <td colSpan={999} className="px-2 py-2 text-gray-400 italic text-xs">
                              Showing 50 of {results[activeTab].rows.length} rows — full data is in the download.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )
                }
              </div>

              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                {results.length === 1
                  ? `Download page-${results[0].page}.csv`
                  : `Download ${results.length} CSVs as ZIP`
                }
              </button>
            </>
          )}

          {results.length === 0 && !isExtracting && (
            <p className="text-sm text-gray-400">Set your page range and click Extract to preview the data.</p>
          )}
        </>
      )}

      {/* How it works */}
      <section className="mt-12" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">How it works</h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
          {[
            { n: '1', label: 'Drop your PDF', desc: 'Drag and drop, click to browse, or paste from clipboard.' },
            { n: '2', label: 'Set your page range', desc: 'Choose which pages to extract tables from. You can extract a single page or the entire document.' },
            { n: '3', label: 'Extract', desc: 'Table data is detected and structured into rows and columns — entirely in your browser via WebAssembly.' },
            { n: '4', label: 'Download CSV', desc: 'One CSV file per page. Multiple pages are bundled as a ZIP.' },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">{step.n}</span>
              <div>
                <p className="text-sm font-semibold text-fg">{step.label}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      {config.faq && config.faq.length > 0 && (
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
