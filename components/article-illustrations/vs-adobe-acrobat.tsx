const rows = [
  { feature: 'Compress PDF',    cy: '✓ Free',          aa: '✓ $19.99/mo',      cyGood: true,  aaGood: false },
  { feature: 'Merge & Split',   cy: '✓ Free',          aa: '✓ $19.99/mo',      cyGood: true,  aaGood: false },
  { feature: 'Files uploaded',  cy: '✗ Never',         aa: '✓ Adobe servers',  cyGood: true,  aaGood: false },
  { feature: 'Works offline',   cy: '✓ Yes',           aa: '✗ Requires internet', cyGood: true, aaGood: false },
  { feature: 'E-signature',     cy: '✗ No',            aa: '✓ Yes',            cyGood: false, aaGood: true  },
]

export function VsAdobeAcrobatIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden font-sans text-xs">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-border bg-bg-elevated">
        <div className="px-4 py-3 text-[11px] font-medium text-fg-muted">Feature</div>
        <div className="px-4 py-3 text-[11px] font-semibold text-primary border-l border-border">ConvertYard</div>
        <div className="px-4 py-3 text-[11px] font-medium text-fg-muted border-l border-border">Adobe Acrobat Pro</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.feature} className="grid grid-cols-[2fr_1fr_1fr]">
            <div className="px-4 py-2.5 text-[11px] text-fg">{row.feature}</div>
            <div className={`px-4 py-2.5 text-[11px] border-l border-border ${row.cyGood ? 'text-green-600' : 'text-red-500'}`}>
              {row.cy}
            </div>
            <div className={`px-4 py-2.5 text-[11px] border-l border-border ${row.aaGood ? 'text-green-600' : 'text-red-500'}`}>
              {row.aa}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-border bg-bg-elevated px-4 py-2">
        <span className="text-[10px] text-fg-subtle">Pricing as of 2025 · ConvertYard is free, local-first, no account required</span>
      </div>
    </div>
  )
}
