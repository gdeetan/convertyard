import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const ROWS = [
  { label: 'Files uploaded to a server', us: 'Never', them: 'Always', usGood: true, themGood: false },
  { label: 'Maximum batch size', us: '1,000+', them: '5–20', usGood: true, themGood: false },
  { label: 'Account required', us: 'No', them: 'Often', usGood: true, themGood: false },
  { label: 'Works offline after first load', us: 'Yes', them: 'No', usGood: true, themGood: false },
  { label: 'Watermarks on output', us: 'Never', them: 'Sometimes', usGood: true, themGood: false },
  { label: 'Ads above the fold', us: 'Never', them: 'Usually', usGood: true, themGood: false },
  { label: 'Ads in the conversion flow', us: 'Never', them: 'Usually', usGood: true, themGood: false },
]

function ValueCell({ value, good }: { value: string; good: boolean }) {
  return (
    <span className={cn('flex items-center gap-1.5 font-medium', good ? 'text-success' : 'text-fg-muted')}>
      {good
        ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        : <X className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
      }
      {value}
    </span>
  )
}

export function ComparisonTable() {
  return (
    <section
      aria-labelledby="compare-heading"
      className="bg-bg-muted py-16 sm:py-24"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2
          id="compare-heading"
          className="mb-10 text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          How we compare
        </h2>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
          <table className="w-full text-sm" aria-label="Feature comparison">
            <thead>
              <tr className="border-b border-border bg-bg-elevated">
                <th className="py-4 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle" scope="col">
                  Feature
                </th>
                <th
                  className="py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-primary border-l-2 border-l-primary"
                  scope="col"
                >
                  ConvertYard
                </th>
                <th className="py-4 pl-4 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle" scope="col">
                  Typical online converters
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className={cn('border-b border-border last:border-0', i % 2 === 0 ? 'bg-bg-elevated' : 'bg-bg')}
                >
                  <td className="py-3.5 pl-6 pr-4 text-fg-muted">{row.label}</td>
                  <td className="py-3.5 px-4 border-l-2 border-l-primary">
                    <ValueCell value={row.us} good={row.usGood} />
                  </td>
                  <td className="py-3.5 pl-4 pr-6">
                    <ValueCell value={row.them} good={row.themGood} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: two side-by-side cards */}
        <div className="sm:hidden">
          <div className="grid grid-cols-2 gap-3">
            {/* ConvertYard card */}
            <div className="rounded-xl border-2 border-primary bg-bg-elevated overflow-hidden">
              <div className="border-b border-border bg-bg-muted px-4 py-3">
                <p className="text-xs font-bold text-primary">ConvertYard</p>
              </div>
              <ul className="divide-y divide-border">
                {ROWS.map((row) => (
                  <li key={row.label} className="px-4 py-3 text-xs">
                    <p className="mb-0.5 text-fg-subtle">{row.label}</p>
                    <ValueCell value={row.us} good={row.usGood} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Competitors card */}
            <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden">
              <div className="border-b border-border bg-bg-muted px-4 py-3">
                <p className="text-xs font-semibold text-fg-subtle">Typical converters</p>
              </div>
              <ul className="divide-y divide-border">
                {ROWS.map((row) => (
                  <li key={row.label} className="px-4 py-3 text-xs">
                    <p className="mb-0.5 text-fg-subtle">{row.label}</p>
                    <ValueCell value={row.them} good={row.themGood} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
