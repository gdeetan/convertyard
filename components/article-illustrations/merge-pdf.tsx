const INPUT_PDFS = [
  { name: 'report.pdf',   pages: '12p' },
  { name: 'invoice.pdf',  pages: '3p'  },
  { name: 'appendix.pdf', pages: '8p'  },
]

function PdfCard({ name, pages, offset = 0 }: { name: string; pages: string; offset?: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-white shadow-sm px-3 py-2.5 flex items-center gap-2.5"
      style={{ marginTop: offset ? `-${offset}px` : undefined }}
    >
      {/* PDF icon */}
      <div className="h-8 w-6 rounded-sm border border-red-200 bg-red-50 flex items-center justify-center shrink-0">
        <span className="font-mono text-[8px] font-bold text-red-500 leading-none">PDF</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-mono text-[11px] text-fg truncate">{name}</span>
        <span className="font-mono text-[10px] text-fg-subtle">{pages}</span>
      </div>
    </div>
  )
}

export function MergePdfIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Merge PDF — ConvertYard</span>
      </div>

      {/* Main content */}
      <div className="flex items-center gap-3 px-4 py-5 bg-bg-elevated">
        {/* Input PDFs (stacked) */}
        <div className="flex-1 flex flex-col gap-1.5">
          {INPUT_PDFS.map((pdf, i) => (
            <PdfCard key={pdf.name} name={pdf.name} pages={pdf.pages} />
          ))}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <div className="h-px w-8 bg-primary" />
            <span className="text-primary text-sm font-bold">→</span>
          </div>
          <span className="font-sans text-[10px] text-fg-subtle">merge</span>
        </div>

        {/* Output PDF */}
        <div className="flex-1">
          <div className="rounded-lg border-2 border-primary/30 bg-white shadow-sm px-3 py-3 flex items-center gap-2.5">
            <div className="h-10 w-7 rounded-sm border border-primary/30 bg-primary/5 flex items-center justify-center shrink-0">
              <span className="font-mono text-[8px] font-bold text-primary leading-none">PDF</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] font-semibold text-fg">merged.pdf</span>
              <span className="font-mono text-[10px] text-fg-muted">23 pages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-white px-3 py-2 text-center">
        <span className="font-mono text-[10px] text-fg-subtle">
          Nothing uploaded · Merged in your browser
        </span>
      </div>
    </div>
  )
}
