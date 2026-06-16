import { Check, X, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type CellValue = 'yes' | 'no' | 'pro' | 'limited'

interface Row {
  feature: string
  convertyard: CellValue
  adobeFree: CellValue
  adobePro: CellValue
  ilovepdf: CellValue
  smallpdf: CellValue
}

const rows: Row[] = [
  { feature: 'Target file size (KB-level)',         convertyard: 'yes',     adobeFree: 'no',      adobePro: 'yes',  ilovepdf: 'no',      smallpdf: 'no'      },
  { feature: 'Visual before/after preview',         convertyard: 'yes',     adobeFree: 'no',      adobePro: 'pro',  ilovepdf: 'no',      smallpdf: 'no'      },
  { feature: "File analyzer (what's bloating it)",  convertyard: 'yes',     adobeFree: 'no',      adobePro: 'no',   ilovepdf: 'no',      smallpdf: 'no'      },
  { feature: 'Custom DPI control',                  convertyard: 'yes',     adobeFree: 'no',      adobePro: 'yes',  ilovepdf: 'no',      smallpdf: 'no'      },
  { feature: 'Font subsetting',                     convertyard: 'yes',     adobeFree: 'no',      adobePro: 'yes',  ilovepdf: 'no',      smallpdf: 'no'      },
  { feature: 'Content stripping (metadata, JS)',    convertyard: 'yes',     adobeFree: 'limited', adobePro: 'yes',  ilovepdf: 'limited', smallpdf: 'limited' },
  { feature: 'Batch (1,000+ files)',                convertyard: 'yes',     adobeFree: 'no',      adobePro: 'yes',  ilovepdf: 'limited', smallpdf: 'limited' },
  { feature: 'Files stay in your browser',          convertyard: 'yes',     adobeFree: 'no',      adobePro: 'no',   ilovepdf: 'no',      smallpdf: 'no'      },
  { feature: 'Free, no account required',           convertyard: 'yes',     adobeFree: 'limited', adobePro: 'no',   ilovepdf: 'limited', smallpdf: 'limited' },
]

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  const base = 'flex items-center justify-center py-2.5 text-sm'
  if (value === 'yes') return (
    <div className={cn(base, highlight && 'bg-primary/5')}>
      <Check className="h-4 w-4 text-green-600 dark:text-green-400" aria-label="Yes" />
    </div>
  )
  if (value === 'no') return (
    <div className={cn(base, highlight && 'bg-primary/5')}>
      <X className="h-4 w-4 text-fg-subtle" aria-label="No" />
    </div>
  )
  if (value === 'pro') return (
    <div className={cn(base, 'text-xs font-medium text-fg-muted', highlight && 'bg-primary/5')}>
      Pro only
    </div>
  )
  return (
    <div className={cn(base, 'text-xs font-medium text-fg-muted', highlight && 'bg-primary/5')}>
      <Minus className="h-3.5 w-3.5 text-fg-subtle" aria-label="Limited" />
    </div>
  )
}

export function CompressorComparisonTable() {
  const cols: Array<{ key: keyof Omit<Row, 'feature'>; label: string; highlight?: boolean }> = [
    { key: 'convertyard', label: 'ConvertYard', highlight: true },
    { key: 'adobeFree',   label: 'Adobe (Free)' },
    { key: 'adobePro',    label: 'Adobe Pro' },
    { key: 'ilovepdf',    label: 'iLovePDF' },
    { key: 'smallpdf',    label: 'Smallpdf' },
  ]

  return (
    <section aria-labelledby="comparison-heading" className="mt-12">
      <h2 id="comparison-heading" className="mb-6 text-xl font-semibold text-fg">
        How ConvertYard compares
      </h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                Feature
              </th>
              {cols.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider',
                    col.highlight
                      ? 'bg-primary/5 text-primary'
                      : 'text-fg-subtle'
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.feature}
                className={cn(
                  'border-b border-border last:border-b-0',
                  i % 2 === 1 && 'bg-bg-muted/50'
                )}
              >
                <td className="px-4 py-2 text-sm text-fg">{row.feature}</td>
                {cols.map(col => (
                  <td key={col.key} className="px-3">
                    <Cell value={row[col.key]} highlight={col.highlight} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-fg-subtle">
        Accurate as of June 2026. Features may change — verify on vendor sites for critical decisions.
      </p>
    </section>
  )
}
