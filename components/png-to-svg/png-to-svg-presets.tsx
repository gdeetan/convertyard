'use client'

import type { ToolOptions } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

const PRESETS: Array<{ name: string; hint: string; values: ToolOptions }> = [
  {
    name: 'Logo',
    hint: '8 colours, sharp corners — brand marks and icons with flat fills',
    values: { numberofcolors: 8, pathomit: 8, ltres: 1, qtres: 1, blurradius: 'off' },
  },
  {
    name: 'Line art',
    hint: '2 colours — silhouettes, stamps, and black-and-white drawings',
    values: { numberofcolors: 2, pathomit: 8, ltres: 0.5, qtres: 1, blurradius: 'off' },
  },
  {
    name: 'Detailed',
    hint: '24 colours, keep small paths — illustrations with more shading',
    values: { numberofcolors: 24, pathomit: 2, ltres: 0.5, qtres: 0.5, blurradius: 'off' },
  },
]

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

function matches(options: ToolOptions, values: ToolOptions): boolean {
  return (Object.keys(values) as string[]).every((key) => options[key] === values[key])
}

export function PngToSvgPresetBar({ options, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-fg-muted">Presets:</span>
      {PRESETS.map((preset) => {
        const active = matches(options, preset.values)
        return (
          <button
            key={preset.name}
            type="button"
            title={preset.hint}
            onClick={() => {
              for (const [name, value] of Object.entries(preset.values)) {
                onChange(name, value)
              }
            }}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-border bg-bg-elevated text-fg hover:border-primary/50 hover:text-primary',
            )}
          >
            {preset.name}
          </button>
        )
      })}
    </div>
  )
}
