'use client'

import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ToolOption, ToolOptions } from '@/lib/types'

interface OptionsPanelProps {
  options: ToolOption[]
  values: ToolOptions
  onChange: (name: string, value: unknown) => void
  disabled?: boolean
}

export function OptionsPanel({ options, values, onChange, disabled = false }: OptionsPanelProps) {
  if (options.length === 0) return null

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-lg border border-border p-4 disabled:opacity-50"
    >
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        Options
      </legend>

      {options.map((opt) => (
        <OptionRow key={opt.name} opt={opt} value={values[opt.name]} onChange={onChange} />
      ))}
    </fieldset>
  )
}

function OptionRow({
  opt,
  value,
  onChange,
}: {
  opt: ToolOption
  value: unknown
  onChange: (name: string, value: unknown) => void
}) {
  const id = `opt-${opt.name}`

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
      {/* Label + hint */}
      <div className="flex min-w-[140px] items-center gap-1.5 sm:pt-0.5">
        <label
          htmlFor={opt.type !== 'toggle' && opt.type !== 'radio' ? id : undefined}
          className="text-sm font-medium text-fg"
        >
          {opt.label}
        </label>
        {opt.hint && (
          <span
            title={opt.hint}
            aria-label={`Hint: ${opt.hint}`}
            className="cursor-help"
          >
            <HelpCircle className="h-3.5 w-3.5 text-fg-subtle" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Control */}
      <div className="flex-1">
        {opt.type === 'slider' && (
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="range"
              min={opt.min}
              max={opt.max}
              step={opt.step ?? 1}
              value={value as number}
              onChange={(e) => onChange(opt.name, Number(e.target.value))}
              className={cn(
                'h-1.5 w-full cursor-pointer appearance-none rounded-full',
                'bg-border accent-primary'
              )}
              aria-valuemin={opt.min}
              aria-valuemax={opt.max}
              aria-valuenow={value as number}
              aria-valuetext={String(value)}
            />
            <span
              className="w-10 shrink-0 text-right text-sm font-medium text-fg tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {value as number}
            </span>
          </div>
        )}

        {opt.type === 'toggle' && (
          <button
            id={id}
            role="switch"
            type="button"
            aria-checked={value as boolean}
            aria-label={opt.label}
            onClick={() => onChange(opt.name, !(value as boolean))}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full',
              'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              value ? 'bg-primary' : 'bg-border'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                value ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        )}

        {opt.type === 'dropdown' && (
          <select
            id={id}
            value={value as string}
            onChange={(e) => onChange(opt.name, e.target.value)}
            className={cn(
              'rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-sm text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              'cursor-pointer'
            )}
          >
            {opt.choices.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}

        {opt.type === 'radio' && (
          <fieldset>
            <legend className="sr-only">{opt.label}</legend>
            <div className="flex flex-wrap gap-2">
              {opt.choices.map((c) => (
                <label
                  key={c.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5',
                    'text-sm transition-colors',
                    'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary',
                    value === c.value
                      ? 'border-primary bg-bg-muted text-primary font-medium'
                      : 'border-border text-fg-muted hover:border-border-strong'
                  )}
                >
                  <input
                    type="radio"
                    name={`opt-${opt.name}`}
                    value={c.value}
                    checked={value === c.value}
                    onChange={() => onChange(opt.name, c.value)}
                    className="sr-only"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {opt.type === 'number' && (
          <input
            id={id}
            type="number"
            min={opt.min}
            max={opt.max}
            step={opt.step ?? 1}
            value={value as number}
            onChange={(e) => onChange(opt.name, Number(e.target.value))}
            className={cn(
              'w-28 rounded-md border border-border bg-bg-elevated px-3 py-1.5',
              'text-sm text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
          />
        )}

        {opt.hint && (
          <p className="mt-1 text-xs text-fg-subtle">{opt.hint}</p>
        )}
      </div>
    </div>
  )
}
