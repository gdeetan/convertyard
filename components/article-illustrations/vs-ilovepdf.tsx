const rows = [
  { feature: 'Batch limit',    cy: '✓ Unlimited',        il: '✗ 200MB / 2 files',     cyGood: true,  ilGood: false },
  { feature: 'Files uploaded', cy: '✗ Never',            il: '✓ Their servers',        cyGood: true,  ilGood: false },
  { feature: 'Works offline',  cy: '✓ Yes',              il: '✗ No',                   cyGood: true,  ilGood: false },
  { feature: 'Ads',            cy: '✓ Below FAQ only',   il: '✗ Multiple placements',  cyGood: true,  ilGood: false },
  { feature: 'Price',          cy: '✓ Free forever',     il: '✓ Free (limits) / €4/mo', cyGood: true, ilGood: true  },
]

export function VsIlovepdfIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden font-sans text-xs">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-border bg-bg-elevated">
        <div className="px-4 py-3 text-[11px] font-medium text-fg-muted">Feature</div>
        <div className="px-4 py-3 text-[11px] font-semibold text-primary border-l border-border">ConvertYard</div>
        <div className="px-4 py-3 text-[11px] font-medium text-fg-muted border-l border-border">ilovePDF</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.feature} className="grid grid-cols-[2fr_1fr_1fr]">
            <div className="px-4 py-2.5 text-[11px] text-fg">{row.feature}</div>
            <div className={`px-4 py-2.5 text-[11px] border-l border-border ${row.cyGood ? 'text-green-600' : 'text-red-500'}`}>
              {row.cy}
            </div>
            <div className={`px-4 py-2.5 text-[11px] border-l border-border ${row.ilGood ? 'text-green-600' : 'text-red-500'}`}>
              {row.il}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-border bg-bg-elevated px-4 py-2">
        <span className="text-[10px] text-fg-subtle">ConvertYard processes files locally · no account · no upload · no limits</span>
      </div>
    </div>
  )
}
